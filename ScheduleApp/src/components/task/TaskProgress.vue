<template>
  <div class="progress">
    <div class="header">
      <strong>{{ label }}</strong>
      <span class="pct">{{ value }}%</span>
    </div>
    <div class="bar">
      <div class="fill" :style="{ width: value + '%' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number; // 0 - 100
    label?: string; // 标题
  }>(),
  {
    label: "进度",
  },
);
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.25rem;
}
.pct {
  color: var(--ai-main);
  font-weight: 600;
}
.bar {
  height: 10px;
  background: var(--bg-elevated, #f1f5f9);
  border: 1px solid var(--border-main);
  border-radius: 999px;
  overflow: hidden;
}
.fill {
  height: 100%;
  background: var(--ai-main);
  transition: width 0.2s ease;
}
</style>
