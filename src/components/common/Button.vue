<template>
  <a-button
    :type="arcoType"
    :status="arcoStatus"
    :disabled="disabled"
    :size="arcoSize"
    @click="$emit('click')"
  >
    <slot />
  </a-button>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  type?: "primary" | "secondary" | "danger";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "ai";
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  size?: "small" | "sm" | "medium" | "large" | "lg";
}>();

defineEmits<{
  (e: "click"): void;
}>();

// 类型映射：自定义 variant/type -> Arco type
const arcoType = computed(() => {
  // 优先使用 variant
  const v = props.variant || props.type;
  if (v === "secondary" || v === "outline" || v === "ghost") return "outline";
  return "primary";
});

// 状态映射：danger 使用 status
const arcoStatus = computed(() => {
  const v = props.variant || props.type;
  if (v === "danger") return "danger";
  return undefined;
});

// 尺寸映射：支持 "sm" 作为 "small" 的别名，"lg" 作为 "large" 的别名
const arcoSize = computed(() => {
  if (props.size === "small" || props.size === "sm") return "small";
  if (props.size === "large" || props.size === "lg") return "large";
  return "medium";
});
</script>

<style scoped>
/* Arco Button 自定义样式覆盖 */
:deep(.arco-btn) {
  font-weight: 500;
}
</style>