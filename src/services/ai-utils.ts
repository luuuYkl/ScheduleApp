/**
 * src/services/ai-utils.ts
 * AI 通用工具模块 — 统一 JSON 解析、SSE 流处理、请求客户端、日志管理
 */

import { APP_CONFIG } from "@/config";

// ────────────────────────────────────────────
// 1. 条件化日志
// ────────────────────────────────────────────

/** AI 模块专用 logger，仅在 DEBUG_MODE 下输出 */
export const aiLogger = {
  log(...args: any[]) {
    if (APP_CONFIG.DEBUG_MODE) {
      console.log("[AI]", ...args);
    }
  },
  warn(...args: any[]) {
    if (APP_CONFIG.DEBUG_MODE) {
      console.warn("[AI]", ...args);
    }
  },
  error(...args: any[]) {
    // error 始终输出
    console.error("[AI]", ...args);
  },
};

// ────────────────────────────────────────────
// 2. 统一 JSON 解析（5 步降级策略）
// ────────────────────────────────────────────

/**
 * 找到最后一个完整的 JSON 分隔符（逗号、左花括号、左方括号）的位置
 * 忽略字符串内的分隔符
 */
function findLastCompleteSeparator(json: string): number {
  let inString = false;
  let escapeNext = false;
  let lastIdx = -1;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === "\\") { escapeNext = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "," || ch === "{" || ch === "[") {
      lastIdx = i;
    }
  }
  return lastIdx;
}

/**
 * 从 AI 响应文本中提取 JSON 对象
 * 依次尝试：直接解析 → 清理 Markdown → 提取大括号 → 修复常见问题 → 修复截断
 */
export function parseAIJSON<T = Record<string, any>>(
  content: string,
): T | null {
  aiLogger.log("解析开始，原始长度:", content.length);

  const tryParse = (text: string, label: string): T | null => {
    try {
      const result = JSON.parse(text) as T;
      aiLogger.log(`✅ ${label} 解析成功`);
      return result;
    } catch (e: any) {
      aiLogger.log(`❌ ${label} 解析失败:`, e?.message);
      return null;
    }
  };

  // 步骤 1：直接解析
  let parsed = tryParse(content, "步骤1-直接解析");
  if (parsed) return parsed;

  // 步骤 2：清理 Markdown 代码块标记
  let cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/gm, "")
    .replace(/```$/gm, "")
    .replace(/```/g, "")
    .trim();

  parsed = tryParse(cleaned, "步骤2-清理Markdown");
  if (parsed) return parsed;

  // 步骤 3：提取首尾大括号之间的 JSON
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    parsed = tryParse(jsonMatch[0], "步骤3-提取JSON");
    if (parsed) return parsed;
  }

  // 步骤 4：修复常见 JSON 问题
  if (jsonMatch) {
    const fixed = jsonMatch[0]
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/:\s*undefined/g, ": null");
    parsed = tryParse(fixed, "步骤4-修复常见问题");
    if (parsed) return parsed;
  }

  // 步骤 5：修复截断的 JSON（补全未闭合的结构）
  if (jsonMatch) {
    try {
      let toFix = jsonMatch[0];

      // 先尝试统计括号状态，判断 JSON 是否截断
      let openBraces = 0;
      let openBrackets = 0;
      let inString = false;
      let escapeNext = false;

      for (let i = 0; i < toFix.length; i++) {
        const ch = toFix[i];
        if (escapeNext) { escapeNext = false; continue; }
        if (ch === "\\") { escapeNext = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === "{") openBraces++;
        if (ch === "}") openBraces--;
        if (ch === "[") openBrackets++;
        if (ch === "]") openBrackets--;
      }

      // 如果正在字符串内，说明 JSON 在字符串值中间截断
      if (inString) {
        // 策略 A：直接关闭字符串，然后补全括号
        const fixA = toFix + '"';
        let obA = 0, obrA = 0, inSA = false, escA = false;
        for (let i = 0; i < fixA.length; i++) {
          const ch = fixA[i];
          if (escA) { escA = false; continue; }
          if (ch === "\\") { escA = true; continue; }
          if (ch === '"') { inSA = !inSA; continue; }
          if (inSA) continue;
          if (ch === "{") obA++;
          if (ch === "}") obA--;
          if (ch === "[") obrA++;
          if (ch === "]") obrA--;
        }
        let resultA = fixA;
        if (obrA > 0) resultA += "]".repeat(obrA);
        if (obA > 0) resultA += "}".repeat(obA);
        resultA = resultA.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
        parsed = tryParse(resultA, "步骤5a-关闭截断字符串");
        if (parsed) return parsed;

        // 策略 B：移除最后一个不完整的 key:value 对（更激进）
        // 找到最后一个完整的逗号或左花括号/方括号（不在字符串内的）
        const lastCompleteIdx = findLastCompleteSeparator(toFix);
        if (lastCompleteIdx > 0) {
          let fixB = toFix.substring(0, lastCompleteIdx);
          let obB = 0, obrB = 0, inSB = false, escB = false;
          for (let i = 0; i < fixB.length; i++) {
            const ch = fixB[i];
            if (escB) { escB = false; continue; }
            if (ch === "\\") { escB = true; continue; }
            if (ch === '"') { inSB = !inSB; continue; }
            if (inSB) continue;
            if (ch === "{") obB++;
            if (ch === "}") obB--;
            if (ch === "[") obrB++;
            if (ch === "]") obrB--;
          }
          if (obrB > 0) fixB += "]".repeat(obrB);
          if (obB > 0) fixB += "}".repeat(obB);
          fixB = fixB.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
          parsed = tryParse(fixB, "步骤5b-移除不完整键值");
          if (parsed) return parsed;
        }
      }

      // 非字符串内截断：直接补全括号
      if (openBrackets > 0) toFix += "]".repeat(openBrackets);
      if (openBraces > 0) toFix += "}".repeat(openBraces);
      toFix = toFix.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
      parsed = tryParse(toFix, "步骤5c-补全括号");
      if (parsed) return parsed;
    } catch {
      // 忽略修复异常
    }
  }

  aiLogger.error("JSON 解析完全失败，内容前 200 字符:", content.substring(0, 200));
  return null;
}

// ────────────────────────────────────────────
// 3. 统一 AI 请求客户端
// ────────────────────────────────────────────

/** 非流式请求结果 */
export interface AIRequestResult {
  ok: boolean;
  status: number;
  statusText: string;
  text: string;
}

/** 请求选项 */
export interface AIRequestOptions {
  /** 请求标签（用于日志） */
  label: string;
  /** 超时毫秒数，默认 30000 */
  timeout?: number;
  /** 重试次数，默认 1 */
  retries?: number;
  /** AbortSignal（用于取消） */
  signal?: AbortSignal;
  /** 是否为流式请求 */
  stream?: boolean;
}

/** 默认超时 30 秒 */
const DEFAULT_TIMEOUT = 30_000;
/** 默认重试 1 次 */
const DEFAULT_RETRIES = 1;

/**
 * 发送非流式 AI 请求
 * 内置超时、重试、错误日志
 */
export async function sendAIRequest(
  body: Record<string, any>,
  options: AIRequestOptions,
): Promise<AIRequestResult> {
  const {
    label,
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    signal: externalSignal,
  } = options;

  const url = `${APP_CONFIG.AI_API_BASE_URL}/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${APP_CONFIG.AI_API_KEY}`,
  };

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // 每次尝试创建独立的 AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // 如果外部 signal 也触发了取消，则中止
    const onExternalAbort = () => controller.abort();
    externalSignal?.addEventListener("abort", onExternalAbort);

    try {
      aiLogger.log(`${label} 请求 (尝试 ${attempt + 1}/${retries + 1})`);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const text = await response.text();

      if (!response.ok) {
        aiLogger.error(`${label} 失败:`, response.status, response.statusText, text);
        // 400 不重试（可能是 payload 格式问题）
        if (response.status === 400) {
          return {
            ok: false,
            status: response.status,
            statusText: response.statusText,
            text,
          };
        }
        lastError = { status: response.status, statusText: response.statusText, text };
        continue; // 重试
      }

      return {
        ok: true,
        status: response.status,
        statusText: response.statusText,
        text,
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        aiLogger.warn(`${label} 请求被取消或超时`);
        return {
          ok: false,
          status: 0,
          statusText: "ABORTED",
          text: "",
        };
      }
      lastError = error;
      aiLogger.warn(`${label} 请求异常 (尝试 ${attempt + 1}):`, error?.message);
    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener("abort", onExternalAbort);
    }
  }

  aiLogger.error(`${label} 所有重试失败:`, lastError?.message);
  return {
    ok: false,
    status: lastError?.status ?? 0,
    statusText: lastError?.statusText ?? lastError?.message ?? "",
    text: lastError?.text ?? "",
  };
}

// ────────────────────────────────────────────
// 4. 统一 SSE 流读取器
// ────────────────────────────────────────────

/** 流式请求的空闲超时（毫秒）：每个 chunk 之间的最大等待时间 */
const STREAM_IDLE_TIMEOUT = 60_000;
/** 流式请求的总超时上限（毫秒）：防止永远挂起 */
const STREAM_MAX_TIMEOUT = 5 * 60_000;

/**
 * 发送流式 AI 请求，逐 chunk yield 内容
 * 自动处理 SSE 格式（data: ... \n\n）
 * 使用空闲超时（每收到一个 chunk 重置）而非总超时
 */
export async function* streamAIRequest(
  body: Record<string, any>,
  options: AIRequestOptions = { label: "stream" },
): AsyncGenerator<string, void, unknown> {
  const url = `${APP_CONFIG.AI_API_BASE_URL}/chat/completions`;
  const { signal: externalSignal } = options;

  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onExternalAbort);

  // 空闲超时：每次收到 chunk 重置
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      aiLogger.warn(`${options.label} 空闲超时（${STREAM_IDLE_TIMEOUT / 1000}s 无数据），中止流`);
      controller.abort();
    }, STREAM_IDLE_TIMEOUT);
  };

  // 总超时上限：绝对不能超过的时间
  const maxTimer = setTimeout(() => {
    aiLogger.warn(`${options.label} 达到总超时上限（${STREAM_MAX_TIMEOUT / 1000}s），中止流`);
    controller.abort();
  }, STREAM_MAX_TIMEOUT);

  try {
    // 连接阶段使用较短的超时
    resetIdleTimer();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${APP_CONFIG.AI_API_KEY}`,
      },
      body: JSON.stringify({ ...body, stream: true }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      aiLogger.error(`${options.label} 流式请求失败:`, response.status, errorText);
      throw new Error(`AI 流式请求失败: ${response.status}`);
    }

    if (!response.body) throw new Error("响应体为空");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 每收到数据就重置空闲计时器
      resetIdleTimer();

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // 忽略单行解析错误
        }
      }
    }
  } finally {
    if (idleTimer) clearTimeout(idleTimer);
    clearTimeout(maxTimer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

// ────────────────────────────────────────────
// 5. 简易 AI 响应缓存
// ────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expire: number;
}

const aiCache = new Map<string, CacheEntry<any>>();

/**
 * 带缓存的 AI 调用
 * @param key 缓存键（建议用 hash 或输入摘要）
 * @param fetcher 实际获取数据的函数
 * @param ttl 缓存存活时间（毫秒），默认 5 分钟
 */
export async function cachedAICall<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000,
): Promise<T> {
  const cached = aiCache.get(key);
  if (cached && Date.now() < cached.expire) {
    aiLogger.log("缓存命中:", key);
    return cached.data;
  }

  const data = await fetcher();
  aiCache.set(key, { data, expire: Date.now() + ttl });
  return data;
}

/** 清除所有 AI 缓存 */
export function clearAICache(): void {
  aiCache.clear();
}

// ────────────────────────────────────────────
// 6b. AI 请求去重（相同请求复用 Promise）
// ────────────────────────────────────────────

const pendingRequests = new Map<string, Promise<any>>();

/**
 * 去重执行 AI 请求 — 相同 key 的请求在 pending 期间复用 Promise
 * @param key 请求唯一标识（如功能名+输入hash）
 * @param fetcher 实际请求函数
 * @returns 请求结果
 */
export function deduplicatedAICall<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const pending = pendingRequests.get(key);
  if (pending) {
    aiLogger.log("请求去重，复用 pending:", key);
    return pending;
  }

  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

/** 取消指定的 pending 请求（下次调用将发起新请求） */
export function cancelPendingRequest(key: string): void {
  pendingRequests.delete(key);
}

// ────────────────────────────────────────────
// 6. AI 可用性检查
// ────────────────────────────────────────────

/** 检查 AI 功能是否可用（配置级别） */
export function isAIAvailable(): boolean {
  return APP_CONFIG.AI_ENABLED && !!APP_CONFIG.AI_API_KEY;
}

// ────────────────────────────────────────────
// 7. 从 AI 非流式响应中提取 content 字段
// ────────────────────────────────────────────

/**
 * 从 OpenAI 兼容的 API 响应 JSON 字符串中提取 content
 */
export function extractContentFromResponse(responseText: string): string {
  try {
    const data = JSON.parse(responseText);
    return data.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}