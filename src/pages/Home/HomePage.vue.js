import Card from "@/components/common/Card.vue";
import Button from "@/components/common/Button.vue";
import Modal from "@/components/common/Modal.vue";
import { ref } from "vue";
const show = ref(false);
function confirm() {
    alert("任务已添加！");
    show.value = false;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
/** @type {[typeof Card, typeof Card, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(Card, new Card({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
const { default: __VLS_3 } = __VLS_2.slots;
__VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({});
/** @type {[typeof Button, typeof Button, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(Button, new Button({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_5 = __VLS_4({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
let __VLS_7;
let __VLS_8;
const __VLS_9 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.show = true;
            // @ts-ignore
            [show,];
        } });
const { default: __VLS_10 } = __VLS_6.slots;
var __VLS_6;
var __VLS_2;
/** @type {[typeof Modal, typeof Modal, ]} */ ;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent(Modal, new Modal({
    visible: (__VLS_ctx.show),
    title: "新任务",
}));
const __VLS_12 = __VLS_11({
    visible: (__VLS_ctx.show),
    title: "新任务",
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
const { default: __VLS_14 } = __VLS_13.slots;
// @ts-ignore
[show,];
__VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({});
{
    const { footer: __VLS_15 } = __VLS_13.slots;
    /** @type {[typeof Button, typeof Button, ]} */ ;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent(Button, new Button({
        ...{ 'onClick': {} },
        type: "secondary",
    }));
    const __VLS_17 = __VLS_16({
        ...{ 'onClick': {} },
        type: "secondary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    let __VLS_19;
    let __VLS_20;
    const __VLS_21 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.show = false;
                // @ts-ignore
                [show,];
            } });
    const { default: __VLS_22 } = __VLS_18.slots;
    var __VLS_18;
    /** @type {[typeof Button, typeof Button, ]} */ ;
    // @ts-ignore
    const __VLS_23 = __VLS_asFunctionalComponent(Button, new Button({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_24 = __VLS_23({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_23));
    let __VLS_26;
    let __VLS_27;
    const __VLS_28 = ({ click: {} },
        { onClick: (__VLS_ctx.confirm) });
    const { default: __VLS_29 } = __VLS_25.slots;
    // @ts-ignore
    [confirm,];
    var __VLS_25;
}
var __VLS_13;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        Card: Card,
        Button: Button,
        Modal: Modal,
        show: show,
        confirm: confirm,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
