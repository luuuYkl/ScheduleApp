<template>
  <div class="page card" style="max-width:640px;margin:0 auto;">
    <h1>编辑计划</h1>
    <p class="text-gray">当前计划 ID：{{ id }}</p>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
const id = useRoute().params.id;
</script>
