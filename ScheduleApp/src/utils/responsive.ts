/**
 * PC端全屏自适应缩放工具
 * 基于 1920px 设计稿，使用 CSS transform: scale() 实现等比例缩放
 * 所有尺寸使用统一布局，通过 scale 缩放适配
 */

/**
 * 响应式配置
 */
export const RESPONSIVE_CONFIG = {
  /** 设计稿基准宽度 */
  BASE_WIDTH: 1920,
  /** 设计稿基准高度 */
  BASE_HEIGHT: 1080,
  /** 最小缩放比例（支持到 1024px）*/
  MIN_SCALE: 0.53,
  /** 防抖延迟 (ms) */
  RESIZE_DEBOUNCE: 100,
  /** 缩放容器类名 */
  CONTAINER_CLASS: 'scale-container',
  /** 包装器类名 */
  WRAPPER_CLASS: 'scale-wrapper',
} as const

/**
 * 响应式状态
 */
export interface ResponsiveState {
  /** 当前屏幕宽度 */
  screenWidth: number
  /** 当前屏幕高度 */
  screenHeight: number
  /** 当前缩放比例 */
  scale: number
  /** 是否达到最小缩放 */
  isMinScale: boolean
}

/**
 * 状态变化回调类型
 */
type ResponsiveCallback = (state: ResponsiveState) => void

/**
 * 监听器列表
 */
const listeners: ResponsiveCallback[] = []

/**
 * 当前状态
 */
let currentState: ResponsiveState | null = null

/**
 * 计算缩放比例
 * 让内容填满整个屏幕宽度，留微小边距避免滚动条
 */
function calculateScale(screenWidth: number): number {
  // 留 0.5% 边距，避免浮点精度问题导致滚动条
  const adjustedWidth = screenWidth * 0.995
  const rawScale = adjustedWidth / RESPONSIVE_CONFIG.BASE_WIDTH
  // 只保留最小缩放保护
  return Math.max(RESPONSIVE_CONFIG.MIN_SCALE, rawScale)
}

/**
 * 获取当前响应式状态
 */
export function getResponsiveState(): ResponsiveState {
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  const scale = calculateScale(screenWidth)
  
  return {
    screenWidth,
    screenHeight,
    scale,
    isMinScale: scale <= RESPONSIVE_CONFIG.MIN_SCALE,
  }
}

/**
 * 更新缩放容器的 transform: scale()
 * 同时更新包装器高度以适配缩放后的实际占用空间
 */
function updateScaleTransform(): void {
  const container = document.querySelector(`.${RESPONSIVE_CONFIG.CONTAINER_CLASS}`) as HTMLElement | null
  const wrapper = document.querySelector(`.${RESPONSIVE_CONFIG.WRAPPER_CLASS}`) as HTMLElement | null
  
  if (!container) {
    if (import.meta.env.DEV) {
      console.warn('[Responsive] Scale container not found')
    }
    return
  }
  
  const state = getResponsiveState()
  currentState = state
  
  // 使用 transform: scale() 缩放
  container.style.transform = `scale(${state.scale})`
  container.style.transformOrigin = 'left top'
  
  // 更新包装器高度以适配缩放后的实际占用空间
  // scale() 不改变布局空间，需要手动设置高度
  if (wrapper) {
    const scaledHeight = RESPONSIVE_CONFIG.BASE_HEIGHT * state.scale
    wrapper.style.height = `${scaledHeight}px`
    wrapper.style.minHeight = `${scaledHeight}px`
  }
  
  // 通知所有监听器
  notifyListeners(state)
  
  // 调试信息
  if (import.meta.env.DEV) {
    console.log(
      `[Responsive] Screen: ${state.screenWidth}x${state.screenHeight}px, Scale: ${state.scale.toFixed(3)}`
    )
  }
}

/**
 * 防抖函数
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 创建防抖版本的更新函数
 */
const debouncedUpdate = debounce(
  updateScaleTransform,
  RESPONSIVE_CONFIG.RESIZE_DEBOUNCE
)

/**
 * 通知所有监听器
 */
function notifyListeners(state: ResponsiveState): void {
  listeners.forEach(callback => {
    try {
      callback(state)
    } catch (error) {
      console.error('[Responsive] Listener error:', error)
    }
  })
}

/**
 * 添加状态变化监听器
 */
export function onResponsiveChange(callback: ResponsiveCallback): () => void {
  listeners.push(callback)
  
  // 如果已有状态，立即通知
  if (currentState) {
    callback(currentState)
  }
  
  // 返回取消监听函数
  return () => {
    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }
}

/**
 * 获取当前缩放比例
 */
export function getCurrentScale(): number {
  return calculateScale(window.innerWidth)
}

/**
 * 初始化响应式缩放
 * 应在应用启动时调用
 */
export function initResponsive(): void {
  // 立即设置一次
  updateScaleTransform()
  
  // 监听窗口大小变化（使用防抖）
  window.addEventListener('resize', debouncedUpdate)
  
  // 监听屏幕方向变化
  window.addEventListener('orientationchange', () => {
    setTimeout(updateScaleTransform, 100)
  })
}

/**
 * Vue 组合式 API: 使用响应式状态
 */
export function useResponsive() {
  const state = ref<ResponsiveState>(getResponsiveState())
  
  onMounted(() => {
    const unsubscribe = onResponsiveChange((newState) => {
      state.value = newState
    })
    
    onUnmounted(unsubscribe)
  })
  
  return {
    state: readonly(state),
    scale: computed(() => state.value.scale),
    screenWidth: computed(() => state.value.screenWidth),
    screenHeight: computed(() => state.value.screenHeight),
  }
}

// 为了支持 Vue 组合式 API，需要导入 Vue 函数
import { ref, computed, readonly, onMounted, onUnmounted } from 'vue'

// 默认导出初始化函数
export default initResponsive