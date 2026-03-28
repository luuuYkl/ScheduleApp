// src/composables/useUserSettings.ts
// 用户偏好设置 composable — 集中管理提醒偏好和AI参与度，自动持久化到 localStorage

import { ref, watch, computed, type Ref } from 'vue'

// ========== 类型定义 ==========

/** 提前提醒时间选项（毫秒） */
export type ReminderAdvance = 5 | 10 | 15 | 30 | 60 | 1440

/** AI 参与程度 */
export type AILevel = 'minimal' | 'standard' | 'active'

/** 用户设置接口 */
export interface UserSettings {
  // ——— 提醒偏好 ———
  reminderEnabled: boolean
  reminderAdvanceMinutes: ReminderAdvance  // 提前提醒时间（分钟）
  reminderSoundEnabled: boolean
  dailyCheckinEnabled: boolean
  dailyCheckinTime: string                 // HH:mm
  weeklyReviewEnabled: boolean

  // ——— AI 参与度 ———
  aiEnabled: boolean
  aiLevel: AILevel
}

// ========== 常量 ==========

const STORAGE_KEY = 'user_settings'

const DEFAULT_SETTINGS: UserSettings = {
  // 提醒偏好
  reminderEnabled: true,
  reminderAdvanceMinutes: 30,
  reminderSoundEnabled: true,
  dailyCheckinEnabled: true,
  dailyCheckinTime: '20:00',
  weeklyReviewEnabled: true,

  // AI 参与度
  aiEnabled: true,
  aiLevel: 'standard',
}

// ========== 单例状态（跨组件共享） ==========

let settingsState: UserSettings | null = null

function loadFromStorage(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (e) {
    console.warn('[useUserSettings] 加载设置失败:', e)
  }
  return { ...DEFAULT_SETTINGS }
}

function saveToStorage(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn('[useUserSettings] 保存设置失败:', e)
  }
}

// ========== 非响应式快照（供 Service 层使用） ==========

/**
 * 获取当前设置的静态快照（非响应式）
 * 适用于不能使用 Vue 响应式系统的 Service 层
 */
export function getUserSettingsSnapshot(): UserSettings {
  if (settingsState) return { ...settingsState }
  return loadFromStorage()
}

/**
 * 快速判断 AI 功能是否启用（非响应式版本）
 */
export function isAIFeatureEnabledSync(feature: 'suggest' | 'analysis' | 'review' | 'smartReminder'): boolean {
  const settings = getUserSettingsSnapshot()
  if (!settings.aiEnabled) return false
  const level: AILevel = settings.aiLevel
  switch (feature) {
    case 'suggest':
      return true
    case 'analysis':
      return level === 'standard' || level === 'active'
    case 'review':
      return level === 'standard' || level === 'active'
    case 'smartReminder':
      return level === 'active'
    default:
      return false
  }
}

// ========== Composable ==========

export function useUserSettings() {
  // 延迟初始化单例
  if (!settingsState) {
    settingsState = loadFromStorage()
  }

  // 创建响应式引用（指向单例）
  const settings = ref({ ...settingsState }) as Ref<UserSettings>

  // 监听变化，自动持久化 + 同步到 ReminderService
  watch(
    settings,
    (newVal) => {
      settingsState = { ...newVal }
      saveToStorage(newVal)
      // 延迟导入避免循环依赖
      import('@/services/reminders').then(({ useReminders }) => {
        useReminders().syncWithUserSettings()
      }).catch(() => {/* 忽略导入失败 */})
    },
    { deep: true },
  )

  // ——— 计算属性：提前提醒时间（毫秒） ———
  const reminderAdvanceMs = computed(
    () => settings.value.reminderAdvanceMinutes * 60 * 1000,
  )

  // ——— AI 参与度说明 ———
  const aiLevelDescriptions: Record<AILevel, string> = {
    minimal: '仅在主动请求时提供建议',
    standard: '主动分析日志 + 自动复盘',
    active: '主动分析日志 + 自动复盘 + 智能提醒',
  }

  const aiLevelLabel = computed(() => {
    const labels: Record<AILevel, string> = {
      minimal: '最少',
      standard: '标准',
      active: '积极',
    }
    return labels[settings.value.aiLevel]
  })

  // ——— 提前提醒时间选项 ———
  const reminderAdvanceOptions: { value: ReminderAdvance; label: string }[] = [
    { value: 5, label: '5分钟' },
    { value: 10, label: '10分钟' },
    { value: 15, label: '15分钟' },
    { value: 30, label: '30分钟' },
    { value: 60, label: '1小时' },
    { value: 1440, label: '1天' },
  ]

  // ——— 方法 ———

  function updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    settings.value = { ...settings.value, [key]: value }
  }

  function resetToDefaults() {
    settings.value = { ...DEFAULT_SETTINGS }
  }

  /**
   * 根据 AI 参与度判断某个 AI 功能是否启用
   * @param feature 'suggest' | 'analysis' | 'review' | 'smartReminder'
   */
  function isAIFeatureEnabled(feature: 'suggest' | 'analysis' | 'review' | 'smartReminder'): boolean {
    if (!settings.value.aiEnabled) return false
    const level: AILevel = settings.value.aiLevel
    switch (feature) {
      case 'suggest':
        // 所有级别都有建议
        return true
      case 'analysis':
        // 标准 + 积极
        return level === 'standard' || level === 'active'
      case 'review':
        // 标准 + 积极
        return level === 'standard' || level === 'active'
      case 'smartReminder':
        // 仅积极
        return level === 'active'
      default:
        return false
    }
  }

  return {
    settings,
    reminderAdvanceMs,
    aiLevelLabel,
    aiLevelDescriptions,
    reminderAdvanceOptions,
    updateSetting,
    resetToDefaults,
    isAIFeatureEnabled,
  }
}