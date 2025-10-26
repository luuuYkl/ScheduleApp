import { describe, it, expect } from 'vitest'
import { generateDailyLog } from '../generate-log'
import type { Task } from '../api.types'

describe('generateDailyLog', () => {
  const mockTasks: Task[] = [
    {
      id: 1,
      plan_id: 1,
      user_id: 1,
      title: "学习 Vue 组件",
      task_date: "2025-10-25",
      status: "done"
    },
    {
      id: 2, 
      plan_id: 1,
      user_id: 1,
      title: "完成路由配置",
      task_date: "2025-10-25",
      status: "done"
    },
    {
      id: 3,
      plan_id: 1,
      user_id: 1,
      title: "编写单元测试",
      task_date: "2025-10-25",
      status: "pending"
    }
  ]

  it('should generate log with correct completion rate', async () => {
    const log = await generateDailyLog(1, mockTasks)
    
    // 验证日志结构完整性
    expect(log).toHaveProperty('id')
    expect(log).toHaveProperty('user_id', 1)
    expect(log).toHaveProperty('date')
    expect(log).toHaveProperty('content')
    expect(log).toHaveProperty('tasks_done', 2)
    expect(log).toHaveProperty('tasks_total', 3)
    
    // 验证完成率计算
    const completion = Math.round((log.tasks_done / log.tasks_total) * 100)
    expect(completion).toBe(67)
    
    // 验证日志内容包含已完成任务
    expect(log.content).toContain('学习 Vue 组件')
    expect(log.content).toContain('完成路由配置')
  })
})