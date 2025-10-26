/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0.d.ts" />
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";
const router = useRouter();
const planStore = usePlanStore();
const taskStore = useTaskStore();
const loading = ref(false);
const plans = computed(() => planStore.plans);
onMounted(async () => {
    await planStore.loadPlans();
    await taskStore.loadTasks(); // 用于进度统计
});
// 进度
function progressFor(planId) {
    const ts = taskStore.tasks.filter((t) => t.plan_id === planId);
    if (ts.length === 0)
        return 0;
    const done = ts.filter((t) => t.status === "done").length;
    return Math.round((done / ts.length) * 100);
}
// 增：跳到创建页
function goCreate() {
    router.push("/plan/create");
}
// 改：稳定做法——用 query 表示编辑目标 /plan/create?edit=ID
function editPlan(id) {
    router.push({ path: "/plan/create", query: { edit: String(id) } });
}
// 删：删除计划并刷新
async function removePlan(id) {
    if (!confirm("确定删除该计划吗？相关任务也会一并删除。"))
        return;
    loading.value = true;
    try {
        await planStore.removePlan(id);
        await Promise.all([planStore.loadPlans(), taskStore.loadTasks()]);
    }
    catch (e) {
        alert(e?.message || "删除失败");
    }
    finally {
        loading.value = false;
    }
}
function goPlanTasks(id) {
    // 优先走命名路由（如果你在 router 里已添加 name: 'plan-tasks'）
    if (router.hasRoute("plan-tasks")) {
        router.push({ name: "plan-tasks", params: { id: String(id) } });
    }
    else {
        // 兜底：直接用路径跳转
        router.push(`/plan/${id}/tasks`);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['ops']} */ ;
/** @type {__VLS_StyleScopedClasses['ops']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "header" },
});
__VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.goCreate) },
    ...{ class: "primary" },
});
// @ts-ignore
[goCreate,];
if (__VLS_ctx.plans.length === 0) {
    // @ts-ignore
    [plans,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "empty" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_elements.ul, __VLS_elements.ul)({
        ...{ class: "list" },
    });
    for (const [p] of __VLS_getVForSourceType((__VLS_ctx.plans))) {
        // @ts-ignore
        [plans,];
        __VLS_asFunctionalElement(__VLS_elements.li, __VLS_elements.li)({
            key: (p.id),
            ...{ class: "plan" },
        });
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "top" },
        });
        __VLS_asFunctionalElement(__VLS_elements.strong, __VLS_elements.strong)({});
        (p.title);
        __VLS_asFunctionalElement(__VLS_elements.small, __VLS_elements.small)({
            ...{ class: "range" },
        });
        (p.start_date);
        (p.end_date);
        (p.frequency);
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
            ...{ class: "pct" },
        });
        (__VLS_ctx.progressFor(p.id));
        // @ts-ignore
        [progressFor,];
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "bar" },
        });
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "fill" },
            ...{ style: ({ width: __VLS_ctx.progressFor(p.id) + '%' }) },
        });
        // @ts-ignore
        [progressFor,];
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "ops" },
        });
        __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.plans.length === 0))
                        return;
                    __VLS_ctx.editPlan(p.id);
                    // @ts-ignore
                    [editPlan,];
                } },
            ...{ class: "secondary" },
        });
        __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.plans.length === 0))
                        return;
                    __VLS_ctx.goPlanTasks(p.id);
                    // @ts-ignore
                    [goPlanTasks,];
                } },
        });
        __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.plans.length === 0))
                        return;
                    __VLS_ctx.removePlan(p.id);
                    // @ts-ignore
                    [removePlan,];
                } },
            ...{ class: "danger" },
            disabled: (__VLS_ctx.loading),
        });
        // @ts-ignore
        [loading,];
        (__VLS_ctx.loading ? "处理中..." : "删除");
        // @ts-ignore
        [loading,];
    }
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['list']} */ ;
/** @type {__VLS_StyleScopedClasses['plan']} */ ;
/** @type {__VLS_StyleScopedClasses['top']} */ ;
/** @type {__VLS_StyleScopedClasses['range']} */ ;
/** @type {__VLS_StyleScopedClasses['pct']} */ ;
/** @type {__VLS_StyleScopedClasses['bar']} */ ;
/** @type {__VLS_StyleScopedClasses['fill']} */ ;
/** @type {__VLS_StyleScopedClasses['ops']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        loading: loading,
        plans: plans,
        progressFor: progressFor,
        goCreate: goCreate,
        editPlan: editPlan,
        removePlan: removePlan,
        goPlanTasks: goPlanTasks,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
