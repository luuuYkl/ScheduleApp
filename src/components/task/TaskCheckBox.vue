<template>
  <label class="row" :class="{ disabled }">
    <input
      type="checkbox"
      :checked="checked"
      :disabled="disabled"
      @change="$emit('toggle')"
    />
    <span class="text"><slot>标记完成</slot></span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  checked: boolean;
  disabled?: boolean;
}>();
defineEmits<{
  (e: 'toggle'): void
}>();
</script>

<style scoped>
.row { display: inline-flex; align-items: center; gap: .5rem; cursor: pointer; }
.row input { width: 18px; height: 18px; }
.text { user-select: none; }
.disabled { opacity: .6; cursor: not-allowed; }
</style>
