<template>
  <PageScaffold 
    title="UI组件演示" 
    :show-back="false"
    class="layer-context"
  >
    <div class="demo-container layout-template-l">
      <!-- Context Layer: 设计系统概览 -->
      <section class="demo-section overview-section layer-context priority-high">
        <h1 class="page-title">🎨 设计系统规范</h1>
        <p class="page-subtitle">统一的设计语言和组件规范</p>
        
        <div class="design-principles">
          <div class="principle-card">
            <div class="principle-icon">🎯</div>
            <h3>一致性</h3>
            <p>统一的视觉语言和交互模式</p>
          </div>
          <div class="principle-card">
            <div class="principle-icon">⚡</div>
            <h3>高效性</h3>
            <p>简洁直观的操作流程</p>
          </div>
          <div class="principle-card">
            <div class="principle-icon">🤖</div>
            <h3>智能化</h3>
            <p>AI驱动的个性化体验</p>
          </div>
        </div>
      </section>

      <!-- Primary Layer: 业务组件映射 -->
      <section class="demo-section layer-primary priority-high">
        <h2>📋 业务场景组件</h2>
        
        <!-- 任务卡片示例 -->
        <div class="component-showcase">
          <h3>任务卡片 (Task Card)</h3>
          <div class="showcase-content">
            <Card class="task-card-demo">
              <div class="task-header">
                <TaskCheckBox 
                  :model-value="false" 
                  @update:model-value="() => {}"
                  class="task-checkbox"
                />
                <div class="task-title">完成项目文档编写</div>
                <span class="status-badge warning">进行中</span>
              </div>
              <div class="task-meta">
                <span class="meta-item">📅 今天 14:00</span>
                <span class="meta-item">⏱ 2小时</span>
                <span class="meta-item">🏷️ 工作</span>
              </div>
              <TaskProgress :value="65" class="task-progress" />
            </Card>
          </div>
        </div>

        <!-- 计划概览卡片 -->
        <div class="component-showcase">
          <h3>计划概览 (Plan Overview)</h3>
          <div class="showcase-content">
            <Card class="plan-card-demo">
              <div class="plan-header">
                <h4>年度学习计划</h4>
                <span class="status-badge success">进行中</span>
              </div>
              <div class="plan-stats">
                <div class="stat-item">
                  <span class="stat-value">24</span>
                  <span class="stat-label">总任务</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">18</span>
                  <span class="stat-label">已完成</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">75%</span>
                  <span class="stat-label">完成率</span>
                </div>
              </div>
              <div class="plan-progress">
                <div class="progress-track">
                  <div class="progress-fill" style="width: 75%"></div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <!-- Primary Layer: 基础组件库 -->
      <section class="demo-section layer-primary priority-high">
        <h2>🧩 基础组件库</h2>
        
        <!-- 按钮组件 -->
        <div class="component-category">
          <h3>Button 按钮</h3>
          <div class="component-grid">
            <div class="component-demo">
              <h4>变体样式</h4>
              <div class="demo-buttons">
                <Button variant="primary">主要按钮</Button>
                <Button variant="secondary">次要按钮</Button>
                <Button variant="outline">轮廓按钮</Button>
                <Button variant="ghost">幽灵按钮</Button>
                <Button variant="danger">危险按钮</Button>
              </div>
            </div>
            
            <div class="component-demo">
              <h4>尺寸规格</h4>
              <div class="demo-buttons">
                <Button size="small">小按钮</Button>
                <Button size="medium">中按钮</Button>
                <Button size="large">大按钮</Button>
              </div>
            </div>
            
            <div class="component-demo">
              <h4>状态控制</h4>
              <div class="demo-buttons">
                <Button variant="primary" disabled>禁用状态</Button>
                <Button variant="primary" loading>加载中</Button>
                <Button variant="primary" icon="plus">带图标</Button>
              </div>
            </div>
          </div>
        </div>

        <!-- 卡片组件 -->
        <div class="component-category">
          <h3>Card 卡片</h3>
          <div class="component-grid">
            <div class="component-demo">
              <Card>
                <template #header>
                  <h4>基础卡片</h4>
                </template>
                <p>这是基础的卡片组件，用于展示内容容器。</p>
              </Card>
            </div>
            
            <div class="component-demo">
              <Card variant="elevated">
                <template #header>
                  <h4>抬升卡片</h4>
                </template>
                <p>具有更高视觉层级的卡片样式。</p>
              </Card>
            </div>
            
            <div class="component-demo">
              <Card variant="ai">
                <template #header>
                  <h4>AI卡片</h4>
                </template>
                <p>专为AI相关功能设计的卡片样式。</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <!-- Secondary Layer: 表单组件 -->
      <section class="demo-section layer-secondary priority-medium">
        <h2>📝 表单组件</h2>
        
        <div class="component-grid">
          <div class="component-demo">
            <h3>Input 输入框</h3>
            <div class="form-demo">
              <div class="form-group">
                <label class="form-label">基础输入框</label>
                <input type="text" class="form-input" placeholder="请输入内容..." />
              </div>
              
              <div class="form-group">
                <label class="form-label">带图标输入框</label>
                <div class="input-with-icon">
                  <span class="input-icon">🔍</span>
                  <input type="text" class="form-input" placeholder="搜索任务..." />
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">错误状态</label>
                <input type="text" class="form-input error" value="输入格式错误" />
                <p class="error-message">请输入有效的邮箱地址</p>
              </div>
            </div>
          </div>
          
          <div class="component-demo">
            <h3>Select 选择器</h3>
            <div class="form-demo">
              <div class="form-group">
                <label class="form-label">单选下拉</label>
                <select class="form-select">
                  <option value="">请选择优先级</option>
                  <option value="high">高优先级</option>
                  <option value="medium">中优先级</option>
                  <option value="low">低优先级</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">多选标签</label>
                <div class="tag-selector">
                  <Badge variant="primary" clickable>工作</Badge>
                  <Badge variant="success" clickable>学习</Badge>
                  <Badge variant="warning" clickable>生活</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Secondary Layer: 状态指示组件 -->
      <section class="demo-section layer-secondary priority-medium">
        <h2>📊 状态指示组件</h2>
        
        <div class="component-grid">
          <div class="component-demo">
            <h3>Badge 徽章</h3>
            <div class="badge-examples">
              <Badge variant="primary">AI</Badge>
              <Badge variant="success">完成</Badge>
              <Badge variant="warning">进行中</Badge>
              <Badge variant="error">错误</Badge>
              <Badge variant="info">信息</Badge>
              <Badge variant="secondary">默认</Badge>
            </div>
          </div>
          
          <div class="component-demo">
            <h3>Status 状态点</h3>
            <div class="status-examples">
              <div class="status-item">
                <div class="status-dot online"></div>
                <span>在线</span>
              </div>
              <div class="status-item">
                <div class="status-dot busy"></div>
                <span>忙碌</span>
              </div>
              <div class="status-item">
                <div class="status-dot offline"></div>
                <span>离线</span>
              </div>
            </div>
          </div>
          
          <div class="component-demo">
            <h3>Progress 进度条</h3>
            <div class="progress-examples">
              <TaskProgress :value="30" />
              <TaskProgress :value="65" />
              <TaskProgress :value="100" />
            </div>
          </div>
        </div>
      </section>

      <!-- Utility Layer: 反馈与通知 -->
      <section class="demo-section layer-utility priority-low">
        <h2>💬 反馈与通知</h2>
        
        <div class="component-grid">
          <div class="component-demo">
            <h3>Toast 提示</h3>
            <div class="toast-examples">
              <div class="toast toast-success">
                <span class="toast-icon">✅</span>
                <span>任务创建成功</span>
              </div>
              <div class="toast toast-warning">
                <span class="toast-icon">⚠️</span>
                <span>请注意截止时间</span>
              </div>
              <div class="toast toast-error">
                <span class="toast-icon">❌</span>
                <span>操作失败，请重试</span>
              </div>
            </div>
          </div>
          
          <div class="component-demo">
            <h3>Modal 对话框</h3>
            <div class="modal-demo">
              <Card class="modal-card">
                <template #header>
                  <h4>确认删除</h4>
                </template>
                <p>确定要删除这个任务吗？此操作不可撤销。</p>
                <div class="modal-actions">
                  <Button variant="outline">取消</Button>
                  <Button variant="danger">删除</Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <!-- Utility Layer: 导航与布局 -->
      <section class="demo-section layer-utility priority-low">
        <h2>🧭 导航与布局</h2>
        
        <div class="layout-demos">
          <div class="layout-demo">
            <h3>底部导航</h3>
            <div class="bottom-nav-demo">
              <div class="nav-bottom">
                <a href="#" class="nav-item active">
                  <span class="nav-icon">🏠</span>
                  <span class="nav-label">首页</span>
                </a>
                <a href="#" class="nav-item">
                  <span class="nav-icon">📅</span>
                  <span class="nav-label">日程</span>
                </a>
                <a href="#" class="nav-item">
                  <span class="nav-icon">📊</span>
                  <span class="nav-label">统计</span>
                </a>
                <a href="#" class="nav-item">
                  <span class="nav-icon">👤</span>
                  <span class="nav-label">我的</span>
                </a>
              </div>
            </div>
          </div>
          
          <div class="layout-demo">
            <h3>页面骨架</h3>
            <div class="scaffold-demo">
              <PageScaffold title="示例页面">
                <div class="scaffold-content">
                  <p>页面主要内容区域</p>
                </div>
              </PageScaffold>
            </div>
          </div>
        </div>
      </section>

      <!-- Utility Layer: 设计规范 -->
      <section class="demo-section layer-utility priority-low">
        <h2>📏 设计规范</h2>
        
        <div class="specifications">
          <div class="spec-category">
            <h3>📱 响应式断点规范</h3>
            <div class="breakpoints-demo">
              <div class="breakpoint-item">
                <div class="breakpoint-name">--screen-mobile-small</div>
                <div class="breakpoint-value">≤ 480px</div>
                <div class="breakpoint-desc">单手极小屏</div>
              </div>
              <div class="breakpoint-item">
                <div class="breakpoint-name">--screen-mobile-medium</div>
                <div class="breakpoint-value">≤ 768px</div>
                <div class="breakpoint-desc">移动主流屏</div>
              </div>
              <div class="breakpoint-item">
                <div class="breakpoint-name">--screen-tablet</div>
                <div class="breakpoint-value">≤ 1024px</div>
                <div class="breakpoint-desc">平板/小桌面</div>
              </div>
              <div class="breakpoint-item">
                <div class="breakpoint-name">--screen-desktop</div>
                <div class="breakpoint-value">≥ 1280px</div>
                <div class="breakpoint-desc">桌面标准</div>
              </div>
            </div>
          </div>
          
          <div class="spec-category">
            <h3>🎯 4层语义结构</h3>
            <div class="layers-demo">
              <div class="layer-item context">
                <div class="layer-name">Context 上下文层</div>
                <div class="layer-desc">背景信息、品牌元素</div>
              </div>
              <div class="layer-item primary">
                <div class="layer-name">Primary 核心动作层</div>
                <div class="layer-desc">主要操作、核心功能</div>
              </div>
              <div class="layer-item secondary">
                <div class="layer-name">Secondary 辅助信息层</div>
                <div class="layer-desc">辅助内容、次要功能</div>
              </div>
              <div class="layer-item utility">
                <div class="layer-name">Utility 工具区层</div>
                <div class="layer-desc">设置选项、工具功能</div>
              </div>
            </div>
          </div>
          
          <div class="spec-category">
            <h3>⚡ 行为优先级规则</h3>
            <div class="priority-demo">
              <div class="priority-item essential">
                <div class="priority-tag">Essential 必须保留</div>
                <div class="priority-desc">核心功能，任何屏幕必显</div>
              </div>
              <div class="priority-item high">
                <div class="priority-tag">High 高优先级</div>
                <div class="priority-desc">重要功能，大屏常显小屏可折叠</div>
              </div>
              <div class="priority-item medium">
                <div class="priority-tag">Medium 中优先级</div>
                <div class="priority-desc">一般功能，桌面常显移动端折叠</div>
              </div>
              <div class="priority-item low">
                <div class="priority-tag">Low 可折叠</div>
                <div class="priority-desc">边缘功能，默认折叠仅主动展开</div>
              </div>
            </div>
          </div>
          
          <div class="spec-category">
            <h3>.spacing 间距系统</h3>
            <div class="spacing-demo">\              <div class="spacing-item">
                <div class="spacing-box spacing-1"></div>
                <span>--space-1 (4px)</span>
              </div>
              <div class="spacing-item">
                <div class="spacing-box spacing-2"></div>
                <span>--space-2 (8px)</span>
              </div>
              <div class="spacing-item">
                <div class="spacing-box spacing-3"></div>
                <span>--space-3 (12px)</span>
              </div>
              <div class="spacing-item">
                <div class="spacing-box spacing-4"></div>
                <span>--space-4 (16px)</span>
              </div>
            </div>
          </div>
          
          <div class="spec-category">
            <h3>🎨 颜色系统</h3>
            <div class="colors-demo">
              <div class="color-palette">
                <div class="color-item">
                  <div class="color-swatch primary"></div>
                  <span>Primary 主色</span>
                </div>
                <div class="color-item">
                  <div class="color-swatch secondary"></div>
                  <span>Secondary 辅色</span>
                </div>
                <div class="color-item">
                  <div class="color-swatch success"></div>
                  <span>Success 成功</span>
                </div>
                <div class="color-item">
                  <div class="color-swatch warning"></div>
                  <span>Warning 警告</span>
                </div>
                <div class="color-item">
                  <div class="color-swatch error"></div>
                  <span>Error 错误</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="spec-category">
            <h3>🔤 字体系统</h3>
            <div class="typography-demo">
              <div class="font-sample">
                <h1 class="text-display">Display 标题</h1>
                <h2 class="text-heading">Heading 标题</h2>
                <h3 class="text-subheading">Subheading 副标题</h3>
                <p class="text-body">Body 正文文本，用于常规内容展示</p>
                <p class="text-caption">Caption 说明文字，较小的辅助文本</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </PageScaffold>
</template>

<script setup lang="ts">
import PageScaffold from '@/components/common/PageScaffold.vue';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import TaskCheckBox from '@/components/task/TaskCheckBox.vue';
import TaskProgress from '@/components/task/TaskProgress.vue';
</script>

<style scoped>
.demo-container {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 2rem;
}

/* 桌面端双列布局 */
@media (min-width: 1025px) {
  .demo-container {
    grid-template-columns: 2fr 1fr;
  }
  
  .overview-section {
    grid-column: 1 / -1;
  }
  
  .demo-section:not(.overview-section) {
    break-inside: avoid;
  }
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 0.5rem;
  text-align: center;
}

.page-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 2rem;
}

/* 设计原则 */
.design-principles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.principle-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  border: 1px solid var(--border-main);
  transition: all 0.2s;
}

.principle-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.principle-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.principle-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 0.5rem;
}

.principle-card p {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 组件展示 */
.component-showcase {
  margin-bottom: 2rem;
}

.component-showcase h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 1rem;
}

.showcase-content {
  background: var(--bg-elevated);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-main);
}

/* 任务卡片演示 */
.task-card-demo {
  max-width: 400px;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.task-title {
  flex: 1;
  font-weight: 500;
  color: var(--text-main);
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.warning {
  background: var(--warning-bg);
  color: var(--warning);
  border: 1px solid var(--warning);
}

.status-badge.success {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid var(--success);
}

.task-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* 计划卡片演示 */
.plan-card-demo {
  max-width: 350px;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.plan-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
}

.plan-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.plan-progress {
  margin-top: 1rem;
}

.progress-track {
  height: 6px;
  background: var(--bg-elevated);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  border-radius: 3px;
}

/* 组件类别 */
.component-category {
  margin-bottom: 2rem;
}

.component-category h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-subtle);
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.component-demo {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-main);
}

.component-demo h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 1rem;
}

/* 按钮演示 */
.demo-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

/* 表单演示 */
.form-demo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-main);
}

.form-input, .form-select {
  padding: 0.75rem;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--bg-input);
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-opacity-10);
}

.form-input.error {
  border-color: var(--error);
}

.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.input-with-icon .form-input {
  padding-left: 2.5rem;
}

.error-message {
  color: var(--error);
  font-size: 0.8rem;
}

.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* 徽章演示 */
.badge-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.status-examples {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.online {
  background: var(--success);
}

.status-dot.busy {
  background: var(--warning);
}

.status-dot.offline {
  background: var(--text-muted);
}

.progress-examples {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Toast演示 */
.toast-examples {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.toast-success {
  background: var(--success-bg);
  border: 1px solid var(--success);
  color: var(--success);
}

.toast-warning {
  background: var(--warning-bg);
  border: 1px solid var(--warning);
  color: var(--warning);
}

.toast-error {
  background: var(--error-bg);
  border: 1px solid var(--error);
  color: var(--error);
}

.toast-icon {
  font-size: 1.2rem;
}

/* Modal演示 */
.modal-demo {
  display: flex;
  justify-content: center;
}

.modal-card {
  width: 300px;
  border: 1px solid var(--border-main);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

/* 布局演示 */
.layout-demos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.layout-demo h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 1rem;
}

.bottom-nav-demo {
  background: var(--bg-main);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--border-main);
}

.nav-bottom {
  display: flex;
  justify-content: space-around;
  background: var(--bg-card);
  border-radius: 16px;
  padding: 0.75rem;
  border: 1px solid var(--border-main);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border-radius: 12px;
  text-decoration: none;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.nav-item.active {
  background: var(--primary-bg);
  color: var(--primary);
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}

.scaffold-demo {
  background: var(--bg-main);
  border-radius: 12px;
  border: 1px solid var(--border-main);
  overflow: hidden;
  height: 200px;
}

.scaffold-content {
  padding: 1rem;
  text-align: center;
}

/* 响应式断点演示 */
.breakpoints-demo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.breakpoint-item {
  background: var(--bg-elevated);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid var(--border-main);
  text-align: center;
}

.breakpoint-name {
  font-weight: 600;
  color: var(--text-main);
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.breakpoint-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.breakpoint-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* 4层结构演示 */
.layers-demo {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.layer-item {
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-main);
}

.layer-item.context {
  background: linear-gradient(90deg, var(--primary-bg) 0%, var(--bg-elevated) 100%);
  border-left: 4px solid var(--primary);
}

.layer-item.primary {
  background: linear-gradient(90deg, var(--success-bg) 0%, var(--bg-elevated) 100%);
  border-left: 4px solid var(--success);
}

.layer-item.secondary {
  background: linear-gradient(90deg, var(--warning-bg) 0%, var(--bg-elevated) 100%);
  border-left: 4px solid var(--warning);
}

.layer-item.utility {
  background: linear-gradient(90deg, var(--error-bg) 0%, var(--bg-elevated) 100%);
  border-left: 4px solid var(--error);
}

.layer-name {
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 0.25rem;
}

.layer-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* 优先级演示 */
.priority-demo {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.priority-item {
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-main);
}

.priority-item.essential {
  background: var(--success-bg);
  border-color: var(--success);
}

.priority-item.high {
  background: var(--primary-bg);
  border-color: var(--primary);
}

.priority-item.medium {
  background: var(--warning-bg);
  border-color: var(--warning);
}

.priority-item.low {
  background: var(--error-bg);
  border-color: var(--error);
}

.priority-tag {
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 0.25rem;
}

.priority-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.spec-category h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 1rem;
}

.spacing-demo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.spacing-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.spacing-box {
  background: var(--primary);
  height: 20px;
}

.spacing-1 { width: 4px; }
.spacing-2 { width: 8px; }
.spacing-3 { width: 12px; }
.spacing-4 { width: 16px; }

.colors-demo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.color-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.color-swatch {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 1px solid var(--border-main);
}

.color-swatch.primary { background: var(--primary); }
.color-swatch.secondary { background: var(--secondary); }
.color-swatch.success { background: var(--success); }
.color-swatch.warning { background: var(--warning); }
.color-swatch.error { background: var(--error); }

.typography-demo {
  background: var(--bg-elevated);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--border-main);
}

.font-sample h1, .font-sample h2, .font-sample h3, .font-sample p {
  margin: 0 0 0.5rem 0;
}

.text-display { font-size: 2.5rem; font-weight: 700; }
.text-heading { font-size: 2rem; font-weight: 600; }
.text-subheading { font-size: 1.5rem; font-weight: 500; }
.text-body { font-size: 1rem; line-height: 1.6; }
.text-caption { font-size: 0.875rem; color: var(--text-secondary); }

/* 通用样式 */
demo-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border-main);
}

demo-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-subtle);
}

/* 响应式 */
@media (max-width: 768px) {
  .demo-container {
    padding: 0.75rem;
    gap: 1.5rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .design-principles {
    grid-template-columns: 1fr;
  }
  
  .component-grid {
    grid-template-columns: 1fr;
  }
  
  .layout-demos {
    grid-template-columns: 1fr;
  }
  
  .specifications {
    grid-template-columns: 1fr;
  }
  
  .plan-stats {
    gap: 1rem;
  }
  
  .task-meta {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  /* 移动端优先级调整 */
  .layer-utility {
    order: 3;
  }
  
  .layer-secondary {
    order: 2;
  }
  
  .layer-primary {
    order: 1;
  }
  
  .layer-context {
    order: 0;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.75rem;
  }
  
  .demo-buttons {
    flex-direction: column;
    align-items: stretch;
  }
  
  .tag-selector {
    justify-content: center;
  }
  
  .badge-examples {
    justify-content: center;
  }
}
</style>
