<template>
  <div 
    class="pull-to-refresh"
    ref="containerRef"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <!-- 下拉指示器 -->
    <div 
      class="pull-indicator"
      :class="{ 
        'pull-indicator--visible': pullDistance > 0,
        'pull-indicator--ready': canRefresh,
        'pull-indicator--loading': refreshing
      }"
      :style="{ height: Math.min(pullDistance, maxPullDistance) + 'px' }"
    >
      <div class="pull-indicator__content">
        <div v-if="refreshing" class="pull-spinner">
          <svg class="pull-spinner__icon" viewBox="0 0 24 24">
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
        <div v-else class="pull-arrow" :class="{ 'pull-arrow--rotate': canRefresh }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </div>
        <span class="pull-text">
          {{ refreshing ? '刷新中...' : (canRefresh ? '释放刷新' : '下拉刷新') }}
        </span>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div 
      class="pull-content"
      :style="{ transform: `translateY(${Math.min(pullDistance, maxPullDistance) * 0.5}px)` }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Props {
  /** 触发刷新的下拉距离阈值 */
  threshold?: number;
  /** 最大下拉距离 */
  maxDistance?: number;
  /** 是否禁用下拉刷新 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  threshold: 80,
  maxDistance: 120,
  disabled: false,
});

const emit = defineEmits<{
  (e: 'refresh'): Promise<void> | void;
}>();

// 状态
const containerRef = ref<HTMLElement | null>(null);
const pullDistance = ref(0);
const refreshing = ref(false);
const isDragging = ref(false);
const startY = ref(0);
const scrollTop = ref(0);

// 计算属性
const maxPullDistance = computed(() => props.maxDistance);
const canRefresh = computed(() => pullDistance.value >= props.threshold && !refreshing.value);

// 触摸事件处理
function handleTouchStart(e: TouchEvent) {
  if (props.disabled || refreshing.value) return;
  
  const target = e.currentTarget as HTMLElement;
  scrollTop.value = target.scrollTop || window.scrollY;
  
  // 只有在顶部时才启用下拉
  if (scrollTop.value <= 0) {
    isDragging.value = true;
    startY.value = e.touches[0].clientY;
  }
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value || props.disabled || refreshing.value) return;
  
  const currentY = e.touches[0].clientY;
  const diff = currentY - startY.value;
  
  if (diff > 0) {
    // 阻止默认滚动行为
    if (scrollTop.value <= 0) {
      e.preventDefault();
    }
    // 添加阻尼效果
    pullDistance.value = diff * 0.5;
  }
}

function handleTouchEnd() {
  if (!isDragging.value) return;
  
  isDragging.value = false;
  
  if (canRefresh.value) {
    triggerRefresh();
  } else {
    pullDistance.value = 0;
  }
}

// 鼠标事件处理（桌面端支持）
function handleMouseDown(e: MouseEvent) {
  if (props.disabled || refreshing.value) return;
  
  scrollTop.value = window.scrollY;
  
  if (scrollTop.value <= 0) {
    isDragging.value = true;
    startY.value = e.clientY;
  }
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value || props.disabled || refreshing.value) return;
  
  const currentY = e.clientY;
  const diff = currentY - startY.value;
  
  if (diff > 0) {
    pullDistance.value = diff * 0.5;
  }
}

function handleMouseUp() {
  if (!isDragging.value) return;
  
  isDragging.value = false;
  
  if (canRefresh.value) {
    triggerRefresh();
  } else {
    pullDistance.value = 0;
  }
}

// 触发刷新
async function triggerRefresh() {
  if (refreshing.value) return;
  
  refreshing.value = true;
  pullDistance.value = props.threshold;
  
  try {
    await emit('refresh');
  } finally {
    refreshing.value = false;
    pullDistance.value = 0;
  }
}

// 暴露刷新方法
defineExpose({
  refresh: triggerRefresh
});
</script>

<style scoped>
.pull-to-refresh {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: pan-y;
}

.pull-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  transition: height 0.2s ease-out;
  z-index: 10;
  pointer-events: none;
}

.pull-indicator__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3);
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.pull-indicator--visible .pull-indicator__content {
  opacity: 1;
}

.pull-indicator--ready .pull-indicator__content {
  color: var(--ai-main);
}

.pull-indicator--loading .pull-indicator__content {
  color: var(--ai-main);
}

/* 箭头 */
.pull-arrow {
  width: 24px;
  height: 24px;
  margin-bottom: var(--space-1);
  transition: transform 0.2s ease;
}

.pull-arrow svg {
  width: 100%;
  height: 100%;
}

.pull-arrow--rotate {
  transform: rotate(180deg);
}

/* 加载动画 */
.pull-spinner {
  width: 24px;
  height: 24px;
  margin-bottom: var(--space-1);
}

.pull-spinner__icon {
  width: 100%;
  height: 100%;
  animation: spin 1s linear infinite;
  color: var(--ai-main);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 文字 */
.pull-text {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

/* 内容区域 */
.pull-content {
  width: 100%;
  height: 100%;
  transition: transform 0.2s ease-out;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .pull-indicator__content {
    padding: var(--space-2);
  }
  
  .pull-arrow,
  .pull-spinner {
    width: 20px;
    height: 20px;
  }
  
  .pull-text {
    font-size: 11px;
  }
}
</style>