<template>
  <div class="page">
    <div class="card" style="max-width:720px;margin:0 auto;">
      <h2 class="mb-2">AI 生成日志</h2>

      <div v-if="logs.length" class="log-list">
        <div v-for="log in logs" :key="log.id" class="log-item">
          <div class="log-header">
            <strong>{{ log.date }}</strong>
            <span class="completion">
              完成度: {{ Math.round((log.tasks_done / log.tasks_total) * 100) }}%
            </span>
          </div>
          <p class="log-content">{{ log.content }}</p>
        </div>
      </div>

      <p v-else class="text-gray">暂无日志记录</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useLogStore } from "@/store/log";
import { useUserStore } from "@/store/user";

const logStore = useLogStore();
const userStore = useUserStore();

const logs = computed(() => logStore.logs);

onMounted(async () => {
  const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id")) ?? 1;
  await logStore.loadLogs(userId);
});
</script>

<style scoped>
.log-list {
  display: grid;
  gap: 1rem;
}
.log-item {
  padding: 1rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  background: var(--card-bg, #fff);
}
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.completion {
  color: var(--color-primary, #3b82f6);
  font-size: 0.9em;
}
.log-content {
  white-space: pre-line;
  color: #374151;
}
.text-gray { color: #6b7280; }
</style>