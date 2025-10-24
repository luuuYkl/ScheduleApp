// src/store/streak.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { API } from "@/services/api";

export const useStreakStore = defineStore("streak", () => {
  const streak = ref<any>(null);

  async function loadStreak(userId: number) {
    streak.value = await API.fetchStreak(userId);
  }

  async function doCheckIn(userId: number) {
    streak.value = await API.checkIn(userId);
  }

  return { streak, loadStreak, doCheckIn };
});
