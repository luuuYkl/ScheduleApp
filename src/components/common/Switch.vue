<!-- src/components/common/Switch.vue -->
<!-- 开关组件 - 基于 Arco Design Switch -->

<template>
  <a-switch
    :model-value="modelValue"
    :disabled="disabled"
    :size="arcoSize"
    @update:model-value="handleChange"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  modelValue?: boolean;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  size: "medium",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

// 尺寸映射：自定义 size -> Arco size
// Arco Switch 只支持 small 和 medium
const arcoSize = computed(() => {
  if (props.size === "small") return "small";
  return "medium";
});

const handleChange = (value: boolean | number | string) => {
  emit("update:modelValue", Boolean(value));
};
</script>

<style scoped>
/* Arco Switch 自定义样式覆盖 */
:deep(.arco-switch) {
  transition: all 0.2s ease;
}

:deep(.arco-switch-checked) {
  background-color: var(--ai-main, #6366f1);
}
</style>