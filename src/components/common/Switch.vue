<!-- src/components/common/Switch.vue -->
<!-- 开关组件 -->

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :class="[
      'switch',
      { 'switch--checked': modelValue },
      { 'switch--disabled': disabled },
      `switch--${size}`,
    ]"
    @click="handleClick"
    :disabled="disabled"
  >
    <span class="switch-track">
      <span class="switch-thumb"></span>
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: boolean;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  size: "medium",
});

const emit = defineEmits<Emits>();

const handleClick = () => {
  emit("update:modelValue", !props.modelValue);
};
</script>

<style scoped>
.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  outline: none;
  transition: all 0.2s ease;
}

.switch:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.switch--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.switch-track {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 24px;
  background-color: var(--border-color);
  border-radius: 12px;
  transition: background-color 0.2s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.switch--checked .switch-track {
  background-color: var(--primary-color);
}

.switch--small .switch-track {
  width: 32px;
  height: 20px;
  border-radius: 10px;
}

.switch--large .switch-track {
  width: 48px;
  height: 28px;
  border-radius: 14px;
}

.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
  transform: translateX(0);
}

.switch--checked .switch-thumb {
  transform: translateX(16px);
}

.switch--small .switch-thumb {
  width: 16px;
  height: 16px;
  transform: translateX(0);
}

.switch--small.switch--checked .switch-thumb {
  transform: translateX(12px);
}

.switch--large .switch-thumb {
  width: 24px;
  height: 24px;
  transform: translateX(0);
}

.switch--large.switch--checked .switch-thumb {
  transform: translateX(20px);
}
</style>
