const __VLS_props = defineProps();
const emit = defineEmits();
// 处理 checkbox 改变事件
function handleChange(e) {
    const target = e.target;
    emit('update:modelValue', target.checked);
    emit('change', target.checked);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['task-checkbox']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "task-checkbox" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    ...{ onChange: (__VLS_ctx.handleChange) },
    type: "checkbox",
    checked: (__VLS_ctx.modelValue),
});
// @ts-ignore
[handleChange, modelValue,];
var __VLS_0 = {};
/** @type {__VLS_StyleScopedClasses['task-checkbox']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        handleChange: handleChange,
    }),
    __typeEmits: {},
    __typeProps: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
