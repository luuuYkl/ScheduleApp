# 📋 项目接手文档 - ScheduleApp

> **最后更新**: 2026-01-11  
> **维护者**: @luuuYkl  
> **项目状态**: ✅ 生产就绪

---

## 🎯 项目概述

ScheduleApp 是一个现代化的 **AI 驱动的习惯追踪和日程管理应用**，专为长期目标管理和日常任务执行而设计。

### 核心理念

- **计划不是进度追踪，而是方向确认** - 弱化百分比，强调阶段感
- **事件型思维 vs 任务型思维** - 日程强调时间，任务强调完成
- **移动优先，响应式自适应** - 完美支持桌面和移动端

### 主要功能

| 功能模块 | 说明 | 状态 |
|---------|------|------|
| 📈 计划管理 | 长期目标规划，AI 智能建议 | ✅ 完成 |
| ✅ 任务管理 | 日常任务创建、重复任务、进度追踪 | ✅ 完成 |
| 📅 日程管理 | 事件提醒、快捷创建 | ✅ 完成 |
| 📊 日志分析 | AI 驱动的任务分析和建议 | ✅ 完成 |
| 🎨 主题系统 | 暗色/明亮双模式 | ✅ 完成 |
| 👤 用户系统 | 注册登录、头像管理 | ✅ 完成 |

---

## 🛠️ 技术栈

### 前端框架
```
Vue 3.5.13        # Composition API + <script setup>
TypeScript 5.7.2  # 严格类型检查
Vite 6.0.7        # 构建工具
Pinia 2.3.2       # 状态管理
Vue Router 4.5.0  # 路由管理
```

### 开发工具
```
Vitest 3.0.5      # 单元测试
jsdom 26.0.0      # DOM 模拟
ESLint            # 代码质量
TypeScript        # 类型检查
```

### 关键依赖
```
DiceBear API      # 用户头像生成
DeepSeek API      # AI 功能支持（需要 API Key）
```

---

## 📁 项目结构

```
ScheduleApp/
├── public/                    # 静态资源
│   ├── clear-console-script.js
│   ├── clear-storage.html
│   └── theme-test.html
│
├── src/
│   ├── assets/               # 全局样式
│   │   └── style.css        # 辅助样式
│   │
│   ├── components/          # 可复用组件
│   │   ├── auth/           # 认证组件
│   │   ├── calendar/       # 日历组件
│   │   ├── common/         # 通用组件（Button, Card, Modal）
│   │   ├── home/           # 首页组件
│   │   │   ├── PlanOverview.vue   # ⭐ 计划进度概览
│   │   │   └── TaskList.vue       # ⭐ 今日任务列表
│   │   ├── log/            # 日志组件
│   │   │   └── AIReviewPanel.vue  # ⭐ AI 分析面板
│   │   ├── plan/           # 计划组件
│   │   │   └── AISuggestions.vue  # ⭐ AI 建议组件
│   │   ├── schedule/       # 日程组件
│   │   │   └── ScheduleForm.vue   # ⭐ 日程创建表单
│   │   └── task/           # 任务组件
│   │
│   ├── pages/              # 页面组件
│   │   ├── Auth/          # 登录注册页
│   │   ├── Home/          # ⭐ 首页
│   │   ├── Log/           # ⭐ 日志页
│   │   ├── Plan/          # ⭐ 计划管理页
│   │   ├── Schedule/      # 日程管理页
│   │   ├── Task/          # ⭐ 任务详情页
│   │   └── User/          # 用户中心页
│   │
│   ├── router/            # 路由配置
│   │   └── index.ts       # ⭐ 路由定义 + 认证守卫
│   │
│   ├── services/          # 服务层
│   │   ├── api.ts         # ⭐ API 接口（Mock/Backend 切换）
│   │   ├── api.types.ts   # ⭐ API 类型定义
│   │   ├── ai.ts          # ⭐ AI 服务（计划优化）
│   │   ├── ai-review.ts   # ⭐ AI 分析服务（日志分析）
│   │   ├── generate-log.ts    # 日志生成
│   │   ├── generate-plan.ts   # 计划生成
│   │   ├── plan.ts            # 计划辅助
│   │   └── repeat-task.ts     # 重复任务生成
│   │
│   ├── store/             # Pinia 状态管理
│   │   ├── index.ts       # Store 入口
│   │   ├── user.ts        # ⭐ 用户状态
│   │   ├── plans.ts       # ⭐ 计划状态
│   │   ├── tasks.ts       # ⭐ 任务状态
│   │   ├── schedules.ts   # 日程状态
│   │   ├── log.ts         # 日志状态
│   │   ├── ai-review.ts   # ⭐ AI 分析状态
│   │   └── streak.ts      # 连续打卡状态
│   │
│   ├── config.ts          # ⭐ 全局配置
│   ├── App.vue            # 根组件
│   ├── main.ts            # 应用入口
│   └── style.css          # ⭐ 主题系统（暗色/明亮模式）
│
├── docs/                  # 文档
│   ├── AI_REVIEW_GUIDE.md
│   └── AI_REVIEW_IMPLEMENTATION.md
│
├── .env.example           # 环境变量示例
├── CHANGELOG.md           # ⭐ 更新日志
├── README.md              # 项目说明
├── package.json           # 依赖配置
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 配置
└── vitest.config.ts       # Vitest 配置
```

**⭐ 标记表示关键文件，新同事应优先了解**

---

## 🚀 快速开始

### 1. 环境要求

```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### 2. 克隆项目

```bash
git clone https://github.com/luuuYkl/ScheduleApp.git
cd ScheduleApp
```

### 3. 安装依赖

```bash
npm install
```

### 4. 配置环境变量（可选）

如果需要使用真实的 AI 功能，创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 DeepSeek API Key：

```env
VITE_DEEPSEEK_API_KEY=your_api_key_here
```

> ⚠️ **注意**: 默认使用 Mock 数据，不需要 API Key 即可运行。

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 6. 构建生产版本

```bash
npm run build
npm run preview  # 预览生产构建
```

---

## 🏗️ 核心架构

### Mock-First 开发模式

```typescript
// src/config.ts
export const APP_CONFIG = {
  USE_MOCK_API: true,  // true = Mock 数据，false = 真实后端
};

// src/services/api.ts
export const API = APP_CONFIG.USE_MOCK_API ? mockAPI : backendAPI;
```

**工作流程**:
1. 所有 API 接口先在 `mockAPI` 中实现
2. 类型定义在 `api.types.ts` 中统一管理
3. `APIInterface` 确保 Mock 和 Backend 接口一致
4. 切换 `USE_MOCK_API` 即可无缝切换数据源

### 状态管理模式

```typescript
// Pinia Store 标准模式
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { API } from '@/services/api';

export const useExampleStore = defineStore('example', () => {
  // 状态
  const items = ref<Item[]>([]);
  const loading = ref(false);

  // 计算属性
  const itemCount = computed(() => items.value.length);

  // 方法：先调用 API，再更新本地状态
  async function loadItems() {
    loading.value = true;
    try {
      items.value = await API.getItems();
    } finally {
      loading.value = false;
    }
  }

  async function updateItem(id: number, data: UpdatePayload) {
    const updated = await API.updateItem(id, data);
    const index = items.value.findIndex(item => item.id === id);
    if (index !== -1) items.value[index] = updated;
    return updated;
  }

  return { items, loading, itemCount, loadItems, updateItem };
});
```

### 路由守卫

```typescript
// src/router/index.ts
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  
  if (to.meta.requiresAuth && !userStore.user) {
    // 需要登录但未登录 -> 跳转登录页
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});
```

---

## 🎨 设计系统

### CSS 主题变量

```css
/* src/style.css */

/* 暗色模式 */
html[data-theme="dark"] {
  --bg-main: #0E1117;
  --bg-card: #161B22;
  --bg-card-hover: #1C2128;
  --text-main: #E5E7EB;
  --ai-main: #6366F1;
  /* ... */
}

/* 明亮模式 */
html[data-theme="light"] {
  --bg-main: #F5F5F5;
  --bg-card: #FAFAFA;
  --bg-card-hover: #F0F0F0;
  --text-main: #0F172A;
  --ai-main: #6366F1;
  /* ... */
}
```

### 5层信息结构标准

所有列表组件都遵循这个结构：

```vue
<template>
  <div class="item">
    <!-- 左列：时间（56px 固定宽度） -->
    <div class="time-col">{{ formatDate(date) }}</div>
    
    <!-- 右列：内容 -->
    <div class="content-col">
      <!-- 第1行：勾选 + 状态圆点 + 标题 -->
      <div class="row title-row">
        <input type="checkbox" class="checkbox" />
        <span class="status-dot" :class="status"></span>
        <span class="title">{{ title }}</span>
      </div>
      
      <!-- 第2行：副信息 -->
      <div class="row meta">
        <span>⏱ {{ duration }} 分钟</span>
        <span>· {{ note }}</span>
      </div>
      
      <!-- 第3行：标签 + 操作 -->
      <div class="row tags">
        <span class="tag">标签</span>
        <button class="btn">操作</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.item {
  display: grid;
  grid-template-columns: 56px 1fr;
  column-gap: 12px;
  padding: 12px 0;
}

.time-col {
  font-size: 12px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.content-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.title {
  font-weight: 500;
  font-size: 14px;
  color: var(--text-main);
}

.meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 6px;
}
</style>
```

---

## 💡 核心功能说明

### 1. 计划管理

**文件**: `src/components/home/PlanOverview.vue`

**特点**:
- 响应式卡片布局（桌面2-3列，移动横滑）
- 4要素结构：名称、进度、状态、AI洞察
- 智能排序：进行中 > 有推进 > 最新
- 分段进度条（█ █ ▒ ▒ ▒）

**关键代码**:
```typescript
function progressFor(planId: number) {
  // 计算计划完成度
  const tasksInRange = taskStore.tasks.filter(/* ... */);
  const done = tasksInRange.filter(t => t.status === "done").length;
  return Math.round((done / tasksInRange.length) * 100);
}

function getAIInsight(plan: any): string {
  // 根据推进情况生成智能建议
  if (recentTasks.length === 0) return '建议重新审视目标';
  if (recentTasks.length >= 3) return '推进稳定，保持节奏';
  // ...
}
```

### 2. AI 日志分析

**文件**: `src/components/log/AIReviewPanel.vue`

**特点**:
- 时间维度分析（今天/本周/本月）
- 任务预览面板
- 本地时区处理
- 智能建议生成

**关键代码**:
```typescript
// 本地时区日期字符串
function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 筛选今天的任务
const todayTasks = allTasks.filter(t => {
  return toLocalDateString(parseLocalDate(t.task_date)) === todayStr;
});
```

### 3. 任务详情页

**文件**: `src/pages/Task/TaskDetailPage.vue`

**结构**:
1. 标题区：状态点 + 大标题 + 属性栏
2. 内容区：进度 + 勾选 + 描述
3. AI 分析区：可折叠智能建议

### 4. 日程创建

**文件**: `src/components/schedule/ScheduleForm.vue`

**特点**:
- 事件型思维（强调时间和提醒）
- 快捷日期选择
- 提醒方式设置
- 重复规则
- 地点和备注

---

## 📝 开发规范

### TypeScript 使用

```typescript
// ✅ 推荐：使用类型定义
interface Task {
  id: number;
  title: string;
  status: 'pending' | 'done' | 'missed';
  task_date: string;
}

// ✅ 推荐：使用泛型
const tasks = ref<Task[]>([]);

// ❌ 避免：使用 any
const data: any = await fetchData(); // 不推荐
```

### 组件命名

```
PascalCase    - 组件文件名：TaskList.vue
camelCase     - 函数/变量：formatDate()
kebab-case    - CSS 类名：.task-list
UPPER_SNAKE   - 常量：APP_CONFIG
```

### 提交规范

```bash
feat: 新增功能
fix: 修复 Bug
docs: 文档更新
style: 样式调整（不影响功能）
refactor: 代码重构
perf: 性能优化
test: 测试相关
chore: 构建/工具配置

# 示例
git commit -m "feat: 添加任务批量删除功能"
git commit -m "fix: 修复明亮模式下卡片 hover 变黑"
```

---

## 🧪 测试

### 运行测试

```bash
npm run test          # 监视模式
npm run test:ui       # UI 界面
npm run coverage      # 覆盖率报告
```

### 测试文件位置

```
src/services/__tests__/
src/store/__tests__/
```

### 测试示例

```typescript
// src/services/__tests__/generate-log.spec.ts
import { describe, it, expect } from 'vitest';
import { generateLog } from '../generate-log';

describe('generateLog', () => {
  it('should generate log from tasks', () => {
    const tasks = [{ id: 1, status: 'done', /* ... */ }];
    const log = generateLog(tasks, []);
    expect(log.completion_rate).toBeGreaterThan(0);
  });
});
```

---

## 🔧 常见问题

### Q1: 如何切换到真实后端？

**A**: 编辑 `src/config.ts`：

```typescript
export const APP_CONFIG = {
  USE_MOCK_API: false,  // 改为 false
};
```

然后在 `src/services/api.ts` 中实现 `backendAPI`。

### Q2: 如何添加新的 API 接口？

**A**: 
1. 在 `src/services/api.types.ts` 中定义类型
2. 在 `APIInterface` 中添加方法签名
3. 在 `mockAPI` 中实现 Mock 版本
4. 在 `backendAPI` 中实现真实版本

```typescript
// 1. 定义类型
export interface NewFeature {
  id: number;
  name: string;
}

// 2. 添加到接口
export interface APIInterface {
  // ... 现有方法
  getNewFeature(id: number): Promise<NewFeature>;
}

// 3. Mock 实现
const mockAPI: APIInterface = {
  // ... 现有实现
  async getNewFeature(id: number) {
    return { id, name: 'Mock Feature' };
  }
};
```

### Q3: 如何添加新的主题色？

**A**: 编辑 `src/style.css`：

```css
html[data-theme="dark"] {
  --my-custom-color: #FF6B6B;
}

html[data-theme="light"] {
  --my-custom-color: #E03131;
}
```

然后在组件中使用：

```css
.my-element {
  color: var(--my-custom-color);
}
```

### Q4: 时区问题如何处理？

**A**: 使用工具函数：

```typescript
import { toLocalDateString, parseLocalDate } from '@/components/log/AIReviewPanel.vue';

// 获取本地日期字符串
const today = toLocalDateString(new Date()); // "2026-01-11"

// 解析日期字符串为本地 Date 对象
const date = parseLocalDate("2026-01-11"); // Date 对象，本地时区
```

### Q5: 如何调试 AI 功能？

**A**: 
1. 检查 `.env` 文件中的 API Key
2. 在浏览器控制台查看网络请求
3. 查看 `src/services/ai.ts` 和 `ai-review.ts` 中的错误处理
4. 使用 Mock 模式进行快速测试

### Q6: 移动端样式如何调试？

**A**: 
```bash
# 开发服务器暴露到网络
npm run dev -- --host

# 然后在手机浏览器访问
http://[你的内网IP]:5173
```

或使用浏览器开发者工具的设备模拟器。

---

## 📚 推荐学习资源

### Vue 3
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Composition API RFC](https://vuejs.org/guide/extras/composition-api-faq.html)

### TypeScript
- [TypeScript 中文文档](https://www.typescriptlang.org/zh/)
- [TypeScript 类型体操](https://github.com/type-challenges/type-challenges)

### Pinia
- [Pinia 官方文档](https://pinia.vuejs.org/zh/)

### CSS
- [CSS Variables](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Using_CSS_custom_properties)
- [CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)

---

## 🤝 协作指南

### 开发流程

1. **拉取最新代码**
   ```bash
   git pull origin main
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **开发并测试**
   ```bash
   npm run dev
   npm run test
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Review 要点

- ✅ 类型安全：无 TypeScript 错误
- ✅ 样式一致：遵循 5层信息结构
- ✅ 响应式：桌面和移动端都测试
- ✅ 主题兼容：暗色和明亮模式都正常
- ✅ 性能：无明显卡顿
- ✅ 测试：关键功能有单元测试

---

## 📞 联系方式

- **项目维护者**: @luuuYkl
- **GitHub Issues**: https://github.com/luuuYkl/ScheduleApp/issues
- **项目 Wiki**: https://github.com/luuuYkl/ScheduleApp/wiki

---

## 📄 附录

### 环境变量说明

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `VITE_DEEPSEEK_API_KEY` | DeepSeek API 密钥 | 否 | - |
| `VITE_API_BASE_URL` | 后端 API 基础 URL | 否 | - |

### NPM 脚本说明

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run test` | 运行测试（监视模式） |
| `npm run test:ui` | 运行测试（UI 模式） |
| `npm run coverage` | 生成测试覆盖率报告 |

### 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

---

## ✨ 最后的话

欢迎加入 ScheduleApp 团队！这个项目注重用户体验和代码质量，希望你能快速上手并做出自己的贡献。

如果在开发过程中遇到问题，不要犹豫：
1. 查看本文档
2. 搜索已有的 GitHub Issues
3. 在团队群里提问
4. 创建新的 Issue

祝开发愉快！🚀
