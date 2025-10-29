<template>
  <div class="profile-page card" style="max-width:480px;margin:2rem auto;">
    <h2>个人资料</h2>
    <div class="avatar-box">
      <img :src="avatarUrl" class="avatar" alt="用户头像" />
    </div>
    <div class="info">
      <p><strong>用户名：</strong>{{ user?.username }}</p>
      <p><strong>用户ID：</strong>{{ user?.id }}</p>
      <p v-if="user?.email"><strong>邮箱：</strong>{{ user.email }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUserStore } from "@/store/user";

const userStore = useUserStore();
const user = computed(() => userStore.user);
// 简单头像生成（可替换为后端头像字段）
const avatarUrl = computed(() =>
  user.value?.username
    ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.value.username)}`
    : 'https://api.dicebear.com/7.x/identicon/svg?seed=default'
);
</script>

<style scoped>
.profile-page {
  padding: 2rem 1.5rem;
  text-align: center;
}
.avatar-box {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}
.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 2px solid #3b82f6;
  background: #f3f4f6;
}
.info {
  margin-top: 1rem;
  text-align: left;
}
</style>
