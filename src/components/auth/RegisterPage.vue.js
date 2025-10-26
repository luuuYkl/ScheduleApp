/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0.d.ts" />
import AuthForm from "@/components/auth/AuthForm.vue";
import { useRouter } from "vue-router";
const router = useRouter();
function goHome() { router.push("/home"); }
function toLogin() { router.push("/login"); }
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "page flex-center" },
    ...{ style: {} },
});
/** @type {[typeof AuthForm, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AuthForm, new AuthForm({
    ...{ 'onSuccess': {} },
    ...{ 'onSwitch': {} },
    mode: "register",
}));
const __VLS_1 = __VLS_0({
    ...{ 'onSuccess': {} },
    ...{ 'onSwitch': {} },
    mode: "register",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
const __VLS_5 = ({ success: {} },
    { onSuccess: (__VLS_ctx.goHome) });
const __VLS_6 = ({ switch: {} },
    { onSwitch: (__VLS_ctx.toLogin) });
// @ts-ignore
[goHome, toLogin,];
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-center']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        AuthForm: AuthForm,
        goHome: goHome,
        toLogin: toLogin,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
