<template>
  <a-card :class="['custom-card', { 'card--ai': ai }]">
    <template #title v-if="$slots.title">
      <slot name="title" />
    </template>
    <template #extra v-if="$slots.extra">
      <slot name="extra" />
    </template>
    <slot />
    <template #actions v-if="$slots.actions">
      <slot name="actions" />
    </template>
  </a-card>
</template>

<script setup lang="ts">
defineProps<{
  ai?: boolean;
}>();
</script>

<style scoped>
.custom-card {
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  box-shadow: var(--shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.05));
  transition: 
    box-shadow var(--dur-fast, 140ms) var(--ease-standard, cubic-bezier(0.2, 0.8, 0.2, 1)),
    transform var(--dur-fast, 140ms) var(--ease-standard, cubic-bezier(0.2, 0.8, 0.2, 1));
}

.custom-card:hover {
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1));
}

/* AI 卡片特殊样式 */
.card--ai {
  border-left: 3px solid var(--ai-main, #6366f1);
  background: var(--ai-bg, rgba(99, 102, 241, 0.12));
}

.card--ai :deep(.arco-card-body) {
  position: relative;
}
</style>