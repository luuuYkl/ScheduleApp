import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useLogStore } from '../log'

describe('LogStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('should load and save logs', async () => {
    const store = useLogStore()
    const userId = 1
    
    // 初始状态应为空
    expect(store.logs).toHaveLength(0)
    
    // 生成一条日志
    const mockTasks = [
      {
        id: 1,
        plan_id: 1,
        user_id: userId,
        title: "测试任务",
        task_date: "2025-10-25",
        status: "done"
      }
    ]
    
    const log = await store.generateTodayLog(userId, mockTasks)
    
    // 验证日志已保存
    expect(store.logs).toHaveLength(1)
    expect(store.logs[0]).toEqual(log)
    
    // 验证持久化存储
    const stored = localStorage.getItem(`logs_${userId}`)
    expect(stored).toBeTruthy()
    expect(JSON.parse(stored!)).toHaveLength(1)
  })
})