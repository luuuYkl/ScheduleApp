<template>
  <PageScaffold
    title="创建任务"
    subtitle="添加新的任务到你的日程"
    show-back-button
    @back="goBack"
  >
    <template #actions>
      <Button variant="outline" @click="clearForm">
        清空
      </Button>
    </template>
    
    <PullToRefresh @refresh="handleRefresh">
      <div class="task-create-container">
        <div class="main-content">
          <!-- 上下文提示区域 -->
          <Card class="context-panel mb-4" v-if="relatedPlan">
            <div class="context-header">
              <h3>📋 关联计划</h3>
              <Button variant="ghost" size="sm" @click="dismissContext">
                ✕
              </Button>
            </div>
            
            <div class="context-content">
              <div class="context-item">
                <div class="context-icon">🎯</div>
                <div class="context-details">
                  <div class="context-title">{{ relatedPlan.title }}</div>
                  <div class="context-period">{{ planPeriod }}</div>
                </div>
              </div>
            </div>
          </Card>
          
          <!-- 任务表单 -->
          <Card class="task-form-card">
            <TaskForm @created="handleCreated" ref="taskFormRef" />
          </Card>
        </div>
        
        <!-- 右侧：任务预览 -->
        <div class="preview-sidebar" v-if="showPreview">
          <Card class="preview-card">
            <div class="preview-header">
              <h3>📋 任务预览</h3>
            </div>
            
            <div class="preview-content">
              <div class="preview-hint">
                <p>💡 填写表单后，任务将显示在今日任务列表中</p>
              </div>
              
              <div class="preview-tips">
                <h4>快捷提示</h4>
                <ul>
                  <li>设置重复规则可自动创建周期性任务</li>
                  <li>关联计划可以帮助追踪整体进度</li>
                  <li>添加时间有助于合理安排日程</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PullToRefresh>
  </PageScaffold>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
import { useTaskStore } from "@/store/tasks";
import PageScaffold from "@/components/common/PageScaffold.vue";
import Button from "@/components/common/Button.vue";
import Card from "@/components/common/Card.vue";
import TaskForm from "@/components/task/TaskForm.vue";
import PullToRefresh from "@/components/common/PullToRefresh.vue";

const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();
const taskStore = useTaskStore();

// 表单引用
const taskFormRef = ref<any>(null);

// 上下文信息
const relatedPlan = ref<any>(null);

const showPreview = ref(true);

const planPeriod = computed(() => {
  if (!relatedPlan.value) return '';
  return `${formatDate(relatedPlan.value.start_date)} - ${formatDate(relatedPlan.value.end_date)}`;
});

// 方法函数
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
}

// 操作函数
function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/home');
  }
}

function clearForm() {
  // 清空表单逻辑 - 通过 ref 调用子组件方法或重置状态
  console.log('清空表单');
}

function dismissContext() {
  relatedPlan.value = null;
}

function handleCreated() {
  router.push("/home"); // 创建成功后返回首页查看
}

// 下拉刷新处理
async function handleRefresh() {
  // 重新加载所有相关数据
  await Promise.all([
    planStore.loadPlans(),
    taskStore.loadTasks(),
  ]);
  
  // 重新检查上下文
  const planId = route.query.planId;
  if (planId) {
    relatedPlan.value = planStore.plans.find((p: any) => p.id === Number(planId));
  }
}

// 初始化
onMounted(async () => {
  // 检查是否有上下文参数
  const planId = route.query.planId;
  
  if (planId) {
    await planStore.loadPlans();
    relatedPlan.value = planStore.plans.find((p: any) => p.id === Number(planId));
  }
});
</script>

<style scoped>
.task-create-container {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--space-5);
  max-width: 1200px;
  margin: 0 auto;
}

.main-content {
  min-width: 0;
}

/* 上下文提示面板 */
.context-panel {
  background: linear-gradient(135deg, var(--ai-bg) 0%, var(--bg-card) 100%);
  border-left: 4px solid var(--ai-main);
  padding: var(--space-4);
}

.context-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.context-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.context-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.context-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-main);
  border-radius: var(--radius-md);
}

.context-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.context-details {
  flex: 1;
}

.context-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: var(--space-1);
}

.context-period {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 任务表单卡片 */
.task-form-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* 预览侧边栏 */
.preview-sidebar {
  height: fit-content;
}

.preview-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  position: sticky;
  top: calc(var(--header-height, 64px) + var(--space-4));
}

.preview-header {
  margin-bottom: var(--space-4);
}

.preview-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.preview-hint {
  padding: var(--space-3);
  background: var(--ai-bg);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--ai-main);
}

.preview-hint p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.preview-tips h4 {
  margin: 0 0 var(--space-2) 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.preview-tips ul {
  margin: 0;
  padding-left: var(--space-4);
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .task-create-container {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
  
  .preview-sidebar {
    order: -1;
  }
  
  .preview-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .task-create-container {
    padding: var(--space-4);
  }
  
  .context-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
}
</style>