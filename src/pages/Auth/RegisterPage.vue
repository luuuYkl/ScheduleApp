<template>
  <div class="auth-page layer-context">
    <div class="auth-container reverse layout-template-l">
      <!-- Primary Layer: 左侧表单区域 -->
      <div class="auth-form layer-primary priority-high">
        <div class="form-wrapper">
          <div class="form-header">
            <h2 class="form-title">创建账户</h2>
            <p class="form-subtitle">开启你的高效生活之旅</p>
          </div>

          <form @submit.prevent="register" class="register-form">
            <div class="form-group">
              <label for="username-input" class="form-label">用户名</label>
              <input
                id="username-input"
                v-model.trim="username"
                class="form-input"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div class="form-group">
              <label for="email-input" class="form-label">邮箱地址</label>
              <input
                id="email-input"
                type="email"
                v-model.trim="email"
                class="form-input"
                placeholder="your@email.com"
              />
            </div>

            <div class="form-group">
              <label for="password-input" class="form-label">密码</label>
              <input
                id="password-input"
                type="password"
                v-model="password"
                class="form-input"
                placeholder="至少6位字符"
                required
                minlength="6"
              />
            </div>

            <div class="password-strength" v-if="password">
              <div class="strength-meter">
                <div 
                  class="strength-bar" 
                  :class="passwordStrength.class"
                  :style="{ width: passwordStrength.width }"
                ></div>
              </div>
              <span class="strength-text">{{ passwordStrength.text }}</span>
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="agreeTerms" class="checkbox-input" required />
                <span class="checkbox-text">我同意 <a href="#" class="terms-link">服务条款</a> 和 <a href="#" class="terms-link">隐私政策</a></span>
              </label>
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
              :disabled="loading || !agreeTerms"
              :aria-busy="loading"
            >
              <span v-if="loading" class="loading-spinner"></span>
              {{ loading ? "注册中..." : "创建账户" }}
            </button>

            <div class="form-footer">
              <span class="footer-text">已有账户？</span>
              <button 
                type="button" 
                @click="goLogin" 
                class="switch-button"
              >
                立即登录
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Context Layer: 右侧视觉区域 -->
      <div class="auth-visual layer-context priority-essential">
        <div class="visual-content">
          <div class="brand-logo">🎯</div>
          <h1 class="brand-title">加入我们</h1>
          <p class="brand-slogan">与 thousands+ 用户一起提升效率</p>
          <div class="benefits-list">
            <div class="benefit-item">
              <span class="benefit-check">✓</span>
              <span>免费使用全部核心功能</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-check">✓</span>
              <span>数据云端同步备份</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-check">✓</span>
              <span>享受个性化AI建议</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-check">✓</span>
              <span>参与社区分享交流</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";

const router = useRouter();
const userStore = useUserStore();

const username = ref("");
const email = ref("");
const password = ref("");
const agreeTerms = ref(false);
const loading = ref(false);
const error = ref("");

// 密码强度计算
const passwordStrength = computed(() => {
  const len = password.value.length;
  if (len === 0) return { class: '', width: '0%', text: '' };
  if (len < 6) return { class: 'weak', width: '33%', text: '密码太弱' };
  if (len < 10) return { class: 'medium', width: '66%', text: '密码强度中等' };
  return { class: 'strong', width: '100%', text: '密码强度良好' };
});

async function register() {
  loading.value = true;
  error.value = "";
  try {
    await userStore.register({
      username: username.value,
      email: email.value,
      password: password.value,
    });
    // 支持 redirect 参数，注册后跳转到原本想访问的页面
    const redirect = router.currentRoute.value.query.redirect as string;
    router.push(redirect || "/home");
  } catch (err: any) {
    error.value = err.message || "注册失败";
  } finally {
    loading.value = false;
  }
}

function goLogin() {
  // 跳转登录页时保留 redirect 参数
  const redirect = router.currentRoute.value.query.redirect;
  if (redirect) {
    router.push({ path: "/login", query: { redirect: redirect as string } });
  } else {
    router.push("/login");
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
  padding: 1rem;
}

.auth-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 960px;
  width: 100%;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.auth-container.reverse {
  direction: rtl;
}

.auth-container.reverse > * {
  direction: ltr;
}

/* 表单区域 */
.auth-form {
  padding: 3rem;
  display: flex;
  align-items: center;
}

.form-wrapper {
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
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

.register-form {
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

.password-strength {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.strength-meter {
  height: 4px;
  background: var(--bg-elevated);
  border-radius: 2px;
  overflow: hidden;
}

.strength-bar {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s;
}

.strength-bar.weak {
  background: var(--error);
  width: 33%;
}

.strength-bar.medium {
  background: var(--warning);
  width: 66%;
}

.strength-bar.strong {
  background: var(--success);
  width: 100%;
}

.strength-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.form-options {
  padding: 0.5rem 0;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1.4;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
  margin-top: 2px;
}

.checkbox-text {
  color: var(--text-secondary);
}

.terms-link {
  color: var(--primary);
  text-decoration: none;
}

.terms-link:hover {
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

/* 视觉区域 */
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

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  opacity: 0.9;
  text-align: left;
}

.benefit-check {
  font-weight: bold;
  color: var(--success);
}

/* 响应式 */
@media (max-width: 768px) {
  .auth-container {
    grid-template-columns: 1fr;
    max-width: 480px;
  }
  
  .auth-container.reverse {
    direction: ltr;
  }
  
  .auth-form {
    order: 1;
    padding: 2rem;
  }
  
  .auth-visual {
    order: 2;
    padding: 2rem;
  }
  
  .brand-logo {
    font-size: 3rem;
  }
  
  .brand-title {
    font-size: 2rem;
  }
  
  .benefits-list {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }
  
  .benefit-item {
    font-size: 0.9rem;
    flex: 1;
    min-width: 140px;
  }
}

@media (max-width: 480px) {
  .auth-page {
    padding: 0.5rem;
  }
  
  .auth-container {
    border-radius: 16px;
  }
  
  .auth-form, .auth-visual {
    padding: 1.5rem;
  }
  
  .form-title {
    font-size: 1.75rem;
  }
}
</style>