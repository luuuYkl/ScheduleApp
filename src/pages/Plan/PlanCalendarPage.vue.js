import { useRoute } from "vue-router";
import CalendarView from "@/components/calendar/CalendarView.vue";
const route = useRoute();
const planId = Number(route.params.id);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "page" },
});
__VLS_asFunctionalElement(__VLS_elements.h1, __VLS_elements.h1)({
    ...{ class: "mb-4" },
});
(__VLS_ctx.planId);
// @ts-ignore
[planId,];
/** @type {[typeof CalendarView, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(CalendarView, new CalendarView({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        CalendarView: CalendarView,
        planId: planId,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
