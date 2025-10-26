<template>
  <div class="page">
    <!-- 保留原有签到功能 -->
    <div class="card mb-4" style="max-width:480px;margin:0 auto;">
      <h2 class="mb-2">每日签到</h2>
      <div v-if="streak">
        <p>当前连续：<strong>{{ streak.current_streak }}</strong> 天</p>
        <p>历史最长：<strong>{{ streak.longest_streak }}</strong> 天</p>
        <p>最后签到：<strong>{{ streak.last_checkin || '无' }}</strong></p>
        <div class="mt-2">
          <button class="primary" @click="checkIn" :disabled="loading">
            {{ loading ? '签到中...' : '今日签到' }}
          </button>
        </div>
      </div>
      <p v-else>正在加载...</p>
    </div>

    <!-- 新增: AI 生成的日志列表 -->
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
import { onMounted, ref, computed } from "vue";
import { useStreakStore } from "@/store/streak";
import { useUserStore } from "@/store/user";
import { useLogStore } from "@/store/log"; // 新增

const streakStore = useStreakStore();
const userStore = useUserStore();
const logStore = useLogStore(); // 新增
const loading = ref(false);

const streak = computed(() => streakStore.streak);
const logs = computed(() => logStore.logs); // 新增

onMounted(async () => {
  const userId = userStore.user?.id ?? 1;
  await Promise.all([
    streakStore.loadStreak(userId),
    logStore.loadLogs(userId) // 新增:加载日志
  ]);
});

async function checkIn() {
  loading.value = true;
  try {
    const userId = userStore.user?.id ?? 1;
    await streakStore.doCheckIn(userId);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.log-list {
  display: grid;
  gap: 1rem;
}
.log-item {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.completion {
  color: var(--color-primary);
  font-size: 0.9em;
}
.log-content {
  white-space: pre-line;
  color: #374151;
}
</style>
