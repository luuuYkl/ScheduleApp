// src/services/task-optimizer.ts
// 任务优化服务 - 根据AI建议优化任务安排

import type { Task, ScheduleItem } from "./api.types";

/**
 * 优化任务数量
 * 自动分析并调整明日任务，保留核心任务，移除或推迟低优先级任务
 * @param tasks 任务列表
 * @returns 优化后的任务列表
 */
export async function optimizeTaskQuantity(tasks: Task[]): Promise<{
  optimized: Task[];
  removed: number;
  postponed: number;
  message: string;
}> {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  // 筛选出明天的任务
  const tomorrowTasks = tasks.filter(t => 
    t.start_date <= tomorrowStr && t.end_date >= tomorrowStr && t.status !== 'done'
  );

  // 如果任务数量合理（6-8个），不需要优化
  if (tomorrowTasks.length <= 8) {
    return {
      optimized: tasks,
      removed: 0,
      postponed: 0,
      message: '当前任务数量合理，无需调整'
    };
  }

  // 深拷贝，避免直接修改 Store 数组
  const optimizedTasks = tasks.map(t => ({ ...t }));
  
  // 优先级评分
  const scoredTasks = tomorrowTasks.map(task => ({
    task,
    score: calculatePriorityScore(task)
  }));

  // 按分数排序，保留高优先级任务
  scoredTasks.sort((a, b) => b.score - a.score);

  const targetCount = 6; // 目标任务数量
  const lowPriorityTasks = scoredTasks.slice(targetCount);

  // 推迟低优先级任务到后天
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().slice(0, 10);

  let removed = 0;
  let postponed = 0;

  for (const item of lowPriorityTasks) {
    const taskIndex = optimizedTasks.findIndex(t => t.id === item.task.id);
    if (taskIndex !== -1) {
      if (item.task.repeat_type === 'none') {
        // 非重复任务，推迟到后天
        optimizedTasks[taskIndex] = {
          ...optimizedTasks[taskIndex],
          start_date: dayAfterTomorrowStr,
          end_date: dayAfterTomorrowStr
        };
        postponed++;
      } else {
        // 重复任务，从列表中移除（不修改原 Store）
        optimizedTasks.splice(taskIndex, 1);
        removed++;
      }
    }
  }

  return {
    optimized: optimizedTasks,
    removed,
    postponed,
    message: `已优化明日任务：保留 ${targetCount} 项核心任务，${postponed} 项推迟至后天，${removed} 项已移除`
  };
}

/**
 * 调整任务时间
 * 根据历史效率时段重排任务，将重要任务安排在高效时段
 * @param tasks 任务列表
 * @param efficiencyPeriods 高效时段（例如 ['09:00-11:00', '14:00-16:00']）
 * @returns 优化后的任务列表
 */
export async function rescheduleTasksByEfficiency(
  tasks: Task[],
  efficiencyPeriods: string[] = ['09:00-11:00', '14:00-16:00']
): Promise<{
  optimized: Task[];
  rescheduled: number;
  message: string;
}> {
  const today = new Date().toISOString().slice(0, 10);
  
  // 筛选出今天未完成的任务
  const todayTasks = tasks.filter(t => 
    t.start_date <= today && t.end_date >= today && t.status !== 'done' && t.start_time
  );

  if (todayTasks.length === 0) {
    return {
      optimized: tasks,
      rescheduled: 0,
      message: '暂无需要调整的任务'
    };
  }

  // 按优先级排序任务
  const prioritizedTasks = todayTasks
    .map(task => ({
      task,
      priority: calculatePriorityScore(task)
    }))
    .sort((a, b) => b.priority - a.priority);

  // 解析高效时段
  const slots = efficiencyPeriods.map(period => {
    const [start, end] = period.split('-');
    return { start, end };
  });

  // 深拷贝，避免直接修改 Store 数组
  const optimizedTasks = tasks.map(t => ({ ...t }));
  let rescheduledCount = 0;

  // 将高优先级任务安排在高效时段的开头
  for (let i = 0; i < Math.min(prioritizedTasks.length, slots.length); i++) {
    const { task } = prioritizedTasks[i];
    const slot = slots[i];

    const taskIndex = optimizedTasks.findIndex(t => t.id === task.id);
    if (taskIndex !== -1) {
      // 从时段开头开始安排，默认1小时
      const [startHour, startMinute] = slot.start.split(':').map(Number);
      const endHour = startHour + 1;
      const endMinute = startMinute;

      optimizedTasks[taskIndex] = {
        ...optimizedTasks[taskIndex],
        start_time: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
        end_time: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
      };
      rescheduledCount++;
    }
  }

  return {
    optimized: optimizedTasks,
    rescheduled: rescheduledCount,
    message: `已将 ${rescheduledCount} 项重要任务调整至高效时段：${efficiencyPeriods.join('、')}`
  };
}

/**
 * 添加休息提醒
 * 为长时间工作添加休息提醒
 * @param tasks 任务列表
 * @param interval 休息间隔（分钟，默认120分钟）
 * @returns 包含提醒的日程列表
 */
export async function addRestReminders(
  tasks: Task[],
  interval: number = 120
): Promise<{
  schedules: ScheduleItem[];
  added: number;
  message: string;
}> {
  const today = new Date().toISOString().slice(0, 10);
  const reminders: ScheduleItem[] = [];

  // 筛选出今天有时间的任务
  const todayTasks = tasks.filter(t => 
    t.start_date <= today && t.end_date >= today && 
    t.start_time && t.end_time && t.status !== 'done'
  );

  if (todayTasks.length < 2) {
    return {
      schedules: reminders,
      added: 0,
      message: '今日任务较少，暂无需添加休息提醒'
    };
  }

  // 按开始时间排序
  todayTasks.sort((a, b) => a.start_time!.localeCompare(b.start_time!));

  // 计算任务之间的间隔，如果超过指定时间则添加休息提醒
  for (let i = 0; i < todayTasks.length - 1; i++) {
    const current = todayTasks[i];
    const next = todayTasks[i + 1];

    const [currentEndHour, currentEndMinute] = current.end_time!.split(':').map(Number);
    const [nextStartHour, nextStartMinute] = next.start_time!.split(':').map(Number);

    const currentEndMinutes = currentEndHour * 60 + currentEndMinute;
    const nextStartMinutes = nextStartHour * 60 + nextStartMinute;
    const gapMinutes = nextStartMinutes - currentEndMinutes;

    // 如果间隔超过阈值，添加休息提醒
    if (gapMinutes >= interval) {
      // 使用分钟计算避免溢出
      const reminderStartMinutes = currentEndMinutes + 10; // 任务结束后10分钟
      const reminderStartHour = Math.floor(reminderStartMinutes / 60);
      const reminderStartMin = reminderStartMinutes % 60;
      
      const reminderEndMinutes = reminderStartMinutes + 15; // 休息15分钟
      const reminderEndHour = Math.floor(reminderEndMinutes / 60);
      const reminderEndMin = reminderEndMinutes % 60;

      reminders.push({
        id: Date.now() + i,
        user_id: 1, // 从当前用户获取
        title: '休息提醒',
        description: '工作一段时间了，记得站起来活动一下，喝杯水，放松眼睛',
        date: today,
        start_time: `${String(reminderStartHour).padStart(2, '0')}:${String(reminderStartMin).padStart(2, '0')}`,
        end_time: `${String(reminderEndHour).padStart(2, '0')}:${String(reminderEndMin).padStart(2, '0')}`,
        completed: false,
        created_at: new Date().toISOString()
      });
    }
  }

  return {
    schedules: reminders,
    added: reminders.length,
    message: `已添加 ${reminders.length} 个休息提醒，每工作 ${interval} 分钟休息一次`
  };
}

/**
 * 计算任务优先级分数
 * @param task 任务对象
 * @returns 优先级分数（0-100）
 */
function calculatePriorityScore(task: Task): number {
  let score = 50; // 基础分数

  // 1. 根据任务标题关键词加分
  const keywords = ['重要', '紧急', '核心', '关键', '优先', '重要任务', 'urgent', 'important'];
  const titleLower = task.title.toLowerCase();
  const keywordMatches = keywords.filter(kw => titleLower.includes(kw.toLowerCase()));
  score += keywordMatches.length * 10;

  // 2. 根据任务时长加分（短任务优先）
  if (task.start_time && task.end_time) {
    const [startHour, startMinute] = task.start_time.split(':').map(Number);
    const [endHour, endMinute] = task.end_time.split(':').map(Number);
    const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    
    if (duration <= 60) score += 15; // 1小时内任务
    else if (duration <= 120) score += 10; // 2小时内任务
    else score -= 10; // 超长任务降低优先级
  }

  // 3. 根据重复类型加分（日常任务优先）
  if (task.repeat_type === 'daily') score += 5;
  else if (task.repeat_type === 'weekly') score += 3;

  // 4. 根据截止日期加分（今天或明天截止的优先）
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  if (task.end_date === today) score += 20;
  else if (task.end_date === tomorrowStr) score += 10;

  // 限制分数在0-100之间
  return Math.max(0, Math.min(100, score));
}

/**
 * 智能优化所有任务
 * 综合调用所有优化策略
 * @param tasks 任务列表
 * @returns 优化结果
 */
export async function smartOptimizeAll(tasks: Task[]): Promise<{
  tasks: Task[];
  schedules: ScheduleItem[];
  optimizations: {
    taskQuantity: { removed: number; postponed: number; message: string };
    taskReschedule: { rescheduled: number; message: string };
    restReminders: { added: number; message: string };
  };
}> {
  const result = {
    tasks: [...tasks],
    schedules: [] as ScheduleItem[],
    optimizations: {
      taskQuantity: { removed: 0, postponed: 0, message: '' },
      taskReschedule: { rescheduled: 0, message: '' },
      restReminders: { added: 0, message: '' }
    }
  };

  // 1. 优化任务数量
  const quantityResult = await optimizeTaskQuantity(result.tasks);
  result.tasks = quantityResult.optimized;
  result.optimizations.taskQuantity = {
    removed: quantityResult.removed,
    postponed: quantityResult.postponed,
    message: quantityResult.message
  };

  // 2. 调整任务时间
  const rescheduleResult = await rescheduleTasksByEfficiency(result.tasks);
  result.tasks = rescheduleResult.optimized;
  result.optimizations.taskReschedule = {
    rescheduled: rescheduleResult.rescheduled,
    message: rescheduleResult.message
  };

  // 3. 添加休息提醒
  const reminderResult = await addRestReminders(result.tasks);
  result.schedules = reminderResult.schedules;
  result.optimizations.restReminders = {
    added: reminderResult.added,
    message: reminderResult.message
  };

  return result;
}