<template>
  <div class="test-page">
    <h1>测试页面</h1>
    <p>这是一个测试页面，用于验证路由是否正常工作。</p>
    <button @click="goToPlanCreate">前往创建计划页面</button>
    <button @click="goToSchedule">前往日程页面</button>
    <button @click="goHome">返回首页</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToPlanCreate() {
  console.log('测试页面：导航到 /plan/create')
  router.push('/plan/create')
}

function goToSchedule() {
  console.log('测试页面：导航到 /schedule')
  router.push('/schedule')
}

function goHome() {
  console.log('测试页面：导航到 /home')
  router.push('/home')
}
</script>

<style scoped>
.test-page {
  padding: 2rem;
  text-align: center;
}

button {
  margin: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--ai-main);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>