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
const props = withDefaults(defineProps<{
  value: number;     // 0 - 100
  label?: string;    // 标题
}>(), {
  label: "进度",
});
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: .25rem; }
.pct { color: var(--color-primary); font-weight: 600; }
.bar {
  height: 10px; background: #f1f5f9; border: 1px solid var(--color-border);
  border-radius: 999px; overflow: hidden;
}
.fill { height: 100%; background: var(--color-primary); transition: width .2s ease; }
</style>
