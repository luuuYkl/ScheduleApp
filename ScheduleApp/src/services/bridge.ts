export type BridgeMethod =
  | "device.getInfo"
  | "app.getVersion"
  | "storage.secureSet"
  | "storage.secureGet"
  | "notification.scheduleLocal"
  | "notification.cancelLocal"
  | "storage.secureRemove"
  | "bridge.getCapabilities";

export interface BridgeRequest<TParams = Record<string, unknown>> {
  method: BridgeMethod;
  params: TParams;
  requestId: string;
}

export interface BridgeSuccess<TData = unknown> {
  ok: true;
  requestId: string;
  data: TData;
}

export interface BridgeFailure {
  ok: false;
  requestId: string;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type BridgeResponse<TData = unknown> =
  | BridgeSuccess<TData>
  | BridgeFailure;

interface NativeBridge {
  invoke: (request: BridgeRequest) => Promise<BridgeResponse>;
}

export interface BridgeCallEvent {
  method: BridgeMethod;
  requestId: string;
  durationMs: number;
  ok: boolean;
  errorCode?: string;
  usedFallback: boolean;
}

export interface BridgeRuntimeMetrics {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  fallbackCalls: number;
  timeoutCalls: number;
  internalErrorCalls: number;
  unsupportedCalls: number;
}

let bridgeTimeoutMs = 1500;
let bridgeEventObserver: ((event: BridgeCallEvent) => void) | null = null;
const runtimeMetrics: BridgeRuntimeMetrics = {
  totalCalls: 0,
  successCalls: 0,
  failedCalls: 0,
  fallbackCalls: 0,
  timeoutCalls: 0,
  internalErrorCalls: 0,
  unsupportedCalls: 0,
};

declare global {
  interface Window {
    ScheduleAppBridge?: NativeBridge;
  }
}

function createRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function failure(
  requestId: string,
  code: string,
  message: string,
): BridgeFailure {
  return {
    ok: false,
    requestId,
    error: { code, message },
  };
}

function notifyBridgeEvent(event: BridgeCallEvent) {
  bridgeEventObserver?.(event);
}

function trackMetrics(event: BridgeCallEvent) {
  runtimeMetrics.totalCalls += 1;
  if (event.ok) {
    runtimeMetrics.successCalls += 1;
  } else {
    runtimeMetrics.failedCalls += 1;
  }

  if (event.usedFallback) runtimeMetrics.fallbackCalls += 1;
  if (event.errorCode === "BRIDGE_TIMEOUT") runtimeMetrics.timeoutCalls += 1;
  if (event.errorCode === "BRIDGE_INTERNAL_ERROR")
    runtimeMetrics.internalErrorCalls += 1;
  if (
    event.errorCode === "BRIDGE_NOT_SUPPORTED" ||
    event.errorCode === "BRIDGE_METHOD_NOT_FOUND"
  ) {
    runtimeMetrics.unsupportedCalls += 1;
  }
}

async function invokeNative<TData>(
  request: BridgeRequest,
): Promise<BridgeResponse<TData>> {
  const startedAt = Date.now();
  const bridge = window.ScheduleAppBridge;

  if (!bridge?.invoke) {
    const result = failure(
      request.requestId,
      "BRIDGE_NOT_SUPPORTED",
      "native bridge not available",
    ) as BridgeResponse<TData>;
    const event: BridgeCallEvent = {
      method: request.method,
      requestId: request.requestId,
      durationMs: Date.now() - startedAt,
      ok: false,
      errorCode: "BRIDGE_NOT_SUPPORTED",
      usedFallback: false,
    };
    trackMetrics(event);
    notifyBridgeEvent(event);
    return result;
  }

  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<BridgeResponse<TData>>((resolve) => {
    timeoutId = window.setTimeout(() => {
      resolve(
        failure(
          request.requestId,
          "BRIDGE_TIMEOUT",
          `bridge call timed out after ${bridgeTimeoutMs}ms`,
        ) as BridgeResponse<TData>,
      );
    }, bridgeTimeoutMs);
  });

  try {
    const result = await Promise.race([
      bridge.invoke(request) as Promise<BridgeResponse<TData>>,
      timeoutPromise,
    ]);

    const event: BridgeCallEvent = {
      method: request.method,
      requestId: request.requestId,
      durationMs: Date.now() - startedAt,
      ok: result.ok,
      errorCode: result.ok ? undefined : result.error.code,
      usedFallback: false,
    };
    trackMetrics(event);
    notifyBridgeEvent(event);
    return result;
  } catch (error) {
    const result = failure(
      request.requestId,
      "BRIDGE_INTERNAL_ERROR",
      error instanceof Error ? error.message : "bridge invoke failed",
    ) as BridgeResponse<TData>;

    const event: BridgeCallEvent = {
      method: request.method,
      requestId: request.requestId,
      durationMs: Date.now() - startedAt,
      ok: false,
      errorCode: "BRIDGE_INTERNAL_ERROR",
      usedFallback: false,
    };
    trackMetrics(event);
    notifyBridgeEvent(event);
    return result;
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
}

let cachedCapabilities: Set<string> | null = null;

function shouldFallbackToWebStorage(code: string) {
  return code === "BRIDGE_NOT_SUPPORTED" || code === "BRIDGE_METHOD_NOT_FOUND";
}

export async function refreshBridgeCapabilities() {
  const result = await getBridgeCapabilities();
  if (result.ok) {
    cachedCapabilities = new Set(result.data);
  } else {
    cachedCapabilities = null;
  }
  return result;
}

export async function isBridgeMethodSupported(method: BridgeMethod) {
  if (!cachedCapabilities) {
    await refreshBridgeCapabilities();
  }
  return cachedCapabilities?.has(method) ?? false;
}

export async function getBridgeCapabilities() {
  const request: BridgeRequest = {
    method: "bridge.getCapabilities",
    params: {},
    requestId: createRequestId(),
  };
  return invokeNative<string[]>(request);
}

function reportFallback(
  method: BridgeMethod,
  requestId: string,
  errorCode: string,
) {
  const event: BridgeCallEvent = {
    method,
    requestId,
    durationMs: 0,
    ok: true,
    errorCode,
    usedFallback: true,
  };
  trackMetrics(event);
  notifyBridgeEvent(event);
}

export async function secureSet(key: string, value: string) {
  const request: BridgeRequest<{ key: string; value: string }> = {
    method: "storage.secureSet",
    params: { key, value },
    requestId: createRequestId(),
  };

  const native = await invokeNative<{ success: boolean }>(request);
  if (native.ok) return native;

  if (!shouldFallbackToWebStorage(native.error.code)) return native;

  localStorage.setItem(key, value);
  reportFallback(request.method, request.requestId, native.error.code);
  return {
    ok: true,
    requestId: request.requestId,
    data: { success: true },
  } as const;
}

export async function secureGet(key: string) {
  const request: BridgeRequest<{ key: string }> = {
    method: "storage.secureGet",
    params: { key },
    requestId: createRequestId(),
  };

  const native = await invokeNative<{ value: string | null }>(request);
  if (native.ok) return native;

  if (!shouldFallbackToWebStorage(native.error.code)) return native;

  reportFallback(request.method, request.requestId, native.error.code);
  return {
    ok: true,
    requestId: request.requestId,
    data: { value: localStorage.getItem(key) },
  } as const;
}

export async function secureRemove(key: string) {
  const request: BridgeRequest<{ key: string }> = {
    method: "storage.secureRemove",
    params: { key },
    requestId: createRequestId(),
  };

  const native = await invokeNative<{ success: boolean }>(request);
  if (native.ok) return native;

  if (!shouldFallbackToWebStorage(native.error.code)) return native;

  localStorage.removeItem(key);
  reportFallback(request.method, request.requestId, native.error.code);
  return {
    ok: true,
    requestId: request.requestId,
    data: { success: true },
  } as const;
}

export async function getDeviceInfo() {
  const request: BridgeRequest = {
    method: "device.getInfo",
    params: {},
    requestId: createRequestId(),
  };
  return invokeNative<{
    platform: string;
    osVersion?: string;
    appVersion?: string;
  }>(request);
}

export function clearBridgeCapabilityCache() {
  cachedCapabilities = null;
}

export function setBridgeTimeoutMs(timeoutMs: number) {
  bridgeTimeoutMs = Math.max(1, Math.floor(timeoutMs));
}

export function setBridgeEventObserver(
  observer: ((event: BridgeCallEvent) => void) | null,
) {
  bridgeEventObserver = observer;
}

export function getBridgeRuntimeMetrics(): BridgeRuntimeMetrics {
  return { ...runtimeMetrics };
}

export function resetBridgeRuntimeMetrics() {
  runtimeMetrics.totalCalls = 0;
  runtimeMetrics.successCalls = 0;
  runtimeMetrics.failedCalls = 0;
  runtimeMetrics.fallbackCalls = 0;
  runtimeMetrics.timeoutCalls = 0;
  runtimeMetrics.internalErrorCalls = 0;
  runtimeMetrics.unsupportedCalls = 0;
}

// ============ Electron 定时任务 API ============

// 扩展 Window 接口
declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      secureStorage: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<boolean>;
      };
      scheduler: {
        getCachedReview: () => Promise<any>;
        triggerReview: () => Promise<any>;
        getTasks: () => Promise<any[]>;
        updateTask: (taskId: string, updates: any) => Promise<boolean>;
        updateConfig: (config: any) => Promise<boolean>;
        saveUserData: (data: { tasks: any[]; schedules: any[]; userId: number }) => Promise<boolean>;
        onAIReviewComplete: (callback: (review: any) => void) => () => void;
      };
      system: {
        isElectron: boolean;
        isDev: boolean;
      };
    };
  }
}

/**
 * 检查是否在 Electron 环境中
 */
export function isElectron(): boolean {
  return !!window.electronAPI?.system?.isElectron;
}

/**
 * 获取缓存的AI复盘结果
 * 支持 Electron 后台任务和 Web 环境两种模式
 */
export async function getCachedAIReview(): Promise<any | null> {
  // Electron 环境：从主进程获取缓存
  if (window.electronAPI?.scheduler) {
    return window.electronAPI.scheduler.getCachedReview();
  }
  
  // Web 环境：从 localStorage 获取缓存
  try {
    const cachedData = localStorage.getItem("ai_daily_review");
    const cachedDate = localStorage.getItem("ai_review_date");
    
    if (cachedData && cachedDate) {
      const lastDate = new Date(cachedDate);
      const hoursDiff = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        return JSON.parse(cachedData);
      }
    }
  } catch (e) {
    console.error("[Bridge] 读取缓存失败:", e);
  }
  
  return null;
}

/**
 * 手动触发AI复盘
 */
export async function triggerAIReview(): Promise<any | null> {
  // Electron 环境：调用主进程
  if (window.electronAPI?.scheduler) {
    return window.electronAPI.scheduler.triggerReview();
  }
  
  // Web 环境：调用前端服务
  try {
    const { triggerManualReview } = await import("./ai-review");
    const { useTaskStore } = await import("@/store/tasks");
    const { useScheduleStore } = await import("@/store/schedules");
    
    const taskStore = useTaskStore();
    const scheduleStore = useScheduleStore();
    
    return triggerManualReview(
      taskStore.tasks || [],
      scheduleStore.schedules || [],
      "today"
    );
  } catch (e) {
    console.error("[Bridge] 触发复盘失败:", e);
    return null;
  }
}

/**
 * 获取定时任务列表
 */
export async function getScheduledTasks(): Promise<any[]> {
  if (window.electronAPI?.scheduler) {
    return window.electronAPI.scheduler.getTasks();
  }
  
  // Web 环境返回模拟数据
  return [
    {
      id: "ai-daily-review",
      name: "AI每日复盘",
      enabled: true,
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

/**
 * 更新定时任务配置
 */
export async function updateScheduledTask(
  taskId: string,
  updates: { enabled?: boolean }
): Promise<boolean> {
  if (window.electronAPI?.scheduler) {
    return window.electronAPI.scheduler.updateTask(taskId, updates);
  }
  
  // Web 环境不支持
  console.warn("[Bridge] Web环境不支持更新定时任务");
  return false;
}

/**
 * 更新服务器配置（为后续服务器接入预留）
 */
export async function updateSchedulerConfig(config: {
  apiBaseUrl?: string;
  useLocalExecution?: boolean;
}): Promise<boolean> {
  if (window.electronAPI?.scheduler) {
    return window.electronAPI.scheduler.updateConfig(config);
  }
  
  // Web 环境保存到 localStorage
  try {
    localStorage.setItem("scheduler_config", JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

/**
 * 保存用户数据（供后台任务读取）
 */
export async function saveUserDataForScheduler(data: {
  tasks: any[];
  schedules: any[];
  userId: number;
}): Promise<boolean> {
  if (window.electronAPI?.scheduler) {
    return window.electronAPI.scheduler.saveUserData(data);
  }
  
  // Web 环境：保存到 localStorage
  try {
    localStorage.setItem("user_data_for_scheduler", JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * 监听AI复盘完成事件
 */
export function onAIReviewComplete(
  callback: (review: any) => void
): () => void {
  if (window.electronAPI?.scheduler) {
    return window.electronAPI.scheduler.onAIReviewComplete(callback);
  }
  
  // Web 环境：返回空的清理函数
  return () => {};
}
