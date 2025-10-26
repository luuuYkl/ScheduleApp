import { createPinia } from "pinia";

// 导出默认 pinia 实例，供 main.ts 中的 `import pinia from "@/store"` 使用
const pinia = createPinia();
export default pinia;
