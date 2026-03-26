import React, { useState, useEffect, useRef } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  useNavigate, 
  Navigate 
} from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Eye, EyeOff, Send, LogOut, 
  User, Bot, Trash2, Cpu, Key, Link,
  Sparkles, Smile, Zap, ChevronRight, LayoutPanelLeft,
  Wand2, ShieldCheck, Heart,
  Box, ChevronDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Config {
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
}

// --- Components ---

const Character = ({ color, shape, eyes, mousePosition, isAvoiding, isLeaning, leanOffset = { x: 20, rotate: 10 }, isThinking, emotion }: any) => {
  const characterRef = useRef<HTMLDivElement>(null);
  const springConfig = { damping: 20, stiffness: 300 };
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  // Determine actual color based on emotion
  const displayColor = emotion === 'happy' ? '#4ade80' : emotion === 'sad' ? '#60a5fa' : color;

  useEffect(() => {
    if (isAvoiding) {
      setEyeOffset({ x: -6, y: -2 });
      return;
    }
    if (isLeaning) {
      setEyeOffset({ x: 6, y: 0 });
      return;
    }
    if (isThinking) return;

    if (characterRef.current) {
      const rect = characterRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (mousePosition?.x || 0) - centerX;
      const dy = (mousePosition?.y || 0) - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = 6;
      const scale = Math.min(maxOffset, distance / 50);
      const angle = Math.atan2(dy, dx);
      setEyeOffset({
        x: Math.cos(angle) * scale,
        y: Math.sin(angle) * scale
      });
    }
  }, [mousePosition, isAvoiding, isLeaning, isThinking]);

  const renderShape = () => {
    switch (shape) {
      case 'rect': return <div className="w-24 h-48 rounded-2xl transition-colors duration-500 shadow-lg" style={{ backgroundColor: displayColor }} />;
      case 'tall-rect': return <div className="w-28 h-64 rounded-3xl transition-colors duration-500 shadow-lg" style={{ backgroundColor: displayColor }} />;
      case 'semi': return <div className="w-40 h-32 rounded-t-full transition-colors duration-500 shadow-lg" style={{ backgroundColor: displayColor }} />;
      case 'blob': return <div className="w-28 h-40 rounded-3xl transition-colors duration-500 shadow-lg" style={{ backgroundColor: displayColor }} />;
      default: return null;
    }
  };

  return (
    <motion.div
      ref={characterRef}
      className="relative cursor-pointer"
      whileHover={{ scale: 1.05, y: -10 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <motion.div
        className="relative h-full w-full flex flex-col items-center"
        animate={{ 
          rotate: isLeaning ? leanOffset.rotate : 0,
          x: isLeaning ? leanOffset.x : 0,
          scale: isLeaning ? 1.05 : 1,
          y: isThinking ? [0, -5, 0] : 0
        }}
        style={{ originY: "100%" }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 20,
          y: isThinking ? { repeat: Infinity, duration: 1 } : {}
        }}
      >
        {renderShape()}
        <div className="absolute inset-0 flex flex-col items-center pt-[20%]">
          <div className="flex gap-3 mb-4">
            {eyes.map((_: any, i: number) => (
              <div key={i} className="w-3.5 h-3.5 bg-white rounded-full relative overflow-hidden shadow-inner">
                <motion.div
                  className="w-1.5 h-1.5 bg-black rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  animate={isThinking ? {
                    x: [0, 2, 0, -2, 0],
                    y: [0, -2, 0, 2, 0],
                  } : { x: eyeOffset.x, y: eyeOffset.y }}
                  transition={isThinking ? { repeat: Infinity, duration: 0.6, ease: "linear" } : { type: "spring", ...springConfig }}
                />
              </div>
            ))}
          </div>
          <motion.div 
            className="bg-black/20 rounded-full overflow-hidden"
            animate={{ 
              width: emotion === 'happy' ? 24 : emotion === 'sad' ? 18 : (isLeaning || isThinking) ? 16 : 12,
              height: emotion === 'happy' ? 12 : emotion === 'sad' ? 6 : (isLeaning || isThinking) ? 8 : 4,
              borderRadius: emotion === 'happy' ? "0 0 12px 12px" : emotion === 'sad' ? "12px 12px 0 0" : (isLeaning || isThinking) ? "50%" : "2px",
              backgroundColor: emotion === 'happy' ? "rgba(0,0,0,0.4)" : emotion === 'sad' ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.2)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        </div>
      </motion.div>
      {shape === 'blob' && (
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-10 h-0.5 bg-black/10 rounded-full z-10" />
      )}
    </motion.div>
  );
};

// --- Page: Login ---

const LoginPage = ({ onLogin, setIsLeaning, setIsTyping, setIsAvoiding }: { onLogin: () => void, setIsLeaning: (l: boolean) => void, setIsTyping: (t: boolean) => void, setIsAvoiding: (a: boolean) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Sync local showPassword to parent isAvoiding
  useEffect(() => {
    setIsAvoiding(showPassword);
  }, [showPassword, setIsAvoiding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('isLoggedIn', 'true');
      onLogin();
      navigate('/chat');
    } else {
      setError('账号或密码错误 (提示: admin/admin)');
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50/50">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md px-12 py-12 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">欢迎回来</h1>
          <p className="text-gray-400 font-medium">体验极简、高效的自定义 AI 对话</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">账号</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 500);
              }}
              onFocus={() => setIsLeaning(true)}
              onBlur={() => setIsLeaning(false)}
              placeholder="请输入您的账号"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-gray-900 font-medium placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">密码</label>
            <div className="relative group">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-gray-900 font-medium placeholder:text-gray-300"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-300 hover:text-indigo-500 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm font-bold ml-1 animate-bounce">{error}</p>}
          <div className="pt-4">
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 group">
              登录进入控制台
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// --- Page: Chat ---

const ChatPage = ({ onLogout, setEmotion, setIsThinking, setIsLeaning, setIsTyping }: { onLogout: () => void, setEmotion: (e: any) => void, setIsThinking: (t: boolean) => void, setIsLeaning: (l: boolean) => void, setIsTyping: (t: boolean) => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLocalThinking, setIsLocalThinking] = useState(false);
  const [config, setConfig] = useState<Config>({
    baseUrl: 'https://api.deepseek.com',
    apiKey: sessionStorage.getItem('apiKey') || '',
    model: 'deepseek-chat',
    systemPrompt: '你是一个专业的 AI 助手。'
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const navigate = useNavigate();

  const providers = [
    { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', models: ['deepseek-chat', 'deepseek-reasoner'] },
    { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
    { name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', models: ['anthropic/claude-3.5-sonnet', 'google/gemini-pro-1.5'] },
    { name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', models: ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768'] },
    { name: 'Local (Ollama)', baseUrl: 'http://localhost:11434/v1', models: ['llama3', 'mistral'] }
  ];

  const presets = [
    { id: 'career', name: '求职专家', icon: <ShieldCheck size={14} />, prompt: '你是一个资深的职业发展专家和猎头。你的职责是：1. 优化简历，使其更具竞争力；2. 模拟面试，提供专业的回答技巧；3. 评估专业技能，指出优缺点；4. 提供学习建议，推荐当前行业最热门的技术栈和工具。说话风格专业、客观、有建设性。', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { id: 'emotional', name: '情感陪聊', icon: <Heart size={14} />, prompt: '你是一个温柔的心理咨询师。善于共情、倾听，说话治愈且富有耐心。', color: 'bg-pink-50 text-pink-600 border-pink-100' },
    { id: 'coder', name: '代码专家', icon: <Cpu size={14} />, prompt: '你是一个资深全栈开发。只输出高质量、符合最佳实践的代码。', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'custom', name: '自定义人格', icon: <Wand2 size={14} />, prompt: '', color: 'bg-purple-50 text-purple-600 border-purple-100' }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveApiKey = (key: string) => {
    sessionStorage.setItem('apiKey', key);
    setConfig({ ...config, apiKey: key });
  };

  const handleInputFocus = () => {
    setIsLeaning(true);
  };

  const handleInputBlur = () => {
    setIsLeaning(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleSend = async () => {
    if (!input.trim() || isLocalThinking) return;
    if (!config.apiKey) {
      alert('请先在右侧配置面板设置 API Key');
      return;
    }

    // Emotion detection
    const isSad = input.includes('不') || input.includes('难过') || input.includes('伤心') || input.includes('累') || input.includes('郁闷') || input.includes('难受') || input.includes('烦');
    const isHappy = (input.includes('开心') || input.includes('快乐') || input.includes('棒') || input.includes('给力') || input.includes('牛')) && !input.includes('不');

    if (isSad) {
      setEmotion('sad');
    } else if (isHappy) {
      setEmotion('happy');
    } else {
      setEmotion('neutral');
    }

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLocalThinking(true);
    setIsThinking(true);

    try {
      console.log('Sending request to backend...');
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          api_key: config.apiKey,
          base_url: config.baseUrl,
          model: config.model,
          system_prompt: config.systemPrompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      let accumulatedContent = '';
      let buffer = '';

      setDebugInfo('正在建立连接...');

      while (reader) {
        const { done, value } = await reader.read();
        if (done) {
          setDebugInfo('流式传输结束');
          break;
        }
        
        const chunkStr = decoder.decode(value, { stream: true });
        setDebugInfo(`收到数据包: ${chunkStr.length} 字节`);
        buffer += chunkStr;
        
        const lines = buffer.split('\n');
        // 如果最后一行不以 \n 结尾，说明 JSON 还没传输完，放回 buffer 等待下一个 chunk
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
          
          const dataStr = trimmedLine.slice(6);
          if (dataStr === '[DONE]') {
            setDebugInfo('收到结束信号 [DONE]');
            continue;
          }
          
          try {
            // 这里可能会有不完整的 JSON，所以用 try-catch 包裹
            const data = JSON.parse(dataStr);
            if (data.error) throw new Error(data.error);
            if (data.content) {
              accumulatedContent += data.content;
              setMessages(prev => {
                const newMsgs = [...prev];
                const lastMsg = newMsgs[newMsgs.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                  newMsgs[newMsgs.length - 1] = { ...lastMsg, content: accumulatedContent };
                }
                return newMsgs;
              });
            }
          } catch (e) { 
            // 如果 JSON 解析失败，可能是这一行也被截断了（虽然按 \n 分隔了），
            // 尝试把这一行重新放回 buffer
            buffer = line + '\n' + buffer;
            console.warn('SSE JSON Parse Error, buffering line:', e);
          }
        }
      }
      
      if (!accumulatedContent) {
        console.warn('Stream finished but accumulatedContent is empty!');
      }

    } catch (err: any) {
      console.error('Chat Error:', err);
      alert(`无法连接到后端服务: ${err.message}\n请确保 Python 后端 (app.py) 已在端口 5000 正常运行。`);
    } finally {
      setIsLocalThinking(false);
      setIsThinking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    onLogout();
    navigate('/');
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = providers.find(p => p.name === e.target.value);
    if (provider) {
      setConfig({
        ...config,
        baseUrl: provider.baseUrl,
        model: provider.models[0]
      });
    }
  };

  return (
    <div className="flex h-full w-full bg-[#f8fafc] overflow-hidden">
      {/* 1. Middle Section: Chat Window */}
      <div className="flex-1 h-full flex flex-col bg-white/50 backdrop-blur-sm relative z-10">
        <header className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 leading-tight">沉浸式会话</h2>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Connection / SSE Protocol</p>
                {debugInfo && (
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    {debugInfo}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-500 rounded-xl transition-all font-bold text-sm">
            <LogOut size={18} />
            登出
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <Sparkles size={40} className="text-gray-200" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">配置完成，等待对话</h3>
                <p className="text-gray-400 text-sm font-medium">在右侧选择您喜欢的人格，或直接开始提问</p>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={cn(
                "flex gap-4",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
                msg.role === 'user' ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-100 text-indigo-600"
              )}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={cn(
                "max-w-[75%] px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm transition-all",
                msg.role === 'user' 
                  ? "bg-gray-900 text-white rounded-tr-none" 
                  : "bg-white text-gray-900 border border-gray-100 rounded-tl-none shadow-indigo-100/50"
              )}>
                {msg.role === 'assistant' ? (
                  <div className="text-gray-900 leading-relaxed">
                    {!msg.content && isLocalThinking ? (
                      <span className="flex gap-1.5 py-1">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                      </span>
                    ) : (
                      <div className="prose prose-sm prose-slate max-w-none prose-p:text-gray-900 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-code:text-indigo-600">
                        {msg.content ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          <span className="text-gray-400 italic">AI 暂未返回有效内容，请检查配置或稍后再试。</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            </motion.div>
          ))}
          {isLocalThinking && (
            <div className="flex gap-4 mr-auto animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
                <Bot size={18} className="text-gray-300" />
              </div>
              <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-indigo-200 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </main>

        <footer className="p-8 bg-white/50 backdrop-blur-md">
          <div className="relative flex items-center bg-white border-2 border-gray-100 rounded-[2rem] p-2 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-600/5 transition-all shadow-xl shadow-gray-200/50">
            <textarea
              value={input}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="在这里输入您的问题，按 Enter 发送..."
              className="flex-1 max-h-32 min-h-[56px] bg-transparent border-none focus:ring-0 text-sm font-medium py-4 px-6 resize-none outline-none placeholder:text-gray-300 text-gray-900"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLocalThinking}
              className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200 active:scale-95"
            >
              <Send size={20} />
            </button>
          </div>
        </footer>
      </div>

      {/* 2. Right Section: Config Sidebar */}
      <aside className="w-[320px] h-full bg-white border-l border-gray-100 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] relative z-20 transition-all duration-500">
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 tracking-tighter uppercase">
            <LayoutPanelLeft size={18} className="text-indigo-600" />
            系统配置中心
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* 1. AI IDENTITY SECTION */}
          <section className="space-y-5">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Smile size={12} className="text-indigo-600" />
              CareerCompass AI 人格
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {presets.map(p => {
                const isActive = (p.id === 'custom' && !presets.filter(pr => pr.id !== 'custom').some(pr => pr.prompt === config.systemPrompt)) || 
                               (p.id !== 'custom' && p.prompt === config.systemPrompt);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (p.id === 'custom') {
                        // 如果选自定义且当前是预设，则清空；如果已经是自定义，则保留
                        if (presets.filter(pr => pr.id !== 'custom').some(pr => pr.prompt === config.systemPrompt)) {
                          setConfig({...config, systemPrompt: ''});
                        }
                      } else {
                        setConfig({...config, systemPrompt: p.prompt});
                      }
                    }}
                    className={cn(
                      "px-4 py-3 rounded-xl text-xs font-bold border flex items-center justify-between transition-all",
                      isActive 
                        ? p.color + " ring-2 ring-current ring-offset-2" 
                        : "bg-white border-gray-100 text-gray-500 hover:border-indigo-200"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {p.icon}
                      {p.name}
                    </span>
                    {isActive && <ChevronRight size={14} />}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 mb-1.5 block ml-1 italic">自定义 System Prompt</label>
              <textarea
                value={config.systemPrompt}
                onChange={(e) => setConfig({...config, systemPrompt: e.target.value})}
                className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-medium text-gray-900 outline-none focus:border-indigo-500 focus:bg-white resize-none transition-all leading-relaxed"
                placeholder="在此输入您的 AI 指令..."
              />
            </div>
          </section>

          {/* 2. ENGINE CONFIG SECTION */}
          <section className="space-y-5">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Box size={12} className="text-indigo-600" />
              AI 供应商与模型
            </h3>
            <div className="space-y-4">
              <div className="group">
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block ml-1">选择供应商</label>
                <div className="relative">
                  <select 
                    onChange={handleProviderChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    {providers.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                    <option value="Custom">自定义 (Manual)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                </div>
              </div>

              <div className="group">
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block ml-1">模型选择</label>
                <div className="relative">
                  <input 
                    type="text" 
                    list="common-models"
                    value={config.model}
                    onChange={(e) => setConfig({...config, model: e.target.value})}
                    placeholder="例如: gpt-4o"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <datalist id="common-models">
                    {providers.flatMap(p => p.models).map(m => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          </section>

          {/* 3. CONNECTION SECTION */}
          <section className="space-y-5">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={12} />
              接口端点 (Endpoint)
            </h3>
            <div className="space-y-4">
              <div className="group">
                <div className="relative">
                  <input 
                    type="text" 
                    value={config.baseUrl}
                    onChange={(e) => setConfig({...config, baseUrl: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-500 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <Link size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
              </div>
              <div className="group">
                <label className="text-[11px] font-bold text-gray-500 mb-1.5 block ml-1 italic uppercase">Private API KEY</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={config.apiKey}
                    onChange={(e) => saveApiKey(e.target.value)}
                    placeholder="在此输入您的 API Key"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <Key size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
              </div>
            </div>
          </section>

          {/* RESET */}
          <div className="pt-4">
            <button 
              onClick={() => {
                setMessages([]);
                alert('会话已重置');
              }}
              className="w-full py-4 bg-gray-900 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95"
            >
              <Trash2 size={16} />
              清除当前上下文
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

// --- App Root ---

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLeaning, setIsLeaning] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isAvoiding, setIsAvoiding] = useState(false);
  const [emotion, setEmotion] = useState<'neutral' | 'happy' | 'sad'>('neutral');

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <Router>
      <div className="flex h-screen w-full bg-white overflow-hidden font-sans" onMouseMove={handleMouseMove}>
        {/* Shared Left Side: Visual Area */}
        <div className="w-[28%] h-full bg-[#4A5568] flex flex-col items-center justify-end pb-20 relative overflow-hidden shadow-2xl z-20 transition-all duration-700">
          <div className="absolute top-10 left-10 flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center rotate-3">
              <div className="w-5 h-5 border-2 border-white rotate-45" />
            </div>
            <span className="text-2xl font-black tracking-tight italic">CareerCompass</span>
          </div>

          <div className="flex items-end -space-x-8 relative scale-90 origin-bottom">
            <Character color="#FF7A59" shape="semi" eyes={[1, 2]} mousePosition={mousePosition} isLeaning={isLeaning} isThinking={isThinking} isAvoiding={isAvoiding} leanOffset={{ x: 25, rotate: 12 }} emotion={emotion} />
            <Character color="#6366F1" shape="tall-rect" eyes={[1, 2]} mousePosition={mousePosition} isLeaning={isLeaning} isThinking={isThinking} isAvoiding={isAvoiding} leanOffset={{ x: 15, rotate: 8 }} emotion={emotion} />
            <Character color="#2D3748" shape="rect" eyes={[1, 2]} mousePosition={mousePosition} isLeaning={isLeaning} isThinking={isThinking} isAvoiding={isAvoiding} leanOffset={{ x: 20, rotate: 10 }} emotion={emotion} />
            <Character color="#ECC94B" shape="blob" eyes={[1, 2]} mousePosition={mousePosition} isLeaning={isLeaning} isThinking={isThinking} isAvoiding={isAvoiding} leanOffset={{ x: 30, rotate: 15 }} emotion={emotion} />
          </div>

          {isThinking && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-[40%] flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center">
                <Zap className="text-yellow-400 animate-pulse" size={32} />
              </div>
              <span className="text-white/60 font-black tracking-widest text-xs uppercase">AI Processing...</span>
            </motion.div>
          )}
        </div>

        {/* Right Side: Routes */}
        <div className="flex-1 h-full overflow-hidden relative">
          <Routes>
            <Route path="/" element={
              !isLoggedIn ? (
                <LoginPage 
                  onLogin={() => setIsLoggedIn(true)} 
                  setIsLeaning={setIsLeaning}
                  setIsTyping={() => {}}
                  setIsAvoiding={setIsAvoiding}
                />
              ) : <Navigate to="/chat" />
            } />
            <Route path="/chat" element={
              isLoggedIn ? (
                <ChatPage 
                  onLogout={() => {
                    setIsLoggedIn(false);
                    setEmotion('neutral');
                  }} 
                  setEmotion={setEmotion} 
                  setIsThinking={setIsThinking} 
                  setIsLeaning={setIsLeaning}
                  setIsTyping={() => {}}
                />
              ) : <Navigate to="/" />
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
