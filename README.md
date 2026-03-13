# ScheduleApp - 日程与任务管理应用

一款移动优先的计划/任务/日程跟踪应用，支持 AI 智能优化，帮助用户高效管理日常事务。

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3 (`<script setup>`) + TypeScript |
| 构建工具 | Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router |
| 单元测试 | Vitest |
| API 模式 | Mock / 真实 API 可切换 |

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 配置 AI 功能（可选）
cp .env.example .env.local
# 在 .env.local 中填入你的 OpenAI API Key

# 启动开发服务器
npm run dev

# 构建生产包
npm run build

# 运行测试
npm run test
```

## ⚙️ 配置说明

编辑 `src/config.ts` 切换 Mock / 真实后端：

```ts
export const APP_CONFIG = {
  USE_MOCK_API: true,  // false 时使用真实后端
  BASE_URL: 'http://localhost:3000'
};
