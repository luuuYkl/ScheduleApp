/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0.d.ts" />
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { useUserStore } from "@/store/user";
import { useTaskStore } from "@/store/tasks";
const route = useRoute();
const userStore = useUserStore();
const taskStore = useTaskStore();
const planId = Number(route.params.id);
const list = computed(() => taskStore.tasks.filter(x => x.plan_id === planId));
// 新增表单
const form = reactive({
    title: "",
    task_date: new Date().toISOString().slice(0, 10)
});
async function addTask() {
    if (!form.title)
        return alert("请填写标题");
    await taskStore.createTask({
        plan_id: planId,
        user_id: userStore.user?.id || 1,
        title: form.title,
        task_date: form.task_date
    });
    form.title = "";
    await taskStore.loadTasks(planId);
}
// 完成切换
async function toggle(id) {
    await taskStore.toggleTaskStatus(id);
}
// 删除
async function remove(id) {
    if (!confirm("确认删除该任务？"))
        return;
    await taskStore.deleteTask(id);
    await taskStore.loadTasks(planId);
}
// 行内编辑
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
/**
 * ✅ 修复：updateTask 需要两个参数 (id, payload)
 */
async function saveEdit() {
    await taskStore.updateTask(edit.id, {
        title: edit.title,
        task_date: edit.task_date
    });
    editingId.value = null;
    await taskStore.loadTasks(planId);
}
onMounted(async () => {
    await taskStore.loadTasks(planId);
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
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.h1, __VLS_elements.h1)({
    ...{ class: "mb-4" },
});
(__VLS_ctx.planId);
// @ts-ignore
[planId,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.h3, __VLS_elements.h3)({});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "row" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    value: (__VLS_ctx.form.title),
    type: "text",
    placeholder: "任务标题（如：第N天打卡）",
});
// @ts-ignore
[form,];
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "date",
});
(__VLS_ctx.form.task_date);
// @ts-ignore
[form,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.addTask) },
    ...{ class: "primary" },
});
// @ts-ignore
[addTask,];
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
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "mt-2" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$router.push('/home');
            // @ts-ignore
            [$router,];
        } },
});
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
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
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        planId: planId,
        list: list,
        form: form,
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
