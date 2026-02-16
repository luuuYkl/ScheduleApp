# ScheduleApp 项目优化建议（按执行顺序，含可直接落地代码示例）

> 本文基于《UI_AESTHETIC_MASTER_PLAN.md》进一步落地为“可执行清单 + 代码示例”。

## Step 0：先止血——修复样式文件污染与职责混乱

当前 `src/style.css` 存在明显的拼接/截断问题，第一步不是“加新样式”，而是“恢复可维护状态”。

### 目标
- 把一个超大 CSS 拆成 3 层：`tokens.css`、`base.css`、`components.css`。
- 删除重复片段、断裂语句、相互覆盖的冲突规则。
- 让主题切换依赖 token，而不是散落在每个组件里 hardcode。

### 推荐目录
```txt
src/styles/
  tokens.css        # 颜色/间距/圆角/阴影/动效变量
  base.css          # reset + typography + 全局元素
  components.css    # button/card/input/nav/timeline 等
src/style.css       # 仅做聚合 import
```

### `src/style.css`（示例）
```css
@import './styles/tokens.css';
@import './styles/base.css';
@import './styles/components.css';
```

---

## Step 1：建立统一 Design Tokens（这是一切 UI 一致性的根）

### `src/styles/tokens.css`（示例）
```css
:root {
  /* spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  /* motion */
  --ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
  --dur-fast: 140ms;
  --dur-normal: 220ms;

  /* layout */
  --header-height: 64px;
  --bottom-nav-height: 64px;
}

html[data-theme='dark'] {
  --bg-main: #0E1117;
  --bg-card: #161B22;
  --text-main: #E5E7EB;
  --text-secondary: #9CA3AF;
  --border-main: rgba(255, 255, 255, 0.08);
  --ai-main: #6366F1;
  --ai-bg: rgba(99, 102, 241, 0.12);
}

html[data-theme='light'] {
  --bg-main: #F5F5F5;
  --bg-card: #FAFAFA;
  --text-main: #0F172A;
  --text-secondary: #475569;
  --border-main: rgba(15, 23, 42, 0.08);
  --ai-main: #6366F1;
  --ai-bg: rgba(99, 102, 241, 0.08);
}
```

---

## Step 2：重构 App Shell（把“固定头+固定底”升级为响应式壳层）

你现在的 `App.vue` 已有顶部和底部导航，但建议升级为：
- Desktop：左侧导航 + 顶栏 + 主区
- Mobile：顶栏 + 底部 tab

### `App.vue`（关键结构示例）
```vue
<template>
  <div class="app-shell">
    <header class="app-header">...</header>

    <div class="app-body">
      <aside class="app-sidebar" v-if="isDesktop">...</aside>
      <main class="app-main">
        <router-view />
      </main>
    </div>

    <footer class="app-bottom-nav" v-if="!isDesktop && showBottomNav">...</footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const showBottomNav = computed(() => route.meta.showBottomNav ?? true);
const isDesktop = computed(() => window.matchMedia('(min-width: 1024px)').matches);
</script>
```

### 壳层样式（示例）
```css
.app-shell {
  min-height: 100dvh;
  background: var(--bg-main);
  color: var(--text-main);
}

.app-header {
  position: sticky;
  top: 0;
  height: var(--header-height);
  border-bottom: 1px solid var(--border-main);
  backdrop-filter: blur(10px);
}

.app-body {
  display: grid;
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .app-body {
    grid-template-columns: 220px minmax(0, 1fr);
  }
}
```

---

## Step 3：抽象页面模板（解决“每页都长得不一样”的问题）

### 建议新增一个布局组件 `PageScaffold.vue`
```vue
<template>
  <section class="page">
    <header class="page__header">
      <h1 class="page__title">{{ title }}</h1>
      <div class="page__actions"><slot name="actions" /></div>
    </header>
    <div class="page__content"><slot /></div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>
```

```css
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4);
}

.page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
```

这样 Home/Calendar/Log/Profile 统一用同一骨架，视觉和交互会立刻对齐。

---

## Step 4：组件标准化（Button/Card/Input 先统一，再谈美化）

### Button（示例）
```css
.btn {
  height: 40px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition: all var(--dur-fast) var(--ease-standard);
}

.btn--primary {
  background: var(--ai-main);
  color: #fff;
}

.btn--secondary {
  background: transparent;
  border-color: var(--border-main);
  color: var(--text-main);
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
```

### Card（示例）
```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  transition: transform var(--dur-fast) var(--ease-standard);
}

.card:hover {
  transform: translateY(-1px);
}
```

---

## Step 5：提升导航可用性（激活态必须“颜色 + 形态”双提示）

```css
.nav-item {
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
}

.nav-item.router-link-active {
  color: var(--ai-main);
  background: var(--ai-bg);
  box-shadow: inset 0 -2px 0 var(--ai-main);
}
```

> 这样在深色与浅色主题下都能一眼识别当前页。

---

## Step 6：无障碍与键盘焦点（这是“专业产品”的分水岭）

```css
:focus-visible {
  outline: 2px solid var(--ai-main);
  outline-offset: 2px;
}

input, button, a {
  min-height: 40px;
}
```

并在交互组件中补充：
- `aria-label`
- `aria-current="page"`（当前导航）
- 错误文案与输入框通过 `aria-describedby` 关联

---

## Step 7：主题逻辑收敛（减少 App.vue 中 JS 强行写变量）

你现在在 `App.vue` 里通过 watch 直接 `root.style.setProperty` 大量写变量，这种方式不利于维护。建议：
- JS 只做 `data-theme` 切换。
- 具体颜色全部留在 CSS token。

### 示例（Pinia/组件侧）
```ts
function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
```

---

## Step 8：按优先级执行的冲刺计划

### P0（1~2 天）
1. 清理样式污染
2. 建立 tokens/base/components 三层
3. 校验明暗主题切换

### P1（3~5 天）
1. App Shell 响应式重构
2. PageScaffold 落地到 Home/Calendar/Log
3. 统一按钮、卡片、输入组件

### P2（2~3 天）
1. 导航激活态升级
2. 焦点态与 aria 完善
3. 空态/加载/错误态统一

---

## 一句话执行建议
先“统一底座（Token + 壳层 + 组件）”，再“打磨细节（动效 + AI 高亮 + 情绪化设计）”。
如果顺序反过来，项目会越来越花，但不会越来越好用。


---

## Step 9：发布与分支策略（按你的要求）

- 文档类优化建议可直接提交到 `main` 分支，避免长期漂移。
- 建议保留提交规范：`docs: xxx`，确保变更可追溯。
- 若后续包含真实 UI 代码改动（非纯文档），再切回功能分支 + PR 流程以降低风险。
