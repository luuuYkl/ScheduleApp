<template>
  <div class="task-checkbox">
    <input
      type="checkbox"
      :checked="modelValue"
      @change="handleChange"
    />
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'change': [value: boolean];
}>();

// 处理 checkbox 改变事件
function handleChange(e: Event) {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
  emit('change', target.checked);
}
</script>

<style scoped>
.task-checkbox { display: inline-flex; align-items: center; gap: .5rem; cursor: pointer; }
.task-checkbox input { width: 18px; height: 18px; }
</style>
