<template>
  <div class="page flex-center" style="min-height:calc(100vh - 120px)">
    <AuthForm mode="login" @success="goHome" @switch="toRegister" />
  </div>
</template>

<script setup lang="ts">
import AuthForm from "@/components/auth/AuthForm.vue";
import { useRouter } from "vue-router";
const router = useRouter();
function goHome() { router.push("/home"); }
function toRegister() { router.push("/register"); }
</script>
