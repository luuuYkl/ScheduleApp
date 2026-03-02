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
};

// 通过 contextBridge 安全地暴露 API
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型定义（供渲染进程使用）
export type ElectronAPI = typeof electronAPI;