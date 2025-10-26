<template>
  <div class="page plan-create" style="max-width:720px;margin:0 auto;">
    <h1>{{ editId ? "编辑计划" : "创建新计划" }}</h1>

    <!-- 表单内容 -->
    <form class="form" @submit.prevent="createPlan" novalidate>
      <label>
        标题 *
        <input v-model.trim="form.title" type="text" placeholder="计划标题" required />
        <small class="error" v-if="errors.title">{{ errors.title }}</small>
      </label>

      <label>
        描述
        <textarea v-model="form.description" placeholder="计划描述（可选）" rows="3"></textarea>
      </label>

      <div class="row">
        <label>
          开始日期 *
          <input v-model="form.start_date" type="date" required />
          <small class="error" v-if="errors.start_date">{{ errors.start_date }}</small>
        </label>
        <label>
          结束日期 *
          <input v-model="form.end_date" type="date" required />
          <small class="error" v-if="errors.end_date">{{ errors.end_date }}</small>
        </label>
      </div>

      <label>
        频率
        <select v-model="form.frequency">
          <option value="daily">每天</option>
          <option value="weekly">每周</option>
          <option value="monthly">每月</option>
          <option value="once">仅一次</option>
        </select>
      </label>

      <div class="ops">
        <button class="primary" type="submit" :disabled="submitting">
          {{ submitting ? "提交中..." : (editId ? "保存修改" : "保存计划") }}
        </button>
        <button type="button" class="secondary" @click="goBack">返回</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";

/*
  功能增强：
  - 支持创建与编辑（通过 query.edit 判断）
  - 表单验证：必填项检查、日期范围校验
  - 提交后创建/更新计划并跳转到计划概览（/home -> PlanOverview.vue）
*/

const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();

// 编辑态判断（支持 ?edit=ID）
const editId = ref<number | null>(null);
if (route.query.edit) {
  const q = Array.isArray(route.query.edit) ? route.query.edit[0] : route.query.edit;
  const n = Number(q);
  if (!Number.isNaN(n)) editId.value = n;
}

// 表单模型
const form = reactive({
  title: "",
  description: "",
  start_date: "",
  end_date: "",
  frequency: "daily",
});

// 验证错误集合
const errors = reactive({
  title: "",
  start_date: "",
  end_date: "",
});

// 提交状态
const submitting = ref(false);

// 编辑态加载数据
async function loadForEdit() {
  if (!editId.value) return;
  // 尝试从 store 缓存取，若没有则触发加载
  let plan = (planStore.getPlan && planStore.getPlan(editId.value)) ?? null;
  if (!plan) {
    await planStore.loadPlans();
    plan = planStore.plans.find((p: any) => p.id === editId.value) ?? null;
  }
  if (!plan) {
    alert("未找到要编辑的计划");
    router.push("/home");
    return;
  }
  form.title = plan.title ?? "";
  form.description = plan.description ?? "";
  form.start_date = plan.start_date ?? "";
  form.end_date = plan.end_date ?? "";
  form.frequency = plan.frequency ?? "daily";
}

// 基本表单校验
function validate() {
  errors.title = "";
  errors.start_date = "";
  errors.end_date = "";

  if (!form.title || form.title.trim().length < 2) {
    errors.title = "标题至少需要 2 个字符";
  }
  if (!form.start_date) {
    errors.start_date = "请选择开始日期";
  }
  if (!form.end_date) {
    errors.end_date = "请选择结束日期";
  }
  if (form.start_date && form.end_date && form.start_date > form.end_date) {
    errors.end_date = "结束日期不能早于开始日期";
  }

  return !errors.title && !errors.start_date && !errors.end_date;
}

// 提交处理：创建或更新
async function createPlan() {
  if (!validate()) return;

  submitting.value = true;
  const payload = {
    title: form.title.trim(),
    description: form.description?.trim() ?? "",
    start_date: form.start_date,
    end_date: form.end_date,
    frequency: form.frequency,
  };

  try {
    if (editId.value) {
      if (!planStore.updatePlan) throw new Error("更新接口未实现");
      await planStore.updatePlan(editId.value, payload);
    } else {
      if (!planStore.createPlan) throw new Error("创建接口未实现");
      await planStore.createPlan(payload);
    }

    // 刷新计划列表，保证 PlanOverview 能马上显示最新数据
    if (planStore.loadPlans) await planStore.loadPlans();

    // 跳回计划概览页面（PlanOverview.vue 在 /home）
    router.push("/home");
  } catch (e: any) {
    console.error(e);
    alert(e?.message || "保存失败");
  } finally {
    submitting.value = false;
  }
}

// 返回操作（后退或回首页）
function goBack() {
  if (window.history.length > 1) router.back();
  else router.push("/home");
}

// 组件挂载时，若为编辑态则加载数据
onMounted(async () => {
  if (editId.value) {
    await loadForEdit();
  }
});
</script>

<style scoped>
.page.plan-create {
  padding: 1rem;
}
.form {
  display: grid;
  gap: .6rem;
}
.form label { display:flex; flex-direction:column; font-weight:600; }
.row { display:flex; gap:.6rem; }
.ops { display:flex; gap:.5rem; margin-top:.6rem; }
.primary { background:#3b82f6; color:#fff; border:none; padding:.5rem 1rem; border-radius:6px; }
.secondary { background:#f1f5f9; border:1px solid #d1d5db; padding:.5rem 1rem; border-radius:6px; }
.error { color:#ef4444; font-size:0.85rem; }
</style>
