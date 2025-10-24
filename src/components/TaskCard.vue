<template>
  <div class="task-card" :class="statusClass">
    <div class="task-content">
      <p class="task-title">{{ title }}</p>
      <span class="task-status">{{ statusText }}</span>
    </div>
    <div class="task-actions">
      <button class="btn btn-primary" @click="$emit('complete')">完成</button>
      <button class="btn btn-secondary" @click="$emit('postpone')">推迟</button>
      <button class="btn btn-danger" @click="$emit('delete')">删除</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "TaskCard",
  props: {
    title: { type: String, required: true },
    status: { type: String, default: "pending" } // "completed" | "postponed" | "pending"
  },
  computed: {
    statusText() {
      switch (this.status) {
        case "completed":
          return "已完成";
        case "postponed":
          return "已推迟";
        default:
          return "待办";
      }
    },
    statusClass() {
      return `task-${this.status}`;
    }
  }
};
</script>

<style src="../styles/TaskCard.css"></style>
