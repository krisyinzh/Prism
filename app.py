from flask import Flask, request, Response, stream_with_context, session, jsonify
from flask_cors import CORS
from openai import OpenAI
import json
import os
import traceback
import socket
import urllib.request

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app, supports_credentials=True)

def test_connectivity(host="api.deepseek.com", port=443):
    """Test if a TCP connection can be established to the host."""
    try:
        socket.setdefaulttimeout(5)
        socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect((host, port))
        return True, "Success"
    except Exception as e:
        return False, str(e)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if username == 'admin' and password == 'admin':
        session['user'] = 'admin'
        return jsonify({"status": "success", "message": "Login successful"}), 200
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({"status": "success"}), 200

@app.route('/api/chat/stream', methods=['POST'])
def stream_chat():
    data = request.json
    messages = data.get('messages', [])
    api_key = data.get('api_key')
    base_url = data.get('base_url', 'https://api.deepseek.com')
    model = data.get('model', 'deepseek-chat')
    system_prompt = data.get('system_prompt', '')

    print(f"\n--- New Request ---")
    print(f"Model: {model}")
    print(f"Base URL: {base_url}")
    
    # Debug proxy settings
    proxies = {k: v for k, v in os.environ.items() if 'proxy' in k.lower()}
    if proxies:
        print(f"Detected Proxies in Environment: {proxies}")
    else:
        print("No proxies detected in environment.")

    # Diagnostic: Try a direct socket connection
    print(f"Diagnostic: Testing TCP connection to {base_url.replace('https://', '').replace('http://', '').split('/')[0]}...")
    host = base_url.replace('https://', '').replace('http://', '').split('/')[0]
    can_connect, diag_msg = test_connectivity(host)
    if can_connect:
        print("Diagnostic: TCP connection test passed.")
    else:
        print(f"Diagnostic: TCP connection failed! Error: {diag_msg}")

    if not api_key:
        return jsonify({"error": "API Key is required"}), 400

    # Initialize client
    client = OpenAI(
        api_key=api_key, 
        base_url=base_url,
        timeout=30.0,
    )

    # Prepend system prompt
    full_messages = []
    if system_prompt:
        full_messages.append({"role": "system", "content": system_prompt})
    full_messages.extend(messages)

    def generate():
        try:
            print("Attempting to connect to AI provider...")
            response = client.chat.completions.create(
                model=model,
                messages=full_messages,
                stream=True
            )
            print("Connection established, receiving stream...")
            for chunk in response:
                if len(chunk.choices) > 0 and chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield f"data: {json.dumps({'content': content})}\n\n"
            print("Stream finished successfully.")
        except Exception as e:
            error_msg = str(e)
            print(f"!!! Streaming Error !!!")
            traceback.print_exc() # Print full traceback to console
            
            hint = ""
            if "Connection error" in error_msg:
                hint = "\n\n诊断信息:\n1. 您的 Python 环境无法连接到 API 服务器。\n2. 请检查是否需要设置系统代理。\n3. 尝试在终端运行: $env:HTTPS_PROXY='您的代理地址'"
            
            yield f"data: {json.dumps({'error': error_msg + hint})}\n\n"
        yield "data: [DONE]\n\n"

    return Response(stream_with_context(generate()), mimetype='text/event-stream')

if __name__ == '__main__':
    # 在生产环境下，监听 0.0.0.0 以便外部访问
    app.run(host='0.0.0.0', port=5000, debug=False)
