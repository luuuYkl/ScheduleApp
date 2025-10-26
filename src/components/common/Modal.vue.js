const props = defineProps();
const emit = defineEmits(["update:visible"]);
function close() {
    emit("update:visible", false);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.visible) {
    // @ts-ignore
    [visible,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ onClick: (__VLS_ctx.close) },
        ...{ class: "overlay" },
    });
    // @ts-ignore
    [close,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "modal" },
    });
    __VLS_asFunctionalElement(__VLS_elements.header, __VLS_elements.header)({
        ...{ class: "modal-header" },
    });
    __VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({});
    (__VLS_ctx.title);
    // @ts-ignore
    [title,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.close) },
        ...{ class: "close-btn" },
    });
    // @ts-ignore
    [close,];
    __VLS_asFunctionalElement(__VLS_elements.main, __VLS_elements.main)({
        ...{ class: "modal-body" },
    });
    var __VLS_0 = {};
    if (__VLS_ctx.$slots.footer) {
        // @ts-ignore
        [$slots,];
        __VLS_asFunctionalElement(__VLS_elements.footer, __VLS_elements.footer)({
            ...{ class: "modal-footer" },
        });
        var __VLS_2 = {};
    }
}
/** @type {__VLS_StyleScopedClasses['overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-footer']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0, __VLS_3 = __VLS_2;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        close: close,
    }),
    emits: {},
    __typeProps: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    emits: {},
    __typeProps: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
