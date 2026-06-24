# StudyTrack

一个使用 Next.js + TypeScript + Prisma + Postgres 开发的学习打卡 Web App。

## 技术栈

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui 风格组件
- Prisma
- Postgres
- dayjs
- lucide-react

## 功能

- 学习分类管理
- 学习打卡记录
- 首页学习概览
- 学习记录列表
- 响应式 UI

## V2 新增功能

- 学习记录编辑
- 学习记录删除
- 学习记录搜索
- 按分类筛选学习记录
- 按日期筛选学习记录
- 分类编辑
- 分类删除保护
- 分类记录数量统计
- 数据统计页面
- 最近 7 天学习趋势
- 分类学习时长占比
- Toast 提示
- 删除确认弹窗
- 私人访问密码登录
- 沉浸式阅读与内容编辑
- 移动端 WebView 安全区适配
- Android WebView 壳打包
- AI 学习助手：按记录、分类、近期天数、日期范围或全部记录进行总结与复盘
- AI 历史：保存总结与多轮对话，支持继续追问、复制和删除

## 页面

- `/login` 私人登录
- `/` Dashboard 首页
- `/checkins` 学习记录
- `/checkins/new` 新建学习打卡
- `/checkins/[id]/edit` 编辑学习打卡
- `/categories` 分类管理
- `/statistics` 数据统计
- `/ai` AI 学习助手

## API

- `GET /api/checkins`
- `POST /api/checkins`
- `GET /api/checkins/[id]`
- `PUT /api/checkins/[id]`
- `DELETE /api/checkins/[id]`
- `GET /api/categories`
- `POST /api/categories`
- `GET /api/categories/[id]`
- `PUT /api/categories/[id]`
- `DELETE /api/categories/[id]`
- `GET /api/statistics`
- `POST /api/login`
- `POST /api/logout`
- `POST /api/ai/chat`
- `GET /api/ai/summaries`
- `GET /api/ai/summaries/[id]`
- `DELETE /api/ai/summaries/[id]`
- `GET /api/ai/conversations`
- `GET /api/ai/conversations/[id]`
- `DELETE /api/ai/conversations/[id]`

## 环境变量

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
APP_PASSWORD="change-this-password"
AUTH_SECRET="change-this-long-random-secret"
AI_API_KEY="your-ai-api-key"
AI_BASE_URL="https://api.openai.com/v1"
AI_MODEL="gpt-4.1-mini"
AI_REASONING_ENABLED="false"
```

- `APP_PASSWORD`：登录 StudyTrack 的访问密码。
- `AUTH_SECRET`：用于签名登录状态，建议使用一串较长的随机字符。
- `AI_API_KEY`：OpenAI-compatible 服务密钥，仅由服务端读取。
- `AI_BASE_URL`：兼容 Chat Completions 的 API 根地址，例如 `https://api.openai.com/v1`。
- `AI_MODEL`：需要调用的模型名称。
- `AI_REASONING_ENABLED`：设为 `true` 时显式开启 DeepSeek thinking，并使用 `high` 推理强度。
- 本地测试时，当前 `.env` 里的默认登录密码是 `123456`。

## 本地运行

1. 安装依赖

```bash
npm install
```

2. 创建本地环境变量

```bash
copy .env.example .env
```

3. 生成 Prisma Client

```bash
npx prisma generate
```

4. 初始化数据库

```bash
npx prisma migrate dev
```

5. 写入默认分类

```bash
npm run prisma:seed
```

6. 启动项目

```bash
npm run dev
```

打开 http://localhost:3000 查看应用。

## 部署到新加坡 VPS

仓库内提供了一套自托管部署文件：

- `Dockerfile`：构建 Next.js 应用镜像
- `docker-compose.yml`：启动 StudyTrack 和 PostgreSQL
- `.env.production.example`：生产环境变量模板
- `deploy/nginx.studytrack.conf`：Nginx 反向代理模板
- `DEPLOY_ALIYUN_VPS.md`：阿里云域名 + VPS 的详细部署步骤

生产环境准备：

```bash
cp .env.production.example .env
```

然后修改 `.env`：

```bash
POSTGRES_PASSWORD="your-postgres-password"
APP_PASSWORD="your-login-password"
AUTH_SECRET="your-long-random-secret"
COOKIE_SECURE="true"
```

启动：

```bash
docker compose up -d --build
```

首次启动会自动执行：

```bash
npx prisma migrate deploy
npm run prisma:seed
```

当前线上域名：

```text
https://anthropicfable5.fun
```

如果服务器已经使用 Nginx Proxy Manager 占用 80/443，可以在代理管理器中把域名转发到应用端口，例如：

```text
anthropicfable5.fun -> http://172.18.0.1:3100
```

## 部署到 Vercel

Windows 和安卓共享数据需要使用线上 Postgres，例如 Neon、Supabase 或 Vercel Marketplace 里的 Postgres 服务。

部署时在 Vercel Project Settings 的 Environment Variables 里配置：

- `DATABASE_URL`：线上 Postgres 连接字符串
- `APP_PASSWORD`：你的私人访问密码
- `AUTH_SECRET`：较长随机字符串
- `AI_API_KEY`：AI 服务密钥
- `AI_BASE_URL`：兼容接口根地址
- `AI_MODEL`：模型名称
- `AI_REASONING_ENABLED`：是否开启 DeepSeek 深度思考

Vercel 的 Build Command 建议设置为：

```bash
npm run vercel-build
```

这个命令会自动创建数据库表、写入默认分类，然后构建应用。

环境变量保存后，需要重新部署才会生效。

第一次连接线上数据库后，运行：

```bash
npm run prisma:deploy
npm run prisma:seed
```

## 部署到 Railway

Railway 更适合把这个项目作为一个完整的 Next.js + Postgres 私人应用来运行。

1. 在 Railway 创建项目，选择从 GitHub 仓库部署。
2. 在项目画布里点击 `+ New`，添加 `Database -> PostgreSQL`。
3. 打开 Next.js 服务的 `Variables`，添加 Postgres 服务里的 `DATABASE_URL` 引用变量。
4. 在 Next.js 服务的 `Variables` 里再添加：

```bash
APP_PASSWORD="your-login-password"
AUTH_SECRET="your-long-random-secret"
```

5. 在 Next.js 服务的 `Settings -> Deploy -> Pre-deploy Command` 里填写：

```bash
npm run railway:predeploy
```

6. 在 Next.js 服务的 `Settings -> Networking` 里点击 `Generate Domain` 生成公网访问地址。

Railway 会使用 `npm run build` 构建项目，并使用 `npm run start` 启动 standalone Next.js 服务。

## Android App

`android-webview-app` 是一个轻量 Android WebView 壳，用于把线上 StudyTrack 包成 APK。

当前入口地址在：

```text
android-webview-app/app/src/main/java/com/studytrack/mobile/MainActivity.java
```

```java
private static final String APP_URL = "https://anthropicfable5.fun";
```

构建 debug APK：

```bash
cd android-webview-app
gradle assembleDebug
```

输出文件：

```text
android-webview-app/app/build/outputs/apk/debug/app-debug.apk
```

项目根目录也会保留一份用于安装测试：

```text
apk-output/StudyTrack-android-debug.apk
```

Android 壳做了这些移动端适配：

- 使用原生容器避让顶部状态栏和底部手势区
- WebView 启动时加载线上 HTTPS 域名
- 禁用页面缓存，方便安装新 APK 后立即看到线上新版本

## 移动端阅读体验

沉浸式阅读支持：

- 全屏覆盖阅读，不露出背后的页面
- 上方功能区默认隐藏
- 点击屏幕中间显示功能区
- 上下滑动时自动隐藏功能区
- 编辑和保存学习内容

## 项目结构

- `app`：页面、布局和 API Routes
- `components`：布局、首页、分类、打卡和通用 UI 组件
- `lib`：Prisma、日期、图标和工具函数
- `prisma`：数据库模型与种子数据
