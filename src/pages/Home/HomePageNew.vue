<template>
  <PageScaffold 
    title="主页概览" 
    subtitle="查看您的计划进度和今日任务"
  >
    <template #actions>
      <button class="btn btn--primary">创建计划</button>
      <button class="btn btn--secondary">添加任务</button>
    </template>
    
    <div class="dashboard-grid">
      <!-- 进度概览卡片 -->
      <div class="card card--elevated">
        <h3>计划进度</h3>
        <div class="progress-stats">
          <div class="stat-item">
            <span class="stat-value">3</span>
            <span class="stat-label">进行中</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">12</span>
            <span class="stat-label">总计划</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">25%</span>
            <span class="stat-label">完成率</span>
          </div>
        </div>
      </div>
      
      <!-- 今日任务 -->
      <div class="card">
        <h3>今日任务</h3>
        <div class="task-list">
          <div class="task-item">
            <div class="task-status">
              <div class="status-indicator completed"></div>
            </div>
            <div class="task-content">
              <h4 class="task-title">完成项目文档</h4>
              <p class="task-time">上午 10:00</p>
            </div>
          </div>
          <div class="task-item">
            <div class="task-status">
              <div class="status-indicator pending"></div>
            </div>
            <div class="task-content">
              <h4 class="task-title">团队会议</h4>
              <p class="task-time">下午 2:00</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 快捷操作 -->
      <div class="card card--ai">
        <h3>AI 建议</h3>
        <p class="ai-text">根据您的使用习惯，建议您今天重点关注「学习计划」的进度。</p>
        <button class="btn btn--ghost btn--sm">查看详情</button>
      </div>
    </div>
  </PageScaffold>
</template>

<script setup lang="ts">
import PageScaffold from '@/components/common/PageScaffold.vue';
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
  margin-top: var(--space-4);
}

.progress-stats {
  display: flex;
  justify-content: space-around;
  margin-top: var(--space-4);
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: var(--ai-main);
  margin-bottom: var(--space-1);
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.task-list {
  margin-top: var(--space-3);
}

.task-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.task-item:last-child {
  border-bottom: none;
}

.task-status {
  flex-shrink: 0;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-indicator.completed {
  background: var(--success);
}

.status-indicator.pending {
  background: var(--warning);
}

.task-content {
  flex: 1;
}

.task-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-main);
  margin: 0 0 var(--space-1) 0;
}

.task-time {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
  
  .progress-stats {
    margin-top: var(--space-3);
  }
  
  .stat-value {
    font-size: 20px;
  }
}
</style>