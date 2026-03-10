<!--
  ═══════════════════════════════════════════════════════════════
  时间轴视图组件 (TimelineView.vue)
  ═══════════════════════════════════════════════════════════════
  
  【组件定位】
  今日页面的核心组件，以时间轴形式展示用户今日的任务和日程安排。
  
  【核心功能】
  1. 日期天气头部 - 显示今日日期、星期和实时天气
  2. 时间轴刻度 - 5:00-23:00 的垂直时间刻度
  3. 事件块展示 - 任务/日程以色块形式定位在时间轴上
  4. 当前时间指示器 - 红色横线标记当前时间位置
  5. 事件交互 - 点击事件块可跳转至详情页
  
  【视觉结构】
  ┌─────────────────────────────────────────────────────────┐
  │  周二                                    ☀️ 25° 晴      │
  │  3月10日                                北京            │
  ├─────────────────────────────────────────────────────────┤
  │  05:00 ─┬─────────────────────────────────────────────  │
  │         │                                              │
  │  06:00 ─┼─────────────────────────────────────────────  │
  │         │  ┌──────────────────────┐                    │
  │  07:00 ─┼──│ 📋 晨间计划          │                    │
  │         │  └──────────────────────┘                    │
  │  08:00 ─┼─────────────────────────────────────────────  │
  │         │  ●━━━━━━━━━━━━━━━━━►  (当前时间指示器)        │
  │  09:00 ─┼──┌──────────────────────┐                    │
  │         │  │ 🎯 专注工作          │                    │
  │  10:00 ─┼──└──────────────────────┘                    │
  │         │                                              │
  └─────────────────────────────────────────────────────────┘
  
  【事件类型与颜色】
  - task(任务):     蓝色边框 (#2563EB)
  - schedule(日程): 紫色边框 (#A855F7)
  - focus(专注):    红色边框 (#EF4444)
  - meal(用餐):     橙色边框 (#F59E0B)
  - break(休息):    绿色边框 (#22C55E)
  
  【数据来源】
  - taskStore: 任务数据仓库
  - scheduleStore: 日程数据仓库
  - wttr.in/Open-Meteo: 天气API (带1小时缓存)
  
  【Props】
  - planId?: 可选，筛选特定计划下的任务
-->
<template>
  <div class="timeline-container card">
    <!-- ========== 头部区域: 日期 + 天气 ========== -->
    <div class="header">
      <!-- 左侧: 星期和日期 -->
      <div class="header-left">
        <h2 class="weekday-title">{{ weekdayText }}</h2>
        <span class="date-label">{{ formatDateLabel(todayStr) }}</span>
      </div>
      <!-- 右侧: 天气信息 (温度 + 描述 + 位置) -->
      <div class="weather-info" v-if="weather">
        <div class="weather-main">
          <span class="weather-icon">{{ weatherIcon }}</span>
          <span class="weather-temp">{{ weather.temp }}°</span>
        </div>
        <div class="weather-details">
          <span class="weather-desc">{{ weather.description }}</span>
          <span class="weather-location" v-if="weather.location">{{ weather.location }}</span>
        </div>
      </div>
    </div>

    <!-- ========== 时间轴主体区域 ========== -->
    <div class="timeline-wrapper">
      <!-- 左侧: 时间刻度列 (05:00 - 23:00) -->
      <div class="time-axis">
        <div 
          v-for="hour in hours" 
          :key="hour" 
          class="hour-mark"
          :class="{ 'current-hour': isCurrentHour(hour) }"
          :style="{ top: ((hour - START_HOUR) / TOTAL_HOURS * 100) + '%' }"
        >
          <span class="hour-label">{{ formatHour(hour) }}</span>
          <div class="hour-line"></div>
        </div>
      </div>

      <!-- 事件区域 -->
      <div class="events-area">
        <!-- 当前时间指示器 -->
        <div 
          class="current-time-indicator" 
          :style="{ top: currentTimePosition + '%' }"
        >
          <div class="indicator-dot"></div>
          <div class="indicator-line"></div>
        </div>

        <!-- 事件块 -->
        <div 
          v-for="event in sortedEvents" 
          :key="event.id"
          class="event-block"
          :class="[event.type, { completed: event.completed }]"
          :style="getEventStyle(event)"
          @click="handleEventClick(event)"
        >
          <div class="event-icon">{{ getEventIcon(event) }}</div>
          <div class="event-content">
            <span class="event-title">{{ event.title }}</span>
            <span class="event-time">{{ formatEventTime(event) }}</span>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="sortedEvents.length === 0" class="empty-state">
          <span class="empty-icon">📅</span>
          <span class="empty-text">今天暂无日程安排</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useTaskStore } from "@/store/tasks";
import { useScheduleStore } from "@/store/schedules";
import { useRouter } from "vue-router";

interface TimelineEvent {
  id: string | number;
  title: string;
  type: 'task' | 'schedule' | 'focus' | 'meal' | 'break';
  startHour: number;
  endHour: number;
  completed: boolean;
  originalData: any;
}

const props = defineProps<{ planId?: number }>();

const taskStore = useTaskStore();
const scheduleStore = useScheduleStore();
const router = useRouter();

const todayStr = new Date().toISOString().slice(0, 10);
const hours = Array.from({ length: 19 }, (_, i) => i + 5); // 5:00 - 23:00

// 当前时间相关
const currentMinute = ref(new Date().getHours() * 60 + new Date().getMinutes());
let timeUpdateInterval: number | null = null;

// 星期文字
const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const weekdayText = computed(() => {
  const today = new Date();
  return weekdays[today.getDay()];
});

// 天气相关
interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
  location?: string;
}

const weather = ref<WeatherData | null>(null);
const weatherLoading = ref(true);

// 天气代码到图标的映射 (基于 wttr.in weatherCode)
const weatherCodeToIcon: Record<string, string> = {
  // 晴天
  '113': '☀️',  // Sunny
  '116': '⛅',  // Partly cloudy
  '119': '🌤️', // Cloudy  
  '122': '☁️',  // Overcast
  
  // 雾
  '143': '🌫️', // Mist
  '248': '🌫️', // Fog
  '260': '🌫️', // Freezing fog
  
  // 雨
  '176': '🌦️', // Patchy rain
  '179': '🌨️', // Patchy snow
  '182': '🌧️', // Patchy sleet
  '185': '🌧️', // Patchy freezing drizzle
  '200': '⛈️', // Thunder
  '227': '❄️', // Blowing snow
  '230': '❄️', // Blizzard
  '263': '🌦️', // Patchy light drizzle
  '266': '🌦️', // Light drizzle
  '281': '🌧️', // Freezing drizzle
  '284': '🌧️', // Heavy freezing drizzle
  '293': '🌦️', // Patchy light rain
  '296': '🌧️', // Light rain
  '299': '🌧️', // Moderate rain
  '302': '🌧️', // Heavy rain
  '305': '🌧️', // Heavy rain
  '308': '🌧️', // Heavy rain
  '311': '🌧️', // Freezing rain
  '314': '🌧️', // Heavy freezing rain
  '317': '🌨️', // Sleet
  '320': '🌨️', // Heavy sleet
  '323': '🌨️', // Patchy snow
  '326': '🌨️', // Light snow
  '329': '❄️', // Moderate snow
  '332': '❄️', // Heavy snow
  '335': '❄️', // Heavy snow
  '338': '❄️', // Heavy snow
  '350': '🌨️', // Ice pellets
  '353': '🌦️', // Rain shower
  '356': '🌧️', // Heavy rain shower
  '359': '🌧️', // Torrential rain
  '362': '🌨️', // Sleet showers
  '365': '🌨️', // Heavy sleet showers
  '368': '🌨️', // Snow showers
  '371': '❄️', // Heavy snow showers
  '374': '🌨️', // Ice pellets
  '377': '🌨️', // Heavy ice pellets
  '386': '⛈️', // Thunder with rain
  '389': '⛈️', // Thunder with heavy rain
  '392': '⛈️', // Thunder with snow
  '395': '⛈️', // Heavy thunder snow
};

// 天气描述到图标的映射
const weatherDescToIcon: Record<string, string> = {
  '晴': '☀️',
  '晴天': '☀️',
  'Sunny': '☀️',
  'Clear': '☀️',
  '多云': '⛅',
  'Partly cloudy': '⛅',
  'Cloudy': '🌤️',
  '阴': '☁️',
  '阴天': '☁️',
  'Overcast': '☁️',
  '小雨': '🌦️',
  '中雨': '🌧️',
  '大雨': '🌧️',
  '暴雨': '⛈️',
  'Rain': '🌧️',
  'Light rain': '🌦️',
  'Heavy rain': '🌧️',
  '雷阵雨': '⛈️',
  'Thunderstorm': '⛈️',
  '小雪': '🌨️',
  '中雪': '❄️',
  '大雪': '❄️',
  'Snow': '❄️',
  '雾': '🌫️',
  '霾': '🌫️',
  'Fog': '🌫️',
  'Mist': '🌫️',
  'Haze': '🌫️',
};

const weatherIcon = computed(() => {
  if (!weather.value) return '🌤️';
  
  // 优先使用天气代码匹配
  const code = weather.value.icon;
  if (code && weatherCodeToIcon[code]) {
    return weatherCodeToIcon[code];
  }
  
  // 然后尝试描述匹配
  const desc = weather.value.description;
  if (desc) {
    // 精确匹配
    if (weatherDescToIcon[desc]) {
      return weatherDescToIcon[desc];
    }
    // 模糊匹配
    for (const [key, icon] of Object.entries(weatherDescToIcon)) {
      if (desc.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(desc.toLowerCase())) {
        return icon;
      }
    }
  }
  
  return '🌤️';
});

// 获取天气数据 - 多数据源方案
async function fetchWeather() {
  weatherLoading.value = true;
  
  // 尝试从缓存读取（1小时有效期）
  const cacheKey = 'weather_cache';
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedData) {
    try {
      const cache = JSON.parse(cachedData);
      const cacheTime = cache.timestamp || 0;
      const now = Date.now();
      
      // 缓存1小时内有效
      if (now - cacheTime < 60 * 60 * 1000) {
        weather.value = cache.data;
        weatherLoading.value = false;
        return;
      }
    } catch (e) {
      // 缓存解析失败，继续获取新数据
    }
  }
  
  // 尝试获取用户位置
  let location = '';
  try {
    // 尝试通过IP定位
    const ipResponse = await fetch('https://ipapi.co/json/', { 
      signal: AbortSignal.timeout(3000) 
    });
    if (ipResponse.ok) {
      const ipData = await ipResponse.json();
      location = ipData.city || '';
    }
  } catch (e) {
    console.log('IP定位失败，使用默认位置');
  }
  
  // 主要数据源: wttr.in
  try {
    const weatherUrl = location 
      ? `https://wttr.in/${encodeURIComponent(location)}?format=j1&lang=zh`
      : 'https://wttr.in/?format=j1&lang=zh';
      
    const response = await fetch(weatherUrl, {
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      const currentCondition = data.current_condition?.[0];
      const area = data.nearest_area?.[0];
      
      if (currentCondition) {
        // 优先使用中文描述
        let description = currentCondition.lang_zh?.[0]?.value || '';
        if (!description) {
          description = currentCondition.weatherDesc?.[0]?.value || '';
          // 尝试翻译常见英文描述
          const translations: Record<string, string> = {
            'Sunny': '晴',
            'Clear': '晴',
            'Partly cloudy': '多云',
            'Cloudy': '多云',
            'Overcast': '阴',
            'Mist': '薄雾',
            'Fog': '雾',
            'Light rain': '小雨',
            'Rain': '雨',
            'Heavy rain': '大雨',
            'Light snow': '小雪',
            'Snow': '雪',
            'Heavy snow': '大雪',
            'Thunderstorm': '雷阵雨',
          };
          description = translations[description] || description;
        }
        
        const weatherData: WeatherData = {
          temp: parseInt(currentCondition.temp_C) || 0,
          description: description || '晴',
          icon: currentCondition.weatherCode || '113',
          humidity: parseInt(currentCondition.humidity) || 0,
          windSpeed: parseInt(currentCondition.windspeedKmph) || 0,
          location: area?.areaName?.[0]?.value || area?.region?.[0]?.value || ''
        };
        
        // 缓存天气数据
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: weatherData
        }));
        
        weather.value = weatherData;
        weatherLoading.value = false;
        return;
      }
    }
  } catch (error) {
    console.log('wttr.in 获取失败，尝试备用源');
  }
  
  // 备用数据源: Open-Meteo (完全免费，无需API Key)
  try {
    // 使用北京作为默认位置
    const lat = 39.9042;
    const lon = 116.4074;
    
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia/Shanghai`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (response.ok) {
      const data = await response.json();
      const current = data.current;
      
      if (current) {
        // Open-Meteo 天气代码映射
        const wmoCodeToDesc: Record<number, string> = {
          0: '晴', 1: '晴', 2: '多云', 3: '阴',
          45: '雾', 48: '雾',
          51: '小雨', 53: '小雨', 55: '中雨',
          61: '小雨', 63: '中雨', 65: '大雨',
          71: '小雪', 73: '中雪', 75: '大雪',
          80: '阵雨', 81: '阵雨', 82: '暴雨',
          95: '雷阵雨', 96: '雷阵雨', 99: '雷阵雨'
        };
        
        const weatherData: WeatherData = {
          temp: Math.round(current.temperature_2m) || 0,
          description: wmoCodeToDesc[current.weather_code] || '晴',
          icon: String(current.weather_code) || '0'
        };
        
        // 缓存天气数据
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: weatherData
        }));
        
        weather.value = weatherData;
        weatherLoading.value = false;
        return;
      }
    }
  } catch (error) {
    console.log('Open-Meteo 获取失败');
  }
  
  // 所有数据源都失败，使用默认值
  weather.value = {
    temp: 20,
    description: '晴',
    icon: '113',
    humidity: 50,
    windSpeed: 10
  };
  weatherLoading.value = false;
}

// 时间轴配置
const START_HOUR = 5;
const END_HOUR = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;

// 合并任务和日程为时间轴事件
const sortedEvents = computed<TimelineEvent[]>(() => {
  const events: TimelineEvent[] = [];

  // 处理日程
  scheduleStore.schedules
    .filter(s => s.date === todayStr)
    .forEach(s => {
      const startHour = parseTimeToHour(s.start_time);
      const endHour = parseTimeToHour(s.end_time);
      
      events.push({
        id: 's-' + s.id,
        title: s.title,
        type: getScheduleType(s.title),
        startHour: Math.max(START_HOUR, startHour),
        endHour: Math.min(END_HOUR, endHour),
        completed: s.completed || false,
        originalData: s
      });
    });

  // 处理任务 - 显示所有今日任务
  const todayTasks = taskStore.tasks.filter(
    t => t.task_date === todayStr && (!props.planId || t.plan_id === props.planId)
  );
  
  // 用于跟踪已占用的时间槽，避免重叠
  const occupiedSlots: number[] = [];
  
  todayTasks.forEach((t, index) => {
    let startHour = parseTimeToHour(t.start_time);
    let endHour = parseTimeToHour(t.end_time);
    
    // 如果任务没有时间信息，给它分配一个默认位置
    if (startHour === 0 && endHour === 0) {
      // 从9点开始，找一个未占用的1小时槽位
      let defaultHour = 9;
      while (occupiedSlots.includes(defaultHour) && defaultHour < END_HOUR) {
        defaultHour++;
      }
      startHour = defaultHour;
      endHour = defaultHour + 1;
      occupiedSlots.push(defaultHour);
    } else {
      // 确保时间有效
      startHour = Math.max(START_HOUR, startHour);
      endHour = Math.min(END_HOUR, Math.max(startHour + 1, endHour));
      // 标记占用的槽位
      for (let h = Math.floor(startHour); h < Math.floor(endHour); h++) {
        occupiedSlots.push(h);
      }
    }
    
    events.push({
      id: 't-' + t.id,
      title: t.title,
      type: getTaskType(t),
      startHour,
      endHour,
      completed: t.status === 'done',
      originalData: t
    });
  });

  // 按开始时间排序
  return events.sort((a, b) => a.startHour - b.startHour);
});

// 当前时间指示器位置
const currentTimePosition = computed(() => {
  const currentHour = currentMinute.value / 60;
  return ((currentHour - START_HOUR) / TOTAL_HOURS) * 100;
});

// 辅助函数
function parseTimeToHour(timeStr?: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m || 0) / 60;
}

function getScheduleType(title: string): TimelineEvent['type'] {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('lunch') || lowerTitle.includes('午餐') || lowerTitle.includes('饭')) {
    return 'meal';
  }
  if (lowerTitle.includes('break') || lowerTitle.includes('休息')) {
    return 'break';
  }
  return 'schedule';
}

function getTaskType(task: any): TimelineEvent['type'] {
  const title = (task.title || '').toLowerCase();
  if (title.includes('focus') || title.includes('专注')) {
    return 'focus';
  }
  return 'task';
}

function getEventIcon(event: TimelineEvent): string {
  if (event.completed) return '✓';
  
  switch (event.type) {
    case 'focus': return '🎯';
    case 'meal': return '🍽️';
    case 'break': return '☕';
    case 'schedule': return '📌';
    case 'task': 
    default: return '📋';
  }
}

function getEventStyle(event: TimelineEvent): Record<string, string> {
  const top = ((event.startHour - START_HOUR) / TOTAL_HOURS) * 100;
  const height = ((event.endHour - event.startHour) / TOTAL_HOURS) * 100;
  
  return {
    top: `${top}%`,
    height: `${Math.max(height, 4)}%` // 最小高度
  };
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function formatEventTime(event: TimelineEvent): string {
  const startH = Math.floor(event.startHour);
  const endH = Math.floor(event.endHour);
  return `${startH} - ${endH}`;
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
}

function isCurrentHour(hour: number): boolean {
  const currentHour = Math.floor(currentMinute.value / 60);
  return hour === currentHour;
}

function handleEventClick(event: TimelineEvent) {
  if (event.id.toString().startsWith('t-')) {
    const taskId = event.originalData.id;
    router.push(`/task/${taskId}`);
  }
}

// 更新当前时间
function updateCurrentTime() {
  const now = new Date();
  currentMinute.value = now.getHours() * 60 + now.getMinutes();
}

onMounted(async () => {
  await taskStore.loadTasks(props.planId);
  await scheduleStore.load(todayStr);
  
  // 获取天气
  fetchWeather();
  
  // 每分钟更新当前时间
  timeUpdateInterval = window.setInterval(updateCurrentTime, 60000);
});

onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
  }
});
</script>

<style scoped>
.timeline-container {
  padding: var(--space-4);
  overflow: hidden;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  gap: var(--space-3);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.weekday-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
  letter-spacing: -0.02em;
}

.date-label {
  font-size: 13px;
  color: var(--text-muted);
}

.weather-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-elevated);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
}

.weather-main {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.weather-icon {
  font-size: 20px;
}

.weather-temp {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}

.weather-details {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.weather-desc {
  font-size: 11px;
  color: var(--text-secondary);
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weather-location {
  font-size: 10px;
  color: var(--text-muted);
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-wrapper {
  display: flex;
  position: relative;
  min-height: 400px;
}

/* 时间轴刻度 */
.time-axis {
  width: 48px;
  flex-shrink: 0;
  position: relative;
}

.hour-mark {
  position: absolute;
  width: 100%;
  display: flex;
  align-items: center;
  height: 0;
}

.hour-label {
  font-size: 11px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  width: 40px;
  text-align: right;
  padding-right: var(--space-2);
}

.hour-line {
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
}

.hour-mark.current-hour .hour-label {
  color: var(--ai-main);
  font-weight: 600;
}

.hour-mark.current-hour .hour-line {
  background: var(--ai-main);
}

/* 事件区域 */
.events-area {
  flex: 1;
  position: relative;
  margin-left: var(--space-2);
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  min-height: 400px;
}

/* 当前时间指示器 */
.current-time-indicator {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  z-index: 10;
  transform: translateY(-50%);
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--error);
  box-shadow: 0 0 4px var(--error);
}

.indicator-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, var(--error), transparent);
}

/* 事件块 */
.event-block {
  position: absolute;
  left: var(--space-2);
  right: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
  min-height: 32px;
  overflow: hidden;
}

.event-block:hover {
  transform: translateX(2px);
  box-shadow: var(--shadow-sm);
}

/* 事件类型颜色 */
.event-block.task {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%);
  border-left: 3px solid var(--color-brand-500);
}

.event-block.schedule {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%);
  border-left: 3px solid #A855F7;
}

.event-block.focus {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%);
  border-left: 3px solid #EF4444;
}

.event-block.meal {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%);
  border-left: 3px solid #F59E0B;
}

.event-block.break {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.08) 100%);
  border-left: 3px solid #22C55E;
}

.event-block.completed {
  opacity: 0.6;
}

.event-block.completed .event-title {
  text-decoration: line-through;
}

.event-icon {
  font-size: 14px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.event-block.completed .event-icon {
  color: var(--success);
}

.event-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.event-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-time {
  font-size: 11px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* 空状态 */
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.empty-icon {
  font-size: 32px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: var(--text-muted);
}

/* 响应式 */
@media (max-width: 768px) {
  .header {
    flex-direction: row;
    align-items: flex-start;
  }
  
  .weekday-title {
    font-size: 18px;
  }
  
  .weather-info {
    padding: var(--space-1) var(--space-2);
    gap: var(--space-1);
  }
  
  .weather-icon {
    font-size: 16px;
  }
  
  .weather-temp {
    font-size: 14px;
  }
  
  .weather-desc {
    font-size: 11px;
    max-width: 40px;
  }
  
  .timeline-wrapper {
    min-height: 350px;
  }
  
  .events-area {
    min-height: 350px;
  }
  
  .time-axis {
    width: 40px;
  }
  
  .hour-label {
    font-size: 10px;
    width: 32px;
  }
  
  .event-block {
    padding: var(--space-1) var(--space-2);
    min-height: 28px;
  }
  
  .event-title {
    font-size: 12px;
  }
  
  .event-time {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .weather-details {
    display: none;
  }
  
  .weather-info {
    padding: var(--space-1) var(--space-2);
  }
  
  .weather-location {
    display: none;
  }
}
</style>