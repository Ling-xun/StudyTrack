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

## 页面

- `/login` 私人登录
- `/` Dashboard 首页
- `/checkins` 学习记录
- `/checkins/new` 新建学习打卡
- `/checkins/[id]/edit` 编辑学习打卡
- `/categories` 分类管理
- `/statistics` 数据统计

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

## 环境变量

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
APP_PASSWORD="change-this-password"
AUTH_SECRET="change-this-long-random-secret"
```

- `APP_PASSWORD`：登录 StudyTrack 的访问密码。
- `AUTH_SECRET`：用于签名登录状态，建议使用一串较长的随机字符。
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

## 部署到 Vercel

Windows 和安卓共享数据需要使用线上 Postgres，例如 Neon、Supabase 或 Vercel Marketplace 里的 Postgres 服务。

部署时在 Vercel Project Settings 的 Environment Variables 里配置：

- `DATABASE_URL`：线上 Postgres 连接字符串
- `APP_PASSWORD`：你的私人访问密码
- `AUTH_SECRET`：较长随机字符串

环境变量保存后，需要重新部署才会生效。

第一次连接线上数据库后，运行：

```bash
npm run prisma:deploy
npm run prisma:seed
```

## 项目结构

- `app`：页面、布局和 API Routes
- `components`：布局、首页、分类、打卡和通用 UI 组件
- `lib`：Prisma、日期、图标和工具函数
- `prisma`：数据库模型与种子数据
