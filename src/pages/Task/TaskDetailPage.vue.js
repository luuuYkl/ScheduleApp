import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTaskStore } from "@/store/tasks";
import { useLogStore } from "@/store/log"; // 新增
import { useUserStore } from "@/store/user"; // 新增
import TaskProgress from "@/components/task/TaskProgress.vue";
import TaskCheckBox from "@/components/task/TaskCheckBox.vue";
const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const logStore = useLogStore(); // 新增
const userStore = useUserStore(); // 新增
const id = Number(route.params.id);
const toggling = ref(false);
// 当前任务
const task = computed(() => taskStore.tasks.find(t => t.id === id));
// 使用计算属性处理任务完成状态
const isTaskDone = computed({
    get: () => {
        const isDone = task.value?.status === 'done';
        console.log('[Debug] isTaskDone.get:', isDone);
        return isDone;
    },
    set: async (newValue) => {
        console.log('[Debug] isTaskDone.set 开始, newValue:', newValue);
        if (!task.value) {
            console.error('[Error] task.value 为空');
            return;
        }
        console.log('[Debug] 当前任务:', {
            id: task.value.id,
            status: task.value.status,
            plan_id: task.value.plan_id
        });
        toggling.value = true;
        try {
            console.log('[Debug] 开始更新任务状态');
            await taskStore.toggleTaskStatus(task.value.id);
            console.log('[Debug] 任务状态更新完成');
            if (newValue) {
                const userId = userStore.user?.id;
                console.log('[Debug] 用户ID:', userId);
                if (!userId) {
                    console.error('[Error] 用户未登录或ID无效');
                    return;
                }
                const planTasks = taskStore.tasks.filter(t => t.plan_id === task.value.plan_id);
                console.log('[Debug] 找到相关计划任务:', planTasks.length, '个');
                console.log('[Debug] 任务详情:', planTasks);
                try {
                    console.log('[Debug] 开始生成日志');
                    const newLog = await logStore.generateTodayLog(userId, planTasks);
                    console.log('[Debug] 日志生成成功:', newLog);
                }
                catch (err) {
                    console.error('[Error] 生成日志失败:', err);
                }
            }
        }
        catch (err) {
            console.error('[Error] 更新任务状态失败:', err);
        }
        finally {
            toggling.value = false;
            console.log('[Debug] 操作完成');
        }
    }
});
// 计划层面的整体进度（同 plan_id 的所有任务计算）
const planProgress = computed(() => {
    if (!task.value)
        return null;
    const list = taskStore.tasks.filter(t => t.plan_id === task.value.plan_id);
    if (list.length === 0)
        return 0;
    const done = list.filter(t => t.status === "done").length;
    return Math.round((done / list.length) * 100);
});
onMounted(async () => {
    // 若刷新后 store 为空，加载一次任务（简单做法：全量加载）
    if (!task.value) {
        await taskStore.loadTasks();
    }
});
function back() {
    router.back();
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
    ...{ class: "page card" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.h1, __VLS_elements.h1)({
    ...{ class: "mb-2" },
});
if (__VLS_ctx.task) {
    // @ts-ignore
    [task,];
    __VLS_asFunctionalElement(__VLS_elements.section, __VLS_elements.section)({
        ...{ class: "block" },
    });
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({});
    __VLS_asFunctionalElement(__VLS_elements.strong, __VLS_elements.strong)({});
    (__VLS_ctx.task.title);
    // @ts-ignore
    [task,];
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({});
    __VLS_asFunctionalElement(__VLS_elements.strong, __VLS_elements.strong)({});
    (__VLS_ctx.task.task_date);
    // @ts-ignore
    [task,];
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({});
    __VLS_asFunctionalElement(__VLS_elements.strong, __VLS_elements.strong)({});
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: (['badge', __VLS_ctx.task.status]) },
    });
    // @ts-ignore
    [task,];
    (__VLS_ctx.task.status);
    // @ts-ignore
    [task,];
    __VLS_asFunctionalElement(__VLS_elements.section, __VLS_elements.section)({
        ...{ class: "block" },
    });
    /** @type {[typeof TaskProgress, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(TaskProgress, new TaskProgress({
        value: (__VLS_ctx.task.status === 'done' ? 100 : 0),
        label: "该任务进度",
    }));
    const __VLS_1 = __VLS_0({
        value: (__VLS_ctx.task.status === 'done' ? 100 : 0),
        label: "该任务进度",
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    // @ts-ignore
    [task,];
    if (__VLS_ctx.planProgress !== null) {
        // @ts-ignore
        [planProgress,];
        __VLS_asFunctionalElement(__VLS_elements.section, __VLS_elements.section)({
            ...{ class: "block" },
        });
        /** @type {[typeof TaskProgress, ]} */ ;
        // @ts-ignore
        const __VLS_4 = __VLS_asFunctionalComponent(TaskProgress, new TaskProgress({
            value: (__VLS_ctx.planProgress),
            label: "所属计划整体进度",
        }));
        const __VLS_5 = __VLS_4({
            value: (__VLS_ctx.planProgress),
            label: "所属计划整体进度",
        }, ...__VLS_functionalComponentArgsRest(__VLS_4));
        // @ts-ignore
        [planProgress,];
        __VLS_asFunctionalElement(__VLS_elements.small, __VLS_elements.small)({
            ...{ class: "hint" },
        });
    }
    __VLS_asFunctionalElement(__VLS_elements.section, __VLS_elements.section)({
        ...{ class: "block" },
    });
    /** @type {[typeof TaskCheckBox, typeof TaskCheckBox, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(TaskCheckBox, new TaskCheckBox({
        modelValue: (__VLS_ctx.isTaskDone),
        disabled: (__VLS_ctx.toggling),
    }));
    const __VLS_9 = __VLS_8({
        modelValue: (__VLS_ctx.isTaskDone),
        disabled: (__VLS_ctx.toggling),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    const { default: __VLS_11 } = __VLS_10.slots;
    // @ts-ignore
    [isTaskDone, toggling,];
    (__VLS_ctx.isTaskDone ? '标记为未完成' : '标记为已完成');
    // @ts-ignore
    [isTaskDone,];
    var __VLS_10;
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "ops" },
    });
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.back) },
    });
    // @ts-ignore
    [back,];
}
else {
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({});
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['ops']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        TaskProgress: TaskProgress,
        TaskCheckBox: TaskCheckBox,
        toggling: toggling,
        task: task,
        isTaskDone: isTaskDone,
        planProgress: planProgress,
        back: back,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
