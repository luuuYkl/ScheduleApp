# UI设计系统规范

## 📋 文档版本信息

**版本**: v1.0  
**最后更新**: 2026-02-15  
**整理者**: AI Assistant  
**原始文档来源**: 多个设计规范文档合并  

---

## 🎯 文档整合说明

本文档整合了以下原始设计规范文档：
- `docs/UI_OPTIMIZATION_SEQUENTIAL_GUIDE.md` - UI优化顺序指南
- `docs/UI_AESTHETIC_MASTER_PLAN.md` - UI美学总体规划
- `UI_IMPLEMENTATION_REPORT.md` - UI实施报告
- `UI_IMPLEMENTATION_SUMMARY.md` - UI实施摘要

---

## 🎨 设计哲学与原则

### 核心设计理念
ScheduleApp的设计遵循以下核心原则：

1. **简洁至上** - 去除不必要的装饰，专注于核心功能
2. **一致性** - 统一的视觉语言和交互模式
3. **可用性优先** - 功能服务于用户体验
4. **响应式适配** - 桌面和移动端的完美平衡
5. **情感化设计** - 通过细节传递温暖和专业感

### 设计价值观
- **效率**：让用户快速完成目标任务
- **直观**：降低学习成本，提高使用效率
- **美观**：现代简约的视觉风格
- **包容**：考虑不同用户群体的需求

---

## 🎯 设计系统架构

### 三层样式架构

```
src/style.css (入口文件)
├── src/styles/tokens.css (设计变量系统)
├── src/styles/base.css (基础样式重置)  
└── src/styles/components.css (组件样式库)
```

### 设计变量系统 (Tokens)

#### 间距系统
```css
:root {
  /* 基础间距单位 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

#### 圆角系统
```css
:root {
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}
```

#### 动效系统
```css
:root {
  /* 缓动函数 */
  --ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-accelerate: cubic-bezier(0.4, 0, 1, 1);
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
  
  /* 持续时间 */
  --dur-fast: 140ms;
  --dur-standard: 220ms;
  --dur-slow: 300ms;
}
```

#### 布局变量
```css
:root {
  --header-height: 64px;
  --bottom-nav-height: 64px;
  --sidebar-width: 220px;
  --max-content-width: 1200px;
}
```

### 主题系统

#### 暗色主题
```css
html[data-theme='dark'] {
  /* 背景色 */
  --bg-main: #0E1117;
  --bg-card: #161B22;
  --bg-card-hover: #1C2128;
  --bg-overlay: rgba(14, 17, 23, 0.8);
  
  /* 文字色 */
  --text-main: #E5E7EB;
  --text-secondary: #9CA3AF;
  --text-tertiary: #6B7280;
  --text-emphasis: #FFFFFF;
  
  /* 边框色 */
  --border-main: rgba(255, 255, 255, 0.08);
  --border-subtle: rgba(255, 255, 255, 0.04);
  --border-strong: rgba(255, 255, 255, 0.16);
  
  /* AI品牌色 */
  --ai-main: #6366F1;
  --ai-light: #818CF8;
  --ai-dark: #4F46E5;
  --ai-bg: rgba(99, 102, 241, 0.12);
  --ai-bg-hover: rgba(99, 102, 241, 0.16);
  
  /* 状态色 */
  --success-main: #10B981;
  --warning-main: #F59E0B;
  --error-main: #EF4444;
  --info-main: #3B82F6;
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
  
  /* 层级 */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

#### 明亮主题
```css
html[data-theme='light'] {
  /* 背景色 */
  --bg-main: #F5F5F5;
  --bg-card: #FAFAFA;
  --bg-card-hover: #F0F0F0;
  --bg-overlay: rgba(245, 245, 245, 0.8);
  
  /* 文字色 */
  --text-main: #0F172A;
  --text-secondary: #475569;
  --text-tertiary: #94A3B8;
  --text-emphasis: #000000;
  
  /* 边框色 */
  --border-main: rgba(15, 23, 42, 0.08);
  --border-subtle: rgba(15, 23, 42, 0.04);
  --border-strong: rgba(15, 23, 42, 0.16);
  
  /* AI品牌色 */
  --ai-main: #6366F1;
  --ai-light: #818CF8;
  --ai-dark: #4F46E5;
  --ai-bg: rgba(99, 102, 241, 0.08);
  --ai-bg-hover: rgba(99, 102, 241, 0.12);
  
  /* 状态色 */
  --success-main: #10B981;
  --warning-main: #F59E0B;
  --error-main: #EF4444;
  --info-main: #3B82F6;
  
  /* 阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
  
  /* 层级 */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

---

## 🏗️ 布局系统规范

### 响应式断点
```css
/* 移动端小屏 */
@media (max-width: 480px) { }

/* 移动端 */
@media (max-width: 768px) { }

/* 平板端 */
@media (min-width: 769px) and (max-width: 1023px) { }

/* 桌面端小屏 */
@media (min-width: 1024px) and (max-width: 1200px) { }

/* 桌面端大屏 */
@media (min-width: 1201px) { }
```

### App Shell结构

#### 桌面端布局
```
┌─────────────────────────────────────┐
│              顶栏 (64px)              │
├────────┬────────────────────────────┤
│        │                            │
│ 侧边栏  │         主内容区            │
│ (220px) │                            │
│        │                            │
└────────┴────────────────────────────┘
```

#### 移动端布局
```
┌─────────────────────────────────────┐
│              顶栏 (64px)              │
├─────────────────────────────────────┤
│                                     │
│            主内容区                  │
│                                     │
├─────────────────────────────────────┤
│           底部导航 (64px)             │
└─────────────────────────────────────┘
```

### 栅格系统
```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.grid {
  display: grid;
  gap: var(--space-4);
}

.grid-cols-1 { grid-template-columns: 1fr; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}
```

---

## 🎨 组件设计规范

### 通用组件标准

#### 按钮 (Button)
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 40px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
  user-select: none;
}

/* 主要按钮 */
.btn--primary {
  background: var(--ai-main);
  color: white;
  border-color: var(--ai-main);
}

.btn--primary:hover {
  background: var(--ai-dark);
  border-color: var(--ai-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* 次要按钮 */
.btn--secondary {
  background: var(--bg-card);
  color: var(--text-main);
  border-color: var(--border-main);
}

.btn--secondary:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
}

/* 禁用状态 */
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 小尺寸 */
.btn--sm {
  height: 32px;
  padding: 0 var(--space-3);
  font-size: 13px;
}

/* 大尺寸 */
.btn--lg {
  height: 48px;
  padding: 0 var(--space-6);
  font-size: 16px;
}
```

#### 卡片 (Card)
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  transition: 
    transform var(--dur-fast) var(--ease-standard),
    box-shadow var(--dur-fast) var(--ease-standard);
}

.card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.card--clickable {
  cursor: pointer;
}

.card--clickable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 紧凑卡片 */
.card--compact {
  padding: var(--space-3);
}

/* 带头部的卡片 */
.card-with-header {
  display: flex;
  flex-direction: column;
}

.card__header {
  padding: var(--space-4) var(--space-4) var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: var(--space-2);
}

.card__body {
  padding: 0 var(--space-4) var(--space-4);
  flex: 1;
}
```

#### 输入框 (Input)
```css
.input {
  width: 100%;
  height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-main);
  font-size: 14px;
  transition: 
    border-color var(--dur-fast) var(--ease-standard),
    box-shadow var(--dur-fast) var(--ease-standard);
}

.input:focus {
  outline: none;
  border-color: var(--ai-main);
  box-shadow: 0 0 0 3px var(--ai-bg);
}

.input::placeholder {
  color: var(--text-tertiary);
}

/* 错误状态 */
.input--error {
  border-color: var(--error-main);
}

.input--error:focus {
  border-color: var(--error-main);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* 成功状态 */
.input--success {
  border-color: var(--success-main);
}

.input--success:focus {
  border-color: var(--success-main);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}
```

#### 导航 (Navigation)
```css
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: 
    background-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard);
}

.nav-item:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
}

.nav-item.router-link-active {
  background: var(--ai-bg);
  color: var(--ai-main);
  box-shadow: inset 3px 0 0 var(--ai-main);
}

/* 移动端底部导航 */
.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 12px;
  transition: 
    color var(--dur-fast) var(--ease-standard),
    background-color var(--dur-fast) var(--ease-standard);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
}

.bottom-nav-item:hover {
  color: var(--text-main);
  background: var(--bg-card);
}

.bottom-nav-item.active,
.bottom-nav-item.router-link-active {
  color: var(--ai-main);
  background: var(--ai-bg);
  box-shadow: inset 0 -2px 0 var(--ai-main);
}
```

---

## 🎭 交互与动效规范

### 交互反馈

#### 悬停效果
```css
.interactive:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.interactive:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}
```

#### 焦点状态
```css
:focus-visible {
  outline: 2px solid var(--ai-main);
  outline-offset: 2px;
}

/* 自定义焦点样式 */
.focus-ring {
  position: relative;
}

.focus-ring:focus-visible::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid var(--ai-main);
  border-radius: inherit;
  pointer-events: none;
}
```

#### 加载状态
```css
.loading {
  position: relative;
  pointer-events: none;
  opacity: 0.6;
}

.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid var(--border-main);
  border-top-color: var(--ai-main);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 动效原则

#### 进场动效
```css
.fade-in {
  animation: fadeIn 0.3s var(--ease-standard) forwards;
  opacity: 0;
}

.slide-up {
  animation: slideUp 0.3s var(--ease-standard) forwards;
  transform: translateY(20px);
  opacity: 0;
}

.scale-in {
  animation: scaleIn 0.2s var(--ease-standard) forwards;
  transform: scale(0.95);
  opacity: 0;
}

@keyframes fadeIn {
  to { opacity: 1; }
}

@keyframes slideUp {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes scaleIn {
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

#### 状态过渡
```css
.state-transition {
  transition: all var(--dur-standard) var(--ease-standard);
}
```

---

## ♿ 无障碍设计规范

### 语义化HTML
```html
<!-- 良好的语义化结构 -->
<header role="banner">
<nav role="navigation" aria-label="主导航">
<main role="main">
<aside role="complementary">
<footer role="contentinfo">

<!-- 表单无障碍 -->
<label for="email">邮箱地址</label>
<input type="email" id="email" aria-describedby="email-help">
<div id="email-help">请输入有效的邮箱地址</div>

<!-- 按钮无障碍 -->
<button aria-label="删除项目" title="删除此项目">
  <svg aria-hidden="true"><!-- 图标 --></svg>
</button>
```

### 键盘导航
```css
/* 确保所有交互元素可聚焦 */
button, a, input, select, textarea {
  min-height: 40px;
}

/* 焦点可见性 */
*:focus {
  outline: 2px solid var(--ai-main);
  outline-offset: 2px;
}

/* 高对比度支持 */
@media (prefers-contrast: high) {
  :root {
    --border-main: #000000;
    --text-secondary: #000000;
  }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 屏幕阅读器支持
```html
<!-- 描述性文本 -->
<span class="sr-only">已完成</span>

<!-- 状态变更通知 -->
<div role="alert" aria-live="polite">
  任务已保存
</div>

<!-- 导航当前位置 -->
<a href="/home" aria-current="page">首页</a>
```

---

## 📱 响应式设计规范

### 移动优先策略
```css
/* 基础样式 - 移动端 */
.component {
  padding: var(--space-3);
  font-size: 14px;
}

/* 平板端增强 */
@media (min-width: 768px) {
  .component {
    padding: var(--space-4);
    font-size: 16px;
  }
}

/* 桌面端优化 */
@media (min-width: 1024px) {
  .component {
    padding: var(--space-6);
    font-size: 18px;
  }
}
```

### 触控友好设计
```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-2);
}

.gesture-area {
  user-select: none;
  touch-action: manipulation;
}
```

### 安全区适配
```css
.safe-area {
  padding-bottom: env(safe-area-inset-bottom, 0);
  padding-top: env(safe-area-inset-top, 0);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
}
```

---

## 🎨 视觉层次规范

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

### 文字层级
```css
.text-display {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.1;
}

.text-h1 {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
}

.text-h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
}

.text-h3 {
  font-size: 20px;
  font-weight: 500;
  line-height: 1.4;
}

.text-body {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
}

.text-caption {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
}

.text-small {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
}
```

---

## 📐 布局组件规范

### 页面脚手架 (PageScaffold)
```vue
<template>
  <section 
    class="page" 
    role="main"
    aria-labelledby="page-title"
  >
    <header class="page__header">
      <div class="page__title-wrapper">
        <h1 
          id="page-title" 
          class="page__title"
          :aria-describedby="subtitle ? 'page-subtitle' : undefined"
        >
          {{ title }}
        </h1>
        <p 
          v-if="subtitle" 
          id="page-subtitle"
          class="page__subtitle"
        >
          {{ subtitle }}
        </p>
      </div>
      <div 
        v-if="$slots.actions"
        class="page__actions"
        role="toolbar"
        aria-label="页面操作"
      >
        <slot name="actions" />
      </div>
    </header>
    <div 
      class="page__content"
      role="region"
      aria-label="页面内容"
    >
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  subtitle?: string;
}

defineProps<Props>();
</script>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4);
  width: 100%;
}

.page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.page__title-wrapper {
  flex: 1;
}

.page__title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-emphasis);
  margin: 0 0 var(--space-2) 0;
  line-height: 1.3;
}

.page__subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.page__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.page__content {
  width: 100%;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page {
    padding: var(--space-3);
  }
  
  .page__header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }
  
  .page__actions {
    align-self: flex-start;
  }
  
  .page__title {
    font-size: 20px;
  }
  
  .page__subtitle {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .page {
    padding: var(--space-2);
  }
  
  .page__title {
    font-size: 18px;
  }
}
</style>
```

---

## 🎯 实施路线图

### UI优化顺序指南

#### Step 0：先止血——修复样式文件污染与职责混乱
目标：把一个超大CSS拆成3层，删除重复片段和冲突规则。

#### Step 1：建立统一Design Tokens
建立一切UI一致性的根基，包括颜色、间距、圆角、阴影、动效变量。

#### Step 2：重构App Shell
将"固定头+固定底"升级为响应式壳层：
- Desktop：左侧导航 + 顶栏 + 主区
- Mobile：顶栏 + 底部tab

#### Step 3：抽象页面模板
新增PageScaffold组件，解决"每页都长得不一样"的问题。

#### Step 4：组件标准化
Button/Card/Input先统一，再谈美化。

#### Step 5：提升导航可用性
激活态必须"颜色 + 形态"双提示。

#### Step 6：无障碍与键盘焦点
这是"专业产品"的分水岭。

#### Step 7：主题逻辑收敛
减少App.vue中JS强行写变量。

#### Step 8：按优先级执行的冲刺计划
- P0（1~2天）：清理样式污染，建立三层架构
- P1（3~5天）：App Shell响应式重构，PageScaffold落地
- P2（2~3天）：导航升级，焦点态完善

#### Step 9：发布与分支策略
文档类优化建议可直接提交到main分支，避免长期漂移。

---

## 📚 设计资源

### 设计工具
- **Figma**：UI设计和原型制作
- **Zeplin**：设计稿标注和开发交付
- **Iconfont**：图标资源管理

### 设计系统参考
- Material Design
- Ant Design
- Tailwind CSS

### 色彩工具
- Adobe Color
- Coolors.co
- WebAIM Contrast Checker

---

## 🔄 持续改进机制

### 设计评审流程
1. **概念阶段**：需求分析和初步设计
2. **设计阶段**：高保真原型和交互设计
3. **评审阶段**：团队评审和用户测试
4. **实施阶段**：开发实现和质量把控
5. **验证阶段**：上线后效果跟踪

### 用户反馈循环
- 定期收集用户使用反馈
- 分析用户行为数据
- 识别设计痛点和改进机会
- 持续优化用户体验

### 设计系统维护
- 定期更新设计规范
- 维护组件库的完整性
- 确保跨平台一致性
- 跟踪新技术和趋势

---
*本文档作为ScheduleApp的设计系统规范，指导产品的视觉设计和用户体验优化*