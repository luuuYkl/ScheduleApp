// src/store/ai-review.ts
// AI 复盘状态管理

import { defineStore } from "pinia";
import { ref } from "vue";
import type { AIReview, ReviewRequest } from "@/services/ai-review";
import { generateAIReview } from "@/services/ai-review";

/**
 * AI 复盘 Store
 * 管理不同时间维度的复盘内容
 */
export const useAIReviewStore = defineStore("ai-review", () => {
  // ========== 状态 ==========

  /** 今日复盘 */
  const todayReview = ref<AIReview | null>(null);

  /** 周复盘 */
  const weekReview = ref<AIReview | null>(null);

  /** 月复盘 */
  const monthReview = ref<AIReview | null>(null);

  /** 复盘加载状态 */
  const loading = ref(false);

  /** 错误信息 */
  const error = ref<string | null>(null);

  // ========== 方法 ==========

  /**
   * 生成复盘
   * @param request 复盘请求
   * @returns 生成的复盘内容
   */
  async function generateReview(
    request: ReviewRequest,
  ): Promise<AIReview | null> {
    loading.value = true;
    error.value = null;

    try {
      const review = await generateAIReview(request);

      // 根据时间维度存储复盘
      switch (request.period) {
        case "today":
          todayReview.value = review;
          break;
        case "week":
          weekReview.value = review;
          break;
        case "month":
          monthReview.value = review;
          break;
      }

      // 保存到 localStorage 便于刷新后恢复
      saveReviewToStorage(review);

      console.log(
        `[AI Review] ${request.period} review generated successfully`,
      );
      return review;
    } catch (err) {
      const message = err instanceof Error ? err.message : "生成复盘失败";
      error.value = message;
      console.error("[AI Review] Failed to generate review:", err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取指定维度的复盘
   */
  function getReview(period: "today" | "week" | "month"): AIReview | null {
    switch (period) {
      case "today":
        return todayReview.value;
      case "week":
        return weekReview.value;
      case "month":
        return monthReview.value;
    }
  }

  /**
   * 从 localStorage 恢复复盘
   */
  function loadReviewsFromStorage(userId: number) {
    try {
      const key = `ai-reviews-${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        todayReview.value = data.today || null;
        weekReview.value = data.week || null;
        monthReview.value = data.month || null;
        console.log("[AI Review] Reviews loaded from storage");
      }
    } catch (err) {
      console.warn("[AI Review] Failed to load reviews from storage:", err);
    }
  }

  /**
   * 清空所有复盘
   */
  function clearReviews() {
    todayReview.value = null;
    weekReview.value = null;
    monthReview.value = null;
    error.value = null;
  }

  // ========== 辅助方法 ==========

  /**
   * 保存复盘到 localStorage
   */
  function saveReviewToStorage(review: AIReview) {
    try {
      const userId = parseInt(localStorage.getItem("user_id") || "1");
      const key = `ai-reviews-${userId}`;
      const existing = JSON.parse(localStorage.getItem(key) || "{}");
      existing[review.period] = review;
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (err) {
      console.warn("[AI Review] Failed to save review to storage:", err);
    }
  }

  return {
    // 状态
    todayReview,
    weekReview,
    monthReview,
    loading,
    error,

    // 方法
    generateReview,
    getReview,
    loadReviewsFromStorage,
    clearReviews,
  };
});
