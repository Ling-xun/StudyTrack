# StudyTrack

一个使用 Next.js + TypeScript + Prisma + SQLite 开发的学习打卡 Web App。

## 技术栈

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui 风格组件
- Prisma
- SQLite
- dayjs
- lucide-react

## 功能

- 学习分类管理
- 学习打卡记录
- 首页学习概览
- 学习记录列表
- 响应式 UI

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

如果本机 Prisma 迁移引擎不可用，也可以使用项目内置初始化脚本：

```bash
npm run db:init
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

## 项目结构

- `app`：页面、布局和 API Routes
- `components`：布局、首页、分类、打卡和通用 UI 组件
- `lib`：Prisma、日期、图标和工具函数
- `prisma`：数据库模型与种子数据
