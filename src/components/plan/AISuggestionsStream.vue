<template>
  <div class="ai-suggestions-stream" ref="streamContainer">
    <!-- 加载和流式输出状态 -->
    <div v-if="loading || streamContent.length > 0" class="ai-header">
      <span class="ai-icon">🤖</span>
      <h3>AI 智能分析</h3>
      <button
        type="button"
        class="close-btn"
        @click="$emit('close')"
        v-if="closeable && !loading"
      >
        ✕
      </button>
    </div>

    <!-- 流式内容展示区 -->
    <div class="stream-content" ref="contentContainer">
      <!-- 加载动画 -->
      <div v-if="loading && streamContent.length === 0" class="ai-loading">
        <div class="spinner"></div>
        <p>AI 正在分析您的计划...</p>
      </div>

      <!-- 模块化展示区 -->
      <TransitionGroup name="module-fade" tag="div" class="modules-container">
        <!-- 分析过程模块 -->
        <div
          v-if="parsedData.reasoning && showReasoning"
          key="reasoning"
          class="module-card reasoning-module"
        >
          <div class="module-header" @click="toggleReasoning">
            <span class="module-icon">💡</span>
            <span class="module-title">分析思路</span>
            <span class="toggle-icon">{{ reasoningExpanded ? '▼' : '▶' }}</span>
          </div>
          <Transition name="expand">
            <div v-show="reasoningExpanded" class="module-body">
              <p>{{ parsedData.reasoning }}</p>
            </div>
          </Transition>
        </div>

        <!-- 建议列表模块 -->
        <div
          v-if="parsedData.suggestions && parsedData.suggestions.length > 0"
          key="suggestions"
          class="module-card suggestions-module"
        >
          <div class="module-header">
            <span class="module-icon">📋</span>
            <span class="module-title">优化建议</span>
            <span class="module-badge">{{ parsedData.suggestions.length }}</span>
          </div>
          <div class="module-body">
            <div
              v-for="(suggestion, index) in parsedData.suggestions"
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
        </div>

        <!-- 推荐任务模块 -->
        <div
          v-if="parsedData.optimized_plan?.recommended_tasks &&
                 parsedData.optimized_plan.recommended_tasks.length > 0"
          key="tasks"
          class="module-card tasks-module"
        >
          <div class="module-header">
            <span class="module-icon">✅</span>
            <span class="module-title">推荐任务</span>
            <span class="module-badge">
              {{ parsedData.optimized_plan.recommended_tasks.length }}
            </span>
          </div>
          <div class="module-body">
            <div
              v-for="(task, index) in parsedData.optimized_plan.recommended_tasks"
              :key="index"
              class="task-card"
            >
              <button
                type="button"
                class="task-add-btn"
                @click="handleAddTask(task)"
                title="添加到待创建任务列表"
              >
                ➕
              </button>
              <div class="task-info">
                <div class="task-title">{{ task.title }}</div>
                <div class="task-meta">
                  <span v-if="task.task_date" class="meta-item">
                    📅 {{ task.task_date }}
                  </span>
                  <span v-if="task.start_time" class="meta-item">
                    ⏰ {{ task.start_time }}
                    <span v-if="task.end_time"> - {{ task.end_time }}</span>
                  </span>
                  <span
                    v-if="task.repeat_type && task.repeat_type !== 'none'"
                    class="meta-item"
                  >
                    🔁 {{ renderRepeat(task) }}
                  </span>
                </div>
                <div v-if="task.note" class="task-note">
                  {{ task.note }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 优化建议模块 -->
        <div
          v-if="hasOptimization"
          key="optimization"
          class="module-card optimization-module"
        >
          <div class="module-header">
            <span class="module-icon">✨</span>
            <span class="module-title">整体优化</span>
          </div>
          <div class="module-body">
            <p v-if="parsedData.optimized_plan?.title" class="opt-item">
              <strong>标题：</strong>{{ parsedData.optimized_plan.title }}
            </p>
            <p v-if="parsedData.optimized_plan?.description" class="opt-item">
              <strong>描述：</strong>{{ parsedData.optimized_plan.description }}
            </p>
          </div>
        </div>
      </TransitionGroup>

      <!-- 流式输出状态提示 -->
      <div v-if="loading && streamContent.length > 0" class="stream-indicator">
        <span class="typing-dots"></span>
        <span>AI 正在生成...</span>
      </div>
    </div>

    <!-- 应用优化建议按钮 -->
    <Transition name="fade">
      <div v-if="hasOptimization && !loading" class="ai-actions">
        <button
          type="button"
          class="btn-apply-optimization"
          @click="$emit('apply-optimization', parsedData.optimized_plan)"
        >
          ✨ 应用优化建议
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import type {
  AISuggestion,
  AIOptimizePlanResponse,
  AIRecommendedTask,
} from "@/services/api.types";

interface Props {
  loading?: boolean;
  response?: AIOptimizePlanResponse | null;
  closeable?: boolean;
  streamContent?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  response: null,
  closeable: true,
  streamContent: "",
});

const emit = defineEmits<{
  close: [];
  "add-task": [task: AIRecommendedTask];
  "apply-optimization": [
    optimizedPlan: AIOptimizePlanResponse["optimized_plan"],
  ];
}>();

// Refs
const streamContainer = ref<HTMLElement>();
const contentContainer = ref<HTMLElement>();

// 状态
const reasoningExpanded = ref(false);
const showReasoning = ref(true);

// 计算属性
const parsedData = computed(() => {
  // 如果有完整的 response，优先使用
  if (props.response) {
    return props.response;
  }
  
  // 否则尝试解析流式内容
  if (props.streamContent) {
    try {
      // 尝试解析 JSON
      const trimmed = props.streamContent.trim();
      
      // 移除可能的 Markdown 标记
      let cleaned = trimmed
        .replace(/^```(?:json)?\s*/gm, "")
        .replace(/```$/gm, "")
        .replace(/```/g, "")
        .trim();
      
      // 尝试提取 JSON 对象
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = jsonMatch[0];
        try {
          return JSON.parse(extracted);
        } catch (e) {
          // 如果解析失败，返回部分解析的数据
          return {
            suggestions: [],
            optimized_plan: { recommended_tasks: [] },
            reasoning: "正在分析中...",
          };
        }
      }
    } catch (e) {
      console.warn("解析流式内容失败:", e);
    }
  }
  
  // 返回空结构
  return {
    suggestions: [],
    optimized_plan: { recommended_tasks: [] },
    reasoning: "",
  };
});

const hasOptimization = computed(() => {
  const plan = parsedData.value.optimized_plan;
  return (
    plan?.title ||
    plan?.description ||
    (plan?.recommended_tasks && plan.recommended_tasks.length > 0)
  );
});

// 方法
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

function toggleReasoning() {
  reasoningExpanded.value = !reasoningExpanded.value;
}

// 自动滚动到底部
const autoScroll = async () => {
  await nextTick();
  if (contentContainer.value) {
    contentContainer.value.scrollTo({
      top: contentContainer.value.scrollHeight,
      behavior: "smooth",
    });
  }
};

// 监听流式内容变化，自动滚动
watch(
  () => props.streamContent,
  () => {
    autoScroll();
  },
  { immediate: true }
);

// 监听 loading 状态变化
watch(
  () => props.loading,
  (newLoading) => {
    if (!newLoading) {
      // 加载完成后，确保容器滚动到正确位置
      setTimeout(() => {
        if (streamContainer.value) {
          streamContainer.value.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 300);
    }
  }
);

// 组件挂载时自动聚焦
onMounted(() => {
  if (streamContainer.value && props.loading) {
    streamContainer.value.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
});
</script>

<style scoped>
.ai-suggestions-stream {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  margin: 0;
  color: var(--text-main);
  box-shadow: var(--shadow-sm);
  max-height: 80vh;
  overflow-y: auto;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-subtle);
  position: relative;
}

.ai-icon {
  font-size: 1.5rem;
}

.ai-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  flex: 1;
}

.close-btn {
  background: var(--bg-main);
  border: 1px solid var(--border-main);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
}

.stream-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-loading {
  text-align: center;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-main);
  border-top-color: var(--ai-main);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modules-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.module-card {
  background: var(--bg-main);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.module-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-subtle);
  cursor: default;
}

.module-header.clickable {
  cursor: pointer;
  transition: background 0.2s;
}

.module-header.clickable:hover {
  background: var(--bg-card-hover);
}

.module-icon {
  font-size: 1.1rem;
}

.module-title {
  font-weight: 600;
  font-size: 0.95rem;
  flex: 1;
}

.module-badge {
  background: var(--ai-bg);
  color: var(--ai-main);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.toggle-icon {
  color: var(--text-secondary);
  font-size: 0.8rem;
  transition: transform 0.2s;
}

.module-body {
  padding: 16px;
}

.module-body p {
  margin: 0;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* 推理模块 */
.reasoning-module .module-header {
  cursor: pointer;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* 建议列表模块 */
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: 6px;
  border-left: 3px solid transparent;
}

.suggestion-item.type-warning {
  border-left-color: #ffc107;
  background: rgba(255, 193, 7, 0.05);
}

.suggestion-item.type-suggestion {
  border-left-color: #4caf50;
  background: rgba(76, 175, 80, 0.05);
}

.suggestion-item.type-info {
  border-left-color: #2196f3;
  background: rgba(33, 150, 243, 0.05);
}

.suggestion-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.suggestion-content {
  flex: 1;
}

.suggestion-content p {
  margin: 0;
  line-height: 1.5;
  color: var(--text-main);
}

/* 推荐任务模块 */
.task-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  transition: all 0.2s;
}

.task-card:hover {
  border-color: var(--ai-main);
  box-shadow: var(--shadow-xs);
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.task-title {
  font-weight: 600;
  color: var(--text-main);
  font-size: 0.95rem;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-note {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
  padding: 8px;
  background: var(--bg-main);
  border-radius: 4px;
}

.task-add-btn {
  background: var(--ai-bg);
  border: 1px solid var(--ai-main);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  color: var(--ai-main);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.task-add-btn:hover {
  background: var(--ai-main);
  color: white;
  transform: scale(1.05);
}

/* 优化建议模块 */
.opt-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.opt-item:last-child {
  border-bottom: none;
}

.opt-item strong {
  color: var(--text-main);
  font-weight: 600;
}

/* 流式指示器 */
.stream-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--ai-bg);
  border-radius: 6px;
  color: var(--ai-main);
  font-size: 0.9rem;
}

.typing-dots {
  display: inline-block;
  width: 12px;
  height: 12px;
  position: relative;
}

.typing-dots::before,
.typing-dots::after {
  content: "";
  position: absolute;
  width: 4px;
  height: 4px;
  background: currentColor;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dots::before {
  left: 0;
  animation-delay: 0s;
}

.typing-dots::after {
  left: 6px;
  animation-delay: 0.2s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

/* 操作按钮 */
.ai-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.btn-apply-optimization {
  background: var(--ai-main);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
}

.btn-apply-optimization:hover {
  background: var(--ai-main-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.btn-apply-optimization:active {
  transform: translateY(0);
}

/* 模块淡入动画 */
.module-fade-enter-active {
  transition: all 0.3s ease;
}

.module-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

/* 淡入动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .ai-suggestions-stream {
    padding: 16px;
    max-height: 70vh;
  }

  .module-header {
    padding: 10px 12px;
  }

  .module-body {
    padding: 12px;
  }

  .task-card {
    flex-direction: column;
  }

  .task-add-btn {
    align-self: flex-end;
  }
}
</style>