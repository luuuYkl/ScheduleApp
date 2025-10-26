/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0.d.ts" />
const __VLS_props = defineProps();
const __VLS_emit = defineEmits();
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "row" },
    ...{ class: ({ disabled: __VLS_ctx.disabled }) },
});
// @ts-ignore
[disabled,];
__VLS_asFunctionalElement(__VLS_elements.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.$emit('toggle');
            // @ts-ignore
            [$emit,];
        } },
    type: "checkbox",
    checked: (__VLS_ctx.checked),
    disabled: (__VLS_ctx.disabled),
});
// @ts-ignore
[disabled, checked,];
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "text" },
});
var __VLS_0 = {};
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled']} */ ;
/** @type {__VLS_StyleScopedClasses['text']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({}),
    __typeEmits: {},
    __typeProps: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
