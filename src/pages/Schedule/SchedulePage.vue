<template>
  <div class="page schedule-page">
    <h1 class="mb-4">创建日程</h1>
    <div class="form-container">
      <ScheduleForm @created="handleCreated" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ScheduleForm from '@/components/schedule/ScheduleForm.vue';
import { useRouter } from 'vue-router';
const router = useRouter();

function handleCreated(){ 
  router.push('/home'); // 创建成功后返回首页查看
}
</script>

<style scoped>
.schedule-page {
  padding-top: calc(var(--header-height, 64px) + 1.5rem);
  padding-bottom: calc(var(--footer-height, 64px) + 1rem);
  padding-left: 1rem;
  padding-right: 1rem;
  min-height: 100vh;
}

.form-container { 
  max-width: 560px; 
  margin: 0 auto; 
}
</style>