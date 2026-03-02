<template>
  <section class="page" role="main" aria-labelledby="page-title">
    <header v-if="title || subtitle || $slots.actions" class="page__header">
      <div v-if="title || subtitle" class="page__title-wrapper">
        <h1
          v-if="title"
          id="page-title"
          class="page__title"
          :aria-describedby="subtitle ? 'page-subtitle' : undefined"
        >
          {{ title }}
        </h1>
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
    </header>
    <div class="page__content" role="region" aria-label="页面内容">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  subtitle?: string;
}

defineProps<Props>();
</script>

<style scoped>
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4);
  width: 100%;
}

.page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
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

.page__content {
  width: 100%;
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
