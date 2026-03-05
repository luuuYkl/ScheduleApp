// src/config.ts
// 🌐 全局项目配置文件
// 用于管理 Mock/真实后端切换、环境配置、接口地址等。

export const APP_CONFIG = {
  /**
   * 🧩 模式开关
   * true  = 使用本地 Mock 数据（无需后端）
   * false = 使用真实后端 API
   */
  USE_MOCK: true,

  /**
   * 🔗 后端 API 地址配置
   */
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",

  /**
   * 📱 应用名称
   */
  APP_NAME: import.meta.env.VITE_APP_NAME || "智远日程",

  /**
   * 🔢 认证相关配置
   */
  AUTH: {
    TOKEN_KEY: "auth_token",
    USER_KEY: "user_info",
    REFRESH_TOKEN_KEY: "refresh_token",
  },

  /**
   * 📅 日期格式配置
   */
  DATE_FORMAT: {
    DISPLAY: "YYYY-MM-DD",
    TIME: "HH:mm",
    FULL: "YYYY-MM-DD HH:mm:ss",
  },

  /**
   * 🎨 主题配置
   */
  THEME: {
    PRIMARY_COLOR: "#3B82F6",
    DARK_MODE: false,
  },

  /**
   * ⚙️ 调试工具
   * true  = 控制台显示 Mock 数据请求日志
   * false = 关闭调试输出
   */
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true" || true,

  /**
   * 🤖 AI 功能配置
   * 用于日程优化建议功能
   */
  AI_ENABLED: import.meta.env.VITE_AI_ENABLED !== "false",
  AI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || "",
  AI_API_BASE_URL: import.meta.env.VITE_AI_API_BASE_URL || "https://api.deepseek.com/v1",
  AI_MODEL: import.meta.env.VITE_AI_MODEL || "deepseek-chat",
};