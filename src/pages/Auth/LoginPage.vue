<template>
  <div class="page card" style="max-width:420px;margin:calc(var(--header-height, 64px) + 1.5rem) auto 2rem auto;">
    <h1 class="mb-4 text-center">登录</h1>

    <div class="mb-2">
      <label>用户名</label>
      <input v-model.trim="username" placeholder="请输入用户名（如 demoUser）" />
    </div>

    <div class="mb-2">
      <label>密码</label>
      <input type="password" v-model="password" placeholder="任意输入即可（Mock 模式）" />
    </div>

    <p v-if="error" style="color:var(--color-danger)">{{ error }}</p>

    <div class="mt-3 flex" style="gap:.5rem;justify-content:center">
      <button class="primary" @click="login" :disabled="loading">
        {{ loading ? "登录中..." : "登录" }}
      </button>
      <button @click="goRegister">去注册</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";

const router = useRouter();
const userStore = useUserStore();

const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function login() {
  loading.value = true;
  error.value = "";
  try {
    await userStore.login(username.value, password.value);
    router.push("/home");
  } catch (err: any) {
    error.value = err.message || "登录失败";
  } finally {
    loading.value = false;
  }
}

function goRegister() {
  router.push("/register");
}
</script>
