import { computed, onMounted } from "vue";
import { useTaskStore } from "@/store/tasks";
import { useRouter } from "vue-router";
const props = defineProps();
const taskStore = useTaskStore();
const router = useRouter();
const tasks = computed(() => {
    const list = taskStore.tasks;
    return props.planId ? list.filter((t) => t.plan_id === props.planId) : list;
});
onMounted(async () => {
    await taskStore.loadTasks(props.planId);
});
async function toggle(taskId) {
    await taskStore.toggleTaskStatus(taskId);
}
function open(id) {
    router.push(`/task/${id}`);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "header" },
});
__VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({});
if (__VLS_ctx.planId) {
    // @ts-ignore
    [planId,];
    __VLS_asFunctionalElement(__VLS_elements.small, __VLS_elements.small)({});
    (__VLS_ctx.planId);
    // @ts-ignore
    [planId,];
}
__VLS_asFunctionalElement(__VLS_elements.ul, __VLS_elements.ul)({
    ...{ class: "list" },
});
for (const [t] of __VLS_getVForSourceType((__VLS_ctx.tasks))) {
    // @ts-ignore
    [tasks,];
    __VLS_asFunctionalElement(__VLS_elements.li, __VLS_elements.li)({
        key: (t.id),
        ...{ class: "row" },
    });
    __VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
        ...{ class: "left" },
    });
    __VLS_asFunctionalElement(__VLS_elements.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.toggle(t.id);
                // @ts-ignore
                [toggle,];
            } },
        type: "checkbox",
        checked: (t.status === 'done'),
    });
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "title" },
    });
    (t.title);
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "date" },
    });
    (t.task_date);
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "right" },
    });
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "badge" },
        ...{ class: (t.status) },
    });
    (t.status);
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.open(t.id);
                // @ts-ignore
                [open,];
            } },
    });
}
if (__VLS_ctx.tasks.length === 0) {
    // @ts-ignore
    [tasks,];
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
        ...{ class: "empty" },
    });
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['list']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['left']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['date']} */ ;
/** @type {__VLS_StyleScopedClasses['right']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        tasks: tasks,
        toggle: toggle,
        open: open,
    }),
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
