import { ref, watch } from "vue";
const props = withDefaults(defineProps(), {
    mode: "create",
    initial: () => ({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        frequency: "daily",
    }),
});
const mode = props.mode;
/** 表单状态 */
const form = ref({
    title: props.initial.title ?? "",
    description: props.initial.description ?? "",
    start_date: props.initial.start_date ?? "",
    end_date: props.initial.end_date ?? "",
    frequency: props.initial.frequency ?? "daily",
});
/** initial 变更时同步到表单（编辑页返回后/异步拉取场景） */
watch(() => props.initial, (v) => {
    form.value = {
        title: v?.title ?? "",
        description: v?.description ?? "",
        start_date: v?.start_date ?? "",
        end_date: v?.end_date ?? "",
        frequency: v?.frequency ?? "daily",
    };
}, { deep: true });
const emit = defineEmits();
function onSubmit() {
    emit("submit", { ...form.value });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    mode: "create",
    initial: () => ({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        frequency: "daily",
    }),
});
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card" },
});
__VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({});
(__VLS_ctx.mode === 'edit' ? '编辑计划' : '新建计划');
// @ts-ignore
[mode,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "mb-2" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.input)({});
(__VLS_ctx.form.title);
// @ts-ignore
[form,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "mb-2" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.textarea)({
    value: (__VLS_ctx.form.description),
});
// @ts-ignore
[form,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "mb-2" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "date",
});
(__VLS_ctx.form.start_date);
// @ts-ignore
[form,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "mb-2" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "date",
});
(__VLS_ctx.form.end_date);
// @ts-ignore
[form,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "mb-2" },
});
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
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.onSubmit) },
    ...{ class: "primary" },
});
// @ts-ignore
[onSubmit,];
(__VLS_ctx.mode === 'edit' ? '保存修改' : '创建计划');
// @ts-ignore
[mode,];
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        mode: mode,
        form: form,
        onSubmit: onSubmit,
    }),
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
