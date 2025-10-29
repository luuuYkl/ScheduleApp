// src/store/plans.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { API } from "@/services/api";
import type { Plan, UpdatePlanPayload } from "@/services/api.types";
import type { Task, CreateTaskPayload, UpdateTaskPayload } from "@/services/api.types";

/*
  合并计划与任务的 store 实现（plans.ts）
  - 这个 store 同时管理 plans 和 tasks，两者共享同一个 pinia store（按你要求在同一文件实现）
  - 提供：load/create/update/remove plan
  - 提供：load/create/update/delete/toggle task
  - 提供辅助方法 getPlan(id)
*/

export const usePlanStore = defineStore("plans", () => {
  // 计划列表
  const plans = ref<any[]>([]);
  // 任务列表（可按需通过 loadTasks(planId) 加载特定计划的任务）
  const tasks = ref<any[]>([]);

  /* ----------------------- Plan 相关方法 ----------------------- */

  // 加载所有计划（从后端获取并替换本地缓存）
  async function loadPlans() {
    plans.value = await API.fetchPlans();
  }

  // 创建计划并追加到本地缓存
  async function createPlan(planData: any) {
    const newPlan = await API.addPlan(planData);
    plans.value.push(newPlan);
    return newPlan;
  }

  // 更新计划并同步本地缓存
  async function updatePlan(id: number, data: UpdatePlanPayload) {
    const updated = await API.updatePlan(id, data);
    const i = plans.value.findIndex((p) => p.id === id);
    if (i !== -1) plans.value[i] = updated;
    return updated;
  }

  // 删除计划并从本地缓存移除
  async function removePlan(id: number) {
    await API.deletePlan(id);
    const i = plans.value.findIndex((p) => p.id === id);
    if (i !== -1) plans.value.splice(i, 1);
  }

  // 获取单个计划的缓存对象（若无返回 null）
  function getPlan(id: number) {
    return plans.value.find((p) => p.id === id) ?? null;
  }

  /* ----------------------- Task 相关方法 ----------------------- */

  // 加载任务：如果传入 planId，则仅加载该计划的任务；否则加载全部任务
  async function loadTasks(planId?: number) {
    // 约定 API.fetchTasks 接收可选的 planId 参数
    tasks.value = await API.fetchTasks(planId);
    return tasks.value;
  }

  // 创建任务（payload 必须包含 user_id，参照 api.types.ts）
  async function createTask(payload: CreateTaskPayload) {
    const newTask = await API.createTask(payload);
    tasks.value.push(newTask);
    return newTask;
  }

  // 更新任务并同步本地缓存
  async function updateTask(id: number, data: UpdateTaskPayload) {
    const updated = await API.updateTask(id, data);
    const i = tasks.value.findIndex((t) => t.id === id);
    if (i !== -1) tasks.value[i] = updated;
    return updated;
  }

  // 删除任务并从本地缓存移除
  async function deleteTask(id: number) {
    await API.deleteTask(id);
    const i = tasks.value.findIndex((t) => t.id === id);
    if (i !== -1) tasks.value.splice(i, 1);
  }

  // 切换任务完成状态（done <-> pending），并更新后端与本地缓存
  // 同时触发日志生成
  async function toggleTaskStatus(id: number) {
    const t = tasks.value.find((x) => x.id === id);
    if (!t) return null;
    const newStatus = t.status === "done" ? "pending" : "done";
    const updated = await API.updateTask(id, { status: newStatus });
    const i = tasks.value.findIndex((x) => x.id === id);
    if (i !== -1) tasks.value[i] = updated;
    
    // 切换状态后，触发日志生成
    try {
      const { useLogStore } = await import("@/store/log");
      const { useUserStore } = await import("@/store/user");
      
      const logStore = useLogStore();
      const userStore = useUserStore();
      const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
      
      // 获取所有今天的任务来生成日志
      const today = new Date().toISOString().slice(0, 10);
      const todayTasks = tasks.value.filter(t => t.task_date === today);
      
      if (todayTasks.length > 0) {
        await logStore.generateTodayLog(userId, todayTasks);
        console.log("✅ 日志已自动生成/更新");
      }
    } catch (e) {
      console.warn("生成日志失败:", e);
      // 不阻断任务状态切换
    }
    
    return updated;
  }

  /* ----------------------- 导出 ----------------------- */
  return {
    // plans
    plans,
    loadPlans,
    createPlan,
    updatePlan,
    removePlan,
    getPlan,
    // tasks
    tasks,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
  };
});
