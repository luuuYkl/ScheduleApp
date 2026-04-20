<!--
  ═══════════════════════════════════════════════════════════════
  专注模式退出按钮组件 (FocusExitButton.vue)
  ═══════════════════════════════════════════════════════════════
  
  【组件定位】
  专注模式页面的退出按钮，固定在右上角。
  
  【核心功能】
  1. 显示退出按钮（× 图标或文字）
  2. 点击后触发退出事件
  3. 支持键盘快捷键（ESC）
  
  【Events】
  - exit: 点击退出按钮时触发
  
  【设计原则】
  - 明显但不过于显眼
  - 易于触达但不干扰专注
-->
<template>
  <div class="focus-exit-button">
    <button 
      class="exit-btn"
      @click="handleExit"
      @keydown.esc="handleExit"
      title="退出专注模式 (ESC)"
    >
      <span class="exit-icon">×</span>
      <span class="exit-text">退出</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

const emit = defineEmits<{
  exit: [];
}>();

function handleExit() {
  emit('exit');
}

// 监听 ESC 键
function handleKeyPress(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleExit();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress);
});
</script>

<style scoped>
.focus-exit-button {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
}

.exit-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--focus-exit-bg);
  border: 1px solid var(--focus-exit-border);
  border-radius: var(--radius-sm);
  color: var(--focus-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  outline: none;
}

.exit-btn:hover {
  background: var(--focus-exit-hover-bg);
  border-color: var(--focus-exit-hover-border);
  color: var(--focus-exit-hover-text);
  transform: translateY(-1px);
}

.exit-btn:active {
  transform: translateY(0);
}

.exit-btn:focus-visible {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5);
}

.exit-icon {
  font-size: 20px;
  line-height: 1;
  font-weight: 300;
}

.exit-text {
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 768px) {
  .focus-exit-button {
    top: 16px;
    right: 16px;
  }
  
  .exit-btn {
    padding: 8px 16px;
  }
  
  .exit-icon {
    font-size: 18px;
  }
  
  .exit-text {
    font-size: 13px;
  }
}
</style>
