# 项目页面和组件调用关系说明

## 📁 项目结构概览

```
src/
├── pages/           # 页面组件（路由级别）
├── components/      # 可复用组件
├── router/          # 路由配置
├── store/           # 状态管理
└── services/        # API 服务层
```

---

## 🗺️ 路由配置 (src/router/index.ts)

### 需要认证的页面 (requiresAuth: true)

| 路由路径 | 页面组件 | 功能说明 | 动态参数 |
|---------|---------|---------|---------|
| `/` | 重定向到 `/home` | - | - |
| `/home` | `HomePage.vue` | 首页：显示计划概览和任务列表 | - |
| `/plan/create` | `PlanCreatePage.vue` | 创建新计划 | - |
| `/plan/:id/tasks` | `PlanTasksPage.vue` | 管理指定计划下的任务 | `id`: 计划ID |
| `/plan/calendar/:id` | `PlanCalendarPage.vue` | 日历视图显示计划任务 | `id`: 计划ID |
| `/log` | `LogPage.vue` | AI 生成的每日日志列表 | - |
| `/task/:id` | `TaskDetailPage.vue` | 任务详情页 | `id`: 任务ID |
| `/user/profile` | `ProfilePage.vue` | 用户个人资料 | - |

### 公开页面 (showBottomNav: false)

| 路由路径 | 页面组件 | 功能说明 |
|---------|---------|---------|
| `/login` | `LoginPage.vue` | 用户登录 |
| `/register` | `RegisterPage.vue` | 用户注册 |

---

## 📄 页面详细说明

### 1. 首页 (HomePage.vue)

**路径**: `src/pages/Home/HomePage.vue`

**使用的组件**:
- `PlanOverview` - 计划概览卡片
- `TaskList` - 今日任务列表

**调用的 Store**:
- `usePlanStore` - 加载计划数据
- `useTaskStore` - 加载任务数据

**主要功能**:
- 显示用户所有计划的概览
- 显示今日待办任务
- 提供快速跳转到"创建计划"和"查看日志"的入口

**代码结构**:
```vue
<template>
  <div class="page home">
    <div class="grid">
      <div class="actions card">
        <button @click="goLog">查看日志</button>
        <button @click="refresh">刷新数据</button>
      </div>
      <PlanOverview @create="goCreate" />
      <TaskList />
    </div>
  </div>
</template>

<script setup>
import PlanOverview from "@/components/home/PlanOverview.vue";
import TaskList from "@/components/home/TaskList.vue";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";
</script>
```

---

### 2. 登录页面 (LoginPage.vue)

**路径**: `src/components/auth/LoginPage.vue`

**使用的组件**:
- `AuthForm` - 通用认证表单（支持登录/注册模式）

**主要功能**:
- 用户登录
- 跳转到注册页面

**代码结构**:
```vue
<template>
  <AuthForm mode="login" @success="goHome" @switch="toRegister" />
</template>

<script setup>
import AuthForm from "@/components/auth/AuthForm.vue";
</script>
```

---

### 3. 注册页面 (RegisterPage.vue)

**路径**: `src/components/auth/RegisterPage.vue`

**使用的组件**:
- `AuthForm` - 通用认证表单（注册模式）

**主要功能**:
- 用户注册
- 跳转到登录页面

---

### 4. 计划创建页面 (PlanCreatePage.vue)

**路径**: `src/pages/Plan/PlanCreatePage.vue`

**使用的组件**:
- `PlanForm` - 计划表单组件

**调用的 Store**:
- `usePlanStore` - 创建新计划

**主要功能**:
- 输入计划标题、描述、开始/结束日期、频率
- 提交后创建计划并返回首页

---

### 5. 计划任务管理页面 (PlanTasksPage.vue)

**路径**: `src/pages/Plan/PlanTasksPage.vue`

**使用的组件**:
- 无（自包含所有UI）

**调用的 Store**:
- `useTaskStore` - 任务的增删改查
- `useUserStore` - 获取当前用户ID

**主要功能**:
- 显示指定计划下的所有任务
- 添加新任务（标题、日期）
- 勾选任务完成/未完成（自动触发日志生成）
- 编辑任务信息
- 删除任务

---

### 6. 日历视图页面 (PlanCalendarPage.vue)

**路径**: `src/pages/Plan/PlanCalendarPage.vue`

**使用的组件**:
- `CalendarView` - 日历组件

**调用的 Store**:
- `usePlanStore` - 获取计划和任务数据

**主要功能**:
- 以日历形式展示计划下的任务
- 可视化任务分布

---

### 7. 日志页面 (LogPage.vue)

**路径**: `src/pages/Log/LogPage.vue`

**使用的组件**:
- 无（自包含所有UI）

**调用的 Store**:
- `useLogStore` - 加载和生成日志
- `useUserStore` - 获取用户ID
- `useTaskStore` - 加载任务用于日志生成

**主要功能**:
- 显示历史日志列表
- 手动生成今日日志（基于当天任务完成情况）
- 刷新日志列表
- 显示完成度百分比和徽章

---

### 8. 任务详情页面 (TaskDetailPage.vue)

**路径**: `src/pages/Task/TaskDetailPage.vue`

**使用的组件**:
- `TaskProgress` - 任务进度条组件
- `TaskCheckBox` - 任务勾选框组件

**调用的 Store**:
- `useTaskStore` - 获取和更新任务详情

**主要功能**:
- 显示任务详细信息
- 更新任务状态
- 显示任务进度

---

### 9. 个人资料页面 (ProfilePage.vue)

**路径**: `src/pages/User/ProfilePage.vue`

**调用的 Store**:
- `useUserStore` - 获取用户信息和登出

**主要功能**:
- 显示用户信息（用户名、头像）
- 登出功能

---

## 🧩 可复用组件说明

### 认证相关组件 (components/auth/)

#### AuthForm.vue
**功能**: 通用认证表单组件
**Props**:
- `mode`: `'login' | 'register'` - 登录或注册模式

**Events**:
- `@success` - 登录/注册成功时触发
- `@switch` - 切换登录/注册模式时触发

**调用的 Store**:
- `useUserStore` - 执行登录/注册操作

---

### 首页相关组件 (components/home/)

#### PlanOverview.vue
**功能**: 计划概览卡片
**Events**:
- `@create` - 点击"创建计划"时触发

**调用的 Store**:
- `usePlanStore` - 加载和显示所有计划

**显示内容**:
- 计划标题、描述
- 开始/结束日期
- 计划频率

#### TaskList.vue
**功能**: 今日任务列表
**调用的 Store**:
- `useTaskStore` - 加载和管理任务
- `useUserStore` - 获取用户信息

**显示内容**:
- 今日所有任务
- 任务完成状态勾选框
- 任务标题和日期

---

### 日历相关组件 (components/calendar/)

#### CalendarView.vue
**功能**: 日历视图组件
**Props**:
- `planId`: `number` - 要显示的计划ID

**显示内容**:
- 月历视图
- 任务标记

---

### 任务相关组件 (components/task/)

#### TaskCheckBox.vue
**功能**: 任务勾选框组件
**Props**:
- `taskId`: `number` - 任务ID
- `status`: `TaskStatus` - 任务状态

**Events**:
- `@change` - 状态改变时触发

#### TaskProgress.vue
**功能**: 任务进度条组件
**Props**:
- `completed`: `number` - 已完成数量
- `total`: `number` - 总任务数

**显示内容**:
- 进度条
- 百分比文字

---

### 计划相关组件 (components/plan/)

#### PlanForm.vue
**功能**: 计划表单组件
**Props**:
- `mode`: `'create' | 'edit'` - 创建或编辑模式
- `initialData?`: `Plan` - 编辑时的初始数据

**Events**:
- `@submit` - 表单提交时触发

**表单字段**:
- 计划标题
- 描述
- 开始日期
- 结束日期
- 频率（每日/每周/自定义）

---

### 日志相关组件 (components/log/)

#### DailyCheckIn.vue
**功能**: 每日签到组件
**调用的 Store**:
- `useStreakStore` - 签到记录

#### StreakCounter.vue
**功能**: 连续签到计数器
**Props**:
- `currentStreak`: `number` - 当前连续天数
- `longestStreak`: `number` - 历史最长连续天数

---

### 通用组件 (components/common/)

#### Button.vue
**功能**: 通用按钮组件
**Props**:
- `variant`: 按钮样式（primary/secondary/success/danger等）
- `size`: 按钮大小（xs/sm/md/lg/xl）
- `loading`: 加载状态

#### Card.vue
**功能**: 卡片容器组件
**Slots**:
- `header` - 卡片头部
- `default` - 卡片内容
- `footer` - 卡片底部

#### Modal.vue
**功能**: 模态框组件
**Props**:
- `visible`: `boolean` - 显示/隐藏
- `title`: `string` - 标题

**Events**:
- `@close` - 关闭时触发

---

## 🔄 组件调用关系图

```
App.vue (根组件)
│
├── Router View
│   │
│   ├── HomePage (首页)
│   │   ├── PlanOverview (计划概览)
│   │   └── TaskList (任务列表)
│   │
│   ├── LoginPage (登录页)
│   │   └── AuthForm (认证表单)
│   │
│   ├── RegisterPage (注册页)
│   │   └── AuthForm (认证表单)
│   │
│   ├── PlanCreatePage (创建计划)
│   │   └── PlanForm (计划表单)
│   │
│   ├── PlanTasksPage (任务管理)
│   │   └── (自包含UI)
│   │
│   ├── PlanCalendarPage (日历视图)
│   │   └── CalendarView (日历组件)
│   │
│   ├── LogPage (日志页面)
│   │   └── (自包含UI)
│   │
│   ├── TaskDetailPage (任务详情)
│   │   ├── TaskProgress (进度条)
│   │   └── TaskCheckBox (勾选框)
│   │
│   └── ProfilePage (个人资料)
│       └── (自包含UI)
│
└── Bottom Navigation (底部导航 - 仅认证后显示)
    ├── → /home
    ├── → /plan/calendar/1
    └── → /log
```

---

## 🔌 Store 使用情况

### 各页面使用的 Store

| 页面 | useUserStore | usePlanStore | useTaskStore | useLogStore |
|-----|--------------|--------------|--------------|-------------|
| HomePage | ✓ | ✓ | ✓ | - |
| LoginPage | ✓ | - | - | - |
| RegisterPage | ✓ | - | - | - |
| PlanCreatePage | - | ✓ | - | - |
| PlanTasksPage | ✓ | - | ✓ | - |
| PlanCalendarPage | - | ✓ | - | - |
| LogPage | ✓ | - | ✓ | ✓ |
| TaskDetailPage | - | - | ✓ | - |
| ProfilePage | ✓ | - | - | - |

---

## 🎯 关键功能流程

### 1. 用户登录流程
```
LoginPage 
  → AuthForm (mode="login")
    → useUserStore.login()
      → API.login()
        → localStorage 存储 token + user
          → 路由跳转到 /home
```

### 2. 任务完成流程（自动生成日志）
```
PlanTasksPage
  → 勾选任务复选框
    → useTaskStore.toggleTaskStatus()
      → API.updateTask()
        → 自动调用 useLogStore.generateTodayLog()
          → 生成/更新当日日志
            → localStorage 保存
```

### 3. 创建计划流程
```
HomePage
  → 点击"创建计划"
    → 路由跳转到 /plan/create
      → PlanCreatePage
        → PlanForm
          → usePlanStore.createPlan()
            → API.addPlan()
              → 返回 HomePage
```

---

## 📝 备注

1. **认证守卫**: 所有需要认证的页面都通过路由守卫 `beforeEach` 检查 token
2. **自动日志**: 任务状态切换时会自动触发日志生成（在 `tasks.ts` 和 `plans.ts` store 中）
3. **Mock 数据**: 默认使用 Mock API（`APP_CONFIG.USE_MOCK_API = true`），数据存储在 localStorage
4. **响应式设计**: 所有页面支持移动端，底部导航在移动端固定显示
5. **组件复用**: `AuthForm` 同时用于登录和注册，`PlanForm` 支持创建和编辑模式

---

## 🔍 未使用的组件

以下组件已创建但目前未被调用：
- `HelloWorld.vue` - 默认示例组件（可删除）
- `TaskCard.vue` - 任务卡片组件（可能用于未来功能）
- `DailyCheckIn.vue` - 签到组件（功能未完全集成）
- `StreakCounter.vue` - 连续签到计数器（功能未完全集成）

---

*最后更新: 2025-10-29*
