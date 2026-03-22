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
              <!-- 实时预览内容 -->
              <div v-if="taskFormRef" class="preview-task">
                <!-- 优先级和标签 -->
                <div class="preview-meta">
                  <div 
                    class="preview-priority"
                    :style="{ '--priority-color': taskFormRef?.previewData?.priorityColor }"
                  >
                    {{ taskFormRef?.previewData?.priorityLabel }}优先级
                  </div>
                  <div v-if="taskFormRef?.previewData?.tags?.length" class="preview-tags">
                    <span 
                      v-for="tag in taskFormRef.previewData.tags"
                      :key="tag"
                      class="preview-tag"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
                
                <!-- 任务标题 -->
                <div class="preview-title">
                  {{ taskFormRef?.previewData?.title }}
                </div>
                
                <!-- 日期和时间 -->
                <div class="preview-datetime">
                  <div class="preview-date">
                    📅 {{ formatDate(taskFormRef?.previewData?.startDate || '') }}
                    <span v-if="taskFormRef?.previewData?.startDate !== taskFormRef?.previewData?.endDate">
                      ~ {{ formatDate(taskFormRef?.previewData?.endDate || '') }}
                    </span>
                  </div>
                  <div v-if="taskFormRef?.previewData?.startTime" class="preview-time">
                    ⏰ {{ taskFormRef?.previewData?.startTime }} - {{ taskFormRef?.previewData?.endTime }}
                  </div>
                </div>
                
                <!-- 关联计划 -->
                <div v-if="taskFormRef?.previewData?.plan" class="preview-plan">
                  📋 计划：{{ taskFormRef?.previewData?.plan?.title }}
                </div>
                
                <!-- 备注 -->
                <div v-if="taskFormRef?.previewData?.note" class="preview-note">
                  <div class="preview-note-label">📝 备注</div>
                  <div class="preview-note-content">{{ taskFormRef?.previewData?.note }}</div>
                </div>
                
                <!-- 重复信息 -->
                <div class="preview-repeat">
                  <div class="preview-repeat-label">🔄 重复</div>
                  <div class="preview-repeat-value">
                    {{ getRepeatLabel(taskFormRef?.previewData?.repeatType) }}
                  </div>
                </div>
              </div>
              
              <!-- 空状态 -->
              <div v-else class="preview-empty">
                <p>💡 填写表单，实时预览任务信息</p>
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

// 获取重复标签
function getRepeatLabel(repeatType?: string): string {
  const labels: Record<string, string> = {
    'none': '不重复',
    'daily': '每天',
    'weekly': '每周',
    'monthly': '每月',
  };
  return labels[repeatType || 'none'] || '不重复';
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

/* 实时预览任务样式 */
.preview-task {
  padding: var(--space-4);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  flex-wrap: wrap;
}

.preview-priority {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  color: white;
  background: var(--priority-color);
}

.preview-tags {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}

.preview-tag {
  padding: var(--space-0.5) var(--space-2);
  background: var(--ai-bg);
  border-radius: var(--radius-full);
  font-size: 11px;
  color: var(--ai-main);
  font-weight: 500;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: var(--space-3);
  line-height: 1.4;
}

.preview-datetime {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.preview-date,
.preview-time {
  font-size: 14px;
  color: var(--text-secondary);
}

.preview-date span,
.preview-time span {
  color: var(--text-main);
  font-weight: 500;
}

.preview-plan {
  padding: var(--space-2);
  background: var(--ai-bg);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--ai-main);
  font-size: 13px;
  color: var(--text-main);
  margin-bottom: var(--space-3);
}

.preview-note {
  margin-bottom: var(--space-3);
}

.preview-note-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}

.preview-note-content {
  padding: var(--space-2);
  background: var(--bg-main);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-main);
  line-height: 1.5;
}

.preview-repeat {
  padding: var(--space-3);
  background: var(--bg-main);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--border-subtle);
}

.preview-repeat-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}

.preview-repeat-value {
  font-size: 14px;
  color: var(--text-main);
}

.preview-empty {
  padding: var(--space-6);
  text-align: center;
}

.preview-empty p {
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
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