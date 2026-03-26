#!/bin/bash

# --- CareerCompass AI 一键部署脚本 (Ubuntu 24.04 稳健版) ---
# 适用环境: 全新 Ubuntu 24.04 系统, root 用户
# 项目路径: /root/Prism

set -e

# 获取服务器 IP (用于最后展示)
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

echo "===================================================="
echo "   CareerCompass AI - 开始部署 (Ubuntu 24.04)"
echo "===================================================="

# 1. 系统更新与基础依赖
echo ">>> [1/5] 正在更新系统并安装基础依赖..."
apt update
apt install -y python3 python3-pip python3-venv nginx curl git xz-utils

# 2. Node.js 环境安装 (使用官方 LTS 源)
echo ">>> [2/5] 正在安装 Node.js LTS (v20+)..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo "Node 版本: $(node -v)"
echo "NPM 版本: $(npm -v)"

# 3. 后端配置 (Flask)
echo ">>> [3/5] 正在配置 Python 后端..."
cd /root/Prism
# 清理旧的 venv (如果有)
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
# 自动生成或使用已有的 requirements.txt
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    pip install flask flask-cors openai python-dotenv
fi
deactivate

# 4. 前端构建 (React + Vite)
echo ">>> [4/5] 正在安装前端依赖并构建..."
# 清理旧的 node_modules (确保权限纯净)
rm -rf node_modules dist
# 使用 --unsafe-perm 避免 root 权限下的安装问题
npm install --unsafe-perm
# 关键步骤：修复解压后可能丢失的可执行权限
chmod -R +x node_modules/.bin
# 执行构建
echo ">>> 开始生产环境构建 (Vite)..."
npm run build

# 5. 系统服务与 Nginx 配置
echo ">>> [5/5] 正在配置 Nginx 与 Systemd 服务..."

# 修复 Nginx 访问 /root 目录的权限问题
# Ubuntu 默认 Nginx 用户是 www-data，无法访问 /root
# 方案：将 Nginx 运行用户改为 root (生产环境下建议将项目移至 /var/www，但为了快速部署，这里先改用户)
sed -i 's/user www-data;/user root;/' /etc/nginx/nginx.conf

# Nginx 站点配置
cat > /etc/nginx/sites-available/prism <<EOF
server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root /root/Prism/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # 针对流式输出 (SSE) 的优化配置
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;
        tcp_nopush on;
        tcp_nodelay on;
        keepalive_timeout 65;
    }
}
EOF

# 启用配置并重启 Nginx
ln -sf /etc/nginx/sites-available/prism /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# 配置 Systemd 守护进程 (后端)
cat > /etc/systemd/system/prism-backend.service <<EOF
[Unit]
Description=CareerCompass AI Backend Service
After=network.target

[Service]
User=root
WorkingDirectory=/root/Prism
ExecStart=/root/Prism/venv/bin/python app.py
Restart=always
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable prism-backend
systemctl restart prism-backend

echo ""
echo "===================================================="
echo "🎉 部署成功！"
echo "===================================================="
echo "1. 访问地址: http://${SERVER_IP}/"
echo "2. 后端日志: journalctl -u prism-backend -f"
echo "3. 提示: 如果无法访问，请检查云服务器防火墙是否放行 80 端口。"
echo "===================================================="
