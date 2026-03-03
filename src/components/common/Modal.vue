<template>
  <a-modal
    :visible="visible"
    :title="title"
    :width="width"
    :footer="!!$slots.footer"
    @cancel="close"
    @ok="close"
    unmount-on-close
  >
    <slot />
    <template #footer v-if="$slots.footer">
      <slot name="footer" />
    </template>
  </a-modal>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean;
  title?: string;
  width?: number | string;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
}>();

function close() {
  emit("update:visible", false);
}
</script>

<style scoped>
/* Arco Modal 自定义样式覆盖 */
:deep(.arco-modal) {
  border-radius: var(--radius-md, 12px);
}

:deep(.arco-modal-header) {
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
}

:deep(.arco-modal-footer) {
  border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
}
</style>