export default (await import('vue')).defineComponent({
    name: "TaskCard",
    props: {
        title: { type: String, required: true },
        status: { type: String, default: "pending" } // "completed" | "postponed" | "pending"
    },
    computed: {
        statusText() {
            switch (this.status) {
                case "completed":
                    return "已完成";
                case "postponed":
                    return "已推迟";
                default:
                    return "待办";
            }
        },
        statusClass() {
            return `task-${this.status}`;
        }
    }
});
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "task-card" },
    ...{ class: (__VLS_ctx.statusClass) },
});
// @ts-ignore
[statusClass,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "task-content" },
});
__VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
    ...{ class: "task-title" },
});
(__VLS_ctx.title);
// @ts-ignore
[title,];
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "task-status" },
});
(__VLS_ctx.statusText);
// @ts-ignore
[statusText,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "task-actions" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('complete');
            // @ts-ignore
            [$emit,];
        } },
    ...{ class: "btn btn-primary" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('postpone');
            // @ts-ignore
            [$emit,];
        } },
    ...{ class: "btn btn-secondary" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('delete');
            // @ts-ignore
            [$emit,];
        } },
    ...{ class: "btn btn-danger" },
});
/** @type {__VLS_StyleScopedClasses['task-card']} */ ;
/** @type {__VLS_StyleScopedClasses['task-content']} */ ;
/** @type {__VLS_StyleScopedClasses['task-title']} */ ;
/** @type {__VLS_StyleScopedClasses['task-status']} */ ;
/** @type {__VLS_StyleScopedClasses['task-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
var __VLS_dollars;
let __VLS_self;
