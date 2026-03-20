<template>
  <PageScaffold
    :title="editId ? '编辑计划' : '创建新计划'"
    :subtitle="editId ? '修改现有计划配置' : '规划你的下一个重要目标'"
    show-back-button
    @back="goBack"
  >
    <template #actions>
      <Button 
        variant="outline" 
        @click="resetForm"
        :disabled="submitting"
      >
        重置
      </Button>
    </template>
    
    <PullToRefresh @refresh="handleRefresh">
    <!-- 双栏布局 -->
    <div class="create-layout">
      <!-- 左侧：表单区域 -->
      <div class="form-section">
        <Card class="form-card">
          <form class="plan-form" @submit.prevent="createPlan" novalidate>
            <a-form-item label="📝 计划标题 *" :error="errors.title">
              <a-input
                v-model.trim="form.title"
                placeholder="例如：准备期末考试、完成项目开发等"
                allow-clear
                @input="clearAISuggestions"
              />
            </a-form-item>

            <a-form-item label="📖 详细描述">
              <a-textarea
                v-model="form.description"
                placeholder="详细描述你的计划目标、背景和期望成果..."
                :auto-size="{ minRows: 4, maxRows: 8 }"
                @input="clearAISuggestions"
              />
            </a-form-item>

            <div class="date-row">
              <a-form-item label="📅 开始日期 *" :error="errors.start_date">
                <a-date-picker
                  v-model="form.start_date"
                  style="width: 100%"
                  @change="clearAISuggestions"
                />
              </a-form-item>
              <a-form-item label="📅 结束日期 *" :error="errors.end_date">
                <a-date-picker
                  v-model="form.end_date"
                  style="width: 100%"
                  @change="clearAISuggestions"
                />
              </a-form-item>
            </div>

            <div class="form-group">
              <label class="form-label">
                🏷️ 标签分类
                <div class="tag-selector">
                  <button 
                    v-for="tag in availableTags" 
                    :key="tag.key"
                    type="button"
                    :class="['tag-option', { active: selectedTags.includes(tag.key) }]"
                    @click="toggleTag(tag.key)"
                  >
                    {{ tag.icon }} {{ tag.label }}
                  </button>
                </div>
              </label>
            </div>

            <!-- AI 优化按钮 -->
            <div class="ai-optimize-section">
              <Button
                variant="ai"
                size="large"
                @click="getAISuggestions"
                :loading="aiLoading"
                :disabled="!canOptimize"
                class="ai-optimize-btn"
              >
                <template #icon>
                  <span class="ai-icon">🤖</span>
                </template>
                {{ aiLoading ? 'AI 分析中...' : 'AI 智能优化' }}
              </Button>
              <p class="ai-hint" v-if="!canOptimize">
                请先填写标题和日期后再使用 AI 优化
              </p>
            </div>

            <div class="form-actions">
              <button 
                type="submit" 
                class="btn primary"
                :disabled="submitting"
              >
                {{ submitting ? '保存中...' : (editId ? '保存修改' : '创建计划') }}
              </button>
              <button 
                type="button"
                class="btn secondary"
                @click="goBack"
                :disabled="submitting"
              >
                取消
              </button>
            </div>
          </form>
        </Card>
      </div>
      
      <!-- 右侧：AI 建议和预览区域 -->
      <div class="preview-section">
        <!-- AI 建议面板 -->
        <Card class="ai-panel" v-if="aiResponse || pendingTasks.length > 0">
          <div class="panel-header">
            <h3>🤖 AI 智能建议</h3>
            <Button 
              v-if="aiResponse" 
              variant="ghost" 
              size="small" 
              @click="clearAISuggestions"
            >
              清除
            </Button>
          </div>
          
          <AISuggestions
            :loading="aiLoading"
            :response="aiResponse"
            @close="clearAISuggestions"
            @add-task="addRecommendedTask"
            @apply-optimization="applyOptimization"
          />
        </Card>
        
        <!-- 待创建任务预览 -->
        <Card class="tasks-preview" v-if="pendingTasks.length > 0">
          <div class="preview-header">
            <h3>📝 待创建任务 ({{ pendingTasks.length }})</h3>
            <span class="preview-hint">保存后将自动创建</span>
          </div>
          
          <div class="tasks-list">
            <div 
              v-for="(task, index) in pendingTasks" 
              :key="index" 
              class="task-preview-item"
            >
              <div class="task-preview-content">
                <div class="task-preview-title">{{ task.title }}</div>
                <div class="task-preview-meta">
                  <span v-if="task.task_date" class="meta-item">
                    📅 {{ formatDate(task.task_date) }}
                  </span>
                  <span v-if="task.start_time" class="meta-item">
                    ⏰ {{ task.start_time }}
                  </span>
                  <span v-if="task.repeat_type && task.repeat_type !== 'none'" class="meta-item">
                    🔁 {{ getRepeatLabel(task.repeat_type) }}
                  </span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="small" 
                @click="removeTask(index)"
                class="remove-task-btn"
              >
                ✕
              </Button>
            </div>
          </div>
        </Card>
        
        <!-- 计划预览 -->
        <Card class="plan-preview" v-if="form.title">
          <div class="preview-header">
            <h3>📋 计划预览</h3>
          </div>
          <div class="preview-content">
            <div class="preview-title">{{ form.title || '未命名计划' }}</div>
            <div class="preview-dates" v-if="form.start_date && form.end_date">
              {{ formatDate(form.start_date) }} - {{ formatDate(form.end_date) }}
              <span class="duration">({{ calculateDuration() }}天)</span>
            </div>
            <div class="preview-description" v-if="form.description">
              {{ form.description }}
            </div>
            <div class="preview-tags" v-if="selectedTags.length > 0">
              <span 
                v-for="tag in selectedTags" 
                :key="tag" 
                class="preview-tag"
              >
                {{ getTagLabel(tag) }}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
    </PullToRefresh>
  </PageScaffold>

</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Message } from "@arco-design/web-vue";
import { usePlanStore } from "@/store/plans";
import { useUserStore } from "@/store/user";
import { optimizePlanWithAI, quickValidatePlan } from "@/services/ai";
import type {
  AIOptimizePlanResponse,
  AIRecommendedTask,
  CreateTaskPayload,
} from "@/services/api.types";
import AISuggestions from "@/components/plan/AISuggestions.vue";
import PageScaffold from "@/components/common/PageScaffold.vue";
import Button from "@/components/common/Button.vue";
import Card from "@/components/common/Card.vue";
import PullToRefresh from "@/components/common/PullToRefresh.vue";

/*
  功能增强：
  - 支持创建与编辑（通过 query.edit 判断）
  - 表单验证：必填项检查、日期范围校验
  - AI 智能优化：分析计划并提供建议和任务拆解
  - 提交后创建/更新计划并跳转到计划概览（/home -> PlanOverview.vue）
*/

const route = useRoute();
const router = useRouter();
const planStore = usePlanStore();
const userStore = useUserStore();

// 编辑态判断（支持 ?edit=ID）
const editId = ref<number | null>(null);
if (route.query.edit) {
  const q = Array.isArray(route.query.edit)
    ? route.query.edit[0]
    : route.query.edit;
  const n = Number(q);
  if (!Number.isNaN(n)) editId.value = n;
}

// 表单模型
const form = reactive({
  title: "",
  description: "",
  start_date: "",
  end_date: "",
});

// 标签选择
const selectedTags = ref<string[]>([]);

const availableTags = [
  { key: 'work', label: '工作', icon: '💼' },
  { key: 'study', label: '学习', icon: '📚' },
  { key: 'personal', label: '个人', icon: '👤' },
  { key: 'health', label: '健康', icon: '💪' },
  { key: 'finance', label: '财务', icon: '💰' },
  { key: 'creative', label: '创意', icon: '🎨' },
];

// 验证错误集合
const errors = reactive({
  title: "",
  start_date: "",
  end_date: "",
});

// 提交状态
const submitting = ref(false);

// AI 相关状态
const aiLoading = ref(false);
const aiResponse = ref<AIOptimizePlanResponse | null>(null);
const pendingTasks = ref<AIRecommendedTask[]>([]); // 用户选择要创建的推荐任务（含时间/重复/描述）

// 是否可以进行 AI 优化（基本字段已填写）
const canOptimize = computed(() => {
  return form.title.trim().length >= 2 && form.start_date && form.end_date;
});

// 辅助方法
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getRepeatLabel(type: string): string {
  const labels: Record<string, string> = {
    'daily': '每日',
    'weekly': '每周',
    'monthly': '每月',
    'yearly': '每年'
  };
  return labels[type] || type;
}

function getTagLabel(key: string): string {
  const tag = availableTags.find(t => t.key === key);
  return tag ? tag.label : key;
}

function calculateDuration(): number {
  if (!form.start_date || !form.end_date) return 0;
  const start = new Date(form.start_date);
  const end = new Date(form.end_date);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function toggleTag(key: string) {
  const index = selectedTags.value.indexOf(key);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  } else {
    selectedTags.value.push(key);
  }
}

function resetForm() {
  form.title = '';
  form.description = '';
  form.start_date = '';
  form.end_date = '';
  selectedTags.value = [];
  Object.keys(errors).forEach(key => {
    (errors as any)[key] = '';
  });
  clearAISuggestions();
  pendingTasks.value = [];
}

// 编辑态加载数据
async function loadForEdit() {
  if (!editId.value) return;
    // 尝试从 store 缓存取， 若没有则触发加载
    let plan = (planStore.getPlan && planStore.getPlan(editId.value)) ?? null;
    if (!plan) {
    await planStore.loadPlans();
    plan = planStore.plans.find((p: any) => p.id === editId.value) ?? null;
  }
  if (!plan) {
    alert("未找到要编辑的计划");
    router.push("/home");
    return;
  }
  form.title = plan.title ?? "";
  form.description = plan.description ?? "";
  form.start_date = plan.start_date ?? "";
  form.end_date = plan.end_date ?? "";
  // 加载标签数据
  if (plan.tags) {
    selectedTags.value = Array.isArray(plan.tags) ? plan.tags : [];
  }
}

// 辅助函数：将日期值转换为字符串格式
function formatDateValue(value: any): string {
  if (!value) return "";
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && typeof value.format === 'function') {
    return value.format('YYYY-MM-DD');
  }
  return String(value);
}

// 基本表单校验 - 带有友好的必填提醒
function validate() {
  errors.title = "";
  errors.start_date = "";
  errors.end_date = "";

  let isValid = true;
  const missingFields: string[] = [];

  // 标题验证
  if (!form.title || form.title.trim().length === 0) {
    errors.title = "请输入计划标题";
    missingFields.push("计划标题");
    isValid = false;
  } else if (form.title.trim().length < 2) {
    errors.title = "标题至少需要 2 个字符";
    isValid = false;
  }
  
  // 日期验证
  const startDateStr = formatDateValue(form.start_date);
  const endDateStr = formatDateValue(form.end_date);
  
  if (!startDateStr) {
    errors.start_date = "请选择开始日期";
    missingFields.push("开始日期");
    isValid = false;
  }
  if (!endDateStr) {
    errors.end_date = "请选择结束日期";
    missingFields.push("结束日期");
    isValid = false;
  }
  
  // 日期逻辑验证
  if (startDateStr && endDateStr && startDateStr > endDateStr) {
    errors.end_date = "结束日期不能早于开始日期";
    Message.error("📅 结束日期不能早于开始日期");
    isValid = false;
  }

  // 显示必填项提醒
  if (missingFields.length > 0) {
    const fieldNames = missingFields.join("、");
    Message.warning(`⚠️ 请完善必填信息：${fieldNames}`);
  }

  return isValid;
}

// AI 优化相关函数
async function getAISuggestions() {
  if (!canOptimize.value) return;

  // 先进行快速验证
  const quickErrors = quickValidatePlan({
    title: form.title,
    description: form.description,
    start_date: form.start_date,
    end_date: form.end_date,
  });

  if (quickErrors.length > 0) {
    // 显示快速验证的错误
    aiResponse.value = {
      suggestions: quickErrors,
      reasoning: "基于基本规则的快速验证",
    };
    return;
  }

  aiLoading.value = true;
  try {
    const response = await optimizePlanWithAI({
      title: form.title,
      description: form.description || "",
      start_date: form.start_date,
      end_date: form.end_date,
      user_context: `用户ID: ${userStore.user?.id}, 用户名: ${userStore.user?.username}`,
    });
    aiResponse.value = response;
  } catch (error) {
    console.error("AI 优化失败:", error);
    alert("AI 优化失败，请稍后重试");
  } finally {
    aiLoading.value = false;
  }
}

function clearAISuggestions() {
  aiResponse.value = null;
}

function isSameTask(a: AIRecommendedTask, b: AIRecommendedTask) {
  return (
    a.title === b.title &&
    (a.task_date ?? "") === (b.task_date ?? "") &&
    (a.start_time ?? "") === (b.start_time ?? "") &&
    (a.repeat_type ?? "none") === (b.repeat_type ?? "none")
  );
}

function addRecommendedTask(task: AIRecommendedTask) {
  const exists = pendingTasks.value.some((t) => isSameTask(t, task));
  if (exists) {
    alert("该任务已添加到待创建列表中");
    return;
  }
  pendingTasks.value.push({
    ...task,
    task_date: task.task_date || form.start_date,
  });
  // 注意：只是添加到待创建列表，不会立即创建计划，需要点击"保存计划"按钮才会创建
}

function removeTask(index: number) {
  pendingTasks.value.splice(index, 1);
}

function applyOptimization(
  optimizedPlan: AIOptimizePlanResponse["optimized_plan"],
) {
  if (!optimizedPlan) return;

  // 应用优化后的字段
  if (optimizedPlan.title) {
    form.title = optimizedPlan.title;
  }
  if (optimizedPlan.description) {
    form.description = optimizedPlan.description;
  }
  if (optimizedPlan.start_date) {
    form.start_date = optimizedPlan.start_date;
  }
  if (optimizedPlan.end_date) {
    form.end_date = optimizedPlan.end_date;
  }

  // 添加推荐任务到待创建列表
  if (optimizedPlan.recommended_tasks) {
    optimizedPlan.recommended_tasks.forEach((task) => {
      addRecommendedTask(task as AIRecommendedTask);
    });
  }

  alert("已应用 AI 优化建议！");
}

// 提交处理：创建或更新
async function createPlan() {
  if (!validate()) return;

  // 检查用户登录状态
  if (!userStore.user?.id) {
    alert("请先登录");
    router.push("/login");
    return;
  }

  submitting.value = true;
  
  // 转换日期格式（Arco Design 的 date-picker 返回 Dayjs 对象）
  const startDateStr = formatDateValue(form.start_date);
  const endDateStr = formatDateValue(form.end_date);
  
  const payload = {
    title: form.title.trim(),
    description: form.description?.trim() ?? "",
    start_date: startDateStr,
    end_date: endDateStr,
    tags: selectedTags.value, // 添加标签
  };

  try {
    if (editId.value) {
      if (!planStore.updatePlan) throw new Error("更新接口未实现");
      await planStore.updatePlan(editId.value, payload);
    } else {
      if (!planStore.createPlan) throw new Error("创建接口未实现");
      const newPlan = await planStore.createPlan(payload);

      // 如果有待创建的推荐任务，自动创建它们
      if (pendingTasks.value.length > 0 && newPlan.id && userStore.user?.id) {
        await createRecommendedTasks(newPlan.id);
      }
    }

    // 刷新计划列表，保证 PlanOverview 能马上显示最新数据
    if (planStore.loadPlans) await planStore.loadPlans();

    // 跳回计划概览页面（PlanOverview.vue 在 /home）
    router.push("/home");
  } catch (e: any) {
    console.error(e);
    alert(e?.message || "保存失败");
  } finally {
    submitting.value = false;
  }
}

// 创建推荐任务
async function createRecommendedTasks(planId: number) {
  if (!userStore.user?.id) return;

  const taskStore = await import("@/store/tasks").then((m) => m.useTaskStore());
  const startDate = new Date(form.start_date);

  for (const task of pendingTasks.value) {
    try {
      const taskPayload: CreateTaskPayload = {
        plan_id: planId,
        user_id: userStore.user.id,
        title: task.title,
        task_date: task.task_date || form.start_date, // 默认从计划开始日期开始
        start_time: task.start_time,
        end_time: task.end_time,
        status: "pending",
        note: task.note,
        repeat_type: task.repeat_type,
        repeat_end_date: task.repeat_end_date,
      };
      await taskStore.createTask(taskPayload);
    } catch (error) {
      console.error(`创建任务失败: ${task.title}`, error);
    }
  }
}

// 返回操作（后退或回首页）
function goBack() {
  if (window.history.length > 1) router.back();
  else router.push("/home");
}

// 下拉刷新处理
async function handleRefresh() {
  // 重新加载计划数据
  if (planStore.loadPlans) {
    await planStore.loadPlans();
  }
  // 如果是编辑模式，重新加载当前编辑的计划
  if (editId.value) {
    await loadForEdit();
  }
}

// 组件挂载时，若为编辑态则加载数据
onMounted(async () => {
  if (editId.value) {
    await loadForEdit();
  }
});
</script>

<style scoped>
/* 整体布局 */
.create-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

/* 左侧表单区域 */
.form-section {
  min-width: 0;
}

.form-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.plan-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-weight: 600;
  color: var(--text-main);
  font-size: 15px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-md);
  background: var(--bg-main);
  color: var(--text-main);
  font-family: inherit;
  font-size: 15px;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--ai-main);
  box-shadow: 0 0 0 3px var(--ai-bg);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.error-hint {
  color: var(--error);
  font-size: 13px;
  margin-top: var(--space-1);
}

/* 标签选择器 */
.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.tag-option {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-main);
  background: var(--bg-main);
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.tag-option:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
}

.tag-option.active {
  background: var(--ai-main);
  color: white;
  border-color: var(--ai-main);
}

/* AI 优化区域 */
.ai-optimize-section {
  margin: var(--space-2) 0;
  text-align: center;
}

.ai-optimize-btn {
  width: 100%;
  padding: var(--space-4);
  font-size: 16px;
  font-weight: 600;
}

.ai-icon {
  font-size: 20px;
}

.ai-hint {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: var(--space-2);
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

.btn {
  flex: 1;
  padding: var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.primary {
  background: var(--ai-main);
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: var(--ai-main-dark);
  transform: translateY(-1px);
}

.btn.secondary {
  background: var(--bg-card);
  color: var(--text-main);
  border: 1px solid var(--border-main);
}

.btn.secondary:hover:not(:disabled) {
  background: var(--bg-card-hover);
}

/* 右侧预览区域 */
.preview-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: fit-content;
}

.ai-panel,
.tasks-preview,
.plan-preview {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}

.panel-header,
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.panel-header h3,
.preview-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
}

.preview-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 任务预览列表 */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.task-preview-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-main);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.task-preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.task-preview-title {
  font-weight: 600;
  color: var(--text-main);
  font-size: 14px;
}

.task-preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: 12px;
  color: var(--text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.remove-task-btn {
  flex-shrink: 0;
  padding: var(--space-1) var(--space-2);
  background: var(--error-bg);
  color: var(--error);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.remove-task-btn:hover {
  background: var(--error);
  color: white;
}

/* 计划预览 */
.preview-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.preview-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
}

.preview-dates {
  font-size: 14px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.duration {
  background: var(--ai-bg);
  color: var(--ai-main);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.preview-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.preview-tag {
  background: var(--ai-bg);
  color: var(--ai-main);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .create-layout {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
  
  .preview-section {
    order: -1;
  }
  
  .date-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .form-card {
    padding: var(--space-4);
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
  
  .tag-selector {
    gap: var(--space-1);
  }
  
  .tag-option {
    font-size: 12px;
    padding: var(--space-1) var(--space-2);
  }
  
  .task-preview-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .task-preview-meta {
    width: 100%;
  }
}
</style>
