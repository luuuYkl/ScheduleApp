<template>
  <PageScaffold
    title="编辑任务"
    :subtitle="task ? task.title : '加载中…'"
  >
    <template #actions>
      <Button variant="ghost" size="small" @click="goBack">
        ← 返回
      </Button>
    </template>

    <div class="edit-container" v-if="task">
      <Card class="form-card">
        <form class="task-edit-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="title">任务标题 *</label>
            <input id="title" v-model="form.title" type="text" placeholder="输入任务标题" required />
          </div>

          <div class="form-group">
            <label>日期范围 *</label>
            <div class="date-range">
              <input v-model="form.start_date" type="date" required />
              <span class="date-separator">~</span>
              <input v-model="form.end_date" type="date" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="startTime">开始时间</label>
              <input id="startTime" v-model="form.start_time" type="time" />
            </div>
            <div class="form-group">
              <label for="endTime">结束时间</label>
              <input id="endTime" v-model="form.end_time" type="time" />
            </div>
          </div>

          <div class="form-group">
            <label for="note">备注</label>
            <textarea id="note" v-model="form.note" placeholder="添加任务备注（可选）" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label for="repeatType">重复</label>
            <select id="repeatType" v-model="form.repeat_type">
              <option value="none">不重复</option>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          </div>

          <div class="form-group" v-if="form.repeat_type !== 'none'">
            <label for="repeatEndDate">重复结束日期</label>
            <input id="repeatEndDate" v-model="form.repeat_end_date" type="date" />
          </div>

          <div class="form-actions">
            <Button variant="primary" size="large" :loading="saving" @click="handleSubmit">
              💾 保存修改
            </Button>
            <Button variant="outline" @click="goBack">
              取消
            </Button>
          </div>
        </form>
      </Card>
    </div>

    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>正在加载…</p>
    </div>
  </PageScaffold>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTaskStore } from "@/store/tasks";
import PageScaffold from "@/components/common/PageScaffold.vue";
import Button from "@/components/common/Button.vue";
import Card from "@/components/common/Card.vue";

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();

const id = Number(route.params.id);
const saving = ref(false);

const task = computed(() => taskStore.tasks.find((t) => t.id === id));

const form = reactive({
  title: "",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  note: "",
  repeat_type: "none",
  repeat_end_date: "",
});

onMounted(async () => {
  if (!task.value) {
    await taskStore.loadTasks();
  }
  if (task.value) {
    form.title = task.value.title;
    form.start_date = task.value.start_date;
    form.end_date = task.value.end_date;
    form.start_time = task.value.start_time || "";
    form.end_time = task.value.end_time || "";
    form.note = task.value.note || "";
    form.repeat_type = task.value.repeat_type || "none";
    form.repeat_end_date = task.value.repeat_end_date || "";
  }
});

async function handleSubmit() {
  if (!task.value || !form.title.trim()) return;
  saving.value = true;
  try {
    await taskStore.updateTask(task.value.id, {
      title: form.title.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      start_time: form.start_time || undefined,
      end_time: form.end_time || undefined,
      note: form.note.trim() || undefined,
      repeat_type: form.repeat_type as any,
      repeat_end_date: form.repeat_type !== "none" ? form.repeat_end_date : undefined,
    });
    router.replace(`/task/${task.value.id}`);
  } catch (err) {
    console.error("保存失败:", err);
  } finally {
    saving.value = false;
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push("/home");
  }
}
</script>

<style scoped>
.edit-container {
  max-width: 600px;
  margin: 0 auto;
}

.form-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.task-edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-group label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-main);
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  background: var(--bg-input);
  color: var(--text-main);
  transition: border-color var(--dur-fast) var(--ease-standard);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--ai-main);
}

.date-range {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.date-separator {
  color: var(--text-muted);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: var(--space-3);
  color: var(--text-secondary);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border-main);
  border-top-color: var(--ai-main);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
