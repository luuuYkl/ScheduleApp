// src/store/tasks.ts
// 任务状态管理 - 处理任务的增删改查和状态切换

import { defineStore } from "pinia";
import { ref } from "vue";
import { API } from "@/services/api";
import type {
  Task,
  TaskStatus,
  CreateTaskPayload,
  UpdateTaskPayload,
} from "@/services/api.types";

/**
 * 任务 Store
 * 管理任务列表、任务操作和状态切换
 */
export const useTaskStore = defineStore("tasks", () => {
  // ========== 状态 ==========
  
  /** 任务列表 */
  const tasks = ref<Task[]>([]);
  
  /** 加载状态 */
  const loading = ref(false);
  
  /** 错误信息 */
  const error = ref<string | null>(null);

  // ========== 加载方法 ==========
  
  /**
   * 加载任务列表
   * @param planId 可选：按计划ID过滤任务
   */
  async function loadTasks(planId?: number) {
    loading.value = true;
    error.value = null;
    try {
      tasks.value = await API.fetchTasks(planId);
    } catch (e: any) {
      error.value = e?.message ?? "加载任务失败";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // ========== 辅助方法 ==========
  
  /**
   * 根据ID查找任务索引
   * @param id 任务ID
   * @returns 索引位置或 -1
   */
  function findIndexById(id: number) {
    return tasks.value.findIndex((t) => t.id === id);
  }

  // ========== CRUD 操作 ==========
  
  /**
   * 切换任务状态（内部方法）
   * @param taskId 任务ID
   */
  async function toggleStatus(taskId: number) {
    const t = tasks.value.find((x) => x.id === taskId);
    if (!t) return;
    const next: TaskStatus = t.status === "done" ? "pending" : "done";
    try {
      const updated = await API.updateTaskStatus?.(taskId, next);
      if (updated) {
        Object.assign(t, updated);
      } else {
        // 兜底：本地切换
        t.status = next;
      }
    } catch (e: any) {
      error.value = e?.message ?? "更新任务状态失败";
      throw e;
    }
  }

  /**
   * 创建新任务
   * @param payload 任务创建参数
   * @returns 创建的任务对象
   */
  async function createTask(payload: CreateTaskPayload) {
    error.value = null;
    try {
      const created = await API.createTask(payload);
      tasks.value.push(created);
      return created;
    } catch (e: any) {
      error.value = e?.message ?? "创建任务失败";
      throw e;
    }
  }

  /**
   * 更新任务信息
   * @param id 任务ID
   * @param payload 更新内容
   * @returns 更新后的任务对象
   */
  async function updateTask(id: number, payload: UpdateTaskPayload) {
    error.value = null;
    try {
      const updated = await API.updateTask(id, payload);
      const idx = findIndexById(id);
      if (idx > -1) tasks.value[idx] = updated;
      return updated;
    } catch (e: any) {
      error.value = e?.message ?? "更新任务失败";
      throw e;
    }
  }

  /**
   * 删除任务
   * @param id 任务ID
   */
  async function deleteTask(id: number) {
    error.value = null;
    try {
      await API.deleteTask(id);
      const idx = findIndexById(id);
      if (idx > -1) tasks.value.splice(idx, 1);
    } catch (e: any) {
      error.value = e?.message ?? "删除任务失败";
      throw e;
    }
  }

  /**
   * 切换任务状态（对外接口）
   * 完成/未完成切换，并自动触发日志生成
   * @param taskId 任务ID
   */
  async function toggleTaskStatus(taskId: number) {
    // 先切换状态
    await toggleStatus(taskId);
    
    // 切换成功后，自动生成当日日志
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
  }

  // ========== 兼容性别名 ==========
  
  /**
   * 删除任务（旧命名兼容）
   * @deprecated 请使用 deleteTask
   */
  async function removeTask(id: number) {
    return deleteTask(id);
  }

  // ========== 导出 ==========
  
  return {
    // 状态
    tasks,
    loading,
    error,

    // 加载方法
    loadTasks,

    // CRUD 操作
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,

    // 旧命名（兼容）
    toggleStatus,
    removeTask,
  };
});
