<!--
  ═══════════════════════════════════════════════════════════════
  专注计时器组件 (FocusTimer.vue)
  ═══════════════════════════════════════════════════════════════
  
  【组件定位】
  专注模式页面的计时器组件，显示用户已专注的时长。
  
  【核心功能】
  1. 显示专注时长（HH:MM:SS格式）
  2. 每秒更新一次
  3. 使用等宽字体避免数字跳动
  
  【Props】
  - duration: 专注时长（秒）
-->
<template>
  <div class="focus-timer">
    <div class="timer-label">已专注</div>
    <div class="timer-value">{{ formattedDuration }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  duration: number;
}>();

// 格式化时长为 HH:MM:SS
const formattedDuration = computed(() => {
  const hours = Math.floor(props.duration / 3600);
  const minutes = Math.floor((props.duration % 3600) / 60);
  const seconds = props.duration % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});
</script>

<style scoped>
.focus-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.timer-label {
  font-size: 14px;
  font-weight: 400;
  color: var(--focus-text-secondary, rgba(229, 231, 235, 0.7));
  letter-spacing: 2px;
  text-transform: uppercase;
}

.timer-value {
  font-size: 48px;
  font-weight: 600;
  color: var(--focus-text, #e5e7eb);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
  line-height: 1;
}

/* 响应式 */
@media (max-width: 768px) {
  .timer-value {
    font-size: 36px;
  }
  
  .timer-label {
    font-size: 12px;
  }
}
</style>