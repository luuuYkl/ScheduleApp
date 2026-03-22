import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Task } from "@/services/api.types";

/**
 * 专注模式 Store
 * 管理专注模式的全局状态，包括弹窗显示、任务选择等
 */
export const useFocusStore = defineStore("focus", () => {
  // ========== 状态 ==========
  
  /** 是否显示任务选择弹窗 */
  const showTaskSelector = ref(false);
  
  /** 选中的任务ID */
  const selectedTaskId = ref<number | null>(null);
  
  /** 今日任务列表（用于弹窗显示）*/
  const todayTasks = ref<Task[]>([]);
  
  // ========== 操作方法 ==========
  
  /**
   * 打开任务选择弹窗
   */
  function openTaskSelector() {
    showTaskSelector.value = true;
  }
  
  /**
   * 关闭任务选择弹窗
   */
  function closeTaskSelector() {
    showTaskSelector.value = false;
  }
  
  /**
   * 选择任务
   * @param taskId 任务ID
   */
  function selectTask(taskId: number) {
    selectedTaskId.value = taskId;
    closeTaskSelector();
  }
  
  /**
   * 清除选中的任务
   */
  function clearSelectedTask() {
    selectedTaskId.value = null;
  }
  
  /**
   * 设置今日任务列表
   * @param tasks 任务数组
   */
  function setTodayTasks(tasks: Task[]) {
    todayTasks.value = tasks;
  }
  
  // ========== 计算属性 ==========
  
  /** 是否有选中的任务 */
  const hasSelectedTask = computed(() => selectedTaskId.value !== null);
  
  // ========== 导出 ==========
  
  return {
    // 状态
    showTaskSelector,
    selectedTaskId,
    todayTasks,
    hasSelectedTask,
    
    // 操作方法
    openTaskSelector,
    closeTaskSelector,
    selectTask,
    clearSelectedTask,
    setTodayTasks,
  };
});