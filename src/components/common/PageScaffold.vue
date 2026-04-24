  <template>
  <section class="page" role="main" aria-labelledby="page-title">
    <header v-if="backTo || title || subtitle || $slots.actions || $slots['header-panel']" class="page__header">
      <div class="page__header-main">
        <!-- 返回按钮 -->
        <button
          v-if="backTo"
          class="page__back-btn"
          @click="handleBack"
          :aria-label="'返回上一页'"
          title="返回"
        >
          <span class="back-icon">←</span>
        </button>
        <div v-if="title || subtitle" class="page__title-wrapper" @click="toggleHeaderPanel">
          <div class="title-row">
            <h1
              v-if="title"
              id="page-title"
              class="page__title"
              :aria-describedby="subtitle ? 'page-subtitle' : undefined"
            >
              {{ title }}
            </h1>
            <button 
              v-if="$slots['header-panel']"
              class="header-toggle-btn"
              :class="{ 'is-expanded': isHeaderPanelExpanded }"
              aria-label="展开或收起面板"
            >
              <span class="toggle-icon">{{ isHeaderPanelExpanded ? '▼' : '▶' }}</span>
            </button>
          </div>
          <p v-if="subtitle" id="page-subtitle" class="page__subtitle">
            {{ subtitle }}
          </p>
        </div>
        <div
          v-if="$slots.actions"
          class="page__actions"
          role="toolbar"
          aria-label="页面操作"
        >
          <slot name="actions" />
        </div>
      </div>
      
      <!-- 可折叠面板区域 -->
      <div 
        v-if="$slots['header-panel'] && isHeaderPanelExpanded" 
        class="page__header-panel"
      >
        <slot name="header-panel" />
      </div>
    </header>
    <div class="page__content" role="region" aria-label="页面内容">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, useSlots } from 'vue';
import { useRouter } from 'vue-router';

interface Props {
  title?: string;
  subtitle?: string;
  collapsibleHeader?: boolean;
  /** 返回按钮：传字符串为指定路径，传 true 为 router.back() */
  backTo?: string | boolean;
}

const props = defineProps<Props>();
const router = useRouter();

const isHeaderPanelExpanded = ref(false);

const toggleHeaderPanel = () => {
  isHeaderPanelExpanded.value = !isHeaderPanelExpanded.value;
};

const handleBack = () => {
  if (typeof props.backTo === 'string') {
    router.push(props.backTo);
  } else {
    router.back();
  }
};

// 暴露方法给父组件
defineExpose({
  isHeaderPanelExpanded,
  toggleHeaderPanel
});
</script>

<style scoped>
.page {
  width: 100%;
  height: 100%;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
}

.page__header {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

/* 返回按钮 */
.page__back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-card-hover);
  color: var(--text-secondary);
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
  transition:
    background-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard),
    box-shadow var(--dur-fast) var(--ease-standard);
}

.page__back-btn:hover {
  background: var(--ai-bg);
  color: var(--ai-main);
  box-shadow: 0 0 0 3px var(--ai-bg);
}

.back-icon {
  font-size: 16px;
  line-height: 1;
  font-weight: 600;
}

.page__title-wrapper {
  flex: 1;
}

.page__title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-emphasis);
  margin: 0 0 var(--space-2) 0;
  line-height: 1.3;
}

.page__subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.page__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.page__header-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
}

.title-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}

.header-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: var(--bg-card-hover);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-toggle-btn:hover {
  background: var(--bg-elevated);
}

.header-toggle-btn.is-expanded .toggle-icon {
  transform: rotate(0deg);
}

.toggle-icon {
  font-size: 12px;
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.page__header-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  margin-top: var(--space-2);
  padding: var(--space-4);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-main);
  box-shadow: var(--shadow-lg);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page__content {
  width: 100%;
  flex: 1;
  overflow: auto;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page {
    padding: var(--space-3);
  }

  .page__header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .page__actions {
    align-self: flex-start;
  }

  .page__title {
    font-size: 20px;
  }

  .page__subtitle {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .page {
    padding: var(--space-2);
  }

  .page__title {
    font-size: 18px;
  }
}
</style>
