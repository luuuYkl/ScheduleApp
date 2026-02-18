<template>
  <PageScaffold title="日志记录" subtitle="查看历史日志和AI智能分析">
    <template #actions>
      <button
        class="btn btn-primary"
        @click="refreshLogs"
        :disabled="loading"
        aria-label="刷新日志"
      >
        <span class="btn-icon">🔄</span>
        <span class="btn-text">{{ loading ? "加载中..." : "刷新" }}</span>
      </button>
      <button
        class="btn btn-secondary"
        @click="generateReport"
        aria-label="生成报告"
      >
        <span class="btn-icon">📊</span>
        <span class="btn-text">生成报告</span>
      </button>
    </template>

    <div class="log-content">
      <!-- AI 复盘面板 -->
      <section class="ai-review-section">
        <div class="section-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"
            />
          </svg>
          AI 智能复盘
        </div>
        <AIReviewPanel />
      </section>

      <!-- 日志列表 -->
      <main class="log-list-container">
        <div v-if="loading && logs.length === 0" class="loading-state">
          <div class="loading-spinner">
            <svg
              class="animate-spin"
              width="48"
              height="48"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
                opacity="0.25"
              />
              <path
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p>加载中...</p>
        </div>

        <div v-else-if="logs.length > 0" class="log-list">
          <div
            v-for="(log, index) in logs"
            :key="log.id"
            class="log-card modern-card"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="log-header">
              <div class="log-date">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="currentColor"
                    stroke-width="2"
                    fill="none"
                  />
                  <line
                    x1="16"
                    y1="2"
                    x2="16"
                    y2="6"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <line
                    x1="8"
                    y1="2"
                    x2="8"
                    y2="6"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <line
                    x1="3"
                    y1="10"
                    x2="21"
                    y2="10"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                </svg>
                <strong>{{ formatDate(log.date) }}</strong>
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
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
              />
              <polyline
                points="14,2 14,8 20,8"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
              />
            </svg>
          </div>
          <h3>暂无日志记录</h3>
        </div>
      </main>
    </div>
  </PageScaffold>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { useLogStore } from "@/store/log";
import { useUserStore } from "@/store/user";
import type { LogEntry } from "@/services/generate-log";
import AIReviewPanel from "@/components/log/AIReviewPanel.vue";
import PageScaffold from "@/components/common/PageScaffold.vue";

const logStore = useLogStore();
const userStore = useUserStore();

const logs = computed(() => logStore.logs);
const loading = ref(false);
// 仅保留自动加载与 AI 复盘功能

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().slice(0, 10)) {
    return "今天";
  } else if (dateStr === yesterday.toISOString().slice(0, 10)) {
    return "昨天";
  } else {
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      weekday: "short",
    };
    return date.toLocaleDateString("zh-CN", options);
  }
}

// 格式化时间
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 获取完成度样式类
function getCompletionClass(log: LogEntry): string {
  const completion = Math.round((log.tasks_done / log.tasks_total) * 100);
  if (completion >= 80) return "high";
  if (completion >= 50) return "medium";
  return "low";
}

// 移除手动生成与刷新操作，保留自动加载

function refreshLogs() {
  onMounted(async () => {
    loading.value = true;
    try {
      const userId =
        userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
      await logStore.loadLogs(userId);
    } catch (e) {
      console.error("加载日志失败:", e);
    } finally {
      loading.value = false;
    }
  });
}

function generateReport() {
  // TODO: 实现报告生成功能
  alert("报告生成功能开发中...");
}

onMounted(async () => {
  loading.value = true;
  try {
    const userId =
      userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
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
  padding-bottom: calc(var(--footer-height, 64px) + 1rem);
}

.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding-top: calc(var(--header-height, 64px) + 1rem);
}

/* ============ 页面头部 ============ */
.page-header {
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-primary-600) 100%
  );
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

/* ============ AI 复盘面板 ============ */
.ai-review-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 1.25rem 0;
}

.section-title svg {
  color: var(--ai-main);
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
}
</style>
