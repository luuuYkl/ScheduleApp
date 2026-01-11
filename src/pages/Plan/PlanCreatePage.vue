<template>
  <div class="page plan-create" style="max-width:720px;margin:calc(var(--header-height, 64px) + 1.5rem) auto 2rem auto;">
    <h1>{{ editId ? "编辑计划" : "创建新计划" }}</h1>

    <!-- 表单内容 -->
    <form class="form" @submit.prevent="createPlan" novalidate>
      <label>
        标题 *
        <input v-model.trim="form.title" type="text" placeholder="计划标题" required @input="clearAISuggestions" />
        <small class="error" v-if="errors.title">{{ errors.title }}</small>
      </label>

      <label>
        描述
        <textarea v-model="form.description" placeholder="计划描述（可选）" rows="3" @input="clearAISuggestions"></textarea>
      </label>

      <div class="row">
        <label>
          开始日期 *
          <input v-model="form.start_date" type="date" required @change="clearAISuggestions" />
          <small class="error" v-if="errors.start_date">{{ errors.start_date }}</small>
        </label>
        <label>
          结束日期 *
          <input v-model="form.end_date" type="date" required @change="clearAISuggestions" />
          <small class="error" v-if="errors.end_date">{{ errors.end_date }}</small>
        </label>
      </div>

      <!-- AI 优化按钮 -->
      <div class="ai-optimize-section">
        <button 
          type="button" 
          class="btn-ai-optimize" 
          @click="getAISuggestions"
          :disabled="aiLoading || !canOptimize"
        >
          <span class="ai-icon">🤖</span>
          {{ aiLoading ? 'AI 分析中...' : 'AI 智能优化' }}
        </button>
        <small class="ai-hint" v-if="!canOptimize">
          请先填写标题和日期后再使用 AI 优化
        </small>
      </div>

      <!-- AI 建议展示 -->
      <AISuggestions
        :loading="aiLoading"
        :response="aiResponse"
        @close="clearAISuggestions"
        @add-task="addRecommendedTask"
        @apply-optimization="applyOptimization"
      />

      <!-- 推荐任务列表（用户已添加） -->
      <div v-if="pendingTasks.length > 0" class="pending-tasks">
        <h3>📝 待创建任务（{{ pendingTasks.length }}）</h3>
        <p class="hint">点击下方"保存计划"按钮后，这些任务将自动创建</p>
        <ul>
          <li v-for="(task, index) in pendingTasks" :key="index">
            <div class="task-info">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-meta">
                <span v-if="task.task_date">📅 {{ task.task_date }}</span>
                <span v-if="task.start_time">⏰ {{ task.start_time }}<span v-if="task.end_time"> - {{ task.end_time }}</span></span>
                <span v-if="task.repeat_type && task.repeat_type !== 'none'">🔁 {{ task.repeat_type }}<span v-if="task.repeat_end_date"> · 至 {{ task.repeat_end_date }}</span></span>
                <span v-if="task.note">📝 {{ task.note }}</span>
              </div>
            </div>
            <button type="button" class="btn-remove" @click="removeTask(index)">✕</button>
          </li>
        </ul>
      </div>

      <div class="ops">
        <button class="primary" type="submit" :disabled="submitting">
          {{ submitting ? "提交中..." : (editId ? "保存修改" : "保存计划") }}
        </button>
        <button type="button" class="secondary" @click="goBack">返回</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePlanStore } from "@/store/plans";
import { useUserStore } from "@/store/user";
import { optimizePlanWithAI, quickValidatePlan } from "@/services/ai";
import type { AIOptimizePlanResponse, AIRecommendedTask, CreateTaskPayload } from "@/services/api.types";
import AISuggestions from "@/components/plan/AISuggestions.vue";
import { APP_CONFIG } from "@/config";

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
  const q = Array.isArray(route.query.edit) ? route.query.edit[0] : route.query.edit;
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

// 编辑态加载数据
async function loadForEdit() {
  if (!editId.value) return;
  // 尝试从 store 缓存取，若没有则触发加载
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
}

// 基本表单校验
function validate() {
  errors.title = "";
  errors.start_date = "";
  errors.end_date = "";

  if (!form.title || form.title.trim().length < 2) {
    errors.title = "标题至少需要 2 个字符";
  }
  if (!form.start_date) {
    errors.start_date = "请选择开始日期";
  }
  if (!form.end_date) {
    errors.end_date = "请选择结束日期";
  }
  if (form.start_date && form.end_date && form.start_date > form.end_date) {
    errors.end_date = "结束日期不能早于开始日期";
  }

  return !errors.title && !errors.start_date && !errors.end_date;
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
      reasoning: "基于基本规则的快速验证"
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
    (a.task_date ?? '') === (b.task_date ?? '') &&
    (a.start_time ?? '') === (b.start_time ?? '') &&
    (a.repeat_type ?? 'none') === (b.repeat_type ?? 'none')
  );
}

function addRecommendedTask(task: AIRecommendedTask) {
  const exists = pendingTasks.value.some(t => isSameTask(t, task));
  if (exists) {
    alert("该任务已添加到待创建列表中");
    return;
  }
  pendingTasks.value.push({ ...task, task_date: task.task_date || form.start_date });
  // 注意：只是添加到待创建列表，不会立即创建计划，需要点击"保存计划"按钮才会创建
}

function removeTask(index: number) {
  pendingTasks.value.splice(index, 1);
}

function applyOptimization(optimizedPlan: AIOptimizePlanResponse['optimized_plan']) {
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
    optimizedPlan.recommended_tasks.forEach(task => {
      addRecommendedTask(task as AIRecommendedTask);
    });
  }

  alert("已应用 AI 优化建议！");
}

// 提交处理：创建或更新
async function createPlan() {
  if (!validate()) return;

  submitting.value = true;
  const payload = {
    title: form.title.trim(),
    description: form.description?.trim() ?? "",
    start_date: form.start_date,
    end_date: form.end_date,
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
  
  const taskStore = await import("@/store/tasks").then(m => m.useTaskStore());
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

// 组件挂载时，若为编辑态则加载数据
onMounted(async () => {
  if (editId.value) {
    await loadForEdit();
  }
});
</script>

<style scoped>
.page.plan-create {
  padding: 1rem;
}
.form {
  display: grid;
  gap: .6rem;
}
.form label { display:flex; flex-direction:column; font-weight:600; }
.row { display:flex; gap:.6rem; }
.ops { display:flex; gap:.5rem; margin-top:.6rem; }
.primary { 
  background: var(--color-primary, #3b82f6); 
  color: #fff; 
  border: none; 
  padding: .5rem 1rem; 
  border-radius: 6px; 
  cursor: pointer;
  transition: background 0.2s;
}
.primary:hover {
  background: var(--color-primary-dark, #2563eb);
}
.primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
.secondary { 
  background: #6b7280; 
  color: #fff; 
  border: none; 
  padding: .5rem 1rem; 
  border-radius: 6px; 
  cursor: pointer;
  transition: background 0.2s;
}
.secondary:hover {
  background: #4b5563;
}
.error { color:#ef4444; font-size:0.85rem; }

/* AI 优化相关样式 */
.ai-optimize-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}

.btn-ai-optimize {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-ai-optimize:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-ai-optimize:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.ai-icon {
  font-size: 1.25rem;
}

.ai-hint {
  color: #6b7280;
  font-size: 0.875rem;
  text-align: center;
}

/* 待创建任务列表 */
.pending-tasks {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.pending-tasks h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #1f2937;
}

.pending-tasks .hint {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.pending-tasks ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pending-tasks li {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.pending-tasks .task-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.pending-tasks .task-title {
  font-weight: 600;
  color: #111827;
}

.pending-tasks .task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #4b5563;
}

.btn-remove {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-remove:hover {
  background: #dc2626;
}
</style>
