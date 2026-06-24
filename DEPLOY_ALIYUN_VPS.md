# 域名 + VPS 部署指南

这份指南用于把 StudyTrack 部署到 VPS，并通过你自己的域名访问。

## 1. 在阿里云添加域名解析

进入阿里云控制台的域名解析页面，为你的域名添加：

```text
记录类型: A
主机记录: @
记录值: YOUR_VPS_IP
```

如果也想使用 `www`：

```text
记录类型: CNAME
主机记录: www
记录值: your-domain.example
```

也可以把 `www` 配成 A 记录，直接指向同一个 VPS IP。

VPS 在新加坡，一般不需要做中国大陆 ICP 备案。解析通常几分钟内生效，慢的时候可能需要更久。

## 2. 在 VPS 安装运行环境

以下命令适合 Ubuntu/Debian 系统：

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx git
sudo systemctl enable --now docker nginx
```

如果开启了防火墙，放行 SSH、HTTP 和 HTTPS：

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 3. 上传项目到 VPS

任选一种方式：

```bash
git clone <你的仓库地址> study-track
cd study-track
```

或者从本机上传项目目录到服务器，再进入项目目录。

## 4. 配置生产环境变量

在 VPS 的项目目录中执行：

```bash
cp .env.production.example .env
nano .env
```

把这些值改掉：

```text
POSTGRES_PASSWORD=数据库强密码
APP_PASSWORD=登录这个打卡 app 的密码
AUTH_SECRET=一串很长的随机密钥
COOKIE_SECURE=true
```

`POSTGRES_PASSWORD` 建议使用字母和数字组合。如果要使用 `@`、`:`、`/` 这类特殊字符，需要在数据库连接地址里做 URL 编码。

可以用这个命令生成 `AUTH_SECRET`：

```bash
openssl rand -hex 32
```

## 5. 启动应用和数据库

```bash
docker compose up -d --build
docker compose logs -f app
```

第一次启动时会自动执行数据库迁移，并写入默认学习分类。

确认本机服务正常：

```bash
curl -I http://127.0.0.1:3100/login
```

## 6. 配置 Nginx 域名转发

复制模板：

```bash
sudo cp deploy/nginx.studytrack.conf /etc/nginx/sites-available/studytrack.conf
sudo nano /etc/nginx/sites-available/studytrack.conf
```

这里已经替换成你的域名：

```text
your-domain.example www.your-domain.example
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/studytrack.conf /etc/nginx/sites-enabled/studytrack.conf
sudo nginx -t
sudo systemctl reload nginx
```

现在可以先访问：

```text
http://your-domain.example
```

## 7. 开启 HTTPS

等阿里云 DNS 已经指向 VPS 后执行：

```bash
sudo certbot --nginx -d your-domain.example -d www.your-domain.example
```

如果你只解析了根域名，就只写一个：

```bash
sudo certbot --nginx -d your-domain.example
```

完成后访问：

```text
https://your-domain.example
```

## 8. 后续更新应用

进入 VPS 项目目录：

```bash
git pull
docker compose up -d --build
```

查看日志：

```bash
docker compose logs -f app
```

停止服务：

```bash
docker compose down
```

只要不删除 Docker volume，PostgreSQL 数据会保留在 `postgres-data` 里。

## 9. 如果要重新打包 Android APK

当前 Android WebView 壳的入口地址在：

```text
android-webview-app/app/src/main/java/com/studytrack/mobile/MainActivity.java
```

把这一行：

```java
private static final String APP_URL = "http://YOUR_VPS_IP:3100";
```

改成你的 HTTPS 域名：

```java
private static final String APP_URL = "https://your-domain.example";
```

然后重新构建 APK。这样手机打开的就是域名版本，而不是旧 IP。
