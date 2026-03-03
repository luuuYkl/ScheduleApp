<template>
  <div class="simple-fab">
    <button @click="testClick">测试按钮</button>
    <div v-if="showMenu" class="menu">
      <button @click="goToPlan">去创建计划</button>
      <button @click="goToSchedule">去创建日程</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showMenu = ref(false)

function testClick() {
  console.log('测试按钮被点击')
  showMenu.value = !showMenu.value
}

function goToPlan() {
  console.log('导航到创建计划页面')
  router.push('/plan/create')
}

function goToSchedule() {
  console.log('导航到日程页面')
  router.push('/schedule')
}
</script>

<style scoped>
.simple-fab {
  position: absolute;
  bottom: 100px;
  right: 20px;
  z-index: 1000;
}

.menu {
  background: var(--bg-card, white);
  border: 1px solid var(--border-main, #ccc);
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
}

button {
  display: block;
  margin: 5px 0;
  padding: 10px;
  background: var(--ai-main, #2563EB);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  background: var(--ai-light, #3B82F6);
}
</style>