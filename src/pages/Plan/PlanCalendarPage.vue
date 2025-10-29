<template>
  <div class="page">
    <h1 class="mb-4">计划 #{{ planId }} 的日历</h1>

  <CalendarView :planId="planId" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import CalendarView from "@/components/calendar/CalendarView.vue";

const route = useRoute();
const planId = Number(route.params.id);
</script>
