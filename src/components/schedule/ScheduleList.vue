<template>
  <div class="schedule-list card">
    <header class="list-header">
      <h3>{{ date }} 的日程</h3>
      <button class="secondary" @click="reload" :disabled="loading">刷新</button>
    </header>
    <div v-if="loading" class="loading">加载中...</div>
    <ul v-else>
      <li v-for="item in items" :key="item.id" class="schedule-item">
        <div class="title-row">
          <strong>{{ item.title }}</strong>
          <small v-if="item.start_time">{{ item.start_time }} - {{ item.end_time || '未结束' }}</small>
        </div>
        <p v-if="item.description" class="desc">{{ item.description }}</p>
        <div class="actions">
          <button class="danger" @click="remove(item.id)">删除</button>
        </div>
      </li>
      <li v-if="items.length===0" class="empty">暂无日程</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useScheduleStore } from '@/store/schedules';
const props = defineProps<{ date: string }>();
const scheduleStore = useScheduleStore();
const loading = computed(()=> scheduleStore.loading);
const items = computed(()=> scheduleStore.schedules.filter(s=> s.date === props.date));

async function reload(){ await scheduleStore.load(props.date); }
async function remove(id:number){
  if(!confirm('确认删除该日程?')) return;
  await scheduleStore.remove(id);
}

onMounted(()=> reload());
</script>

<style scoped>
.schedule-list { padding:1rem; }
.list-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:.5rem; }
ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.5rem; }
.schedule-item { background:#f8fafc; padding:.5rem .75rem; border:1px solid var(--color-border); border-radius:6px; display:flex; flex-direction:column; gap:.35rem; }
.title-row { display:flex; justify-content:space-between; align-items:center; font-size:.85rem; }
.title-row small { color: var(--color-gray); }
.desc { font-size:.7rem; color: var(--color-gray); margin:0; }
.empty { text-align:center; color: var(--color-gray); padding:.75rem 0; }
.actions { display:flex; justify-content:flex-end; }
</style>