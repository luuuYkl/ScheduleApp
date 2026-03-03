<template>
  <div class="ai-suggestions" v-if="showSuggestions">
    <div class="ai-header">
      <span class="ai-icon">🤖</span>
      <h3>AI 智能建议</h3>
      <button
        type="button"
        class="close-btn"
        @click="$emit('close')"
        v-if="closeable"
      >
        ✕
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="ai-loading">
      <div class="spinner"></div>
      <p>AI 正在分析您的计划...</p>
    </div>

    <!-- 建议列表 -->
    <div
      v-else-if="suggestions && suggestions.length > 0"
      class="suggestions-list"
    >
      <div
        v-for="(suggestion, index) in suggestions"
        :key="index"
        :class="['suggestion-item', `type-${suggestion.type}`]"
      >
        <span class="suggestion-icon">
          {{ getSuggestionIcon(suggestion.type) }}
        </span>
        <div class="suggestion-content">
          <p>{{ suggestion.message }}</p>
        </div>
      </div>
    </div>

    <!-- 推荐任务列表 -->
    <div
      v-if="recommendedTasks && recommendedTasks.length > 0"
      class="recommended-tasks"
    >
      <h4>📋 推荐任务清单</h4>
      <ul>
        <li v-for="(task, index) in recommendedTasks" :key="index">
          <button
            type="button"
            class="task-add-btn"
            @click="handleAddTask(task)"
            title="添加到待创建任务列表（不会立即创建计划）"
          >
            ➕
          </button>
          <div class="task-info">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-meta">
              <span v-if="task.task_date">📅 {{ task.task_date }}</span>
              <span v-if="task.start_time"
                >⏰ {{ task.start_time
                }}<span v-if="task.end_time"> - {{ task.end_time }}</span></span
              >
              <span v-if="task.repeat_type && task.repeat_type !== 'none'"
                >🔁 {{ renderRepeat(task) }}</span
              >
              <span v-if="task.note">📝 {{ task.note }}</span>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- AI 分析说明 -->
    <div v-if="reasoning" class="ai-reasoning">
      <details>
        <summary>💡 分析说明</summary>
        <p>{{ reasoning }}</p>
      </details>
    </div>

    <!-- 应用优化建议按钮 -->
    <div v-if="optimizedPlan" class="ai-actions">
      <button
        type="button"
        class="btn-apply-optimization"
        @click="$emit('apply-optimization', optimizedPlan)"
      >
        ✨ 应用优化建议
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type {
  AISuggestion,
  AIOptimizePlanResponse,
  AIRecommendedTask,
} from "@/services/api.types";

interface Props {
  loading?: boolean;
  response?: AIOptimizePlanResponse | null;
  closeable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  response: null,
  closeable: true,
});

const emit = defineEmits<{
  close: [];
  "add-task": [task: AIRecommendedTask];
  "apply-optimization": [
    optimizedPlan: AIOptimizePlanResponse["optimized_plan"],
  ];
}>();

const showSuggestions = computed(() => {
  if (props.loading) return true;
  const res = props.response;
  if (!res) return false;
  return (
    (res.suggestions && res.suggestions.length > 0) ||
    !!res.optimized_plan ||
    !!res.reasoning
  );
});

const suggestions = computed(() => props.response?.suggestions || []);
const recommendedTasks = computed<AIRecommendedTask[]>(
  () => props.response?.optimized_plan?.recommended_tasks || [],
);
const reasoning = computed(() => props.response?.reasoning || "");
const optimizedPlan = computed(() => props.response?.optimized_plan);

function getSuggestionIcon(type: AISuggestion["type"]): string {
  switch (type) {
    case "warning":
      return "⚠️";
    case "suggestion":
      return "💡";
    case "info":
      return "ℹ️";
    default:
      return "📌";
  }
}

function renderRepeat(task: AIRecommendedTask) {
  if (!task.repeat_type || task.repeat_type === "none") return "";
  const end = task.repeat_end_date ? `，到 ${task.repeat_end_date}` : "";
  return `${task.repeat_type} 重复${end}`;
}

function handleAddTask(task: AIRecommendedTask) {
  emit("add-task", task);
}
</script>

<style scoped>
.ai-suggestions {
  background: linear-gradient(135deg, var(--color-brand-600, #1D4ED8) 0%, var(--color-brand-700, #1E40AF) 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  position: relative;
}

.ai-icon {
  font-size: 1.5rem;
}

.ai-header h3 {
  margin: 0;
  font-size: 1.25rem;
  flex: 1;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  color: white;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ai-loading {
  text-align: center;
  padding: 2rem 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.suggestion-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.suggestion-item.type-warning {
  background: rgba(255, 193, 7, 0.2);
  border-left: 3px solid #ffc107;
}

.suggestion-item.type-suggestion {
  background: rgba(76, 175, 80, 0.2);
  border-left: 3px solid #4caf50;
}

.suggestion-item.type-info {
  background: rgba(33, 150, 243, 0.2);
  border-left: 3px solid #2196f3;
}

.suggestion-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
}

.suggestion-content p {
  margin: 0;
  line-height: 1.5;
}

.recommended-tasks {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.recommended-tasks h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.recommended-tasks ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recommended-tasks li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  transition: background 0.2s;
}

.recommended-tasks li:hover {
  background: rgba(255, 255, 255, 0.15);
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-title {
  font-weight: 600;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 0.9rem;
  opacity: 0.9;
}

.task-add-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  color: white;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.task-add-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.ai-reasoning {
  margin-top: 1rem;
}

.ai-reasoning details {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.75rem;
}

.ai-reasoning summary {
  cursor: pointer;
  font-weight: 500;
  user-select: none;
}

.ai-reasoning p {
  margin: 0.75rem 0 0 0;
  line-height: 1.6;
  opacity: 0.9;
}

.ai-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.btn-apply-optimization {
  background: white;
  color: var(--color-brand-600, #1D4ED8);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-apply-optimization:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-apply-optimization:active {
  transform: translateY(0);
}
</style>
