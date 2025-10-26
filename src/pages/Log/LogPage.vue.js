/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0.d.ts" />
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
    }
    finally {
        loading.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "page card" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.h1, __VLS_elements.h1)({
    ...{ class: "mb-2" },
});
if (__VLS_ctx.streak) {
    // @ts-ignore
    [streak,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({});
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({});
    __VLS_asFunctionalElement(__VLS_elements.strong, __VLS_elements.strong)({});
    (__VLS_ctx.streak.current_streak);
    // @ts-ignore
    [streak,];
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({});
    __VLS_asFunctionalElement(__VLS_elements.strong, __VLS_elements.strong)({});
    (__VLS_ctx.streak.longest_streak);
    // @ts-ignore
    [streak,];
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({});
    __VLS_asFunctionalElement(__VLS_elements.strong, __VLS_elements.strong)({});
    (__VLS_ctx.streak.last_checkin || '无');
    // @ts-ignore
    [streak,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "mt-2" },
    });
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.checkIn) },
        ...{ class: "primary" },
        disabled: (__VLS_ctx.loading),
    });
    // @ts-ignore
    [checkIn, loading,];
    (__VLS_ctx.loading ? '签到中...' : '今日签到');
    // @ts-ignore
    [loading,];
}
else {
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({});
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        loading: loading,
        streak: streak,
        checkIn: checkIn,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
