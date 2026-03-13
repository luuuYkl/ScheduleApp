<template>
  <div class="color-test-page">
    <h1>🎨 全局颜色系统测试</h1>
    
    <!-- Brand Colors -->
    <section class="test-section">
      <h2>Brand 品牌色（纯蓝色系）</h2>
      <div class="color-swatches">
        <div class="swatch" style="background: var(--color-brand-500)">
          <span>500</span>
          <small>#2563EB</small>
        </div>
        <div class="swatch" style="background: var(--color-brand-600)">
          <span>600</span>
          <small>#1D4ED8</small>
        </div>
        <div class="swatch" style="background: var(--color-brand-700)">
          <span>700</span>
          <small>#1E40AF</small>
        </div>
        <div class="swatch" style="background: var(--color-brand-400)">
          <span>400</span>
          <small>#60A5FA</small>
        </div>
        <div class="swatch" style="background: var(--color-brand-100)">
          <span>100</span>
          <small>#DBEAFE</small>
        </div>
      </div>
      <div class="alpha-swatches">
        <div class="swatch alpha" style="background: var(--color-brand-alpha-12)">
          <span>Alpha 12</span>
        </div>
        <div class="swatch alpha" style="background: var(--color-brand-alpha-24)">
          <span>Alpha 24</span>
        </div>
      </div>
    </section>

    <!-- Neutral Colors - Dark Theme -->
    <section class="test-section">
      <h2>Neutral 中性色 (暗色主题)</h2>
      <div class="neutral-swatches">
        <div class="swatch large" style="background: var(--color-bg-page)">
          <span>Page BG</span>
          <small>#0B0F14</small>
        </div>
        <div class="swatch large" style="background: var(--color-bg-card)">
          <span>Card BG</span>
          <small>#111827</small>
        </div>
        <div class="swatch large" style="background: var(--color-bg-elevated)">
          <span>Elevated</span>
          <small>#1F2937</small>
        </div>
        <div class="swatch large" style="background: var(--color-bg-input)">
          <span>Input BG</span>
          <small>#0B0F14</small>
        </div>
      </div>
      
      <div class="text-swatches">
        <div class="text-sample" style="color: var(--color-text-primary)">
          <span>Primary Text</span>
          <small>#F9FAFB</small>
        </div>
        <div class="text-sample" style="color: var(--color-text-secondary)">
          <span>Secondary Text</span>
          <small>#9CA3AF</small>
        </div>
        <div class="text-sample" style="color: var(--color-text-muted)">
          <span>Muted Text</span>
          <small>#6B7280</small>
        </div>
      </div>
      
      <div class="border-swatches">
        <div class="border-sample" style="border-color: var(--color-border-primary)">
          <span>Primary Border</span>
          <small>rgba(255,255,255,0.10)</small>
        </div>
        <div class="border-sample" style="border-color: var(--color-border-subtle)">
          <span>Subtle Border</span>
          <small>rgba(255
        </div>
      </div>
    </section>

    <!-- Semantic Colors -->
    <section class="test-section">
      <h2>Semantic 语义色</h2>
      <div class="semantic-swatches">
        <div class="swatch semantic" style="background: var(--color-success)">
          <span>Success</span>
          <small>#22C55E</small>
        </div>
        <div class="swatch semantic" style="background: var(--color-warning)">
          <span>Warning</span>
          <small>#F59E0B</small>
        </div>
        <div class="swatch semantic" style="background: var(--color-error)">
          <span>Error</span>
          <small>#EF4444</small>
        </div>
        <div class="swatch semantic" style="background: var(--color-info)">
          <span>Info</span>
          <small>#3B82F6</small>
        </div>
      </div>
      
      <div class="bg-swatches">
        <div class="swatch bg" style="background: var(--color-success-bg)">
          <span>Success BG</span>
        </div>
        <div class="swatch bg" style="background: var(--color-warning-bg)">
          <span>Warning BG</span>
        </div>
        <div class="swatch bg" style="background: var(--color-error-bg)">
          <span>Error BG</span>
        </div>
        <div class="swatch bg" style="background: var(--color-info-bg)">
          <span>Info BG</span>
        </div>
      </div>
    </section>

    <!-- Component Examples -->
    <section class="test-section">
      <h2>组件示例</h2>
      
      <div class="component-examples">
        <!-- Buttons -->
        <div class="example-group">
          <h3>按钮</h3>
          <button class="btn-primary">Primary Button</button>
          <button class="btn-secondary">Secondary Button</button>
          <button class="btn-ghost">Ghost Button</button>
        </div>
        
        <!-- Input -->
        <div class="example-group">
          <h3>输入框</h3>
          <input type="text" class="input-field" placeholder="输入框示例">
        </div>
        
        <!-- Card -->
        <div class="example-group">
          <h3>卡片</h3>
          <div class="card-example">
            <h4>卡片标题</h4>
            <p>这是卡片内容示例</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Theme Toggle -->
    <section class="test-section">
      <h2>主题切换测试</h2>
      <button @click="toggleTheme" class="theme-toggle">
        切换到{{ currentTheme === 'dark' ? '浅色' : '暗色' }}主题
      </button>
      <p>当前主题: {{ currentTheme }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const currentTheme = ref('dark')

function toggleTheme() {
  const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', newTheme)
  currentTheme.value = newTheme
  localStorage.setItem('theme', newTheme)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'dark'
  currentTheme.value = savedTheme
  document.documentElement.setAttribute('data-theme', savedTheme)
})
</script>

<style scoped>
.color-test-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--color-bg-page);
  color: var(--color-text-primary);
  min-height: 100vh;
}

.test-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-subtle);
}

.test-section h2 {
  margin-top: 0;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: 0.5rem;
}

.color-swatches {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.swatch {
  width: 100px;
  height: 100px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: 500;
  position: relative;
  border: 1px solid var(--color-border-subtle);
}

.swatch.large {
  width: 120px;
  height: 80px;
}

.swatch.alpha {
  color: var(--color-text-primary);
}

.swatch.semantic {
  width: 120px;
  height: 80px;
}

.swatch.bg {
  width: 120px;
  height: 60px;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}

.swatch span {
  font-size: 0.9rem;
}

.swatch small {
  font-size: 0.7rem;
  opacity: 0.8;
}

.neutral-swatches {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.text-swatches {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
}

.text-sample {
  padding: 0.5rem;
  font-size: 1.1rem;
}

.text-sample span {
  display: inline-block;
  width: 120px;
  font-weight: 500;
}

.border-swatches {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.border-sample {
  padding: 1rem;
  border: 2px solid;
  border-radius: var(--radius-md);
  background: var(--color-bg-input);
}

.semantic-swatches {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.bg-swatches {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.component-examples {
  display: grid;
  gap: 1.5rem;
}

.example-group h3 {
  margin: 0 0 1rem 0;
  color: var(--color-text-primary);
}

/* Button Examples */
.btn-primary {
  background: var(--color-brand-500);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
}

.btn-primary:hover {
  background: var(--color-brand-600);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
}

.btn-secondary:hover {
  background: var(--color-surface-card-hover);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
}

.btn-ghost:hover {
  background: var(--color-brand-alpha-12);
  color: var(--color-text-primary);
}

/* Input Example */
.input-field {
  width: 100%;
  max-width: 300px;
  padding: 0.75rem;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: 1rem;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 3px var(--color-brand-alpha-24);
}

/* Card Example */
.card-example {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  transition: all var(--dur-fast) var(--ease-standard);
}

.card-example:hover {
  background: var(--color-surface-card-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-example h4 {
  margin: 0 0 0.5rem 0;
  color: var(--color-text-primary);
}

.card-example p {
  margin: 0;
  color: var(--color-text-secondary);
}

/* Theme Toggle */
.theme-toggle {
  background: var(--color-brand-500);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
}

.theme-toggle:hover {
  background: var(--color-brand-600);
}

/* Responsive */
@media (max-width: 768px) {
  .color-test-page {
    padding: 1rem;
  }
  
  .color-swatches {
    flex-wrap: wrap;
  }
  
  .neutral-swatches {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .semantic-swatches {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .bg-swatches {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>