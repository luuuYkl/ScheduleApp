/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0.d.ts" />
import { ref } from "vue";
import { useUserStore } from "@/store/user";
const props = defineProps();
const emit = defineEmits();
const store = useUserStore();
const loading = ref(false);
const error = ref("");
const form = ref({
    username: "",
    email: "",
    password: ""
});
async function onSubmit() {
    error.value = "";
    loading.value = true;
    try {
        if (props.mode === "login") {
            await store.login(form.value.username, form.value.password);
        }
        else {
            await store.register({
                username: form.value.username,
                email: form.value.email || undefined,
                password: form.value.password
            });
        }
        emit("success");
    }
    catch (e) {
        error.value = e?.message || "操作失败，请重试";
    }
    finally {
        loading.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.form, __VLS_elements.form)({
    ...{ onSubmit: (__VLS_ctx.onSubmit) },
    ...{ class: "card" },
});
// @ts-ignore
[onSubmit,];
__VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({
    ...{ class: "mb-4" },
});
(__VLS_ctx.mode === 'login' ? '登录' : '注册');
// @ts-ignore
[mode,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "mb-2" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.input)({
    required: true,
    placeholder: "请输入用户名",
});
(__VLS_ctx.form.username);
// @ts-ignore
[form,];
if (__VLS_ctx.mode === 'register') {
    // @ts-ignore
    [mode,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
    __VLS_asFunctionalElement(__VLS_elements.input)({
        type: "email",
        placeholder: "name@example.com",
    });
    (__VLS_ctx.form.email);
    // @ts-ignore
    [form,];
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "mb-2" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "password",
    required: true,
    minlength: "6",
    placeholder: "至少 6 位",
});
(__VLS_ctx.form.password);
// @ts-ignore
[form,];
if (__VLS_ctx.error) {
    // @ts-ignore
    [error,];
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
        ...{ class: "mb-2" },
        ...{ style: {} },
    });
    (__VLS_ctx.error);
    // @ts-ignore
    [error,];
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "flex" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ class: "primary" },
    type: "submit",
    disabled: (__VLS_ctx.loading),
});
// @ts-ignore
[loading,];
(__VLS_ctx.loading ? '处理中...' : (__VLS_ctx.mode === 'login' ? '登录' : '注册'));
// @ts-ignore
[mode, loading,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('switch');
            // @ts-ignore
            [$emit,];
        } },
    ...{ class: "secondary" },
    type: "button",
});
(__VLS_ctx.mode === 'login' ? '去注册' : '去登录');
// @ts-ignore
[mode,];
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        loading: loading,
        error: error,
        form: form,
        onSubmit: onSubmit,
    }),
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
