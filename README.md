# Prism - CareerCompass AI (Custom Edition)

一个高度交互、极简设计的 AI 对话面板，集成了四位会根据你的行为做出反应的 SVG 吉祥物。支持多模型切换（OpenAI, DeepSeek, Ollama 等）和人格预设。
<img width="1808" height="913" alt="image" src="https://github.com/user-attachments/assets/8803d3bb-4a22-40be-87c3-2c471be30f72" />

## ✨ 特性

- **互动吉祥物**：四位可爱的 Mascot 会根据你的输入行为（输入账号、密码）和 AI 的状态（思考中、回复内容关键词）做出物理动画反应。
- **多模型支持**：内置 DeepSeek, OpenAI, OpenRouter, Groq, Ollama 等主流供应商预设。
- **人格预设**：提供“求职专家”、“情感陪聊”、“代码专家”等一键预设，并支持深度自定义。
- **流式输出**：基于 SSE (Server-Sent Events) 的极致流畅对话体验，支持长文本缓冲解析。
- **全栈架构**：React (Vite) 前端 + Flask 后端，支持一键部署至 Ubuntu 服务器。

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/krisyinzh/Prism.git
cd Prism
```

### 2. 后端启动 (Python 3.10+)
```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动后端
python app.py
```

### 3. 前端启动 (Node.js 18+)
```bash
npm install
npm run dev
```

## 🛠️ 服务器部署 (Ubuntu 24.04)

我们提供了一键部署脚本，只需在 root 目录下执行：

```bash
chmod +x deploy.sh
./deploy.sh
```

## 📄 许可证

MIT License
