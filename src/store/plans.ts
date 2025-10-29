// src/store/plans.ts
// 计划和任务联合状态管理 - 同时处理计划和任务的 CRUD 操作

import { defineStore } from "pinia";
import { ref } from "vue";
import { API } from "@/services/api";
import type { Plan, UpdatePlanPayload } from "@/services/api.types";
import type { Task, CreateTaskPayload, UpdateTaskPayload } from "@/services/api.types";

/**
 * 计划 Store
 * 合并管理计划(Plan)和任务(Task)两个实体
 * - 计划：用户创建的习惯养成计划
 * - 任务：计划下的具体待办事项
 */
export const usePlanStore = defineStore("plans", () => {
  // ========== 状态 ==========
  
  /** 计划列表 */
  const plans = ref<any[]>([]);
  
  /** 任务列表（可按计划ID过滤） */
  const tasks = ref<any[]>([]);

  // ========== 计划管理 ==========

  /**
   * 加载所有计划
   * 从后端获取并替换本地缓存
   */
  async function loadPlans() {
    plans.value = await API.fetchPlans();
  }

  /**
   * 创建新计划
   * @param planData 计划数据
   * @returns 创建的计划对象
   */
  async function createPlan(planData: any) {
    const newPlan = await API.addPlan(planData);
    plans.value.push(newPlan);
    return newPlan;
  }

  /**
   * 更新计划信息
   * @param id 计划ID
   * @param data 更新内容
   * @returns 更新后的计划对象
   */
  async function updatePlan(id: number, data: UpdatePlanPayload) {
    const updated = await API.updatePlan(id, data);
    const i = plans.value.findIndex((p) => p.id === id);
    if (i !== -1) plans.value[i] = updated;
    return updated;
  }

  /**
   * 删除计划
   * @param id 计划ID
   */
  async function removePlan(id: number) {
    await API.deletePlan(id);
    const i = plans.value.findIndex((p) => p.id === id);
    if (i !== -1) plans.value.splice(i, 1);
  }

  /**
   * 获取单个计划的缓存对象
   * @param id 计划ID
   * @returns 计划对象或 null
   */
  function getPlan(id: number) {
    return plans.value.find((p) => p.id === id) ?? null;
  }

  // ========== 任务管理 ==========

  /**
   * 加载任务列表
   * @param planId 可选：按计划ID过滤任务
   * @returns 任务列表
   */
  async function loadTasks(planId?: number) {
    tasks.value = await API.fetchTasks(planId);
    return tasks.value;
  }

  /**
   * 创建新任务
   * @param payload 任务创建参数（必须包含 user_id）
   * @returns 创建的任务对象
   */
  async function createTask(payload: CreateTaskPayload) {
    const newTask = await API.createTask(payload);
    tasks.value.push(newTask);
    return newTask;
  }

  /**
   * 更新任务信息
   * @param id 任务ID
   * @param data 更新内容
   * @returns 更新后的任务对象
   */
  async function updateTask(id: number, data: UpdateTaskPayload) {
    const updated = await API.updateTask(id, data);
    const i = tasks.value.findIndex((t) => t.id === id);
    if (i !== -1) tasks.value[i] = updated;
    return updated;
  }

  /**
   * 删除任务
   * @param id 任务ID
   */
  async function deleteTask(id: number) {
    await API.deleteTask(id);
    const i = tasks.value.findIndex((t) => t.id === id);
    if (i !== -1) tasks.value.splice(i, 1);
  }

  /**
   * 切换任务完成状态
   * done <-> pending，并自动触发日志生成
   * @param id 任务ID
   * @returns 更新后的任务对象或 null
   */
  async function toggleTaskStatus(id: number) {
    const t = tasks.value.find((x) => x.id === id);
    if (!t) return null;
    
    // 切换状态
    const newStatus = t.status === "done" ? "pending" : "done";
    const updated = await API.updateTask(id, { status: newStatus });
    const i = tasks.value.findIndex((x) => x.id === id);
    if (i !== -1) tasks.value[i] = updated;
    
    // 自动生成当日日志
    try {
      const { useLogStore } = await import("@/store/log");
      const { useUserStore } = await import("@/store/user");
      
      const logStore = useLogStore();
      const userStore = useUserStore();
      const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
      
      // 筛选今天的任务
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

  // ========== 导出 ==========
  
  return {
    // 计划相关
    plans,
    loadPlans,
    createPlan,
    updatePlan,
    removePlan,
    getPlan,
    
    // 任务相关
    tasks,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
  };
});
