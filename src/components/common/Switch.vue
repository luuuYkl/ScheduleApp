<!-- src/components/common/Switch.vue -->
<!-- 开关组件 - 基于 Arco Design Switch，紧凑尺寸与圆形按钮（18px）视觉协调 -->

<template>
  <a-switch
    :model-value="modelValue"
    :disabled="disabled"
    size="small"
    @update:model-value="handleChange"
  />
</template>

<script setup lang="ts">
interface Props {
  modelValue?: boolean;
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const handleChange = (value: boolean | number | string) => {
  emit("update:modelValue", Boolean(value));
};
</script>

<style scoped>
/*
 * 基于 Arco small (28×16px) 尺寸，放大到 36×20px
 * 使用 !important 确保覆盖 Arco 全局 CSS（arco.css 优先级高于 scoped :deep）
 */

/* 轨道：20px 高 × 36px 宽，圆角胶囊形 */
:deep(.arco-switch) {
  height: 20px !important;
  min-width: 36px !important;
  border-radius: 10px !important;
  line-height: 20px !important;
  transition: all 0.25s ease !important;
}

/* 滑块圆形按钮：16×16px，距边缘 2px */
:deep(.arco-switch .arco-switch-handle) {
  width: 16px !important;
  height: 16px !important;
  border-radius: 50% !important;
  top: 2px !important;
  left: 2px !important;
}

/* 开启状态：滑块右移，left = 总宽 - 滑块宽 - 间距 = 36 - 16 - 2 = 18px */
:deep(.arco-switch-checked .arco-switch-handle) {
  left: calc(100% - 18px) !important;
}

/* 开启颜色 */
:deep(.arco-switch-checked) {
  background-color: var(--ai-main, #6366f1) !important;
}
</style>
