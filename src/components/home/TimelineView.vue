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
    <!-- ========== 头部区域（扁平化布局） ========== -->
    <div class="header-compact">
      <!-- 左侧：日期信息组 -->
      <div class="date-section">
        <!-- 集成式日期选择器 -->
        <div class="date-picker">
          <span class="date-primary">{{ primaryDate }}</span>
          <span class="date-secondary">{{ yearMonth }}</span>
          
        </div>
        
        <!-- 胶囊视图切换器 -->
        <div class="view-switcher">
          <button 
            v-for="mode in viewModes" 
            :key="mode.value"
            class="view-mode-btn"
            :class="{ active: viewMode === mode.value }"
            @click="viewMode = mode.value"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>
      
      <!-- 右侧：天气信息 -->
      <div class="weather-info-compact" v-if="weather">
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
    <div class="timeline-wrapper" :class="{ 'three-day-mode': viewMode === 'three-day' }">
      <!-- 左侧: 时间刻度列 (00:00 - 24:00) -->
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

      <!-- ========== 单日视图 ========== -->
      <div 
        v-if="viewMode === 'single'"
        class="events-area" 
        ref="eventsAreaRef"
        @dragover="handleDragOver"
        @drop="handleDragEnd"
      >
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
          :class="[
            event.type, 
            { completed: event.completed, dragging: draggedEvent?.id === event.id }
          ]"
          :style="getEventStyle(event)"
          draggable="true"
          @mouseenter="handleMouseEnter($event, event)"
          @mouseleave="handleMouseLeave"
          @dragstart="handleDragStart($event, event)"
          @click="handleEventClick(event)"
        >
          <div class="event-icon">{{ getEventIcon(event) }}</div>
          <div class="event-content">
            <span class="event-title">{{ event.title }}</span>
            <span class="event-time">{{ formatEventTime(event) }}</span>
          </div>
          <!-- 调整大小手柄 -->
          <div 
            class="resize-handle" 
            @mousedown.stop="startResize($event, event)"
            @click.stop
          ></div>
          <!-- 溢出指示器 -->
          <div 
            v-if="event.totalColumns && event.totalColumns > MAX_VISIBLE_COLUMNS && event.columnIndex === MAX_VISIBLE_COLUMNS - 1" 
            class="overflow-badge"
          >
            +{{ event.totalColumns - MAX_VISIBLE_COLUMNS }}
          </div>
        </div>

        <!-- 全局 Tooltip 容器 -->
        <transition name="tooltip-fade">
          <div 
            v-if="activeTooltip && activeEvent"
            class="event-tooltip-global"
            :style="{ 
              left: (mousePosition.x + 15) + 'px',
              top: (mousePosition.y + 10) + 'px'
            }"
          >
            <div class="tooltip-content">
              <!-- 头部：标题 + 类型标签 -->
              <div class="tooltip-header">
                <div class="tooltip-title">{{ activeEvent.title }}</div>
                <div class="tooltip-type-badge">
                  {{ getTypeLabel(activeEvent.type) }}
                </div>
              </div>
              
              <!-- 时间信息 -->
              <div class="tooltip-row">
                <span class="tooltip-icon">🕐</span>
                <span class="tooltip-label">时间</span>
                <span class="tooltip-value">{{ formatEventTimeDetailed(activeEvent) }}</span>
              </div>
              
              <!-- 描述（如果有）-->
              <div v-if="activeEvent.originalData.description" class="tooltip-description">
                {{ activeEvent.originalData.description }}
              </div>
              
              <!-- 任务特有信息 -->
              <template v-if="activeEvent.type === 'task'">
                <!-- 优先级 -->
                <div class="tooltip-row" v-if="activeEvent.originalData.priority">
                  <span class="tooltip-icon">⚡</span>
                  <span class="tooltip-label">优先级</span>
                  <span class="tooltip-value">{{ getPriorityLabel(activeEvent.originalData.priority) }}</span>
                </div>
                
                <!-- 进度 -->
                <div class="tooltip-progress" v-if="activeEvent.originalData.progress !== undefined">
                  <div class="tooltip-row">
                    <span class="tooltip-icon">📊</span>
                    <span class="tooltip-label">进度</span>
                    <span class="tooltip-value">{{ activeEvent.originalData.progress }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: activeEvent.originalData.progress + '%' }"></div>
                  </div>
                </div>
                
                <!-- 状态 -->
                <div class="tooltip-row">
                  <span class="tooltip-icon">✅</span>
                  <span class="tooltip-label">状态</span>
                  <span class="tooltip-value">{{ getStatusLabel(activeEvent.originalData.status) }}</span>
                </div>
              </template>
              
              <!-- 日程特有信息 -->
              <template v-if="activeEvent.type === 'schedule'">
                <div class="tooltip-row">
                  <span class="tooltip-icon">✅</span>
                  <span class="tooltip-label">状态</span>
                  <span class="tooltip-value">{{ activeEvent.completed ? '已完成' : '未完成' }}</span>
                </div>
              </template>
            </div>
          </div>
        </transition>

        <!-- 拖拽反馈元素 -->
        <template v-if="isDragging && draggedEvent && dragDeltaHour !== 0">
          <!-- 预期落点矩形（极淡背景引导） -->
          <div 
            class="drop-placeholder"
            :style="{
              top: dragPreviewTop + '%',
              height: dragPreviewHeight + '%'
            }"
          ></div>
          
          <!-- 简洁时间提示（紧随占位框顶部） -->
          <div 
            class="drag-time-hint"
            :style="{
              top: `calc(${dragPreviewTop}% - 24px)`,
              left: '50%',
              transform: 'translateX(-50%)'
            }"
          >
            <span class="hint-time">{{ formatSnapTime(snapStartHour) }}</span>
            <span class="hint-separator"></span>
            <span class="hint-time">{{ formatSnapTime(snapEndHour) }}</span>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-if="sortedEvents.length === 0" class="empty-state">
          <span class="empty-icon">📅</span>
          <span class="empty-text">今天暂无日程安排</span>
        </div>
      </div>

      <!-- ========== 一周视图 ========== -->
      <div v-else-if="viewMode === 'week'" class="events-area-week">
        <div 
          v-for="day in weekDays" 
          :key="day.dateStr" 
          class="day-column"
          :class="{ 'is-today': day.isToday }"
        >
          <!-- 日期头部 -->
          <div class="day-header">
            <span class="day-label">{{ day.label }}</span>
            <span class="day-date">{{ day.shortDate }}</span>
          </div>
          <!-- 事件区域 -->
          <div class="day-events">
            <!-- 当前时间指示器（仅今天列显示） -->
            <div 
              v-if="day.isToday"
              class="current-time-indicator" 
              :style="{ top: currentTimePosition + '%' }"
            >
              <div class="indicator-dot"></div>
              <div class="indicator-line"></div>
            </div>

            <!-- 事件块 -->
            <div 
              v-for="event in getEventsForDay(day.dateStr, 2)" 
              :key="event.id"
              class="event-block"
              :class="[event.type, { completed: event.completed }]"
              :style="getEventStyle(event)"
              @mouseenter="handleMouseEnter($event, event)"
              @mouseleave="handleMouseLeave"
              @click="handleEventClick(event)"
            >
              <div class="event-icon">{{ getEventIcon(event) }}</div>
              <div class="event-content">
                <span class="event-title">{{ event.title }}</span>
              </div>
              <!-- 溢出指示器 -->
              <div 
                v-if="event.totalColumns && event.totalColumns > 2 && event.columnIndex === 1" 
                class="overflow-badge"
              >
                +{{ event.totalColumns - 2 }}
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="getEventsForDay(day.dateStr).length === 0" class="empty-state-mini">
              <span class="empty-icon-mini">-</span>
            </div>
          </div>
        </div>

        <!-- 全局 Tooltip 容器 -->
        <transition name="tooltip-fade">
          <div 
            v-if="activeTooltip && activeEvent"
            class="event-tooltip-global"
            :style="{ 
              left: (mousePosition.x + 15) + 'px',
              top: (mousePosition.y + 10) + 'px'
            }"
          >
            <div class="tooltip-content">
              <!-- 头部：标题 + 类型标签 -->
              <div class="tooltip-header">
                <div class="tooltip-title">{{ activeEvent.title }}</div>
                <div class="tooltip-type-badge">
                  {{ getTypeLabel(activeEvent.type) }}
                </div>
              </div>
              
              <!-- 时间信息 -->
              <div class="tooltip-row">
                <span class="tooltip-icon">🕐</span>
                <span class="tooltip-label">时间</span>
                <span class="tooltip-value">{{ formatEventTimeDetailed(activeEvent) }}</span>
              </div>
              
              <!-- 描述（如果有）-->
              <div v-if="activeEvent.originalData.description" class="tooltip-description">
                {{ activeEvent.originalData.description }}
              </div>
              
              <!-- 任务特有信息 -->
              <template v-if="activeEvent.type === 'task'">
                <!-- 优先级 -->
                <div class="tooltip-row" v-if="activeEvent.originalData.priority">
                  <span class="tooltip-icon">⚡</span>
                  <span class="tooltip-label">优先级</span>
                  <span class="tooltip-value">{{ getPriorityLabel(activeEvent.originalData.priority) }}</span>
                </div>
                
                <!-- 进度 -->
                <div class="tooltip-progress" v-if="activeEvent.originalData.progress !== undefined">
                  <div class="tooltip-row">
                    <span class="tooltip-icon">📊</span>
                    <span class="tooltip-label">进度</span>
                    <span class="tooltip-value">{{ activeEvent.originalData.progress }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: activeEvent.originalData.progress + '%' }"></div>
                  </div>
                </div>
                
                <!-- 状态 -->
                <div class="tooltip-row">
                  <span class="tooltip-icon">✅</span>
                  <span class="tooltip-label">状态</span>
                  <span class="tooltip-value">{{ getStatusLabel(activeEvent.originalData.status) }}</span>
                </div>
              </template>
              
              <!-- 日程特有信息 -->
              <template v-if="activeEvent.type === 'schedule'">
                <div class="tooltip-row">
                  <span class="tooltip-icon">✅</span>
                  <span class="tooltip-label">状态</span>
                  <span class="tooltip-value">{{ activeEvent.completed ? '已完成' : '未完成' }}</span>
                </div>
              </template>
            </div>
          </div>
        </transition>
      </div>

      <!-- ========== 三日视图 ========== -->
      <div v-else class="events-area-multi">
        <div 
          v-for="(day, index) in threeDays" 
          :key="day.dateStr" 
          class="day-column"
          :class="{ 'is-today': index === 0 }"
        >
          <!-- 日期头部 -->
          <div class="day-header">
            <span class="day-label">{{ day.label }}</span>
            <span class="day-date">{{ day.shortDate }}</span>
          </div>
          <!-- 事件区域 -->
          <div 
            class="day-events"
            :ref="el => { if (el) dayEventsRefs[index] = el as HTMLElement }"
            @dragover="handleDragOver"
            @drop="handleDragEnd"
          >
            <!-- 当前时间指示器（仅今天列显示） -->
            <div 
              v-if="index === 0"
              class="current-time-indicator" 
              :style="{ top: currentTimePosition + '%' }"
            >
              <div class="indicator-dot"></div>
              <div class="indicator-line"></div>
            </div>

            <!-- 事件块 -->
            <div 
              v-for="event in getEventsForDay(day.dateStr, 3)" 
              :key="event.id"
              class="event-block"
              :class="[
                event.type, 
                { completed: event.completed, dragging: draggedEvent?.id === event.id }
              ]"
              :style="getEventStyle(event)"
              draggable="true"
              @mouseenter="handleMouseEnter($event, event)"
              @mouseleave="handleMouseLeave"
              @dragstart="handleDragStart($event, event)"
              @click="handleEventClick(event)"
            >
              <div class="event-icon">{{ getEventIcon(event) }}</div>
              <div class="event-content">
                <span class="event-title">{{ event.title }}</span>
                <span class="event-time">{{ formatEventTime(event) }}</span>
              </div>
              <!-- 溢出指示器 -->
              <div 
                v-if="event.totalColumns && event.totalColumns > 3 && event.columnIndex === 2" 
                class="overflow-badge"
              >
                +{{ event.totalColumns - 3 }}
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="getEventsForDay(day.dateStr).length === 0" class="empty-state-mini">
              <span class="empty-icon-mini">-</span>
            </div>
          </div>
        </div>

        <!-- 全局 Tooltip 容器 -->
        <transition name="tooltip-fade">
          <div 
            v-if="activeTooltip && activeEvent"
            class="event-tooltip-global"
            :style="{ 
              left: (mousePosition.x + 15) + 'px',
              top: (mousePosition.y + 10) + 'px'
            }"
          >
            <div class="tooltip-content">
              <!-- 头部：标题 + 类型标签 -->
              <div class="tooltip-header">
                <div class="tooltip-title">{{ activeEvent.title }}</div>
                <div class="tooltip-type-badge">
                  {{ getTypeLabel(activeEvent.type) }}
                </div>
              </div>
              
              <!-- 时间信息 -->
              <div class="tooltip-row">
                <span class="tooltip-icon">🕐</span>
                <span class="tooltip-label">时间</span>
                <span class="tooltip-value">{{ formatEventTimeDetailed(activeEvent) }}</span>
              </div>
              
              <!-- 描述（如果有）-->
              <div v-if="activeEvent.originalData.description" class="tooltip-description">
                {{ activeEvent.originalData.description }}
              </div>
              
              <!-- 任务特有信息 -->
              <template v-if="activeEvent.type === 'task'">
                <!-- 优先级 -->
                <div class="tooltip-row" v-if="activeEvent.originalData.priority">
                  <span class="tooltip-icon">⚡</span>
                  <span class="tooltip-label">优先级</span>
                  <span class="tooltip-value">{{ getPriorityLabel(activeEvent.originalData.priority) }}</span>
                </div>
                
                <!-- 进度 -->
                <div class="tooltip-progress" v-if="activeEvent.originalData.progress !== undefined">
                  <div class="tooltip-row">
                    <span class="tooltip-icon">📊</span>
                    <span class="tooltip-label">进度</span>
                    <span class="tooltip-value">{{ activeEvent.originalData.progress }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: activeEvent.originalData.progress + '%' }"></div>
                  </div>
                </div>
                
                <!-- 状态 -->
                <div class="tooltip-row">
                  <span class="tooltip-icon">✅</span>
                  <span class="tooltip-label">状态</span>
                  <span class="tooltip-value">{{ getStatusLabel(activeEvent.originalData.status) }}</span>
                </div>
              </template>
              
              <!-- 日程特有信息 -->
              <template v-if="activeEvent.type === 'schedule'">
                <div class="tooltip-row">
                  <span class="tooltip-icon">✅</span>
                  <span class="tooltip-label">状态</span>
                  <span class="tooltip-value">{{ activeEvent.completed ? '已完成' : '未完成' }}</span>
                </div>
              </template>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watchEffect } from "vue";
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
  columnIndex?: number; // 所在列索引
  totalColumns?: number;  // 总列数
}

// 最大同时显示的列数
const MAX_VISIBLE_COLUMNS = 4;

// ========== 重叠检测和分组函数 ==========

// 检测两个事件是否重叠
function eventsOverlap(e1: TimelineEvent, e2: TimelineEvent): boolean {
  return e1.startHour < e2.endHour && e2.startHour < e1.endHour;
}

// 为事件分配列索引，处理重叠情况
function assignColumnsToEvents(events: TimelineEvent[], maxColumns: number = MAX_VISIBLE_COLUMNS): TimelineEvent[] {
  if (events.length === 0) return events;
  
  // 按开始时间排序
  const sorted = [...events].sort((a, b) => a.startHour - b.startHour);
  
  // 每一列的最后一个结束时间
  const columnEndTimes: number[] = [];
  
  return sorted.map(event => {
    // 找到第一个不重叠的列
    let columnIndex = 0;
    while (columnIndex < columnEndTimes.length && columnEndTimes[columnIndex] > event.startHour) {
      columnIndex++;
    }
    
    // 更新该列的结束时间
    if (columnIndex >= columnEndTimes.length) {
      columnEndTimes.push(event.endHour);
    } else {
      columnEndTimes[columnIndex] = event.endHour;
    }
    
    return {
      ...event,
      columnIndex,
      totalColumns: Math.min(columnEndTimes.length, maxColumns)
    };
  });
}

// 计算同一时间段内的事件总数（用于显示溢出）
function getOverlapGroup(events: TimelineEvent[], targetEvent: TimelineEvent): TimelineEvent[] {
  return events.filter(e => eventsOverlap(e, targetEvent));
}

const props = defineProps<{ planId?: number }>();

const taskStore = useTaskStore();
const scheduleStore = useScheduleStore();
const router = useRouter();

const todayStr = new Date().toISOString().slice(0, 10);
const hours = Array.from({ length: 25 }, (_, i) => i); // 0:00 - 24:00

// 当前时间相关
const currentMinute = ref(new Date().getHours() * 60 + new Date().getMinutes());
let timeUpdateInterval: number | null = null;

// 拖拽状态
const draggedEvent = ref<TimelineEvent | null>(null);
const dragDeltaHour = ref(0);
const eventsAreaRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragMouseY = ref(0);
const dragPreviewTop = ref(0);
const dragPreviewHeight = ref(0);

// 吸附间隔：15分钟
const SNAP_INTERVAL = 0.25;

// 吸附后的开始和结束时间
const snapStartHour = computed(() => {
  if (!draggedEvent.value) return 0;
  return draggedEvent.value.startHour + dragDeltaHour.value;
});

const snapEndHour = computed(() => {
  if (!draggedEvent.value) return 0;
  return draggedEvent.value.endHour + dragDeltaHour.value;
});


// 时间格式化
function formatSnapTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// 监听拖拽状态，更新预览位置
watchEffect(() => {
  if (!draggedEvent.value || dragDeltaHour.value === 0) return;
  const newStartHour = draggedEvent.value.startHour + dragDeltaHour.value;
  const duration = draggedEvent.value.endHour - draggedEvent.value.startHour;
  
  dragPreviewTop.value = ((newStartHour - START_HOUR) / TOTAL_HOURS) * 100;
  dragPreviewHeight.value = (duration / TOTAL_HOURS) * 100;
});

// 调整大小状态
const resizingEvent = ref<TimelineEvent | null>(null);
const resizeDeltaHour = ref(0);

// 三日视图的事件区域引用
const dayEventsRefs = ref<HTMLElement[]>([]);

// ========== Tooltip 状态管理 ==========
const activeTooltip = ref<string | number | null>(null);
const mousePosition = ref({ x: 0, y: 0 });
const activeEvent = ref<TimelineEvent | null>(null);

// ========== 视图模式（单日/三日/一周） ==========
const viewMode = ref<'single' | 'three-day' | 'week'>('single');

// 三日数据
const threeDays = computed(() => {
  const today = new Date();
  return [0, 1, 2].map(offset => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dateStr = date.toISOString().slice(0, 10);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return {
      dateStr,
      label: offset === 0 ? '今天' : offset === 1 ? '明天' : '后天',
      weekday: weekdays[date.getDay()],
      shortDate: `${date.getMonth() + 1}/${date.getDate()}`
    };
  });
});

// 一周数据（从周一开始）
const weekDays = computed(() => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=周日, 1=周一, ..., 6=周六
  // 计算到周一的偏移（周日需要回退6天）
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  
  return [0, 1, 2, 3, 4, 5, 6].map(offset => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + offset);
    const dateStr = date.toISOString().slice(0, 10);
    const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const isToday = dateStr === todayStr;
    return {
      dateStr,
      label: weekdays[offset],
      shortDate: `${date.getMonth() + 1}/${date.getDate()}`,
      isToday
    };
  });
});

// ========== 日期标题区域（扁平化布局） ==========

// 主日期（星期 + 日）
const primaryDate = computed(() => {
  if (viewMode.value === 'single') {
    return `${weekdayText.value} ${todayDate.value}`;
  } else if (viewMode.value === 'three-day') {
    const start = threeDays.value[0].shortDate;
    const end = threeDays.value[2].shortDate;
    return `${start}-${end}`;
  } else {
    // 一周视图
    const start = weekDays.value[0].shortDate;
    const end = weekDays.value[6].shortDate;
    return `${start}-${end}`;
  }
});

// 次要日期（年月）
const yearMonth = computed(() => {
  const today = new Date();
  return `${today.getFullYear()}年${today.getMonth() + 1}月`;
});

// 今天的日期号
const todayDate = computed(() => {
  const today = new Date();
  return today.getDate();
});

// 视图模式配置
const viewModes = [
  { value: 'single', label: '今日' },
  { value: 'three-day', label: '三日' },
  { value: 'week', label: '一周' }
];

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
const START_HOUR = 0;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;

// 合并任务和日程为时间轴事件（带列分配）
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
    t => t.start_date <= todayStr && t.end_date >= todayStr && (!props.planId || t.plan_id === props.planId)
  );
  
  todayTasks.forEach((t) => {
    let startHour = parseTimeToHour(t.start_time);
    let endHour = parseTimeToHour(t.end_time);
    
    // 如果任务没有时间信息，给它分配一个默认位置
    if (startHour === 0 && endHour === 0) {
      // 从9点开始，默认1小时
      startHour = 9;
      endHour = 10;
    } else {
      // 确保时间有效
      startHour = Math.max(START_HOUR, startHour);
      endHour = Math.min(END_HOUR, Math.max(startHour + 1, endHour));
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

  // 为重叠事件分配列索引
  return assignColumnsToEvents(events);
});

// 当前时间指示器位置
const currentTimePosition = computed(() => {
  const currentHour = currentMinute.value / 60;
  return ((currentHour - START_HOUR) / TOTAL_HOURS) * 100;
});

// ========== 三日视图：获取指定日期的事件 ==========
function getEventsForDay(dateStr: string, maxColumns: number = MAX_VISIBLE_COLUMNS): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // 处理日程
  scheduleStore.schedules
    .filter(s => s.date === dateStr)
    .forEach(s => {
      const startHour = parseTimeToHour(s.start_time);
      const endHour = parseTimeToHour(s.end_time);
      
      events.push({
        id: 's-' + s.id + '-' + dateStr,
        title: s.title,
        type: getScheduleType(s.title),
        startHour: Math.max(START_HOUR, startHour),
        endHour: Math.min(END_HOUR, endHour),
        completed: s.completed || false,
        originalData: s
      });
    });

  // 处理任务
  const dayTasks = taskStore.tasks.filter(
    t => t.start_date <= dateStr && t.end_date >= dateStr && (!props.planId || t.plan_id === props.planId)
  );
  
  const occupiedSlots: number[] = [];
  
  dayTasks.forEach((t) => {
    let startHour = parseTimeToHour(t.start_time);
    let endHour = parseTimeToHour(t.end_time);
    
    if (startHour === 0 && endHour === 0) {
      let defaultHour = 9;
      while (occupiedSlots.includes(defaultHour) && defaultHour < END_HOUR) {
        defaultHour++;
      }
      startHour = defaultHour;
      endHour = defaultHour + 1;
      occupiedSlots.push(defaultHour);
    } else {
      startHour = Math.max(START_HOUR, startHour);
      endHour = Math.min(END_HOUR, Math.max(startHour + 1, endHour));
      for (let h = Math.floor(startHour); h < Math.floor(endHour); h++) {
        occupiedSlots.push(h);
      }
    }
    
    events.push({
      id: 't-' + t.id + '-' + dateStr,
      title: t.title,
      type: getTaskType(t),
      startHour,
      endHour,
      completed: t.status === 'done',
      originalData: t
    });
  });

  // 为重叠事件分配列索引
  return assignColumnsToEvents(events, maxColumns);
}

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
  let height = ((event.endHour - event.startHour) / TOTAL_HOURS) * 100;
  
  // 如果正在调整这个事件的大小，动态更新高度
  if (resizingEvent.value?.id === event.id && resizeDeltaHour.value !== 0) {
    const newEndHour = event.endHour + resizeDeltaHour.value;
    height = ((newEndHour - event.startHour) / TOTAL_HOURS) * 100;
  }
  
  // 处理重叠事件的并排显示
  const columnIndex = event.columnIndex ?? 0;
  const totalColumns = event.totalColumns ?? 1;
  const visibleColumns = Math.min(totalColumns, MAX_VISIBLE_COLUMNS);
  
  // 计算宽度百分比（留出小间隙）
  const gap = 2; // 像素间隙
  const widthPercent = (100 - (gap * (visibleColumns - 1)) / 3) / visibleColumns;
  const leftPercent = columnIndex * (widthPercent + gap / 3);
  
  return {
    top: `${top}%`,
    height: `${Math.max(height, 4)}%`, // 最小高度
    left: `calc(var(--space-2) + ${leftPercent}%)`,
    width: `calc(${widthPercent}% - var(--space-2))`
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

function formatEventTimeDetailed(event: TimelineEvent): string {
  const formatHourMinute = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  return `${formatHourMinute(event.startHour)} - ${formatHourMinute(event.endHour)}`;
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

// ========== Tooltip 辅助函数 ==========

// 获取类型标签
function getTypeLabel(type: TimelineEvent['type']): string {
  const labels: Record<TimelineEvent['type'], string> = {
    task: '任务',
    schedule: '日程',
    focus: '专注',
    meal: '用餐',
    break: '休息'
  };
  return labels[type] || type;
}

// 获取优先级标签
function getPriorityLabel(priority: string | undefined): string {
  if (!priority) return '';
  const labels: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  };
  return labels[priority] || priority;
}

// 获取状态标签
function getStatusLabel(status: string | undefined): string {
  if (!status) return '';
  const labels: Record<string, string> = {
    todo: '待办',
    in_progress: '进行中',
    done: '已完成',
    cancelled: '已取消'
  };
  return labels[status] || status;
}

// ========== Tooltip 事件处理 ==========

function handleMouseEnter(event: MouseEvent, timelineEvent: TimelineEvent) {
  activeTooltip.value = timelineEvent.id;
  activeEvent.value = timelineEvent;
  
  // 获取事件块的位置
  const target = event.currentTarget as HTMLElement;
  
  // 向上查找事件区域的容器
  const eventsArea = target.closest('.events-area, .events-area-week, .events-area-multi') as HTMLElement;
  
  if (eventsArea) {
    const containerRect = eventsArea.getBoundingClientRect();
    // 记录鼠标相对于容器的位置
    mousePosition.value = {
      x: event.clientX - containerRect.left,
      y: event.clientY - containerRect.top
    };
  }
}

function handleMouseLeave() {
  activeTooltip.value = null;
  activeEvent.value = null;
}

function handleEventClick(event: TimelineEvent) {
  if (event.id.toString().startsWith('t-')) {
    const taskId = event.originalData.id;
    router.push(`/task/${taskId}`);
  }
}

// ========== 拖拽功能 ==========
function handleDragStart(event: DragEvent, timelineEvent: TimelineEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(timelineEvent.id));
  }
  draggedEvent.value = timelineEvent;
  dragDeltaHour.value = 0;
  isDragging.value = true;
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  
  if (!draggedEvent.value || !eventsAreaRef.value) return;
  
  // 更新鼠标Y坐标
  dragMouseY.value = event.clientY;
  
  // 计算拖拽位置对应的时间
  const rect = eventsAreaRef.value.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const percentage = y / rect.height;
  const newStartHour = START_HOUR + percentage * TOTAL_HOURS;
  
  // 计算时间偏移量（吸附到15分钟）
  const delta = newStartHour - draggedEvent.value.startHour;
  dragDeltaHour.value = Math.round(delta / SNAP_INTERVAL) * SNAP_INTERVAL;
}

function handleDragEnd() {
  if (draggedEvent.value && dragDeltaHour.value !== 0) {
    // 更新事件时间
    updateEventTime(draggedEvent.value, dragDeltaHour.value);
  }
  draggedEvent.value = null;
  dragDeltaHour.value = 0;
  isDragging.value = false;
}

async function updateEventTime(event: TimelineEvent, deltaHour: number) {
  const newStartHour = event.startHour + deltaHour;
  const newEndHour = event.endHour + deltaHour;
  
  // 确保时间在有效范围内
  if (newStartHour < START_HOUR || newEndHour > END_HOUR) {
    return;
  }
  
  const formatHourToTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  const newStartTime = formatHourToTime(newStartHour);
  const newEndTime = formatHourToTime(newEndHour);
  
  try {
    if (event.id.toString().startsWith('s-')) {
      // 更新日程
      await scheduleStore.update(event.originalData.id, {
        start_time: newStartTime,
        end_time: newEndTime
      });
      await scheduleStore.load(todayStr);
    } else if (event.id.toString().startsWith('t-')) {
      // 更新任务
      await taskStore.updateTask(event.originalData.id, {
        start_time: newStartTime,
        end_time: newEndTime
      });
      await taskStore.loadTasks();
    }
  } catch (error) {
    console.error('更新时间失败:', error);
  }
}

// ========== 调整大小功能 ==========
function startResize(event: MouseEvent, timelineEvent: TimelineEvent) {
  event.preventDefault();
  event.stopPropagation();
  
  resizingEvent.value = timelineEvent;
  resizeDeltaHour.value = 0;
  
  // 添加全局鼠标事件
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', endResize);
}

function handleResize(event: MouseEvent) {
  if (!resizingEvent.value || !eventsAreaRef.value) return;
  
  const rect = eventsAreaRef.value.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const percentage = Math.max(0, Math.min(1, y / rect.height));
  const targetHour = START_HOUR + percentage * TOTAL_HOURS;
  
  // 计算新的结束时间（四舍五入到半小时）
  const newEndHour = Math.round(targetHour * 2) / 2;
  const delta = newEndHour - resizingEvent.value.endHour;
  
  // 确保最小时长为0.5小时，且不超过结束时间
  if (newEndHour > resizingEvent.value.startHour + 0.5 && newEndHour <= END_HOUR) {
    resizeDeltaHour.value = delta;
  }
}

function endResize() {
  if (resizingEvent.value && resizeDeltaHour.value !== 0) {
    updateEventDuration(resizingEvent.value, resizeDeltaHour.value);
  }
  
  resizingEvent.value = null;
  resizeDeltaHour.value = 0;
  
  // 移除全局鼠标事件
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', endResize);
}

async function updateEventDuration(event: TimelineEvent, deltaHour: number) {
  const newEndHour = event.endHour + deltaHour;
  
  // 确保时间有效
  if (newEndHour <= event.startHour || newEndHour > END_HOUR) {
    return;
  }
  
  const formatHourToTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  const newEndTime = formatHourToTime(newEndHour);
  const startTime = formatHourToTime(event.startHour);
  
  try {
    if (event.id.toString().startsWith('s-')) {
      // 更新日程
      await scheduleStore.update(event.originalData.id, {
        start_time: startTime,
        end_time: newEndTime
      });
      await scheduleStore.load(todayStr);
    } else if (event.id.toString().startsWith('t-')) {
      // 更新任务
      await taskStore.updateTask(event.originalData.id, {
        start_time: startTime,
        end_time: newEndTime
      });
      await taskStore.loadTasks();
    }
  } catch (error) {
    console.error('更新时长失败:', error);
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
  padding: var(--space-5);
  overflow: hidden;
  min-width: 380px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ========== 扁平化头部布局 ========== */
.header-compact {
  display: flex;
  align-items: center;  /* 统一基准线对齐 */
  justify-content: space-between;
  gap: var(--space-4);
  height: 44px;  /* 压缩纵向空间 */
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

/* 日期信息组 */
.date-section {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

/* 集成式日期选择器 */
.date-picker {
  display: flex;
  align-items: baseline;  /* 基线对齐 */
  gap: var(--space-3);
  padding: 6px 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.date-picker:hover {
  border-color: var(--ai-main);
  background: var(--ai-bg);
}

.date-picker:active {
  transform: scale(0.98);
}

/* 主日期：等高视觉权重 */
.date-primary {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-main);
  font-variant-numeric: tabular-nums;
}

/* 次要日期：通过留白平衡，而非字号差异 */
.date-secondary {
  font-size: 15px;  /* 与主日期等高 */
  font-weight: 400;  /* 通过字重区分 */
  color: var(--text-secondary);
}

.date-icon {
  font-size: 16px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.date-picker:hover .date-icon {
  opacity: 1;
}

/* 胶囊视图切换器 */
.view-switcher {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
}

.view-mode-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.view-mode-btn:hover {
  color: var(--text-main);
}

.view-mode-btn.active {
  background: var(--bg-elevated);
  color: var(--ai-main);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 紧凑天气信息 */
.weather-info-compact {
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
  flex: 1;
  min-height: 650px;
  padding: var(--space-2);
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
  min-height: 100%;
  height: 100%;
  padding: var(--space-2);
}

/* 当前时间指示器 */
.current-time-indicator {
  position: absolute;
  left: var(--space-3);
  right: var(--space-3);
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

/* ========== 全局 Tooltip 样式 ========== */

/* 全局 Tooltip 容器 */
.event-tooltip-global {
  position: absolute;
  background: var(--bg-elevated);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  min-width: 280px;
  max-width: 320px;
  white-space: normal;
  pointer-events: none;
}

/* Tooltip 进入/离开动画 */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.tooltip-fade-enter-to,
.tooltip-fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* Tooltip 内容容器 */
.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
}

/* 头部：标题 + 类型标签 */
.tooltip-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
}

.tooltip-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tooltip-type-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--ai-bg);
  color: var(--ai-main);
  font-weight: 500;
  flex-shrink: 0;
}

/* 信息行 */
.tooltip-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: 12px;
  line-height: 1.5;
}

.tooltip-icon {
  flex-shrink: 0;
  width: 16px;
  text-align: center;
  opacity: 0.6;
}

.tooltip-label {
  color: var(--text-secondary);
  flex-shrink: 0;
  font-weight: 500;
}

.tooltip-value {
  color: var(--text-main);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 描述文本 */
.tooltip-description {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.5;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  word-wrap: break-word;
}

/* 进度条 */
.tooltip-progress {
  margin-top: var(--space-2);
}

.progress-bar {
  height: 4px;
  background: var(--bg-subtle);
  border-radius: 2px;
  overflow: hidden;
  margin-top: var(--space-1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ai-main), #7C3AED);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 溢出指示器 */
.overflow-badge {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--ai-main);
  color: white;
  font-size: 9px;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: var(--radius-full);
  min-width: 18px;
  text-align: center;
}

/* 拖拽状态 */
.event-block.dragging {
  opacity: 0.5;
  transform: scale(0.98);
  cursor: grabbing;
}

.event-block:active {
  cursor: grabbing;
}

/* 调整大小手柄 */
.resize-handle {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 8px;
  cursor: ns-resize;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  background: transparent;
  transition: background 0.15s;
}

.resize-handle:hover {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.1), transparent);
}

.resize-handle::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.resize-handle:hover::after {
  opacity: 1;
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

/* ========== 拖拽反馈系统（重构后） ========== */

/* 预期落点矩形 - 极淡背景引导 */
.drop-placeholder {
  position: absolute;
  left: var(--space-2);
  right: var(--space-2);
  border: 1px dashed rgba(var(--ai-main-rgb, 59, 130, 246), 0.2);
  border-radius: var(--radius-sm);
  background: rgba(var(--ai-main-rgb, 59, 130, 246), 0.015);
  z-index: 2;
  pointer-events: none;
  transition: top 0.15s ease-out, height 0.15s ease-out;
}

/* 简洁时间提示 - 紧随占位框顶部 */
.drag-time-hint {
  position: absolute;
  background: var(--bg-elevated);
  border: 1px solid rgba(var(--ai-main-rgb, 59, 130, 246), 0.3);
  border-radius: 6px;
  padding: 6px 12px;
  box-shadow: var(--shadow-md);
  z-index: 15;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 500;
}

.hint-time {
  color: var(--ai-main);
}

.hint-separator {
  width: 1px;
  height: 14px;
  background: rgba(var(--ai-main-rgb, 59, 130, 246), 0.3);
}

/* ========== 一周视图样式 ========== */
.hour-mark.highlighted {
  background: var(--ai-bg);
}

.hour-mark.highlighted .hour-label {
  color: var(--ai-main);
  font-weight: 600;
}

.hour-mark.highlighted .hour-line {
  background: var(--ai-main);
  height: 2px;
}

/* ========== 一周视图样式 ========== */
.events-area-week {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-left: var(--space-2);
}

.events-area-week .day-column {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  min-width: 0;
}

.events-area-week .day-column.is-today {
  background: var(--bg-elevated);
}

.events-area-week .day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-card);
}

.events-area-week .day-column.is-today .day-header {
  background: var(--ai-bg);
  border-bottom-color: var(--ai-main);
}

.events-area-week .day-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.events-area-week .day-column.is-today .day-label {
  color: var(--ai-main);
}

.events-area-week .day-date {
  font-size: 10px;
  color: var(--text-muted);
}

.events-area-week .day-column.is-today .day-date {
  color: var(--ai-light);
}

.events-area-week .day-events {
  flex: 1;
  position: relative;
  min-height: 500px;
}

.events-area-week .event-block {
  left: 2px;
  right: 2px;
  padding: 2px 4px;
  min-height: 24px;
}

.events-area-week .event-icon {
  font-size: 10px;
  width: 14px;
}

.events-area-week .event-title {
  font-size: 10px;
  line-height: 1.2;
}

.events-area-week .current-time-indicator {
  left: 2px;
  right: 2px;
}

.events-area-week .indicator-dot {
  width: 6px;
  height: 6px;
}

.events-area-week .indicator-line {
  height: 1px;
}

.events-area-week .empty-state-mini {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.events-area-week .empty-icon-mini {
  font-size: 14px;
  color: var(--text-muted);
  opacity: 0.3;
}

/* 一周视图溢出指示器 */
.events-area-week .overflow-badge {
  font-size: 8px;
  padding: 1px 3px;
  min-width: 14px;
  right: 2px;
}

/* 一周视图响应式 */
@media (max-width: 768px) {
  .events-area-week .day-header {
    padding: var(--space-1);
  }
  
  .events-area-week .day-label {
    font-size: 10px;
  }
  
  .events-area-week .day-date {
    font-size: 9px;
  }
  
  .events-area-week .day-events {
    min-height: 400px;
  }
  
  .events-area-week .event-block {
    padding: 1px 2px;
    min-height: 20px;
  }
  
  .events-area-week .event-title {
    font-size: 9px;
  }
}

/* ========== 三日视图样式 ========== */
.events-area-multi {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-left: var(--space-2);
}

.events-area-multi .day-column {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  min-width: 0;
}

.events-area-multi .day-column.is-today {
  background: var(--bg-elevated);
}

.events-area-multi .day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-card);
}

.events-area-multi .day-column.is-today .day-header {
  background: var(--ai-bg);
  border-bottom-color: var(--ai-main);
}

.events-area-multi .day-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.events-area-multi .day-column.is-today .day-label {
  color: var(--ai-main);
}

.events-area-multi .day-date {
  font-size: 11px;
  color: var(--text-muted);
}

.events-area-multi .day-events {
  flex: 1;
  position: relative;
  min-height: 500px;
}

.events-area-multi .event-block {
  left: 2px;
  right: 2px;
  padding: var(--space-1) var(--space-2);
  min-height: 28px;
}

.events-area-multi .event-icon {
  font-size: 12px;
  width: 16px;
}

.events-area-multi .event-title {
  font-size: 12px;
}

.events-area-multi .event-time {
  font-size: 10px;
}

.events-area-multi .current-time-indicator {
  left: 2px;
  right: 2px;
}

.events-area-multi .indicator-dot {
  width: 6px;
  height: 6px;
}

.events-area-multi .indicator-line {
  height: 1px;
}

.events-area-multi .empty-state-mini {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.events-area-multi .empty-icon-mini {
  font-size: 16px;
  color: var(--text-muted);
  opacity: 0.3;
}

/* 三日视图溢出指示器 */
.events-area-multi .overflow-badge {
  font-size: 8px;
  padding: 1px 3px;
  min-width: 14px;
  right: 2px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .timeline-container {
    padding: var(--space-3);
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