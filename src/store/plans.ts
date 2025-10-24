// src/store/plans.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { API } from "@/services/api";
import type { Plan, UpdatePlanPayload } from "@/services/api.types";

export const usePlanStore = defineStore("plans", () => {
  const plans = ref<any[]>([]);

  async function loadPlans() {
    plans.value = await API.fetchPlans();
  }

  async function createPlan(planData: any) {
    const newPlan = await API.addPlan(planData);
    plans.value.push(newPlan);
  }

  async function updatePlan(id: number, data: UpdatePlanPayload) {
    const updated = await API.updatePlan(id, data);
    const i = plans.value.findIndex(p => p.id === id);
    if (i !== -1) plans.value[i] = updated;
    return updated;
  }

  async function removePlan(id: number) {
    await API.deletePlan(id);
    const i = plans.value.findIndex(p => p.id === id);
    if (i !== -1) plans.value.splice(i, 1);
  }

  return { plans, loadPlans, createPlan, updatePlan, removePlan };
});
