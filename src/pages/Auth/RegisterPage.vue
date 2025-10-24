<template>
  <div class="page card" style="max-width:420px;margin:2rem auto;">
    <h1 class="mb-4 text-center">注册</h1>

    <div class="mb-2">
      <label>用户名</label>
      <input v-model.trim="username" placeholder="请输入用户名" />
    </div>

    <div class="mb-2">
      <label>邮箱（可选）</label>
      <input type="email" v-model.trim="email" placeholder="example@mail.com" />
    </div>

    <div class="mb-2">
      <label>密码</label>
      <input type="password" v-model="password" placeholder="请输入密码" />
    </div>

    <p v-if="error" style="color:var(--color-danger)">{{ error }}</p>

    <div class="mt-3 flex" style="gap:.5rem;justify-content:center">
      <button class="primary" @click="register" :disabled="loading">
        {{ loading ? "注册中..." : "注册" }}
      </button>
      <button @click="goLogin">返回登录</button>
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
  } catch (err: any) {
    error.value = err.message || "注册失败";
  } finally {
    loading.value = false;
  }
}

function goLogin() {
  router.push("/login");
}
</script>
