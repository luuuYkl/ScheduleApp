<template>
  <div class="demo-page">
    <div class="container">
      <h1>🎨 UI组件演示页面</h1>
      <p class="text-secondary">展示新设计系统的效果</p>

      <!-- 卡片组件演示 -->
      <section class="demo-section">
        <h2>🎴 Card 组件</h2>
        <div class="grid grid-cols-3 gap-4">
          <div class="card">
            <h3>基础卡片</h3>
            <p class="text-secondary">这是基础的卡片组件样式</p>
          </div>
          <div class="card card--elevated">
            <h3>抬升卡片</h3>
            <p class="text-secondary">带有更高层级感的卡片</p>
          </div>
          <div class="card card--ai">
            <h3>AI特色卡片</h3>
            <p class="text-secondary">专为AI功能设计的卡片样式</p>
          </div>
        </div>
      </section>

      <!-- 按钮组件演示 -->
      <section class="demo-section">
        <h2>🔘 Button 组件</h2>
        <div class="flex flex-wrap gap-3">
          <button class="btn btn--primary">主要按钮</button>
          <button class="btn btn--secondary">次要按钮</button>
          <button class="btn btn--ghost">幽灵按钮</button>
          <button class="btn btn--danger">危险按钮</button>
          <button class="btn btn--primary" disabled>禁用按钮</button>
        </div>
        <div class="flex flex-wrap gap-3 mt-3">
          <button class="btn btn--sm btn--primary">小按钮</button>
          <button class="btn btn--primary">普通按钮</button>
          <button class="btn btn--lg btn--primary">大按钮</button>
        </div>
      </section>

      <!-- 输入组件演示 -->
      <section class="demo-section">
        <h2>📝 Input 组件</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block mb-2 text-secondary">文本输入框</label>
            <input type="text" class="input" placeholder="请输入内容..." />
          </div>
          <div>
            <label class="block mb-2 text-secondary">选择器</label>
            <select class="input">
              <option>选项1</option>
              <option>选项2</option>
              <option>选项3</option>
            </select>
          </div>
          <div>
            <label class="block mb-2 text-secondary">文本域</label>
            <textarea
              class="input"
              rows="3"
              placeholder="多行文本输入..."
            ></textarea>
          </div>
          <div>
            <label class="block mb-2 text-secondary">只读输入框</label>
            <input type="text" class="input" value="只读内容" readonly />
          </div>
        </div>
      </section>

      <!-- 徽章组件演示 -->
      <section class="demo-section">
        <h2>🏷️ Badge 组件</h2>
        <div class="flex flex-wrap gap-2">
          <span class="badge badge--primary">AI</span>
          <span class="badge badge--success">完成</span>
          <span class="badge badge--warning">进行中</span>
          <span class="badge badge--error">错误</span>
        </div>
      </section>

      <!-- 时间线组件演示 -->
      <section class="demo-section">
        <h2>📊 Timeline 组件</h2>
        <div class="timeline">
          <div class="timeline-item">
            <h4>任务创建</h4>
            <p class="text-secondary">2024-01-15 10:30</p>
          </div>
          <div class="timeline-item timeline-item--ai">
            <h4>AI分析完成</h4>
            <p class="text-secondary">2024-01-15 11:45</p>
          </div>
          <div class="timeline-item">
            <h4>任务完成</h4>
            <p class="text-secondary">2024-01-15 14:20</p>
          </div>
        </div>
      </section>

      <!-- 导航组件演示 -->
      <section class="demo-section">
        <h2>🧭 Navigation 组件</h2>
        <div class="nav-demo-container">
          <!-- 顶部导航演示 -->
          <div class="nav-top">
            <div class="flex items-center gap-3">
              <h3 class="text-main">顶部导航</h3>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn btn--ghost btn--sm">设置</button>
            </div>
          </div>

          <!-- 底部导航演示 -->
          <div class="nav-bottom-demo">
            <div class="nav-bottom">
              <a href="#" class="nav-item router-link-active">
                <span class="nav-icon">🏠</span>
                <span>首页</span>
              </a>
              <a href="#" class="nav-item">
                <span class="nav-icon">📅</span>
                <span>日程</span>
              </a>
              <a href="#" class="nav-item">
                <span class="nav-icon">📊</span>
                <span>统计</span>
              </a>
              <a href="#" class="nav-item">
                <span class="nav-icon">👤</span>
                <span>我的</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 实用工具类演示 -->
      <section class="demo-section">
        <h2>🔧 Utility Classes</h2>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <h4>阴影效果</h4>
            <div class="card shadow-xs mb-2">xs shadow</div>
            <div class="card shadow-sm mb-2">sm shadow</div>
            <div class="card shadow-md mb-2">md shadow</div>
          </div>
          <div>
            <h4>圆角效果</h4>
            <div class="card rounded-xs mb-2">xs radius</div>
            <div class="card rounded-sm mb-2">sm radius</div>
            <div class="card rounded-md mb-2">md radius</div>
          </div>
          <div>
            <h4>文本颜色</h4>
            <p class="text-main">主要文本</p>
            <p class="text-secondary">次要文本</p>
            <p class="text-muted">说明文本</p>
            <p class="text-ai">AI文本</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// 演示页面不需要额外逻辑
</script>

<style scoped>
.demo-page {
  padding: var(--space-6) 0;
  min-height: 100vh;
  background: var(--bg-main);
}

.demo-section {
  margin-bottom: var(--space-8);
  padding: var(--space-6);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-main);
}

.demo-section h2 {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
}

.nav-demo-container {
  position: relative;
  height: 200px;
  background: var(--bg-main);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-main);
}

.nav-bottom-demo {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .demo-section {
    padding: var(--space-4);
  }

  .grid-cols-3 {
    grid-template-columns: 1fr;
  }

  .grid-cols-2 {
    grid-template-columns: 1fr;
  }
}
</style>
