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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "page" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({
    ...{ class: "mb-2" },
});
if (__VLS_ctx.logs.length) {
    // @ts-ignore
    [logs,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "log-list" },
    });
    for (const [log] of __VLS_getVForSourceType((__VLS_ctx.logs))) {
        // @ts-ignore
        [logs,];
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            key: (log.id),
            ...{ class: "log-item" },
        });
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "log-header" },
        });
        __VLS_asFunctionalElement(__VLS_elements.strong, __VLS_elements.strong)({});
        (log.date);
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
            ...{ class: "completion" },
        });
        (Math.round((log.tasks_done / log.tasks_total) * 100));
        __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
            ...{ class: "log-content" },
        });
        (log.content);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
        ...{ class: "text-gray" },
    });
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['log-list']} */ ;
/** @type {__VLS_StyleScopedClasses['log-item']} */ ;
/** @type {__VLS_StyleScopedClasses['log-header']} */ ;
/** @type {__VLS_StyleScopedClasses['completion']} */ ;
/** @type {__VLS_StyleScopedClasses['log-content']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        logs: logs,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
