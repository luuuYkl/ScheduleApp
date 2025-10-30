import { defineStore } from 'pinia';
import { ref } from 'vue';
import { API } from '@/services/api';
import type { ScheduleItem, CreateSchedulePayload, UpdateSchedulePayload } from '@/services/api.types';

export const useScheduleStore = defineStore('schedules', () => {
  const schedules = ref<ScheduleItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load(date?: string) {
    loading.value = true; error.value = null;
    try { schedules.value = await API.fetchSchedules(date); } catch(e:any){ error.value = e.message || '加载失败'; }
    finally { loading.value = false; }
  }

  async function create(payload: CreateSchedulePayload) {
    const item = await API.createSchedule(payload);
    schedules.value.push(item);
    return item;
  }

  async function update(id: number, payload: UpdateSchedulePayload) {
    const updated = await API.updateSchedule(id, payload);
    const idx = schedules.value.findIndex(s => s.id === id);
    if (idx !== -1) schedules.value[idx] = updated;
    return updated;
  }

  async function remove(id: number) {
    await API.deleteSchedule(id);
    const idx = schedules.value.findIndex(s => s.id === id);
    if (idx !== -1) schedules.value.splice(idx,1);
  }

  async function toggleComplete(id: number) {
    const item = schedules.value.find(s => s.id === id);
    if (!item) return;
    const newCompleted = !item.completed;
    await update(id, { completed: newCompleted });
  }

  return { schedules, loading, error, load, create, update, remove, toggleComplete };
});