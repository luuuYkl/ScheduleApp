<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import PlanForm from "@/components/plan/PlanForm.vue";
import { usePlanStore } from "@/store/plans";

const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();

const editId = computed(() => {
  const v = route.query.edit;
  return v ? Number(v) : null;
});

const editingPlan = computed(() =>
  editId.value ? planStore.plans.find(p => p.id === editId.value) : null
);

onMounted(async () => {
  if (!planStore.plans.length) await planStore.loadPlans();
});

async function submit(payload: any) {
  if (editId.value) {
    await planStore.updatePlan(editId.value, payload);
    alert("保存成功");
  } else {
    await planStore.createPlan(payload);
    alert("创建成功");
  }
  router.push("/home");
}
</script>

<template>
  <div class="page" style="max-width:640px;margin:0 auto;">
    <h1 class="mb-4">{{ editId ? "编辑计划" : "新建计划" }}</h1>

    <PlanForm
      :mode="editId ? 'edit' : 'create'"
      :initial="editingPlan ? {
        title: editingPlan.title,
        description: editingPlan.description,
        start_date: editingPlan.start_date,
        end_date: editingPlan.end_date,
        frequency: editingPlan.frequency,
      } : undefined"
      @submit="submit"
    />
  </div>
</template>
