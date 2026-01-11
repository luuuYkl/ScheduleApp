// src/config.ts
// 🌐 全局项目配置文件
// 用于管理 Mock/真实后端切换、环境配置、接口地址等。

// 扩展 ImportMeta 类型以包含环境变量
declare global {
  interface ImportMeta {
    env: Record<string, any>;
  }
}

export const APP_CONFIG = {
  /**
   * 🧩 模式开关
   * true  = 使用本地 Mock 数据（无需后端）
   * false = 使用真实后端 API（Axios 调用 MySQL 后端）
   */
  USE_MOCK_API: true,

  /**
   * 🌐 后端接口基础地址（仅在 USE_MOCK_API = false 时生效）
   */
  BASE_URL: "http://localhost:3000/api",

  /**
   * 🧠 项目信息
   */
  APP_NAME: "能适应型日程管理 App",
  APP_VERSION: "0.9.0-MVP", // MVP 阶段版本号

  /**
   * 🪄 界面显示设置
   */
  THEME_COLOR: "#3B82F6",  // 默认主色调（蓝色）
  DARK_MODE: false,        // 默认不开启暗色模式

  /**
   * ⚙️ 调试工具
   * true  = 控制台显示 Mock 数据请求日志
   * false = 关闭调试输出
   */
  DEBUG_MODE: true,

  /**
   * 🤖 AI 功能配置
   * 用于日程优化建议功能
   */
  AI_ENABLED: true, // 启用 AI 功能
  AI_API_KEY: "", // OpenAI API Key，通过 .env.local 配置
  AI_API_BASE_URL: "https://api.deepseek.com/v1", // DeepSeek API 基础地址
  AI_MODEL: "deepseek-chat", // DeepSeek 模型名称
};

// 在运行时从环境变量加载配置
export function loadEnvConfig() {
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    APP_CONFIG.AI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  }
  if (import.meta.env.VITE_OPENAI_BASE_URL) {
    APP_CONFIG.AI_API_BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL;
  }
}

// 应用启动时自动加载
loadEnvConfig();
