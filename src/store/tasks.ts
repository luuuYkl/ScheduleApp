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
   * 完成/未完成切换
   * 注意：日志生成已移至凌晨4点定时复盘时统一处理，不再在任务完成时触发
   * @param taskId 任务ID
   */
  async function toggleTaskStatus(taskId: number) {
    // 只切换状态，不触发日志生成
    await toggleStatus(taskId);
  }

  /**
   * 拆解任务：在指定日期创建一个独立副本
   * 原任务保持完全不变，不影响其他日期的相同任务
   * 用于 TimelineView 中任务的逐日拆解
   * @param taskId 原任务ID
   * @param activeDate 要拆解的日期
   */
  async function splitTask(taskId: number, activeDate: string) {
    const t = tasks.value.find((x) => x.id === taskId);
    if (!t) return;

    // 创建一个当天的独立副本
    // 原任务保持不变，确保其他日期的相同任务不受影响
    const payload: CreateTaskPayload = {
      plan_id: t.plan_id,
      user_id: t.user_id,
      title: t.title,
      start_date: activeDate,
      end_date: activeDate,
      start_time: t.start_time,
      end_time: t.end_time,
      status: 'pending',
      note: t.note,
      repeat_type: 'none',
      repeat_group_id: Date.now(),
    };
    await createTask(payload);
  }

async function splitAndToggleMultiDayTask(taskId: number, activeDate: string) {
    const t = tasks.value.find((x) => x.id === taskId);
    if (!t) return;

    const { start_date, end_date } = t;

    // 如果 activeDate 等于 start_date，只需缩小范围
    if (activeDate === start_date) {
      if (start_date === end_date) {
        // 单天任务，直接切换
        await toggleTaskStatus(taskId);
        return;
      }
      // 将 start_date 往后移一天
      const nextDay = new Date(start_date);
      nextDay.setDate(nextDay.getDate() + 1);
      const newStart = nextDay.toISOString().slice(0, 10);

      // 创建一个单天已完成任务
      const donePayload: CreateTaskPayload = {
        plan_id: t.plan_id,
        user_id: t.user_id,
        title: t.title,
        start_date: activeDate,
        end_date: activeDate,
        start_time: t.start_time,
        end_time: t.end_time,
        status: "done",
        note: t.note,
        repeat_type: "none",
        repeat_end_date: null,
      };
      await createTask(donePayload);
      // 更新原任务范围
      await updateTask(taskId, { start_date: newStart });
    } else if (activeDate === end_date) {
      // 将 end_date 往前移一天
      const prevDay = new Date(end_date);
      prevDay.setDate(prevDay.getDate() - 1);
      const newEnd = prevDay.toISOString().slice(0, 10);

      const donePayload: CreateTaskPayload = {
        plan_id: t.plan_id,
        user_id: t.user_id,
        title: t.title,
        start_date: activeDate,
        end_date: activeDate,
        start_time: t.start_time,
        end_time: t.end_time,
        status: "done",
        note: t.note,
        repeat_type: "none",
        repeat_end_date: null,
      };
      await createTask(donePayload);
      await updateTask(taskId, { end_date: newEnd });
    } else {
      // activeDate 在中间：拆为两段 + 一个已完成单天任务
      const prevDay = new Date(activeDate);
      prevDay.setDate(prevDay.getDate() - 1);
      const part1End = prevDay.toISOString().slice(0, 10);

      const nextDay = new Date(activeDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const part2Start = nextDay.toISOString().slice(0, 10);

      // 创建已完成单天任务
      const donePayload: CreateTaskPayload = {
        plan_id: t.plan_id,
        user_id: t.user_id,
        title: t.title,
        start_date: activeDate,
        end_date: activeDate,
        start_time: t.start_time,
        end_time: t.end_time,
        status: "done",
        note: t.note,
        repeat_type: "none",
        repeat_end_date: null,
      };
      await createTask(donePayload);

      // 创建后半段任务
      const part2Payload: CreateTaskPayload = {
        plan_id: t.plan_id,
        user_id: t.user_id,
        title: t.title,
        start_date: part2Start,
        end_date: end_date,
        start_time: t.start_time,
        end_time: t.end_time,
        note: t.note,
        repeat_type: "none",
        repeat_end_date: null,
      };
      await createTask(part2Payload);

      // 更新前半段（原任务）
      await updateTask(taskId, { end_date: part1End });
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
    splitTask,
    splitAndToggleMultiDayTask,

    // 旧命名（兼容）
    toggleStatus,
    removeTask,
  };
});
