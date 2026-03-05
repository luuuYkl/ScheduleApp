/**
 * Electron 主进程入口
 * 负责创建窗口、管理应用生命周期、后台定时任务
 */
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { schedulerService } from './scheduler';

// 判断是否为开发模式
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 判断是否使用字节码
const useBytecode = app.isPackaged;

/**
 * 字节码加载器
 * 在生产环境中加载编译后的 .jsc 文件
 */
function loadBytecodeModule(modulePath: string) {
  try {
    const bytenode = require('bytenode');
    const jscPath = modulePath.replace(/\.js$/, '.jsc');
    if (fs.existsSync(jscPath)) {
      return bytenode.runBytecodeFile(jscPath);
    }
    return require(modulePath);
  } catch (error) {
    console.error(`Failed to load module: ${modulePath}`, error);
    return null;
  }
}

/**
 * 创建主窗口
 */
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'ScheduleApp - 日程管理',
    icon: path.join(__dirname, '../public/vite.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      // 禁用开发者工具在生产环境
      devTools: isDev,
    },
    // 窗口外观
    frame: true,
    backgroundColor: '#ffffff',
    show: false, // 先隐藏，加载完成后显示
  });

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 加载应用
  if (isDev) {
    // 开发模式：加载 Vite 开发服务器
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：加载构建后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 外部链接用默认浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // 禁用导航到外部URL
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost') && !url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  return mainWindow;
}

// 应用准备就绪
app.whenReady().then(() => {
  const mainWindow = createWindow();
  
  // 初始化定时任务服务
  schedulerService.setMainWindow(mainWindow);
  schedulerService.startAll();
  console.log('[Main] 定时任务服务已启动');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWindow = createWindow();
      schedulerService.setMainWindow(newWindow);
    }
  });
});

// 所有窗口关闭时退出（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 安全：禁止新窗口创建
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// IPC 处理 - 安全存储相关
ipcMain.handle('secure-storage:get', async (_event, key: string) => {
  // 这里可以调用字节码编译的 secure-storage 模块
  // 加密的存储逻辑
  const store = app.getPath('userData');
  const storagePath = path.join(store, 'secure-storage.json');
  try {
    if (fs.existsSync(storagePath)) {
      const data = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
      return data[key];
    }
  } catch {
    return null;
  }
  return null;
});

ipcMain.handle('secure-storage:set', async (_event, key: string, value: string) => {
  const store = app.getPath('userData');
  const storagePath = path.join(store, 'secure-storage.json');
  try {
    let data: Record<string, string> = {};
    if (fs.existsSync(storagePath)) {
      data = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
    }
    data[key] = value;
    fs.writeFileSync(storagePath, JSON.stringify(data), 'utf-8');
    return true;
  } catch {
    return false;
  }
});

// IPC 处理 - 定时任务相关
// 获取缓存的AI复盘结果
ipcMain.handle('scheduler:get-cached-review', async () => {
  return schedulerService.getCachedReview();
});

// 手动触发AI复盘
ipcMain.handle('scheduler:trigger-review', async () => {
  return schedulerService.triggerReview();
});

// 获取定时任务列表
ipcMain.handle('scheduler:get-tasks', async () => {
  return schedulerService.getTasks();
});

// 更新定时任务
ipcMain.handle('scheduler:update-task', async (_event, taskId: string, updates: any) => {
  return schedulerService.updateTask(taskId, updates);
});

// 更新服务器配置
ipcMain.handle('scheduler:update-config', async (_event, config: any) => {
  schedulerService.updateConfig(config);
  return true;
});

// 保存用户数据（供定时任务读取）
ipcMain.handle('scheduler:save-user-data', async (_event, data: { tasks: any[]; schedules: any[]; userId: number }) => {
  const store = app.getPath('userData');
  const dataPath = path.join(store, 'user-data.json');
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[Main] 保存用户数据失败:', error);
    return false;
  }
});

// 应用信息
console.log('ScheduleApp Electron v' + app.getVersion());
console.log('Running in:', isDev ? 'development' : 'production', 'mode');