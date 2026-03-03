<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- 左侧视觉区域 -->
      <div class="auth-visual">
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

      <!-- 右侧表单区域 -->
      <div class="auth-form">
        <AuthForm mode="login" @success="goHome" @switch="toRegister" />
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

function toRegister() {
  router.push("/register");
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

/* 左侧视觉区域 */
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

/* 响应式 */
@media (max-width: 768px) {
  .auth-container {
    grid-template-columns: 1fr;
    max-width: 480px;
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
    padding: 0.5rem;
  }
  
  .auth-container {
    border-radius: 16px;
  }
  
  .auth-visual, .auth-form {
    padding: 1.5rem;
  }
}
</style>