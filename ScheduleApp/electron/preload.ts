/**
 * Electron 预加载脚本
 * 在渲染进程中安全地暴露 Node.js API
 */
import { contextBridge, ipcRenderer } from 'electron';

// 定义暴露给渲染进程的 API
const electronAPI = {
  // 平台信息
  platform: process.platform,
  
  // 安全存储 API
  secureStorage: {
    get: (key: string): Promise<string | null> => 
      ipcRenderer.invoke('secure-storage:get', key),
    set: (key: string, value: string): Promise<boolean> => 
      ipcRenderer.invoke('secure-storage:set', key, value),
  },
  
  // 应用信息
  app: {
    getVersion: (): Promise<string> => 
      ipcRenderer.invoke('app:getVersion'),
    getPath: (name: string): Promise<string> => 
      ipcRenderer.invoke('app:getPath', name),
  },
  
  // 系统信息
  system: {
    isElectron: true,
    isDev: process.env.NODE_ENV === 'development',
  },
  
  // 定时任务 API
  scheduler: {
    // 获取缓存的AI复盘结果
    getCachedReview: (): Promise<any> => 
      ipcRenderer.invoke('scheduler:get-cached-review'),
    
    // 手动触发AI复盘
    triggerReview: (): Promise<any> => 
      ipcRenderer.invoke('scheduler:trigger-review'),
    
    // 获取定时任务列表
    getTasks: (): Promise<any[]> => 
      ipcRenderer.invoke('scheduler:get-tasks'),
    
    // 更新定时任务
    updateTask: (taskId: string, updates: any): Promise<boolean> => 
      ipcRenderer.invoke('scheduler:update-task', taskId, updates),
    
    // 更新服务器配置
    updateConfig: (config: any): Promise<boolean> => 
      ipcRenderer.invoke('scheduler:update-config', config),
    
    // 保存用户数据（供定时任务读取）
    saveUserData: (data: { tasks: any[]; schedules: any[]; userId: number }): Promise<boolean> => 
      ipcRenderer.invoke('scheduler:save-user-data', data),
    
    // 监听AI复盘完成事件
    onAIReviewComplete: (callback: (review: any) => void) => {
      const handler = (_event: any, review: any) => callback(review);
      ipcRenderer.on('ai-review-complete', handler);
      return () => ipcRenderer.removeListener('ai-review-complete', handler);
    },
  },
};

// 通过 contextBridge 安全地暴露 API
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型定义（供渲染进程使用）
export type ElectronAPI = typeof electronAPI;
