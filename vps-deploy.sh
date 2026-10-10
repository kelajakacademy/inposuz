#!/bin/bash

# ==============================================================================
# BarPOS - Automatic VPS Server Setup & Deployment Script (Ubuntu 22.04/24.04)
# ==============================================================================

set -e

echo "🚀 BarPOS VPS Avtomatik O'rnatish Skripti Boshlandi..."

# 1. System Update & Dependencies
echo "📦 Tizim paketlari yangilanmoqda..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git build-essential nginx certbot python3-certbot-nginx sqlite3 ufw

# 2. Install Node.js 22 LTS
echo "🟢 Node.js v22 o'rnatilmoqda..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node versiyasi: $(node -v)"
echo "NPM versiyasi: $(npm -v)"

# 3. Install PM2 & TSX globally
echo "⚙️ PM2 ва TSX глобал ўрнатилмоқда..."
sudo npm install -g pm2 tsx

# 4. Project Build
echo "🛠 Loyiha kutubxonalari o'rnatilmoqda va build qilinmoqda..."
npm install
npm run build

# 5. Start Application with PM2
echo "🔄 PM2 orqali BarPOS servisi ishga tushirilmoqda..."
pm2 stop barpos || true
pm2 delete barpos || true
pm2 start "npm start" --name "barpos"
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME || true

# 6. Configure UFW Firewall
echo "🛡 Firewall портлари очилмоқда (80, 443, 22)..."
sudo ufw allow 22/tcp || true
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw allow 3000/tcp || true
echo "y" | sudo ufw enable || true

echo "✅ BarPOS VPS Serverda muvaffaqiyatli ishga tushdi!"
echo "📍 Ilova порт 3000 да ишламоқда: http://YOUR_SERVER_IP:3000"
