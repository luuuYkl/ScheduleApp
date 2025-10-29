<template>
  <div class="page log-page">
    <div class="page-container">
      <!-- 页面头部 -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-actions">
            <button class="modern-btn btn-primary" @click="generateLog" :disabled="generating">
              <svg v-if="!generating" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <div v-else class="btn-spinner">
                <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
              {{ generating ? '生成中...' : '生成今日日志' }}
            </button>
            <button class="modern-btn btn-secondary" @click="refreshLogs" :disabled="loading">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 12a9 9 0 11-6.219-8.56" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M15 4v4h4" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
              刷新
            </button>
          </div>
        </div>
      </header>

      <!-- 日志列表 -->
      <main class="log-content">
        <div v-if="loading && logs.length === 0" class="loading-state">
          <div class="loading-spinner">
            <svg class="animate-spin" width="48" height="48" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.25"/>
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
          <p>加载中...</p>
        </div>

        <div v-else-if="logs.length > 0" class="log-list">
          <div v-for="(log, index) in logs" :key="log.id" class="log-card modern-card" :style="{ animationDelay: `${index * 0.1}s` }">
            <div class="log-header">
              <div class="log-date">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
                </svg>
                <strong>{{ formatDate(log.date) }}</strong>
              </div>
              
              <div class="log-stats">
                <div class="stat-item">
                  <span class="stat-label">完成</span>
                  <span class="stat-value">{{ log.tasks_done }}/{{ log.tasks_total }}</span>
                </div>
                <div class="completion-badge" :class="getCompletionClass(log)">
                  {{ Math.round((log.tasks_done / log.tasks_total) * 100) }}%
                </div>
              </div>
            </div>
            
            <div class="log-body">
              <p class="log-content">{{ log.content }}</p>
            </div>
            
            <div class="log-footer">
              <span class="log-time">{{ formatTime(log.created_at) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" fill="none"/>
              <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <h3>暂无日志记录</h3>
          <p>完成今天的任务后，点击"生成今日日志"按钮创建您的第一条日志</p>
          <button class="modern-btn btn-primary" @click="generateLog" :disabled="generating">
            {{ generating ? '生成中...' : '立即生成' }}
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { useLogStore } from "@/store/log";
import { useUserStore } from "@/store/user";
import { useTaskStore } from "@/store/tasks";
import type { LogEntry } from "@/services/generate-log";

const logStore = useLogStore();
const userStore = useUserStore();
const taskStore = useTaskStore();

const logs = computed(() => logStore.logs);
const loading = ref(false);
const generating = ref(false);

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dateStr === today.toISOString().slice(0, 10)) {
    return '今天';
  } else if (dateStr === yesterday.toISOString().slice(0, 10)) {
    return '昨天';
  } else {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', weekday: 'short' };
    return date.toLocaleDateString('zh-CN', options);
  }
}

// 格式化时间
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// 获取完成度样式类
function getCompletionClass(log: LogEntry): string {
  const completion = Math.round((log.tasks_done / log.tasks_total) * 100);
  if (completion >= 80) return 'high';
  if (completion >= 50) return 'medium';
  return 'low';
}

// 刷新日志
async function refreshLogs() {
  loading.value = true;
  try {
    const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
    await logStore.loadLogs(userId);
  } catch (e) {
    console.error("刷新日志失败:", e);
  } finally {
    loading.value = false;
  }
}

// 手动生成今日日志
async function generateLog() {
  generating.value = true;
  try {
    const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
    
    // 加载所有任务
    await taskStore.loadTasks();
    
    // 获取今天的任务
    const today = new Date().toISOString().slice(0, 10);
    const todayTasks = taskStore.tasks.filter(t => t.task_date === today);
    
    if (todayTasks.length === 0) {
      alert("今天还没有任务，请先创建一些任务");
      return;
    }
    
    // 生成日志
    await logStore.generateTodayLog(userId, todayTasks);
    
    // 刷新日志列表
    await logStore.loadLogs(userId);
    
    console.log("✅ 日志生成成功！");
  } catch (e: any) {
    console.error("生成日志失败:", e);
    alert(e?.message || "生成日志失败，请重试");
  } finally {
    generating.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
    await logStore.loadLogs(userId);
  } catch (e) {
    console.error("加载日志失败:", e);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* ============ 页面布局 ============ */
.log-page {
  min-height: 100vh;
  background: var(--color-gray-50);
}

.page-container {
  max-width: 900px;
  margin: 0 auto;
}

/* ============ 页面头部 ============ */
.page-header {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-600) 100%);
  color: white;
  padding: var(--space-8) 0;
  margin-bottom: var(--space-6);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.header-content {
  padding: 0 var(--space-6);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-4);
}

.header-actions {
  display: flex;
  gap: var(--space-3);
}

.header-actions .modern-btn {
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(10px);
}

.header-actions .btn-primary {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.header-actions .btn-primary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header-actions .btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.header-actions .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ============ 日志内容区 ============ */
.log-content {
  padding: 0 var(--space-6) var(--space-8);
}

.log-list {
  display: grid;
  gap: var(--space-6);
}

.log-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  animation: fadeInUp 0.5s ease-out;
  animation-fill-mode: both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5);
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-border);
}

.log-date {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-gray-900);
  font-size: 1.125rem;
}

.log-date svg {
  color: var(--color-primary);
}

.log-stats {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.completion-badge {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 700;
}

.completion-badge.high {
  background: var(--color-success-light);
  color: var(--color-success);
}

.completion-badge.medium {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.completion-badge.low {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.log-body {
  padding: var(--space-6);
}

.log-content {
  color: var(--color-gray-700);
  line-height: 1.8;
  font-size: 1rem;
  white-space: pre-line;
  margin: 0;
}

.log-footer {
  padding: var(--space-3) var(--space-6);
  background: var(--color-gray-50);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: flex-end;
}

.log-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* ============ 加载状态 ============ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  gap: var(--space-4);
}

.loading-spinner {
  color: var(--color-primary);
}

.loading-state p {
  color: var(--color-text-secondary);
  margin: 0;
}

/* ============ 空状态 ============ */
.empty-state {
  text-align: center;
  padding: var(--space-12);
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--color-gray-100);
  border-radius: var(--radius-full);
  margin-bottom: var(--space-6);
  color: var(--color-text-muted);
}

.empty-state h3 {
  color: var(--color-gray-900);
  margin: 0 0 var(--space-3) 0;
  font-size: 1.5rem;
}

.empty-state p {
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-6) 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

/* ============ 按钮动画 ============ */
.btn-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ============ 响应式设计 ============ */
@media (min-width: 919px) {
  .header-content {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 var(--space-6);
  }
  
  .log-content {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 var(--space-6) var(--space-8);
  }
}

@media (max-width: 640px) {
  .page-header {
    padding: var(--space-6) 0;
    margin-bottom: var(--space-4);
  }
  
  .header-content {
    flex-direction: column;
    padding: 0 var(--space-4);
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }
  
  .log-content {
    padding: 0 var(--space-4) var(--space-6);
  }
  
  .log-header {
    flex-direction: column;
    gap: var(--space-3);
    align-items: flex-start;
    padding: var(--space-4);
  }
  
  .log-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .log-body {
    padding: var(--space-4);
  }
  
  .empty-state {
    padding: var(--space-8) var(--space-4);
  }
}

/* ============ 暗色主题支持 ============ */
@media (prefers-color-scheme: dark) {
  .log-page {
    background: var(--color-background);
  }
  
  .log-card {
    background: var(--color-surface);
    border-color: var(--color-border);
  }
  
  .log-header,
  .log-footer {
    background: var(--color-gray-800);
    border-color: var(--color-gray-700);
  }
  
  .empty-state {
    background: var(--color-surface);
  }
  
  .empty-icon {
    background: var(--color-gray-800);
  }
}</style>