// src/store/tasks.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { API } from "@/services/api";
import type {
  Task,
  TaskStatus,
  CreateTaskPayload,
  UpdateTaskPayload,
} from "@/services/api.types";

export const useTaskStore = defineStore("tasks", () => {
  // ---------- state ----------
  const tasks = ref<Task[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ---------- loaders ----------
  /**
   * 加载任务列表（可选传 planId 过滤）
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

  // ---------- helpers ----------
  function findIndexById(id: number) {
    return tasks.value.findIndex((t) => t.id === id);
  }

  // ---------- mutations / actions ----------
  /**
   * （旧）切换状态方法：内部用于别名
   */
  async function toggleStatus(taskId: number) {
    const t = tasks.value.find((x) => x.id === taskId);
    if (!t) return;
    const next: TaskStatus = t.status === "done" ? "pending" : "done";
    try {
      const updated = await API.updateTaskStatus?.(taskId, next);
      // 若后端没有 updateTaskStatus，可在 api.ts 用 updateTask 兼容实现
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
   * 创建任务（页面期望的方法名）
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
   * 更新任务（页面期望的方法名）
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
   * 删除任务（页面期望的方法名）
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
   * 切换任务状态（页面期望的方法名，内部复用旧方法）
   */
  async function toggleTaskStatus(taskId: number) {
    return toggleStatus(taskId);
  }

  // ---------- 兼容别名（如果别的页面用了旧名字也能正常工作） ----------
  /** 别名：与旧页面保持兼容 */
  async function removeTask(id: number) {
    return deleteTask(id);
  }

  return {
    // state
    tasks,
    loading,
    error,

    // loaders
    loadTasks,

    // 新命名（页面当前使用）
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,

    // 旧命名（兼容）
    toggleStatus,
    removeTask,
  };
});
