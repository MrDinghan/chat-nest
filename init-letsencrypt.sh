#!/bin/bash

# ChatNest SSL 证书初始化脚本
# 用法: sudo bash init-letsencrypt.sh

set -e

DOMAIN="chatnest.space"
EMAIL="dh227498161@gmail.com"
COMPOSE="docker-compose"

echo ">>> 停止旧服务..."
$COMPOSE down

echo ">>> 构建前端..."
$COMPOSE up frontend-builder

echo ">>> 用 HTTP 临时配置启动 Nginx（申请证书用）..."
$COMPOSE run -d --name chatnest-nginx-init \
  -p 80:80 \
  -v "$(pwd)/nginx/init.conf:/etc/nginx/conf.d/default.conf" \
  -v certbot_www:/var/www/certbot \
  nginx nginx -g "daemon off;"

echo ">>> 申请 SSL 证书..."
$COMPOSE run --rm --entrypoint "certbot certonly --webroot --webroot-path /var/www/certbot -d $DOMAIN --email $EMAIL --agree-tos --no-eff-email" certbot

echo ">>> 停止临时 Nginx..."
docker stop chatnest-nginx-init && docker rm chatnest-nginx-init

echo ">>> 启动所有服务（使用完整 HTTPS 配置）..."
$COMPOSE up -d

echo ""
echo "=== 部署完成! ==="
echo "访问 https://$DOMAIN"
