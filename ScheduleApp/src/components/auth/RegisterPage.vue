<template>
  <div class="auth-page">
    <div class="auth-container reverse">
      <!-- 左侧表单区域 -->
      <div class="auth-form">
        <AuthForm mode="register" @success="goHome" @switch="toLogin" />
      </div>

      <!-- 右侧视觉区域 -->
      <div class="auth-visual">
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
import AuthForm from "@/components/auth/AuthForm.vue";
import { useRouter } from "vue-router";

const router = useRouter();

function goHome() {
  // 支持重定向到原始目标页面
  const redirect = router.currentRoute.value.query.redirect as string;
  if (redirect) {
    router.push(redirect);
  } else {
    router.push("/home");
  }
}

function toLogin() {
  router.push("/login");
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: #DBEAFE;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

/* 背景装饰效果 */
.auth-page::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6) 0%, transparent 50%);
  pointer-events: none;
}

.auth-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 900px;
  width: 100%;
  background: #FFFFFF;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
}

.auth-container.reverse {
  direction: rtl;
}

.auth-container.reverse > * {
  direction: ltr;
}

/* 视觉区域 */
.auth-visual {
  background: linear-gradient(160deg, var(--color-brand-500) 0%, var(--color-brand-700) 100%);
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  overflow: hidden;
}

/* 视觉区域装饰 */
.auth-visual::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 40%);
  pointer-events: none;
}

.visual-content {
  text-align: center;
  max-width: 320px;
  position: relative;
  z-index: 1;
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

/* 表单区域 */
.auth-form {
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
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
}
</style>