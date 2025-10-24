<template>
  <button
    :class="['btn', type, { disabled }]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  type?: 'primary' | 'secondary' | 'danger',
  disabled?: boolean
}>();
</script>

<style scoped>
.btn {
  cursor: pointer;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  transition: background 0.2s ease, transform 0.1s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.btn:hover {
  transform: translateY(-1px);
}

/* 类型 */
.primary {
  background-color: var(--color-primary);
  color: #fff;
}
.primary:hover {
  background-color: var(--color-primary-dark);
}
.secondary {
  background-color: var(--color-secondary);
  color: #fff;
}
.danger {
  background-color: var(--color-danger);
  color: #fff;
}

.disabled {
  background-color: var(--color-gray);
  color: var(--color-text-light);
  cursor: not-allowed;
  box-shadow: none;
}
</style>
