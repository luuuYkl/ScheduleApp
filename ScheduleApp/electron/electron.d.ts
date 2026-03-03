/**
 * Electron 类型定义
 */

declare module 'electron' {
  import { Component } from 'vue';
  
  interface BrowserWindow {
    loadURL(url: string): Promise<void>;
    loadFile(path: string): Promise<void>;
    webContents: {
      openDevTools(): void;
      setWindowOpenHandler(handler: (details: { url: string }) => { action: string }): void;
      on(event: string, listener: (...args: any[]) => void): void;
    };
    once(event: string, listener: () => void): void;
    show(): void;
  }
  
  interface App {
    whenReady(): Promise<void>;
    on(event: string, listener: () => void): void;
    quit(): void;
    isPackaged: boolean;
    getVersion(): string;
    getPath(name: string): string;
  }
  
  interface IpcMain {
    handle(channel: string, listener: (event: any, ...args: any[]) => Promise<any> | any): void;
    on(channel: string, listener: (event: any, ...args: any[]) => void): void;
  }
  
  interface IpcRenderer {
    invoke(channel: string, ...args: any[]): Promise<any>;
    on(channel: string, listener: (event: any, ...args: any[]) => void): void;
    send(channel: string, ...args: any[]): void;
  }
  
  interface ContextBridge {
    exposeInMainWorld(apiKey: string, api: any): void;
  }
  
  interface Shell {
    openExternal(url: string): Promise<void>;
  }
  
  export const app: App;
  export const ipcMain: IpcMain;
  export const ipcRenderer: IpcRenderer;
  export const contextBridge: ContextBridge;
  export const shell: Shell;
  export function BrowserWindow(options: {
    width: number;
    height: number;
    minWidth?: number;
    minHeight?: number;
    title?: string;
    icon?: string;
    webPreferences?: {
      nodeIntegration?: boolean;
      contextIsolation?: boolean;
      preload?: string;
      webSecurity?: boolean;
      devTools?: boolean;
    };
    frame?: boolean;
    backgroundColor?: string;
    show?: boolean;
  }): BrowserWindow;
}

// 全局类型扩展
declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      secureStorage: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<boolean>;
      };
      app: {
        getVersion: () => Promise<string>;
        getPath: (name: string) => Promise<string>;
      };
      system: {
        isElectron: boolean;
        isDev: boolean;
      };
    };
  }
}

export {};