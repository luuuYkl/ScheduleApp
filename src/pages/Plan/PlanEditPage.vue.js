import { reactive, ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
import { useUserStore } from "@/store/user";
const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();
const userStore = useUserStore();
// 解析 planId（确保为数字）
const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
const planId = Number(rawId);
// 表单模型
const form = reactive({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    frequency: "daily",
});
const saving = ref(false);
// 任务相关状态与编辑态
const newTaskTitle = ref("");
const newTaskDate = ref(new Date().toISOString().slice(0, 10));
const editingId = ref(null);
const editTitle = ref("");
const editDate = ref("");
// 任务列表（来自 store）
const tasks = computed(() => planStore.tasks.filter((t) => t.plan_id === planId));
// 加载计划与任务
async function loadData() {
    // 确保本地缓存有计划与任务
    await Promise.all([planStore.loadPlans(), planStore.loadTasks(planId)]);
    const plan = planStore.getPlan(planId);
    if (!plan) {
        alert("未找到该计划");
        router.push("/home");
        return;
    }
    // 填充表单
    form.title = plan.title ?? "";
    form.description = plan.description ?? "";
    form.start_date = plan.start_date ?? "";
    form.end_date = plan.end_date ?? "";
    form.frequency = plan.frequency ?? "daily";
}
onMounted(() => {
    loadData();
});
// 保存计划（更新）
async function savePlan() {
    if (!form.title)
        return alert("请填写标题");
    saving.value = true;
    try {
        if (!planStore.updatePlan)
            throw new Error("计划更新接口未实现");
        await planStore.updatePlan(planId, {
            title: form.title,
            description: form.description,
            start_date: form.start_date,
            end_date: form.end_date,
            frequency: form.frequency,
        });
        alert("保存成功");
        // 返回上页
        router.back();
    }
    catch (e) {
        alert(e?.message || "保存失败");
    }
    finally {
        saving.value = false;
    }
}
function cancel() {
    router.back();
}
/* ---------------- 任务操作 ---------------- */
async function addTask() {
    if (!newTaskTitle.value)
        return alert("请输入任务标题");
    const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id") || 0);
    if (!userId)
        return alert("请先登录");
    try {
        await planStore.createTask({
            plan_id: planId,
            user_id: userId,
            title: newTaskTitle.value,
            task_date: newTaskDate.value,
        });
        newTaskTitle.value = "";
        newTaskDate.value = new Date().toISOString().slice(0, 10);
        await planStore.loadTasks(planId);
    }
    catch (e) {
        alert(e?.message || "添加任务失败");
    }
}
function startEdit(t) {
    editingId.value = t.id;
    editTitle.value = t.title;
    editDate.value = t.task_date;
}
function cancelEdit() {
    editingId.value = null;
    editTitle.value = "";
    editDate.value = "";
}
async function saveTaskEdit() {
    if (!editingId.value)
        return;
    if (!editTitle.value)
        return alert("请输入任务标题");
    try {
        await planStore.updateTask(editingId.value, {
            title: editTitle.value,
            task_date: editDate.value,
        });
        editingId.value = null;
        await planStore.loadTasks(planId);
    }
    catch (e) {
        alert(e?.message || "更新任务失败");
    }
}
async function deleteTask(id) {
    if (!confirm("确认删除该任务？"))
        return;
    try {
        await planStore.deleteTask(id);
        await planStore.loadTasks(planId);
    }
    catch (e) {
        alert(e?.message || "删除任务失败");
    }
}
async function toggleTask(id) {
    try {
        await planStore.toggleTaskStatus(id);
        // store 已更新，本地列表会响应；如需强制刷新可调用 loadTasks
    }
    catch (e) {
        alert(e?.message || "切换状态失败");
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['form']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "page card" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.h1, __VLS_elements.h1)({});
__VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
    ...{ class: "text-gray" },
});
(__VLS_ctx.planId);
// @ts-ignore
[planId,];
__VLS_asFunctionalElement(__VLS_elements.form, __VLS_elements.form)({
    ...{ onSubmit: (__VLS_ctx.savePlan) },
    ...{ class: "form" },
});
// @ts-ignore
[savePlan,];
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.input)({
    value: (__VLS_ctx.form.title),
    type: "text",
    placeholder: "计划标题",
    required: true,
});
// @ts-ignore
[form,];
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.textarea, __VLS_elements.textarea)({
    value: (__VLS_ctx.form.description),
    placeholder: "计划描述（可选）",
});
// @ts-ignore
[form,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "row" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "date",
});
(__VLS_ctx.form.start_date);
// @ts-ignore
[form,];
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "date",
});
(__VLS_ctx.form.end_date);
// @ts-ignore
[form,];
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
    value: (__VLS_ctx.form.frequency),
});
// @ts-ignore
[form,];
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "daily",
});
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "weekly",
});
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "monthly",
});
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "once",
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "ops" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ class: "primary" },
    type: "submit",
    disabled: (__VLS_ctx.saving),
});
// @ts-ignore
[saving,];
(__VLS_ctx.saving ? '保存中...' : '保存计划');
// @ts-ignore
[saving,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.cancel) },
    type: "button",
    ...{ class: "secondary" },
});
// @ts-ignore
[cancel,];
__VLS_asFunctionalElement(__VLS_elements.section, __VLS_elements.section)({
    ...{ class: "tasks" },
});
__VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "task-add" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    placeholder: "新任务标题",
});
(__VLS_ctx.newTaskTitle);
// @ts-ignore
[newTaskTitle,];
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "date",
});
(__VLS_ctx.newTaskDate);
// @ts-ignore
[newTaskDate,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.addTask) },
    ...{ class: "primary" },
});
// @ts-ignore
[addTask,];
if (__VLS_ctx.tasks.length) {
    // @ts-ignore
    [tasks,];
    __VLS_asFunctionalElement(__VLS_elements.ul, __VLS_elements.ul)({
        ...{ class: "task-list" },
    });
    for (const [t] of __VLS_getVForSourceType((__VLS_ctx.tasks))) {
        // @ts-ignore
        [tasks,];
        __VLS_asFunctionalElement(__VLS_elements.li, __VLS_elements.li)({
            key: (t.id),
            ...{ class: ({ done: t.status === 'done' }) },
        });
        if (__VLS_ctx.editingId !== t.id) {
            // @ts-ignore
            [editingId,];
            __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
                ...{ class: "task-row" },
            });
            __VLS_asFunctionalElement(__VLS_elements.input)({
                ...{ onChange: (...[$event]) => {
                        if (!(__VLS_ctx.tasks.length))
                            return;
                        if (!(__VLS_ctx.editingId !== t.id))
                            return;
                        __VLS_ctx.toggleTask(t.id);
                        // @ts-ignore
                        [toggleTask,];
                    } },
                type: "checkbox",
                checked: (t.status === 'done'),
            });
            __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
                ...{ class: "task-main" },
            });
            __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
                ...{ class: "title" },
            });
            (t.title);
            __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
                ...{ class: "meta" },
            });
            (t.task_date);
            __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
                ...{ class: "task-actions" },
            });
            __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.tasks.length))
                            return;
                        if (!(__VLS_ctx.editingId !== t.id))
                            return;
                        __VLS_ctx.startEdit(t);
                        // @ts-ignore
                        [startEdit,];
                    } },
            });
            __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.tasks.length))
                            return;
                        if (!(__VLS_ctx.editingId !== t.id))
                            return;
                        __VLS_ctx.deleteTask(t.id);
                        // @ts-ignore
                        [deleteTask,];
                    } },
                ...{ class: "danger" },
            });
        }
        else {
            __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
                ...{ class: "task-edit" },
            });
            __VLS_asFunctionalElement(__VLS_elements.input)({});
            (__VLS_ctx.editTitle);
            // @ts-ignore
            [editTitle,];
            __VLS_asFunctionalElement(__VLS_elements.input)({
                type: "date",
            });
            (__VLS_ctx.editDate);
            // @ts-ignore
            [editDate,];
            __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
                ...{ onClick: (__VLS_ctx.saveTaskEdit) },
                ...{ class: "primary" },
            });
            // @ts-ignore
            [saveTaskEdit,];
            __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
                ...{ onClick: (__VLS_ctx.cancelEdit) },
            });
            // @ts-ignore
            [cancelEdit,];
        }
    }
}
else {
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
        ...{ class: "text-gray" },
    });
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray']} */ ;
/** @type {__VLS_StyleScopedClasses['form']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['ops']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['tasks']} */ ;
/** @type {__VLS_StyleScopedClasses['task-add']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['task-list']} */ ;
/** @type {__VLS_StyleScopedClasses['done']} */ ;
/** @type {__VLS_StyleScopedClasses['task-row']} */ ;
/** @type {__VLS_StyleScopedClasses['task-main']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['meta']} */ ;
/** @type {__VLS_StyleScopedClasses['task-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['task-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        planId: planId,
        form: form,
        saving: saving,
        newTaskTitle: newTaskTitle,
        newTaskDate: newTaskDate,
        editingId: editingId,
        editTitle: editTitle,
        editDate: editDate,
        tasks: tasks,
        savePlan: savePlan,
        cancel: cancel,
        addTask: addTask,
        startEdit: startEdit,
        cancelEdit: cancelEdit,
        saveTaskEdit: saveTaskEdit,
        deleteTask: deleteTask,
        toggleTask: toggleTask,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
