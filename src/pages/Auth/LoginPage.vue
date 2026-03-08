<template>
  <div class="auth-page layer-context">
    <div class="auth-container layout-template-l">
      <!-- Context Layer: 左侧视觉区域 -->
      <div class="auth-visual layer-context priority-essential">
        <div class="visual-content">
          <div class="brand-logo">🎯</div>
          <h1 class="brand-title">DayDayApp</h1>
          <p class="brand-slogan">专注每一天，成就更好的自己</p>
          <div class="features-list">
            <div class="feature-item">
              <span class="feature-icon">📋</span>
              <span>智能任务规划</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📊</span>
              <span>数据驱动成长</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🤖</span>
              <span>AI 智能助手</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Primary Layer: 右侧表单区域 -->
      <div class="auth-form layer-primary priority-high">
        <div class="form-wrapper">
          <div class="form-header">
            <h2 class="form-title">欢迎回来</h2>
            <p class="form-subtitle">登录你的账户继续旅程</p>
          </div>

          <form @submit.prevent="login" class="login-form">
            <div class="form-group">
              <label for="username-input" class="form-label">用户名</label>
              <input
                id="username-input"
                v-model.trim="username"
                class="form-input"
                placeholder="请输入用户名"
                aria-required="true"
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label for="password-input" class="form-label">密码</label>
              <input
                id="password-input"
                type="password"
                v-model="password"
                class="form-input"
                placeholder="请输入密码"
                aria-required="true"
                autocomplete="current-password"
              />
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="rememberMe" class="checkbox-input" />
                <span class="checkbox-text">记住我</span>
              </label>
              <a href="#" class="forgot-link">忘记密码？</a>
            </div>

            <p
              v-if="error"
              class="error-message"
              role="alert"
              aria-live="polite"
            >
              {{ error }}
            </p>

            <button
              type="submit"
              class="submit-button primary"
              :disabled="loading"
              :aria-busy="loading"
            >
              <span v-if="loading" class="loading-spinner"></span>
              {{ loading ? "登录中..." : "登录" }}
            </button>

            <div class="form-footer">
              <span class="footer-text">还没有账户？</span>
              <button 
                type="button" 
                @click="goRegister" 
                class="switch-button"
                aria-label="跳转到注册页面"
              >
                立即注册
              </button>
            </div>
          </form>

          <!-- Secondary Layer: 社交登录 -->
          <div class="social-login layer-secondary priority-low">
            <div class="divider">
              <span class="divider-text">或使用以下方式登录</span>
            </div>
            <div class="social-buttons">
              <button class="social-button" title="微信登录">
                <span class="social-icon">💬</span>
              </button>
              <button class="social-button" title="QQ登录">
                <span class="social-icon">🐧</span>
              </button>
              <button class="social-button" title="Apple登录">
                <span class="social-icon"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
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
const rememberMe = ref(false);
const loading = ref(false);
const error = ref("");

async function login() {
  loading.value = true;
  error.value = "";
  try {
    await userStore.login(username.value, password.value);
    // 支持 redirect 参数，登录后跳转到原本想访问的页面
    const redirect = router.currentRoute.value.query.redirect as string;
    router.push(redirect || "/home");
  } catch (err: any) {
    error.value = err.message || "登录失败";
  } finally {
    loading.value = false;
  }
}

function goRegister() {
  // 跳转注册页时保留 redirect 参数
  const redirect = router.currentRoute.value.query.redirect;
  if (redirect) {
    router.push({ path: "/register", query: { redirect: redirect as string } });
  } else {
    router.push("/register");
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.auth-container {
  display: grid;
  grid-template-columns: 400px 1fr;
  max-width: 1000px;
  width: 100%;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* 左侧视觉区域 */
.auth-visual {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.visual-content {
  text-align: center;
  max-width: 320px;
}

.brand-logo {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.5px;
}

.brand-slogan {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  opacity: 0.9;
}

.feature-icon {
  font-size: 1.25rem;
}

/* 右侧表单区域 */
.auth-form {
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-wrapper {
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

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-opacity-10);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
}

.checkbox-text {
  color: var(--text-secondary);
}

.forgot-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.forgot-link:hover {
  text-decoration: underline;
}

.error-message {
  color: var(--error);
  font-size: 0.9rem;
  text-align: center;
  padding: 0.75rem;
  background: var(--error-bg);
  border-radius: 8px;
  border: 1px solid var(--error);
}

.submit-button {
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.footer-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.switch-button {
  background: none;
  border: none;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
}

.switch-button:hover {
  text-decoration: underline;
}

/* 社交登录 */
.social-login {
  margin-top: 2rem;
}

.divider {
  position: relative;
  text-align: center;
  margin: 1.5rem 0;
}

.divider-text {
  background: white;
  padding: 0 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border-main);
}

.social-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.social-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid var(--border-main);
  background: var(--bg-elevated);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.social-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.social-icon {
  font-size: 1.25rem;
}

/* 响应式 */
@media (max-width: 768px) {
  .auth-container {
    grid-template-columns: 1fr;
    max-width: 480px;
    grid-template-rows: auto 1fr;
  }
  
  .auth-visual {
    padding: 2rem;
    min-height: 200px;
  }
  
  .brand-logo {
    font-size: 3rem;
  }
  
  .brand-title {
    font-size: 2rem;
  }
  
  .auth-form {
    padding: 2rem;
  }
  
  .features-list {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }
  
  .feature-item {
    font-size: 0.9rem;
  }
  
  .auth-visual {
    order: -1;
  }
  
  .auth-form {
    order: 1;
  }
}

@media (max-width: 480px) {
  .auth-page {
    padding: 1rem 0.5rem;
  }
  
  .auth-container {
    border-radius: 16px;
  }
  
  .auth-visual, .auth-form {
    padding: 1.5rem;
  }
  
  .form-title {
    font-size: 1.75rem;
  }
  
  .social-buttons {
    gap: 0.75rem;
  }
  
  .social-button {
    width: 44px;
    height: 44px;
  }
}
</style>