import { useRouter } from "vue-router";
import PlanOverview from "@/components/home/PlanOverview.vue";
import TaskList from "@/components/home/TaskList.vue";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";
const router = useRouter();
const planStore = usePlanStore();
const taskStore = useTaskStore();
function goCreate() {
    router.push("/plan/create");
}
function goLog() {
    router.push("/log");
}
async function refresh() {
    await Promise.all([planStore.loadPlans(), taskStore.loadTasks()]);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "page home" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "grid" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "actions card" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "btns" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.goLog) },
    ...{ class: "secondary" },
});
// @ts-ignore
[goLog,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.refresh) },
});
// @ts-ignore
[refresh,];
/** @type {[typeof PlanOverview, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PlanOverview, new PlanOverview({
    ...{ 'onCreate': {} },
}));
const __VLS_1 = __VLS_0({
    ...{ 'onCreate': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
const __VLS_5 = ({ create: {} },
    { onCreate: (__VLS_ctx.goCreate) });
// @ts-ignore
[goCreate,];
var __VLS_2;
/** @type {[typeof TaskList, ]} */ ;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent(TaskList, new TaskList({}));
const __VLS_8 = __VLS_7({}, ...__VLS_functionalComponentArgsRest(__VLS_7));
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['home']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['btns']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        PlanOverview: PlanOverview,
        TaskList: TaskList,
        goCreate: goCreate,
        goLog: goLog,
        refresh: refresh,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
