#!/bin/bash

# ChatNest SSL 证书初始化脚本
# 用法: sudo bash init-letsencrypt.sh

set -e

DOMAIN="chatnest.space"
EMAIL="dh227498161@gmail.com"
COMPOSE="docker-compose"

echo ">>> 创建临时 Nginx 配置 (仅 HTTP)..."
cat > nginx/init.conf << 'NGINX'
server {
    listen 80;
    server_name chatnest.space;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
NGINX

echo ">>> 构建前端..."
$COMPOSE up frontend-builder

echo ">>> 启动临时 Nginx..."
# 临时用 init.conf 替换 default.conf
cp nginx/default.conf nginx/default.conf.bak
cp nginx/init.conf nginx/default.conf
$COMPOSE up -d nginx

echo ">>> 申请 SSL 证书..."
$COMPOSE run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email

echo ">>> 恢复完整 Nginx 配置..."
cp nginx/default.conf.bak nginx/default.conf
rm nginx/default.conf.bak nginx/init.conf

echo ">>> 重启所有服务..."
$COMPOSE down
$COMPOSE up -d

echo ""
echo "=== 部署完成! ==="
echo "访问 https://$DOMAIN"
