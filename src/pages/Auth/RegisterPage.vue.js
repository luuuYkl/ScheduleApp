import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";
const router = useRouter();
const userStore = useUserStore();
const username = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");
async function register() {
    loading.value = true;
    error.value = "";
    try {
        await userStore.register({
            username: username.value,
            email: email.value,
            password: password.value
        });
        router.push("/home");
    }
    catch (err) {
        error.value = err.message || "注册失败";
    }
    finally {
        loading.value = false;
    }
}
function goLogin() {
    router.push("/login");
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "page card" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.h1, __VLS_elements.h1)({
    ...{ class: "mb-4 text-center" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "mb-2" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.input)({
    placeholder: "请输入用户名",
});
(__VLS_ctx.username);
// @ts-ignore
[username,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "mb-2" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "email",
    placeholder: "example@mail.com",
});
(__VLS_ctx.email);
// @ts-ignore
[email,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "mb-2" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "password",
    placeholder: "请输入密码",
});
(__VLS_ctx.password);
// @ts-ignore
[password,];
if (__VLS_ctx.error) {
    // @ts-ignore
    [error,];
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
        ...{ style: {} },
    });
    (__VLS_ctx.error);
    // @ts-ignore
    [error,];
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "mt-3 flex" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.register) },
    ...{ class: "primary" },
    disabled: (__VLS_ctx.loading),
});
// @ts-ignore
[register, loading,];
(__VLS_ctx.loading ? "注册中..." : "注册");
// @ts-ignore
[loading,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.goLogin) },
});
// @ts-ignore
[goLogin,];
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        username: username,
        email: email,
        password: password,
        loading: loading,
        error: error,
        register: register,
        goLogin: goLogin,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
