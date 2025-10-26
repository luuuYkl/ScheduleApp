import { reactive, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
/*
  功能增强：
  - 支持创建与编辑（通过 query.edit 判断）
  - 表单验证：必填项检查、日期范围校验
  - 提交后创建/更新计划并跳转到计划概览（/home -> PlanOverview.vue）
*/
const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();
// 编辑态判断（支持 ?edit=ID）
const editId = ref(null);
if (route.query.edit) {
    const q = Array.isArray(route.query.edit) ? route.query.edit[0] : route.query.edit;
    const n = Number(q);
    if (!Number.isNaN(n))
        editId.value = n;
}
// 表单模型
const form = reactive({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    frequency: "daily",
});
// 验证错误集合
const errors = reactive({
    title: "",
    start_date: "",
    end_date: "",
});
// 提交状态
const submitting = ref(false);
// 编辑态加载数据
async function loadForEdit() {
    if (!editId.value)
        return;
    // 尝试从 store 缓存取，若没有则触发加载
    let plan = (planStore.getPlan && planStore.getPlan(editId.value)) ?? null;
    if (!plan) {
        await planStore.loadPlans();
        plan = planStore.plans.find((p) => p.id === editId.value) ?? null;
    }
    if (!plan) {
        alert("未找到要编辑的计划");
        router.push("/home");
        return;
    }
    form.title = plan.title ?? "";
    form.description = plan.description ?? "";
    form.start_date = plan.start_date ?? "";
    form.end_date = plan.end_date ?? "";
    form.frequency = plan.frequency ?? "daily";
}
// 基本表单校验
function validate() {
    errors.title = "";
    errors.start_date = "";
    errors.end_date = "";
    if (!form.title || form.title.trim().length < 2) {
        errors.title = "标题至少需要 2 个字符";
    }
    if (!form.start_date) {
        errors.start_date = "请选择开始日期";
    }
    if (!form.end_date) {
        errors.end_date = "请选择结束日期";
    }
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
        errors.end_date = "结束日期不能早于开始日期";
    }
    return !errors.title && !errors.start_date && !errors.end_date;
}
// 提交处理：创建或更新
async function createPlan() {
    if (!validate())
        return;
    submitting.value = true;
    const payload = {
        title: form.title.trim(),
        description: form.description?.trim() ?? "",
        start_date: form.start_date,
        end_date: form.end_date,
        frequency: form.frequency,
    };
    try {
        if (editId.value) {
            if (!planStore.updatePlan)
                throw new Error("更新接口未实现");
            await planStore.updatePlan(editId.value, payload);
        }
        else {
            if (!planStore.createPlan)
                throw new Error("创建接口未实现");
            await planStore.createPlan(payload);
        }
        // 刷新计划列表，保证 PlanOverview 能马上显示最新数据
        if (planStore.loadPlans)
            await planStore.loadPlans();
        // 跳回计划概览页面（PlanOverview.vue 在 /home）
        router.push("/home");
    }
    catch (e) {
        console.error(e);
        alert(e?.message || "保存失败");
    }
    finally {
        submitting.value = false;
    }
}
// 返回操作（后退或回首页）
function goBack() {
    if (window.history.length > 1)
        router.back();
    else
        router.push("/home");
}
// 组件挂载时，若为编辑态则加载数据
onMounted(async () => {
    if (editId.value) {
        await loadForEdit();
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['form']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "page plan-create" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.h1, __VLS_elements.h1)({});
(__VLS_ctx.editId ? "编辑计划" : "创建新计划");
// @ts-ignore
[editId,];
__VLS_asFunctionalElement(__VLS_elements.form, __VLS_elements.form)({
    ...{ onSubmit: (__VLS_ctx.createPlan) },
    ...{ class: "form" },
    novalidate: true,
});
// @ts-ignore
[createPlan,];
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.input)({
    value: (__VLS_ctx.form.title),
    type: "text",
    placeholder: "计划标题",
    required: true,
});
// @ts-ignore
[form,];
if (__VLS_ctx.errors.title) {
    // @ts-ignore
    [errors,];
    __VLS_asFunctionalElement(__VLS_elements.small, __VLS_elements.small)({
        ...{ class: "error" },
    });
    (__VLS_ctx.errors.title);
    // @ts-ignore
    [errors,];
}
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.textarea, __VLS_elements.textarea)({
    value: (__VLS_ctx.form.description),
    placeholder: "计划描述（可选）",
    rows: "3",
});
// @ts-ignore
[form,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "row" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "date",
    required: true,
});
(__VLS_ctx.form.start_date);
// @ts-ignore
[form,];
if (__VLS_ctx.errors.start_date) {
    // @ts-ignore
    [errors,];
    __VLS_asFunctionalElement(__VLS_elements.small, __VLS_elements.small)({
        ...{ class: "error" },
    });
    (__VLS_ctx.errors.start_date);
    // @ts-ignore
    [errors,];
}
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "date",
    required: true,
});
(__VLS_ctx.form.end_date);
// @ts-ignore
[form,];
if (__VLS_ctx.errors.end_date) {
    // @ts-ignore
    [errors,];
    __VLS_asFunctionalElement(__VLS_elements.small, __VLS_elements.small)({
        ...{ class: "error" },
    });
    (__VLS_ctx.errors.end_date);
    // @ts-ignore
    [errors,];
}
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
    disabled: (__VLS_ctx.submitting),
});
// @ts-ignore
[submitting,];
(__VLS_ctx.submitting ? "提交中..." : (__VLS_ctx.editId ? "保存修改" : "保存计划"));
// @ts-ignore
[editId, submitting,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.goBack) },
    type: "button",
    ...{ class: "secondary" },
});
// @ts-ignore
[goBack,];
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-create']} */ ;
/** @type {__VLS_StyleScopedClasses['form']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['ops']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        editId: editId,
        form: form,
        errors: errors,
        submitting: submitting,
        createPlan: createPlan,
        goBack: goBack,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
