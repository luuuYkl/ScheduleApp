<template>
  <PageScaffold 
    title="我的一天" 
    subtitle="查看今日计划和待办事项"
  >
    <template #actions>
      <button 
        class="btn btn-primary" 
        @click="goCreate"
        aria-label="创建新计划"
      >
        <span class="btn-icon">➕</span>
        <span class="btn-text">新建计划</span>
      </button>
      <button 
        class="btn btn-secondary" 
        @click="goSchedule"
        aria-label="创建日程"
      >
        <span class="btn-icon">⏰</span>
        <span class="btn-text">新建日程</span>
      </button>
    </template>
    
    <div class="home-content">
      <div class="grid">
        <PlanOverview @create="goCreate" />
        <TaskList />
      </div>
    </div>
  </PageScaffold>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import PlanOverview from "@/components/home/PlanOverview.vue";
import TaskList from "@/components/home/TaskList.vue";
import PageScaffold from "@/components/common/PageScaffold.vue";

const router = useRouter();

function goCreate() {
  router.push("/plan/create");
}
function goSchedule() {
  router.push("/schedule");
}
</script>

<style scoped>
.home-content {
  width: 100%;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  max-width: 900px;
  margin: 0 auto;
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
  text-decoration: none;
}

.btn-primary {
  background: var(--ai-main);
  color: white;
}

.btn-primary:hover {
  background: var(--ai-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: var(--bg-card);
  color: var(--text-main);
  border: 1px solid var(--border-main);
}

.btn-secondary:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
}

.btn-icon {
  font-size: 16px;
}

.btn-text {
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .grid {
    gap: var(--space-3);
  }
  
  .btn {
    padding: var(--space-2) var(--space-3);
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .grid {
    gap: var(--space-2);
  }
  
  .btn {
    padding: var(--space-1) var(--space-2);
    font-size: 12px;
  }
  
  .btn-text {
    display: none;
  }
}
</style>
