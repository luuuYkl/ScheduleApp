import { computed, ref, onMounted } from "vue";
import { useTaskStore } from "@/store/tasks";
import { useRoute } from "vue-router";
const taskStore = useTaskStore();
const planId = useRoute().params.id;
// 当前月份和年份
const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());
const selectedDay = ref(null);
// 星期天到星期六
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
// 获取本月的所有天数及任务
const daysInMonth = computed(() => {
    const firstDay = new Date(currentYear.value, currentMonth.value, 1);
    const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0);
    const days = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const tasks = taskStore.tasks.filter((task) => task.plan_id === Number(planId) && task.task_date === dateStr);
        days.push({ date: dateStr, tasks });
    }
    return days;
});
// 月份标签
const monthLabel = computed(() => {
    const monthNames = [
        '一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];
    return `${monthNames[currentMonth.value]} ${currentYear.value}`;
});
// 上一个月
function prevMonth() {
    if (currentMonth.value === 0) {
        currentMonth.value = 11;
        currentYear.value -= 1;
    }
    else {
        currentMonth.value -= 1;
    }
}
// 下一个月
function nextMonth() {
    if (currentMonth.value === 11) {
        currentMonth.value = 0;
        currentYear.value += 1;
    }
    else {
        currentMonth.value += 1;
    }
}
// 查看某天的任务
function showTasks(day) {
    selectedDay.value = day;
}
// 判断当天的所有任务是否都完成
function isAllTasksDone(day) {
    return day.tasks.every((task) => task.status === 'done');
}
onMounted(async () => {
    await taskStore.loadTasks(Number(planId)); // 加载任务
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['day']} */ ;
/** @type {__VLS_StyleScopedClasses['task-list']} */ ;
/** @type {__VLS_StyleScopedClasses['task-list']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "calendar" },
});
__VLS_asFunctionalElement(__VLS_elements.header, __VLS_elements.header)({});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.prevMonth) },
});
// @ts-ignore
[prevMonth,];
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
(__VLS_ctx.monthLabel);
// @ts-ignore
[monthLabel,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.nextMonth) },
});
// @ts-ignore
[nextMonth,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "days" },
});
for (const [day] of __VLS_getVForSourceType((__VLS_ctx.weekDays))) {
    // @ts-ignore
    [weekDays,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "day-name" },
        key: (day),
    });
    (day);
}
for (const [day] of __VLS_getVForSourceType((__VLS_ctx.daysInMonth))) {
    // @ts-ignore
    [daysInMonth,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.showTasks(day);
                // @ts-ignore
                [showTasks,];
            } },
        key: (day.date),
        ...{ class: "day" },
        ...{ class: ({ 'has-tasks': day.tasks.length > 0, 'done': __VLS_ctx.isAllTasksDone(day) }) },
    });
    // @ts-ignore
    [isAllTasksDone,];
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
    (day.date);
    if (day.tasks.length) {
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({});
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
        (day.tasks.length);
    }
}
if (__VLS_ctx.selectedDay) {
    // @ts-ignore
    [selectedDay,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "task-list" },
    });
    __VLS_asFunctionalElement(__VLS_elements.h3, __VLS_elements.h3)({});
    (__VLS_ctx.selectedDay.date);
    // @ts-ignore
    [selectedDay,];
    __VLS_asFunctionalElement(__VLS_elements.ul, __VLS_elements.ul)({});
    for (const [task] of __VLS_getVForSourceType((__VLS_ctx.selectedDay.tasks))) {
        // @ts-ignore
        [selectedDay,];
        __VLS_asFunctionalElement(__VLS_elements.li, __VLS_elements.li)({
            key: (task.id),
        });
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
        (task.title);
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
        (task.status === 'done' ? '✅ 完成' : '❌ 未完成');
    }
}
/** @type {__VLS_StyleScopedClasses['calendar']} */ ;
/** @type {__VLS_StyleScopedClasses['days']} */ ;
/** @type {__VLS_StyleScopedClasses['day-name']} */ ;
/** @type {__VLS_StyleScopedClasses['day']} */ ;
/** @type {__VLS_StyleScopedClasses['has-tasks']} */ ;
/** @type {__VLS_StyleScopedClasses['done']} */ ;
/** @type {__VLS_StyleScopedClasses['task-list']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        selectedDay: selectedDay,
        weekDays: weekDays,
        daysInMonth: daysInMonth,
        monthLabel: monthLabel,
        prevMonth: prevMonth,
        nextMonth: nextMonth,
        showTasks: showTasks,
        isAllTasksDone: isAllTasksDone,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
