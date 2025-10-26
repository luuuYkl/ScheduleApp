/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0.d.ts" />
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import PlanForm from "@/components/plan/PlanForm.vue";
import { usePlanStore } from "@/store/plans";
const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();
const editId = computed(() => {
    const v = route.query.edit;
    return v ? Number(v) : null;
});
const editingPlan = computed(() => editId.value ? planStore.plans.find(p => p.id === editId.value) : null);
onMounted(async () => {
    if (!planStore.plans.length)
        await planStore.loadPlans();
});
async function submit(payload) {
    if (editId.value) {
        await planStore.updatePlan(editId.value, payload);
        alert("保存成功");
    }
    else {
        await planStore.createPlan(payload);
        alert("创建成功");
    }
    router.push("/home");
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "page" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.h1, __VLS_elements.h1)({
    ...{ class: "mb-4" },
});
(__VLS_ctx.editId ? "编辑计划" : "新建计划");
// @ts-ignore
[editId,];
/** @type {[typeof PlanForm, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PlanForm, new PlanForm({
    ...{ 'onSubmit': {} },
    mode: (__VLS_ctx.editId ? 'edit' : 'create'),
    initial: (__VLS_ctx.editingPlan ? {
        title: __VLS_ctx.editingPlan.title,
        description: __VLS_ctx.editingPlan.description,
        start_date: __VLS_ctx.editingPlan.start_date,
        end_date: __VLS_ctx.editingPlan.end_date,
        frequency: __VLS_ctx.editingPlan.frequency,
    } : undefined),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onSubmit': {} },
    mode: (__VLS_ctx.editId ? 'edit' : 'create'),
    initial: (__VLS_ctx.editingPlan ? {
        title: __VLS_ctx.editingPlan.title,
        description: __VLS_ctx.editingPlan.description,
        start_date: __VLS_ctx.editingPlan.start_date,
        end_date: __VLS_ctx.editingPlan.end_date,
        frequency: __VLS_ctx.editingPlan.frequency,
    } : undefined),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
const __VLS_5 = ({ submit: {} },
    { onSubmit: (__VLS_ctx.submit) });
// @ts-ignore
[editId, editingPlan, editingPlan, editingPlan, editingPlan, editingPlan, editingPlan, submit,];
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        PlanForm: PlanForm,
        editId: editId,
        editingPlan: editingPlan,
        submit: submit,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
