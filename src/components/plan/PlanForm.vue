<template>
  <div class="card">
    <h2>{{ mode === 'edit' ? '编辑计划' : '新建计划' }}</h2>

    <div class="mb-2">
      <label>标题</label>
      <input v-model.trim="form.title" />
    </div>

    <div class="mb-2">
      <label>描述</label>
      <textarea v-model.trim="form.description" />
    </div>

    <div class="mb-2">
      <label>开始日期</label>
      <input type="date" v-model="form.start_date" />
    </div>

    <div class="mb-2">
      <label>结束日期</label>
      <input type="date" v-model="form.end_date" />
    </div>

    <div class="mb-2">
      <label>频率</label>
      <select v-model="form.frequency">
        <option value="daily">daily</option>
        <option value="weekly">weekly</option>
      </select>
    </div>

    <button class="primary" @click="onSubmit">
      {{ mode === 'edit' ? '保存修改' : '创建计划' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

/** 表单模型类型 */
type Frequency = "daily" | "weekly";
interface PlanFormModel {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  frequency: Frequency;
}

/** 组件 props */
type Mode = "create" | "edit";
const props = withDefaults(
  defineProps<{
    mode?: Mode;
    initial?: Partial<PlanFormModel>;
  }>(),
  {
    mode: "create",
    initial: () => ({
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      frequency: "daily" as Frequency,
    }),
  }
);

const mode = props.mode;

/** 表单状态 */
const form = ref<PlanFormModel>({
  title: props.initial.title ?? "",
  description: props.initial.description ?? "",
  start_date: props.initial.start_date ?? "",
  end_date: props.initial.end_date ?? "",
  frequency: (props.initial.frequency as Frequency) ?? "daily",
});

/** initial 变更时同步到表单（编辑页返回后/异步拉取场景） */
watch(
  () => props.initial,
  (v: Partial<PlanFormModel> | undefined) => {
    form.value = {
      title: v?.title ?? "",
      description: v?.description ?? "",
      start_date: v?.start_date ?? "",
      end_date: v?.end_date ?? "",
      frequency: (v?.frequency as Frequency) ?? "daily",
    };
  },
  { deep: true }
);

/** 提交 */
const emit = defineEmits<{ (e: "submit", payload: PlanFormModel): void }>();
function onSubmit() {
  emit("submit", { ...form.value });
}
</script>
