<template>
  <form class="auth-form-wrapper" @submit.prevent="onSubmit">
    <div class="form-header">
      <h2 class="form-title">{{ mode === "login" ? "欢迎回来" : "创建账户" }}</h2>
      <p class="form-subtitle">{{ mode === "login" ? "登录你的账户继续旅程" : "开启你的高效生活之旅" }}</p>
    </div>

    <div class="form-group">
      <label for="username-input" class="form-label">用户名</label>
      <input
        id="username-input"
        v-model.trim="form.username"
        class="form-input"
        required
        placeholder="请输入用户名"
        autocomplete="username"
      />
    </div>

    <div v-if="mode === 'register'" class="form-group">
      <label for="email-input" class="form-label">邮箱（可选）</label>
      <input
        id="email-input"
        v-model.trim="form.email"
        type="email"
        class="form-input"
        placeholder="name@example.com"
        autocomplete="email"
      />
    </div>

    <div class="form-group">
      <label for="password-input" class="form-label">密码</label>
      <input
        id="password-input"
        v-model="form.password"
        type="password"
        class="form-input"
        required
        minlength="6"
        placeholder="至少 6 位"
        :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
      />
    </div>

    <p v-if="error" class="error-message" role="alert">
      {{ error }}
    </p>

    <button type="submit" class="submit-button primary" :disabled="loading">
      <span v-if="loading" class="loading-spinner"></span>
      {{ loading ? "处理中..." : mode === "login" ? "登录" : "注册" }}
    </button>

    <div class="form-footer">
      <span class="footer-text">{{ mode === "login" ? "还没有账户？" : "已有账户？" }}</span>
      <button type="button" class="switch-button" @click="$emit('switch')">
        {{ mode === "login" ? "立即注册" : "立即登录" }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useUserStore } from "@/store/user";

const props = defineProps<{ mode: "login" | "register" }>();
const emit = defineEmits<{ (e: "success"): void; (e: "switch"): void }>();

const store = useUserStore();
const loading = ref(false);
const error = ref("");

const form = ref({
  username: "",
  email: "",
  password: "",
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
        password: form.value.password,
      });
    }
    emit("success");
  } catch (e: any) {
    error.value = e?.message || "操作失败，请重试";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-form-wrapper {
  width: 100%;
  max-width: 360px;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 0.5rem 0;
}

.form-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-main);
}

.form-input {
  padding: 0.875rem 1rem;
  border: 1px solid var(--border-main);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  background: var(--bg-input);
  color: var(--text-main);
}

.form-input::placeholder {
  color: var(--text-muted);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 3px var(--color-brand-alpha-12);
}

.error-message {
  color: var(--error);
  font-size: 0.9rem;
  text-align: center;
  padding: 0.75rem;
  background: var(--error-bg);
  border-radius: 8px;
  border: 1px solid var(--error);
  margin-bottom: 1rem;
}

.submit-button.primary {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, var(--color-brand-500) 0%, var(--color-brand-600) 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
}

.submit-button.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-brand-600) 0%, var(--color-brand-700) 100%);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
  transform: translateY(-1px);
}

.submit-button.primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-footer {
  text-align: center;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
  border-top: 1px solid var(--border-subtle);
}

.footer-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.switch-button {
  background: none;
  border: none;
  color: var(--color-brand-500);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.switch-button:hover {
  color: var(--color-brand-600);
  text-decoration: underline;
}
</style>