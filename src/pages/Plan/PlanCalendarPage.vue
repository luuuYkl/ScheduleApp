<template>
  <div class="page">
    <h1 class="mb-4">计划 #{{ planId }} 的日历</h1>

    <CalendarView :planId="planId" />
    <!-- 悬浮按钮：创建日程 -->
    <button class="fab" @click="goSchedule" title="创建日程">
      <span class="icon">➕</span>
      <span class="text">日程</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import CalendarView from "@/components/calendar/CalendarView.vue";

const route = useRoute();
const planId = Number(route.params.id);
const router = useRouter();

function goSchedule() {
  router.push("/schedule");
}
</script>

<style scoped>
.page {
  background: var(--bg-main);
  min-height: 100vh;
  padding: 1rem;
  padding-top: calc(var(--header-height, 64px) + 1rem);
  padding-bottom: calc(var(--footer-height, 64px) + 1rem);
}

.page h1 {
  color: var(--text-main);
  margin-bottom: 1.5rem;
}

/* 悬浮按钮 (FAB) - 暗色主题 */
.fab {
  position: fixed;
  bottom: 80px; /* 避开底部导航 */
  right: 1.5rem;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--ai-main);
  color: var(--text-emphasis);
  border: 1px solid var(--ai-border);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    background 0.2s;
  z-index: 50;
}

.fab:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.6);
  background: var(--ai-light);
}

.fab .icon {
  font-size: 1.5rem;
  line-height: 1;
}

.fab .text {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

@media (max-width: 640px) {
  .fab {
    bottom: 70px;
    right: 1rem;
    width: 56px;
    height: 56px;
  }
  .fab .icon {
    font-size: 1.25rem;
  }
  .fab .text {
    font-size: 0.6rem;
  }
}
</style>
