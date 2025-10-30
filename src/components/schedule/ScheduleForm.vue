<template>
  <form class="schedule-form" @submit.prevent="handleSubmit">
    <div class="row">
      <label>标题</label>
      <input v-model="form.title" required placeholder="如：会议 / 学习 / 运动" />
    </div>
    <div class="row">
      <label>日期</label>
      <input type="date" v-model="form.date" required />
    </div>
    <div class="row time-row">
      <div>
        <label>开始时间</label>
        <input type="time" v-model="form.start_time" />
      </div>
      <div>
        <label>结束时间</label>
        <input type="time" v-model="form.end_time" />
      </div>
    </div>
    <div class="row">
      <label>描述</label>
      <textarea v-model="form.description" rows="3" placeholder="补充说明(可选)"></textarea>
    </div>
    <div class="actions">
      <button type="submit" class="primary" :disabled="submitting">{{ submitting ? '创建中...' : '创建日程' }}</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useScheduleStore } from '@/store/schedules';
import { useUserStore } from '@/store/user';

const emit = defineEmits<{ (e: 'created'): void }>();
const scheduleStore = useScheduleStore();
const userStore = useUserStore();
const submitting = ref(false);
const today = new Date().toISOString().slice(0,10);

const form = reactive({
  title: '',
  date: today,
  start_time: '',
  end_time: '',
  description: ''
});

async function handleSubmit() {
  if (!userStore.user?.id) return alert('请先登录');
  submitting.value = true;
  try {
    await scheduleStore.create({
      user_id: userStore.user.id,
      title: form.title.trim(),
      date: form.date,
      start_time: form.start_time || undefined,
      end_time: form.end_time || undefined,
      description: form.description || undefined
    });
    emit('created');
    // reset
    form.title=''; form.description='';
  } catch(e:any){
    alert(e?.message || '创建失败');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.schedule-form { display:flex; flex-direction:column; gap:.75rem; }
.row { display:flex; flex-direction:column; gap:.35rem; }
label { font-size:.75rem; font-weight:600; letter-spacing:.05em; color: var(--color-gray,#555); }
input, textarea { border:1px solid var(--color-border); border-radius:6px; padding:.55rem .65rem; font-size:.85rem; }
.time-row { display:grid; grid-template-columns: repeat(2,1fr); gap:.75rem; }
@media (max-width:560px){ .time-row { grid-template-columns: 1fr; } }
.actions { display:flex; justify-content:flex-end; }
</style>