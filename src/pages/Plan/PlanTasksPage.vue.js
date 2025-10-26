import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { useTaskStore } from "@/store/tasks";
import { useUserStore } from "@/store/user"; // 新增
const route = useRoute();
const taskStore = useTaskStore();
const userStore = useUserStore(); // 新增
const planId = Number(route.params.id);
const list = computed(() => taskStore.tasks.filter(x => x.plan_id === planId));
const form = reactive({
    title: "",
    task_date: new Date().toISOString().slice(0, 10),
});
const submitting = ref(false);
async function addTask() {
    if (!form.title)
        return alert("请填写任务标题");
    if (!form.task_date)
        return alert("请选择任务日期");
    const userId = userStore.user?.id ?? Number(localStorage.getItem("user_id") || 0);
    if (!userId)
        return alert("请先登录");
    submitting.value = true;
    try {
        await taskStore.createTask({
            plan_id: planId,
            user_id: userId,
            title: form.title,
            task_date: form.task_date,
        });
        // 重置表单
        form.title = "";
        form.task_date = new Date().toISOString().slice(0, 10);
        // 刷新任务列表（可选，如果 store 已自动更新则不需要）
        await taskStore.loadTasks(planId);
    }
    catch (e) {
        alert(e?.message || "添加失败，请重试");
    }
    finally {
        submitting.value = false;
    }
}
async function toggle(id) {
    await taskStore.toggleTaskStatus(id);
}
async function remove(id) {
    if (!confirm("确认删除该任务？"))
        return;
    await taskStore.deleteTask(id);
}
const editingId = ref(null);
const edit = reactive({ id: 0, title: "", task_date: "" });
function startEdit(t) {
    editingId.value = t.id;
    edit.id = t.id;
    edit.title = t.title;
    edit.task_date = t.task_date;
}
function cancelEdit() {
    editingId.value = null;
}
async function saveEdit() {
    await taskStore.updateTask(edit.id, {
        title: edit.title,
        task_date: edit.task_date,
    });
    editingId.value = null;
}
onMounted(async () => {
    await taskStore.loadTasks(planId);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "page" },
});
__VLS_asFunctionalElement(__VLS_elements.h1, __VLS_elements.h1)({
    ...{ class: "mb-4" },
});
(__VLS_ctx.planId);
// @ts-ignore
[planId,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card mb-4" },
});
__VLS_asFunctionalElement(__VLS_elements.h3, __VLS_elements.h3)({});
__VLS_asFunctionalElement(__VLS_elements.form, __VLS_elements.form)({
    ...{ onSubmit: (__VLS_ctx.addTask) },
    ...{ class: "add-form" },
});
// @ts-ignore
[addTask,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "form-row" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    value: (__VLS_ctx.form.title),
    type: "text",
    placeholder: "任务标题",
    required: true,
});
// @ts-ignore
[form,];
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "date",
    required: true,
});
(__VLS_ctx.form.task_date);
// @ts-ignore
[form,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    type: "submit",
    ...{ class: "primary" },
    disabled: (__VLS_ctx.submitting),
});
// @ts-ignore
[submitting,];
(__VLS_ctx.submitting ? '添加中...' : '添加任务');
// @ts-ignore
[submitting,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_elements.h3, __VLS_elements.h3)({});
if (__VLS_ctx.list.length) {
    // @ts-ignore
    [list,];
    __VLS_asFunctionalElement(__VLS_elements.ul, __VLS_elements.ul)({
        ...{ class: "list" },
    });
    for (const [t] of __VLS_getVForSourceType((__VLS_ctx.list))) {
        // @ts-ignore
        [list,];
        __VLS_asFunctionalElement(__VLS_elements.li, __VLS_elements.li)({
            key: (t.id),
            ...{ class: "item" },
        });
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "left" },
        });
        __VLS_asFunctionalElement(__VLS_elements.input)({
            ...{ onChange: (...[$event]) => {
                    if (!(__VLS_ctx.list.length))
                        return;
                    __VLS_ctx.toggle(t.id);
                    // @ts-ignore
                    [toggle,];
                } },
            type: "checkbox",
            checked: (t.status === 'done'),
        });
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "info" },
        });
        __VLS_asFunctionalElement(__VLS_elements.strong, __VLS_elements.strong)({});
        (t.title);
        __VLS_asFunctionalElement(__VLS_elements.small, __VLS_elements.small)({});
        (t.task_date);
        (t.status);
        if (__VLS_ctx.editingId !== t.id) {
            // @ts-ignore
            [editingId,];
            __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
                ...{ class: "ops" },
            });
            __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.list.length))
                            return;
                        if (!(__VLS_ctx.editingId !== t.id))
                            return;
                        __VLS_ctx.startEdit(t);
                        // @ts-ignore
                        [startEdit,];
                    } },
                ...{ class: "secondary" },
            });
            __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.list.length))
                            return;
                        if (!(__VLS_ctx.editingId !== t.id))
                            return;
                        __VLS_ctx.remove(t.id);
                        // @ts-ignore
                        [remove,];
                    } },
                ...{ class: "danger" },
            });
        }
        else {
            __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
                ...{ class: "edit" },
            });
            __VLS_asFunctionalElement(__VLS_elements.input)({
                value: (__VLS_ctx.edit.title),
                type: "text",
            });
            // @ts-ignore
            [edit,];
            __VLS_asFunctionalElement(__VLS_elements.input)({
                type: "date",
            });
            (__VLS_ctx.edit.task_date);
            // @ts-ignore
            [edit,];
            __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
                ...{ onClick: (__VLS_ctx.saveEdit) },
                ...{ class: "primary" },
            });
            // @ts-ignore
            [saveEdit,];
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
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['add-form']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['list']} */ ;
/** @type {__VLS_StyleScopedClasses['item']} */ ;
/** @type {__VLS_StyleScopedClasses['left']} */ ;
/** @type {__VLS_StyleScopedClasses['info']} */ ;
/** @type {__VLS_StyleScopedClasses['ops']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['edit']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        planId: planId,
        list: list,
        form: form,
        submitting: submitting,
        addTask: addTask,
        toggle: toggle,
        remove: remove,
        editingId: editingId,
        edit: edit,
        startEdit: startEdit,
        cancelEdit: cancelEdit,
        saveEdit: saveEdit,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
