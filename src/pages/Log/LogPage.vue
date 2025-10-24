<template>
  <div class="page card" style="max-width:480px;margin:0 auto;">
    <h1 class="mb-2">行为日志 / 签到</h1>
    <div v-if="streak">
      <p>当前连续：<strong>{{ streak.current_streak }}</strong> 天</p>
      <p>历史最长：<strong>{{ streak.longest_streak }}</strong> 天</p>
      <p>最后签到：<strong>{{ streak.last_checkin || '无' }}</strong></p>
      <div class="mt-2">
        <button class="primary" @click="checkIn" :disabled="loading">{{ loading ? '签到中...' : '今日签到' }}</button>
      </div>
    </div>
    <p v-else>正在加载...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useStreakStore } from "@/store/streak";
import { useUserStore } from "@/store/user";

const streakStore = useStreakStore();
const userStore = useUserStore();
const loading = ref(false);

const streak = computed(() => streakStore.streak);

onMounted(async () => {
  const userId = userStore.user?.id ?? 1; // 简化：mock场景默认1
  await streakStore.loadStreak(userId);
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
