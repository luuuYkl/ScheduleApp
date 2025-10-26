// ...existing code...
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";
// router 用于页面跳转
const router = useRouter();
// Pinia store：计划与任务
const planStore = usePlanStore();
const taskStore = useTaskStore();
// 删除/请求处理中状态标记，防止重复点击
const loading = ref(false);
// 计算属性：从 planStore 获取当前计划数组
const plans = computed(() => planStore.plans);
// 生命周期：组件挂载时加载计划和任务数据（用于进度计算）
onMounted(async () => {
    await planStore.loadPlans();
    // 同步加载任务以便 progressFor 能正确计算
    await taskStore.loadTasks();
});
/*
  progressFor(planId)
  - 计算给定计划的任务完成率（百分比整数）
  - 策略：查找属于该计划的任务，统计状态为 'done' 的数量 / 总数
  - 返回 0-100 的整数
*/
function progressFor(planId) {
    const ts = taskStore.tasks.filter((t) => t.plan_id === planId);
    if (ts.length === 0)
        return 0;
    const done = ts.filter((t) => t.status === "done").length;
    return Math.round((done / ts.length) * 100);
}
/*
  goCreate()
  - 跳转到创建计划页面
*/
function goCreate() {
    router.push("/plan/create");
}
/*
  editPlan(id)
  - 编辑计划：为了保持路由稳定性，使用 /plan/create?edit=ID 的方式进入编辑态
*/
function editPlan(id) {
    router.push({ path: "/plan/create", query: { edit: String(id) } });
}
/*
  removePlan(id)
  - 删除计划并刷新计划与任务数据
  - 显示原生 confirm 提示以防误删
  - 捕获错误并用 alert 提示用户
*/
async function removePlan(id) {
    if (!confirm("确定删除该计划吗？相关任务也会一并删除。"))
        return;
    loading.value = true;
    try {
        await planStore.removePlan(id);
        // 并行刷新 plan 与 task 数据
        await Promise.all([planStore.loadPlans(), taskStore.loadTasks()]);
    }
    catch (e) {
        alert(e?.message || "删除失败");
    }
    finally {
        loading.value = false;
    }
}
/*
  goPlanTasks(id)
  - 跳转到计划任务管理页
  - 优先使用命名路由（如果 router 中有 name: 'plan-tasks'），否则使用路径拼接兜底
*/
function goPlanTasks(id) {
    if (router.hasRoute("plan-tasks")) {
        router.push({ name: "plan-tasks", params: { id: String(id) } });
    }
    else {
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
