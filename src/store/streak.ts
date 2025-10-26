// src/store/streak.ts
import { defineStore } from "pinia";
import { ref } from "vue";
// 使用宽松引用以兼容不同 services/api 导出命名
import * as API from "@/services/api";
const APIAny = API as any;

export const useStreakStore = defineStore("streak", () => {
  const streak = ref<any>(null);

  // 加载用户签到（容错：若后端返回错误或为空则返回默认值）
  async function loadStreak(userId: number) {
    try {
      const fn = APIAny.fetchStreak || APIAny.getStreak || APIAny.loadStreak;
      if (!fn) {
        // 无后端接口时直接返回默认
        streak.value = {
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          last_checkin: null,
        };
        return streak.value;
      }

      const res = await fn(userId);
      // 如果后端返回 null/undefined，使用默认
      streak.value = res ?? {
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_checkin: null,
      };
      return streak.value;
    } catch (err: any) {
      // 记录日志并回退到默认数据，避免抛出未捕获错误到组件
      // eslint-disable-next-line no-console
      console.warn("[streak] loadStreak error:", err?.message ?? err);
      streak.value = {
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_checkin: null,
      };
      return streak.value;
    }
  }

  async function doCheckIn(userId: number) {
    try {
      const fn = APIAny.checkIn || APIAny.postCheckIn || APIAny.doCheckIn;
      if (!fn) {
        // mock 行为：简单更新本地状态
        streak.value = {
          user_id: userId,
          current_streak: (streak.value?.current_streak ?? 0) + 1,
          longest_streak: Math.max(streak.value?.longest_streak ?? 0, (streak.value?.current_streak ?? 0) + 1),
          last_checkin: new Date().toISOString().slice(0, 10),
        };
        return streak.value;
      }
      const res = await fn(userId);
      streak.value = res ?? streak.value;
      return streak.value;
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.warn("[streak] doCheckIn error:", err?.message ?? err);
      return streak.value;
    }
  }

  return { streak, loadStreak, doCheckIn };
});
