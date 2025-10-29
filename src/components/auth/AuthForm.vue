<template>
  <form class="card" @submit.prevent="onSubmit">
    <h2 class="mb-4">{{ mode === 'login' ? '登录' : '注册' }}</h2>

    <div class="mb-2">
      <label>用户名</label>
      <input v-model.trim="form.username" required placeholder="请输入用户名" />
    </div>

    <div v-if="mode === 'register'" class="mb-2">
      <label>邮箱（可选）</label>
      <input v-model.trim="form.email" type="email" placeholder="name@example.com" />
    </div>

    <div class="mb-2">
      <label>密码</label>
      <input v-model="form.password" type="password" required minlength="6" placeholder="至少 6 位" />
    </div>

    <p v-if="error" class="mb-2" style="color: var(--color-danger)">{{ error }}</p>

    <div class="flex" style="gap:.5rem">
      <button class="primary" type="submit" :disabled="loading">
        {{ loading ? '处理中...' : (mode === 'login' ? '登录' : '注册') }}
      </button>
      <button class="secondary" type="button" @click="$emit('switch')">
        {{ mode === 'login' ? '去注册' : '去登录' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useUserStore } from "@/store/user";

const props = defineProps<{ mode: 'login' | 'register' }>();
const emit = defineEmits<{ (e:'success'):void; (e:'switch'):void }>();

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
    } else {
      await store.register({ 
        username: form.value.username, 
        email: form.value.email || undefined, 
        password: form.value.password 
      });
    }
    // 立即同步 userStore 的 user/token，保证响应式
    await store.restore();
    emit("success");
  } catch (e: any) {
    error.value = e?.message || "操作失败，请重试";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.card { max-width: 420px; margin: 0 auto; }
label { display:block; margin-bottom: 4px; color: var(--color-text-light); }
input { margin-bottom: 8px; }
</style>
