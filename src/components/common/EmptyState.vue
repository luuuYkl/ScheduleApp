<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon }}</div>
    <h3 class="empty-title">{{ title }}</h3>
    <p class="empty-desc" v-if="description">{{ description }}</p>
    <slot name="action">
      <button
        v-if="action"
        class="empty-action"
        @click="$emit('action-click')"
      >
        {{ action }}
      </button>
    </slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string;
  title: string;
  description?: string;
  action?: string;
}>();

defineEmits<{
  'action-click': [];
}>();
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  text-align: center;
  min-height: 200px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-4);
  animation: empty-float 3s ease-in-out infinite;
  opacity: 0.85;
}

@keyframes empty-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 var(--space-1);
}

.empty-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0 0 var(--space-4);
  max-width: 280px;
  line-height: 1.5;
}

.empty-action {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-5);
  border: 1px solid var(--ai-main);
  border-radius: var(--radius-full);
  background: var(--ai-bg);
  color: var(--ai-main);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color var(--dur-fast) var(--ease-standard),
    box-shadow var(--dur-fast) var(--ease-standard),
    transform var(--dur-fast) var(--ease-standard);
}

.empty-action:hover {
  background: var(--ai-main);
  color: white;
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.empty-action:active {
  transform: translateY(0);
}
</style>