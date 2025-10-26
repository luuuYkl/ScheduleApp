/// <reference types="../node_modules/.vue-global-types/vue_3.5_0.d.ts" />
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";
import { APP_CONFIG } from "@/config";
const router = useRouter();
const userStore = useUserStore();
function logout() {
    userStore.logout();
    router.push("/login");
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    id: "app",
});
__VLS_asFunctionalElement(__VLS_elements.header, __VLS_elements.header)({
    ...{ class: "app-header" },
});
__VLS_asFunctionalElement(__VLS_elements.nav, __VLS_elements.nav)({
    ...{ class: "container flex-between" },
});
__VLS_asFunctionalElement(__VLS_elements.h1, __VLS_elements.h1)({
    ...{ class: "logo" },
});
(__VLS_ctx.APP_CONFIG.APP_NAME);
// @ts-ignore
[APP_CONFIG,];
if (__VLS_ctx.userStore.isLoggedIn) {
    // @ts-ignore
    [userStore,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "user-area" },
    });
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
    (__VLS_ctx.userStore.user?.username);
    // @ts-ignore
    [userStore,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.logout) },
        ...{ class: "danger" },
    });
    // @ts-ignore
    [logout,];
}
__VLS_asFunctionalElement(__VLS_elements.main, __VLS_elements.main)({
    ...{ class: "app-main" },
});
const __VLS_0 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
RouterView;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_elements.footer, __VLS_elements.footer)({
    ...{ class: "app-footer text-center" },
});
__VLS_asFunctionalElement(__VLS_elements.small, __VLS_elements.small)({});
(__VLS_ctx.APP_CONFIG.APP_NAME);
(__VLS_ctx.APP_CONFIG.APP_VERSION);
// @ts-ignore
[APP_CONFIG, APP_CONFIG,];
/** @type {__VLS_StyleScopedClasses['app-header']} */ ;
/** @type {__VLS_StyleScopedClasses['container']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-between']} */ ;
/** @type {__VLS_StyleScopedClasses['logo']} */ ;
/** @type {__VLS_StyleScopedClasses['user-area']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['app-main']} */ ;
/** @type {__VLS_StyleScopedClasses['app-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        APP_CONFIG: APP_CONFIG,
        userStore: userStore,
        logout: logout,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
