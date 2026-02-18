<template>
  <div class="fab-container">
    <!-- 展开的菜单 -->
    <transition name="menu-fade">
      <div 
        v-if="isOpen" 
        class="fab-menu" 
        @click.stop
        ref="menuContainer"
      >
        <button 
          ref="planButton"
          class="fab-menu-item" 
          @click.stop="handleAction('plan', $event)"
          @keydown.enter="handleAction('plan')"
          @keydown.space.prevent="handleAction('plan')"
          aria-label="新建计划"
          tabindex="0"
        >
          <span class="menu-icon">📝</span>
          <span class="menu-text">计划</span>
        </button>
        <button 
          ref="scheduleButton"
          class="fab-menu-item" 
          @click.stop="handleAction('schedule', $event)"
          @keydown.enter="handleAction('schedule')"
          @keydown.space.prevent="handleAction('schedule')"
          aria-label="新建日程"
          tabindex="0"
        >
          <span class="menu-icon">⏰</span>
          <span class="menu-text">日程</span>
        </button>
      </div>
    </transition>

    <!-- 主按钮 -->
    <button 
      ref="fabButton"
      class="fab-main"
      :class="{ 'is-open': isOpen }"
      @click.stop="toggleMenu($event)"
      @keydown.enter="toggleMenu"
      @keydown.space.prevent="toggleMenu"
      @keydown.esc="closeMenu"
      aria-label="新建"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      tabindex="0"
    >
      <span class="fab-icon">+</span>
      <span class="fab-text">新建</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isOpen = ref(false)
const isMobile = computed(() => window.innerWidth <= 768)
const fabButton = ref<HTMLButtonElement | null>(null)
const menuContainer = ref<HTMLDivElement | null>(null)
const planButton = ref<HTMLButtonElement | null>(null)
const scheduleButton = ref<HTMLButtonElement | null>(null)

function toggleMenu(event: Event) {
  console.log('[FAB] toggleMenu called, isOpen:', isOpen.value)
  console.log('[FAB] Event:', event)
  event.stopPropagation()
  isOpen.value = !isOpen.value
  console.log('[FAB] isOpen now:', isOpen.value)
}

function closeMenu() {
  isOpen.value = false
  nextTick(() => {
    fabButton.value?.focus()
  })
}

function handleAction(action: 'plan' | 'schedule', event?: Event) {
  console.log('[FAB] handleAction called with:', action)
  console.log('[FAB] Event object:', event)
  
  if (event) {
    event.stopPropagation()
    console.log('[FAB] Event stopped propagation')
  }
  
  isOpen.value = false
  console.log('[FAB] Menu closed')
  
  // 使用setTimeout确保状态更新完成后再导航
  setTimeout(() => {
    // 先尝试简单的导航测试
    if (action === 'plan') {
      console.log('[FAB] Navigating to /plan/create')
      try {
        const result = router.push('/plan/create')
        console.log('[FAB] Navigation result:', result)
        console.log('[FAB] Current route:', router.currentRoute.value.fullPath)
      } catch (error) {
        console.error('[FAB] Navigation failed:', error)
      }
    } else {
      console.log('[FAB] Navigating to /schedule')
      try {
        const result = router.push('/schedule')
        console.log('[FAB] Navigation result:', result)
        console.log('[FAB] Current route:', router.currentRoute.value.fullPath)
      } catch (error) {
        console.error('[FAB] Navigation failed:', error)
      }
    }
  }, 100)
}

// 点击外部关闭菜单
function handleClickOutside(e: MouseEvent) {
  if (isOpen.value) {
    const target = e.target as Node
    if (menuContainer.value && !menuContainer.value.contains(target)) {
      closeMenu()
    }
  }
}

// 键盘导航
function handleKeyDown(e: KeyboardEvent) {
  if (!isOpen.value) return
  
  switch (e.key) {
    case 'Escape':
      e.preventDefault()
      closeMenu()
      break
    case 'Tab':
      // 处理 Tab 键循环
      if (e.shiftKey) {
        if (document.activeElement === fabButton.value) {
          e.preventDefault()
          scheduleButton.value?.focus()
        }
      } else {
        if (document.activeElement === scheduleButton.value) {
          e.preventDefault()
          fabButton.value?.focus()
        }
      }
      break
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.fab-container {
  position: fixed;
  bottom: calc(var(--bottom-nav-height, 64px) + 16px);
  right: 16px;
  z-index: var(--z-fixed);
}

/* 主按钮 */
.fab-main {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-full);
  background: var(--ai-main);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  transition: all 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  font-weight: 500;
  font-size: 16px;
  position: relative;
  z-index: 2;
}

.fab-main:hover {
  background: var(--ai-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-xl);
}

.fab-main:focus {
  outline: none;
  box-shadow: 
    var(--shadow-lg),
    0 0 0 3px var(--ai-bg),
    0 0 0 5px var(--ring-color);
}

.fab-main.is-open {
  transform: rotate(45deg);
  background: var(--error);
}

.fab-main.is-open:hover {
  background: var(--error);
}

.fab-icon {
  font-size: 24px;
  line-height: 1;
  transition: transform var(--dur-normal) var(--ease-standard);
}

.fab-main.is-open .fab-icon {
  transform: rotate(135deg);
}

.fab-text {
  font-size: 14px;
  font-weight: 500;
}

/* 菜单 */
.fab-menu {
  position: absolute;
  bottom: 56px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-main);
  min-width: 120px;
  z-index: 1;
}

.fab-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  color: var(--text-main);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
  width: 100%;
  text-align: left;
}

.fab-menu-item:hover {
  background: var(--bg-card-hover);
  transform: translateX(2px);
}

.fab-menu-item:focus {
  outline: none;
  background: var(--bg-card-hover);
  box-shadow: 0 0 0 2px var(--ai-main);
}

.menu-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.menu-text {
  flex: 1;
}

/* 动画 */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: 
    opacity 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.menu-fade-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.8);
}

.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.8);
}

/* 桌面端优化 */
@media (min-width: 1024px) {
  .fab-main {
    width: 56px;
    height: 56px;
    font-size: 16px;
  }
  
  .fab-icon {
    font-size: 24px;
  }
  
  .fab-text {
    font-size: 14px;
  }
  
  .fab-menu {
    min-width: 130px;
  }
  
  .fab-menu-item {
    padding: 14px;
    font-size: 15px;
  }
  
  .menu-icon {
    font-size: 18px;
    width: 24px;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .fab-container {
    bottom: calc(var(--bottom-nav-height, 64px) + 16px);
    right: 16px;
  }
  
  .fab-main {
    width: 48px;
    height: 48px;
  }
  
  .fab-icon {
    font-size: 20px;
  }
  
  .fab-text {
    font-size: 12px;
  }
  
  .fab-menu {
    min-width: 110px;
    padding: 6px;
    bottom: 52px;
  }
  
  .fab-menu-item {
    padding: 10px;
    font-size: 13px;
  }
  
  .menu-icon {
    font-size: 16px;
    width: 20px;
  }
}

/* 性能优化 */
@media (prefers-reduced-motion: reduce) {
  .fab-main,
  .fab-menu-item,
  .menu-fade-enter-active,
  .menu-fade-leave-active {
    transition: none;
  }
  
  .fab-main:hover,
  .fab-menu-item:hover {
    transform: none;
  }
}

/* 确保在所有主题下的一致性 */
.fab-main {
  will-change: transform, box-shadow;
}
</style>