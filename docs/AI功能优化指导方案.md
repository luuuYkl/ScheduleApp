# 🚀 ScheduleApp AI功能优化指导方案

> **目标用户**：大学生 + 立下目标但有实现困难的人  
> **核心价值**：AI辅助计划创建 + AI复盘优化计划执行

---

## 📊 一、现状分析

### 1.1 已实现的AI功能

| 功能模块 | 文件位置 | 完成度 | 说明 |
|---------|---------|--------|------|
| AI计划优化 | `src/services/ai.ts` | ✅ 90% | 分析计划、生成推荐任务 |
| AI复盘服务 | `src/services/ai-review.ts` | ✅ 85% | 每日/周/月复盘总结 |
| AI建议组件 | `src/components/plan/AISuggestions.vue` | ✅ 80% | 展示建议和任务列表 |
| AI定时任务 | `src/main.ts` | ✅ 100% | 每日凌晨自动复盘 |

### 1.2 核心痛点识别

针对目标用户（大学生+目标实现困难者）的主要痛点：

```
痛点1: 不知道如何制定可行的计划
       → 现状：AI可优化计划 ✅ 基本满足

痛点2: 计划太宏大无法坚持
       → 现状：仅提供建议 ⚠️ 缺少强制拆分

痛点3: 执行中遇到困难没人指导
       → 现状：无实时反馈 ❌ 缺失

痛点4: 复盘后不知道如何调整
       → 现状：仅生成建议 ⚠️ 缺少一键应用

痛点5: 缺乏持续动力
       → 现状：仅有签到 ⚠️ 激励不足
```

---

## 🎯 二、优化方案总览

### 2.1 功能优先级矩阵

| 优先级 | 功能名称 | 价值评估 | 实现难度 | 建议周期 |
|--------|---------|---------|---------|---------|
| 🔴 P0 | 复盘一键应用调整 | ⭐⭐⭐⭐⭐ | 中 | 1-2周 |
| 🔴 P0 | 问题任务智能识别 | ⭐⭐⭐⭐⭐ | 低 | 1周 |
| 🟡 P1 | 学生场景模板库 | ⭐⭐⭐⭐ | 中 | 2周 |
| 🟡 P1 | 动态难度调整 | ⭐⭐⭐⭐ | 中 | 2周 |
| 🟢 P2 | 实时执行辅导 | ⭐⭐⭐⭐ | 高 | 3-4周 |
| 🟢 P2 | 成长激励系统 | ⭐⭐⭐ | 中 | 2周 |

---

## 📋 三、详细功能设计

### 3.1 🔴 P0: AI复盘一键应用调整

**问题**：复盘只生成建议，用户需要手动修改计划，增加操作成本

**解决方案**：新增"一键应用"功能，自动将复盘建议转化为计划调整

#### 3.1.1 功能流程

```
用户触发复盘
    ↓
AI分析完成数据
    ↓
生成复盘报告 + 调整建议
    ↓
【新增】一键应用按钮 ← 用户点击
    ↓
自动执行以下操作：
├── 调整未完成任务日期
├── 修改任务时间安排
├── 添加AI推荐的新任务
├── 降低/提高任务密度
└── 更新计划结束日期（可选）
    ↓
展示调整预览，用户确认后生效
```

#### 3.1.2 新增数据结构

```typescript
// src/services/ai-review.ts - 扩展

/** 复盘调整动作 */
export interface ReviewAdjustment {
  type: 'reschedule' | 'add_task' | 'modify_task' | 'delete_task' | 'extend_plan';
  target_id?: number;          // 目标任务/计划ID
  current_value?: any;         // 当前值
  suggested_value: any;        // 建议值
  reason: string;              // 调整原因
  priority: 'high' | 'medium' | 'low';
}

/** 扩展AI复盘响应 */
export interface AIReview {
  // ... 现有字段
  
  // 新增字段
  adjustments: ReviewAdjustment[];  // 可应用的调整列表
  risk_alerts: RiskAlert[];         // 风险预警
}

/** 风险预警 */
export interface RiskAlert {
  type: 'overdue' | 'overload' | 'stagnant' | 'unrealistic';
  message: string;
  affected_items: number[];
  severity: 'warning' | 'critical';
}
```

#### 3.1.3 API扩展

```typescript
// src/services/ai-review.ts - 新增函数

/**
 * 应用复盘调整
 */
export async function applyReviewAdjustments(
  adjustments: ReviewAdjustment[]
): Promise<ApplyResult> {
  const results: ApplyResult = { success: [], failed: [] };
  
  for (const adj of adjustments) {
    try {
      switch (adj.type) {
        case 'reschedule':
          await taskStore.updateTask(adj.target_id, {
            task_date: adj.suggested_value.new_date
          });
          break;
        case 'add_task':
          await taskStore.createTask(adj.suggested_value);
          break;
        case 'modify_task':
          await taskStore.updateTask(adj.target_id, adj.suggested_value);
          break;
        case 'delete_task':
          await taskStore.deleteTask(adj.target_id);
          break;
        case 'extend_plan':
          await planStore.updatePlan(adj.target_id, {
            end_date: adj.suggested_value.new_end_date
          });
          break;
      }
      results.success.push(adj);
    } catch (e) {
      results.failed.push({ adjustment: adj, error: e });
    }
  }
  
  return results;
}
```

#### 3.1.4 UI组件设计

```vue
<!-- src/components/plan/ReviewAdjustments.vue - 新增组件 -->
<template>
  <div class="review-adjustments">
    <div class="adjustments-header">
      <h3>🎯 AI建议的调整</h3>
      <span class="adjustments-count">{{ adjustments.length }}项</span>
    </div>
    
    <!-- 调整列表 -->
    <div class="adjustments-list">
      <div 
        v-for="(adj, index) in adjustments" 
        :key="index"
        :class="['adjustment-item', adj.priority]"
      >
        <div class="adjustment-icon">{{ getAdjustmentIcon(adj.type) }}</div>
        <div class="adjustment-content">
          <div class="adjustment-title">{{ getAdjustmentTitle(adj) }}</div>
          <div class="adjustment-reason">{{ adj.reason }}</div>
          <div class="adjustment-diff" v-if="adj.current_value">
            <span class="current">{{ formatValue(adj.current_value) }}</span>
            <span class="arrow">→</span>
            <span class="suggested">{{ formatValue(adj.suggested_value) }}</span>
          </div>
        </div>
        <label class="adjustment-checkbox">
          <input type="checkbox" v-model="selectedAdjustments" :value="adj" />
        </label>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="adjustments-actions">
      <Button variant="outline" @click="selectAll">全选</Button>
      <Button variant="primary" @click="applySelected" :loading="applying">
        应用选中 ({{ selectedAdjustments.length }})
      </Button>
    </div>
  </div>
</template>
```

---

### 3.2 🔴 P0: 问题任务智能识别

**问题**：用户不知道哪些任务出了问题，需要手动查找

**解决方案**：在首页/计划页面自动识别并高亮问题任务

#### 3.2.1 问题类型定义

```typescript
// src/services/task-analyzer.ts - 新增文件

/** 任务问题类型 */
export type TaskIssueType = 
  | 'overdue'        // 已过期未完成
  | 'stagnant'       // 长期无进展
  | 'overload'       // 单日任务过多
  | 'conflict'       // 时间冲突
  | 'unrealistic'    // 时间预估不合理
  | 'orphan'         // 无关联计划
  | 'vague';         // 描述模糊

/** 任务问题 */
export interface TaskIssue {
  task_id: number;
  type: TaskIssueType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestion: string;
  auto_fix_available: boolean;
}

/** 分析任务问题 */
export function analyzeTaskIssues(tasks: Task[]): TaskIssue[] {
  const issues: TaskIssue[] = [];
  const today = new Date().toISOString().slice(0, 10);
  
  tasks.forEach(task => {
    // 检查过期任务
    if (task.task_date < today && task.status === 'pending') {
      issues.push({
        task_id: task.id,
        type: 'overdue',
        severity: 'warning',
        message: `任务「${task.title}」已过期${calculateDaysOverdue(task.task_date)}天`,
        suggestion: '建议重新安排到合适的日期',
        auto_fix_available: true
      });
    }
    
    // 检查描述模糊
    if (task.title.length < 4 && !task.note) {
      issues.push({
        task_id: task.id,
        type: 'vague',
        severity: 'info',
        message: `任务「${task.title}」描述不够清晰`,
        suggestion: '建议添加更详细的说明',
        auto_fix_available: false
      });
    }
    
    // 更多检查...
  });
  
  return issues.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
```

#### 3.2.2 UI展示

```vue
<!-- 在 HomePage.vue 或 PlanOverview.vue 中添加 -->
<div class="task-issues-panel" v-if="taskIssues.length > 0">
  <div class="issues-header">
    <span class="issues-icon">⚠️</span>
    <span class="issues-title">{{ taskIssues.length }}个任务需要关注</span>
  </div>
  <div class="issues-list">
    <div 
      v-for="issue in taskIssues.slice(0, 3)" 
      :key="issue.task_id"
      :class="['issue-item', issue.severity]"
      @click="goToTask(issue.task_id)"
    >
      <span class="issue-message">{{ issue.message }}</span>
      <Button v-if="issue.auto_fix_available" size="small" variant="ghost">
        一键修复
      </Button>
    </div>
  </div>
  <Button variant="link" v-if="taskIssues.length > 3">
    查看全部 {{ taskIssues.length }} 个问题
  </Button>
</div>
```

---

### 3.3 🟡 P1: 学生场景模板库

**问题**：通用建议对大学生场景不够针对性

**解决方案**：预设大学生高频场景模板，AI优化时自动识别并应用

#### 3.3.1 模板定义

```typescript
// src/services/plan-templates.ts - 新增文件

/** 计划模板 */
export interface PlanTemplate {
  id: string;
  name: string;
  icon: string;
  category: 'exam' | 'study' | 'job' | 'skill' | 'life';
  description: string;
  keywords: string[];           // 触发关键词
  suggested_duration: number;   // 建议时长（天）
  task_templates: TaskTemplate[];
  tips: string[];
}

/** 任务模板 */
export interface TaskTemplate {
  title: string;
  default_time?: string;
  repeat_type?: 'daily' | 'weekly';
  note?: string;
}

/** 预设模板库 */
export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: 'final-exam',
    name: '期末考试备考',
    icon: '📚',
    category: 'exam',
    description: '为期末考试制定高效复习计划',
    keywords: ['期末', '考试', '复习', '备考', 'final'],
    suggested_duration: 14,
    task_templates: [
      { title: '复习今日章节', default_time: '09:00', repeat_type: 'daily' },
      { title: '完成练习题', default_time: '14:00', repeat_type: 'daily', note: '针对复习内容' },
      { title: '整理错题本', default_time: '20:00', repeat_type: 'daily' },
      { title: '模拟测验', default_time: '15:00', note: '每周一次全真模拟' },
    ],
    tips: [
      '建议采用番茄工作法，25分钟专注+5分钟休息',
      '复习间隔建议：新知识24小时内复习第一次，3天后第二次，7天后第三次',
      '考前一天不要学习新内容，专注于复习和放松',
    ]
  },
  {
    id: 'thesis',
    name: '毕业论文写作',
    icon: '📝',
    category: 'study',
    description: '从开题到答辩的完整论文计划',
    keywords: ['论文', '毕业', 'thesis', '开题', '答辩'],
    suggested_duration: 60,
    task_templates: [
      { title: '文献阅读与笔记', default_time: '09:00', repeat_type: 'daily' },
      { title: '撰写正文', default_time: '14:00', repeat_type: 'daily', note: '每日目标500字' },
      { title: '与导师沟通', note: '每周汇报进度' },
    ],
    tips: [
      '先完成再完美，第一稿不需要完美',
      '定期备份，建议使用Git或云盘',
      '与导师保持沟通，及时调整方向',
    ]
  },
  {
    id: 'job-hunting',
    name: '求职准备',
    icon: '💼',
    category: 'job',
    description: '校招/实习求职全流程准备',
    keywords: ['求职', '找工作', '实习', '面试', '简历', 'offer'],
    suggested_duration: 30,
    task_templates: [
      { title: '刷LeetCode/算法题', default_time: '09:00', repeat_type: 'daily' },
      { title: '准备面试题', default_time: '14:00', repeat_type: 'daily' },
      { title: '投递简历', default_time: '10:00', note: '每日目标3-5家' },
      { title: '模拟面试', note: '每周2次' },
    ],
    tips: [
      '简历要针对岗位定制，突出相关经验',
      '面试后及时复盘，记录问题',
      '保持积极心态，求职是双向选择',
    ]
  },
  {
    id: 'postgrad',
    name: '考研备考',
    icon: '🎓',
    category: 'exam',
    description: '考研全周期复习计划',
    keywords: ['考研', '研究生', 'postgrad'],
    suggested_duration: 180,
    task_templates: [
      { title: '英语单词/阅读', default_time: '07:00', repeat_type: 'daily' },
      { title: '数学练习', default_time: '09:00', repeat_type: 'daily' },
      { title: '专业课复习', default_time: '14:00', repeat_type: 'daily' },
      { title: '政治刷题', default_time: '19:00', repeat_type: 'daily' },
      { title: '真题模拟', note: '周末进行' },
    ],
    tips: [
      '制定长期规划，分阶段推进',
      '保持作息规律，不要熬夜',
      '定期检测学习效果，及时调整',
    ]
  },
  {
    id: 'skill-learning',
    name: '技能学习',
    icon: '💡',
    category: 'skill',
    description: '学习一项新技能（编程/设计/语言等）',
    keywords: ['学习', '技能', '编程', '设计', '语言', 'learn'],
    suggested_duration: 30,
    task_templates: [
      { title: '理论学习', default_time: '09:00', repeat_type: 'daily', note: '视频/文档学习' },
      { title: '动手实践', default_time: '14:00', repeat_type: 'daily', note: '做一个小项目' },
      { title: '总结笔记', default_time: '20:00', repeat_type: 'daily' },
    ],
    tips: [
      '学习最好的方式是输出，尝试教别人或写博客',
      '设定可量化的里程碑，如"完成3个小项目"',
      '加入学习社区，与他人交流',
    ]
  },
];

/**
 * 根据计划标题匹配模板
 */
export function matchTemplate(title: string, description?: string): PlanTemplate | null {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  for (const template of PLAN_TEMPLATES) {
    for (const keyword of template.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return template;
      }
    }
  }
  
  return null;
}

/**
 * 应用模板到计划
 */
export function applyTemplate(
  template: PlanTemplate,
  planId: number,
  startDate: string,
  endDate: string
): CreateTaskPayload[] {
  const tasks: CreateTaskPayload[] = [];
  
  template.task_templates.forEach((tt, index) => {
    tasks.push({
      plan_id: planId,
      title: tt.title,
      task_date: startDate,
      start_time: tt.default_time,
      note: tt.note,
      repeat_type: tt.repeat_type || 'none',
      repeat_end_date: tt.repeat_type ? endDate : undefined,
      status: 'pending'
    });
  });
  
  return tasks;
}
```

#### 3.3.2 模板选择UI

```vue
<!-- 在 PlanCreatePage.vue 中添加模板选择 -->
<div class="template-section" v-if="!editId">
  <div class="section-title">🎯 或选择一个模板开始</div>
  <div class="template-grid">
    <div 
      v-for="template in filteredTemplates" 
      :key="template.id"
      :class="['template-card', { active: selectedTemplate?.id === template.id }]"
      @click="selectTemplate(template)"
    >
      <span class="template-icon">{{ template.icon }}</span>
      <span class="template-name">{{ template.name }}</span>
    </div>
  </div>
</div>
```

---

### 3.4 🟡 P1: 动态难度调整

**问题**：计划执行过程中，任务量不会根据实际完成情况调整

**解决方案**：AI根据完成率自动建议调整任务密度

#### 3.4.1 调整逻辑

```typescript
// src/services/dynamic-adjustment.ts - 新增文件

/** 难度调整建议 */
export interface DifficultyAdjustment {
  current_density: number;      // 当前任务密度（任务数/天）
  suggested_density: number;    // 建议密度
  adjustment_reason: string;
  actions: AdjustmentAction[];
}

/** 调整动作 */
export interface AdjustmentAction {
  type: 'add_rest_day' | 'reduce_tasks' | 'increase_tasks' | 'redistribute';
  description: string;
  impact: string;
}

/**
 * 计算难度调整建议
 */
export function calculateDifficultyAdjustment(
  tasks: Task[],
  startDate: string,
  endDate: string,
  completionRate: number
): DifficultyAdjustment | null {
  
  const totalDays = calculateDaysBetween(startDate, endDate);
  const totalTasks = tasks.length;
  const currentDensity = totalTasks / totalDays;
  
  // 完成率过高，建议增加任务
  if (completionRate > 90 && currentDensity < 5) {
    return {
      current_density: currentDensity,
      suggested_density: currentDensity * 1.2,
      adjustment_reason: '你的完成率很高，可以考虑增加挑战',
      actions: [
        {
          type: 'increase_tasks',
          description: '每日增加1-2个任务',
          impact: '提升成长速度'
        }
      ]
    };
  }
  
  // 完成率过低，建议减少任务
  if (completionRate < 50) {
    return {
      current_density: currentDensity,
      suggested_density: Math.max(1, currentDensity * 0.7),
      adjustment_reason: '当前任务量可能超出你的承载能力',
      actions: [
        {
          type: 'reduce_tasks',
          description: '减少每日任务数量',
          impact: '提高完成率，建立信心'
        },
        {
          type: 'add_rest_day',
          description: '每周增加1天休息日',
          impact: '防止倦怠'
        }
      ]
    };
  }
  
  return null;
}
```

---

### 3.5 🟢 P2: 实时执行辅导

**问题**：执行过程中遇到困难没有即时帮助

**解决方案**：AI助手随时可咨询，提供针对性建议

#### 3.5.1 功能设计

```typescript
// src/services/ai-coach.ts - 新增文件

/** 辅导请求 */
export interface CoachRequest {
  type: 'stuck' | 'motivation' | 'time_conflict' | 'difficulty' | 'general';
  task?: Task;
  context?: string;
}

/** 辅导响应 */
export interface CoachResponse {
  empathy: string;           // 共情回应
  analysis: string;          // 问题分析
  suggestions: string[];     // 具体建议
  quick_actions: QuickAction[];  // 快捷操作
  encouragement: string;     // 鼓励语
}

/** 快捷操作 */
export interface QuickAction {
  label: string;
  action: 'postpone' | 'break_down' | 'ask_help' | 'skip' | 'simplify';
  params?: any;
}

/**
 * 获取AI辅导建议
 */
export async function getAICoachHelp(request: CoachRequest): Promise<CoachResponse> {
  const prompt = buildCoachPrompt(request);
  const response = await callAIAPI(prompt);
  return parseCoachResponse(response);
}

/**
 * 预设的鼓励语库
 */
export const ENCOURAGEMENTS = {
  stuck: [
    '遇到困难很正常，这说明你在挑战自己 💪',
    '每个专家都曾是初学者，继续加油！🌟',
    '暂时卡住不代表失败，休息一下再来！',
  ],
  motivation: [
    '回想一下你开始这个计划的初心 ✨',
    '你已经坚持了{days}天，这本身就是成就！',
    '小步前进也是前进，今天的你就是最好的你',
  ],
  difficulty: [
    '困难是成长的必经之路，你正在变得更强',
    '把大山拆成小台阶，一步一步来',
    '允许自己慢一点，但不要停下',
  ],
};
```

#### 3.5.2 UI组件

```vue
<!-- src/components/common/AICoach.vue - 新增组件 -->
<template>
  <div class="ai-coach-container">
    <!-- 悬浮按钮 -->
    <div class="coach-fab" @click="openCoach">
      <span class="coach-icon">🤖</span>
      <span class="coach-label" v-if="hasIssue">有{issueCount}个问题待处理</span>
    </div>
    
    <!-- 辅导面板 -->
    <Modal v-model:visible="showPanel" title="AI学习助手">
      <div class="coach-panel">
        <!-- 快捷问题选择 -->
        <div class="quick-questions">
          <button 
            v-for="q in quickQuestions" 
            :key="q.type"
            @click="askQuestion(q.type)"
            class="quick-question-btn"
          >
            {{ q.icon }} {{ q.label }}
          </button>
        </div>
        
        <!-- 对话区域 -->
        <div class="coach-conversation">
          <div v-for="msg in messages" :class="['message', msg.role]">
            {{ msg.content }}
          </div>
        </div>
        
        <!-- 输入框 -->
        <div class="coach-input">
          <input 
            v-model="userInput" 
            placeholder="描述你遇到的困难..."
            @enter="sendMessage"
          />
          <Button @click="sendMessage">发送</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>
```

---

### 3.6 🟢 P2: 成长激励系统增强

**问题**：仅有签到系统，长期激励不足

**解决方案**：增加成就系统、成长曲线、个性化鼓励

#### 3.6.1 成就系统

```typescript
// src/services/achievements.ts - 新增文件

/** 成就定义 */
export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'persistence' | 'completion' | 'streak' | 'milestone' | 'special';
  condition: AchievementCondition;
  reward?: Reward;
}

/** 成就条件 */
export interface AchievementCondition {
  type: 'task_count' | 'streak_days' | 'completion_rate' | 'plan_count' | 'special';
  value: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

/** 奖励 */
export interface Reward {
  type: 'badge' | 'title' | 'theme';
  value: string;
}

/** 成就库 */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_task',
    name: '迈出第一步',
    icon: '🎯',
    description: '完成第一个任务',
    category: 'milestone',
    condition: { type: 'task_count', value: 1 }
  },
  {
    id: 'week_streak',
    name: '坚持一周',
    icon: '🔥',
    description: '连续签到7天',
    category: 'streak',
    condition: { type: 'streak_days', value: 7 },
    reward: { type: 'badge', value: 'week_warrior' }
  },
  {
    id: 'task_master_100',
    name: '任务达人',
    icon: '🏆',
    description: '累计完成100个任务',
    category: 'completion',
    condition: { type: 'task_count', value: 100 }
  },
  {
    id: 'early_bird',
    name: '早起鸟',
    icon: '🌅',
    description: '在7点前完成第一个任务',
    category: 'special',
    condition: { type: 'special', value: 'early_task' }
  },
  {
    id: 'plan_completed',
    name: '目标达成',
    icon: '🎉',
    description: '完成一个计划的所有任务',
    category: 'milestone',
    condition: { type: 'plan_count', value: 1 }
  },
];

/**
 * 检查成就解锁
 */
export function checkAchievements(
  userStats: UserStats
): Achievement[] {
  const unlocked: Achievement[] = [];
  
  for (const achievement of ACHIEVEMENTS) {
    if (isAchievementUnlocked(achievement, userStats)) {
      unlocked.push(achievement);
    }
  }
  
  return unlocked;
}
```

---

## 📅 四、实施路线图

### 第一阶段（1-2周）- 核心闭环

```
Week 1:
├── [Day 1-2] 复盘一键应用调整 - 数据结构设计
├── [Day 3-4] 复盘一键应用调整 - API实现
├── [Day 5] 问题任务智能识别 - 分析逻辑
└── [Day 6-7] 问题任务智能识别 - UI展示

Week 2:
├── [Day 1-2] 复盘调整UI组件开发
├── [Day 3-4] 集成测试与Bug修复
└── [Day 5-7] 用户测试与反馈收集
```

### 第二阶段（2-3周）- 体验提升

```
Week 3-4:
├── 学生场景模板库设计与实现
├── 动态难度调整算法开发
├── 模板选择UI开发
└── 集成测试
```

### 第三阶段（3-4周）- 差异化功能

```
Week 5-7:
├── AI实时辅导系统开发
├── 成长激励系统增强
├── 整体优化与打磨
└── 全面测试与发布准备
```

---

## 🔧 五、技术实现注意事项

### 5.1 AI调用优化

```typescript
// 建议添加AI调用缓存和限流

const aiCache = new Map<string, { data: any; expire: number }>();

async function cachedAICall<T>(
  key: string,
  prompt: string,
  ttl: number = 3600000 // 1小时
): Promise<T> {
  const cached = aiCache.get(key);
  if (cached && Date.now() < cached.expire) {
    return cached.data;
  }
  
  const result = await callAIAPI(prompt);
  aiCache.set(key, { data: result, expire: Date.now() + ttl });
  
  return result;
}
```

### 5.2 错误处理

```typescript
// 统一的AI错误处理

class AIServiceError extends Error {
  constructor(
    message: string,
    public code: 'RATE_LIMIT' | 'API_ERROR' | 'PARSE_ERROR' | 'TIMEOUT',
    public fallback?: any
  ) {
    super(message);
  }
}

function handleAIError(error: AIServiceError): any {
  switch (error.code) {
    case 'RATE_LIMIT':
      // 返回缓存或Mock数据
      return error.fallback || generateMockResponse();
    case 'PARSE_ERROR':
      // 尝试简化解析
      return parseSimpleFormat(error.fallback);
    default:
      throw error;
  }
}
```

### 5.3 用户隐私

```typescript
// 敏感信息脱敏

function sanitizeForAI(data: any): any {
  return {
    ...data,
    // 移除敏感字段
    password: undefined,
    email: maskEmail(data.email),
    phone: undefined,
    // 保留必要数据
    tasks: data.tasks?.map(t => ({
      title: t.title,
      status: t.status,
      task_date: t.task_date
    }))
  };
}
```

---

## 📊 六、效果评估指标

### 6.1 核心指标

| 指标 | 计算方式 | 目标值 |
|------|---------|--------|
| 计划完成率 | 已完成任务数/总任务数 | > 70% |
| 用户留存率 | 7日/30日留存 | > 40% / > 20% |
| AI功能使用率 | 使用AI优化的计划占比 | > 60% |
| 复盘应用率 | 应用复盘建议的用户占比 | > 30% |

### 6.2 监控埋点

```typescript
// 建议添加的埋点事件

enum AnalyticsEvent {
  // AI相关
  AI_OPTIMIZE_CLICK = 'ai_optimize_click',
  AI_OPTIMIZE_SUCCESS = 'ai_optimize_success',
  AI_REVIEW_GENERATE = 'ai_review_generate',
  AI_REVIEW_APPLY = 'ai_review_apply',
  
  // 计划相关
  PLAN_CREATE = 'plan_create',
  PLAN_COMPLETE = 'plan_complete',
  PLAN_TEMPLATE_USE = 'plan_template_use',
  
  // 任务相关
  TASK_COMPLETE = 'task_complete',
  TASK_ISSUE_FIX = 'task_issue_fix',
}
```

---

## 📝 七、附录

### A. 相关文件清单

```
需修改的文件:
├── src/services/ai-review.ts          # 扩展复盘功能
├── src/services/ai.ts                 # 增强优化功能
├── src/pages/Plan/PlanCreatePage.vue  # 添加模板选择
├── src/pages/Home/HomePage.vue        # 添加问题提示
├── src/components/plan/AISuggestions.vue  # 增强建议组件

需新增的文件:
├── src/services/task-analyzer.ts      # 任务问题分析
├── src/services/plan-templates.ts     # 计划模板库
├── src/services/dynamic-adjustment.ts # 动态难度调整
├── src/services/ai-coach.ts           # AI辅导服务
├── src/services/achievements.ts       # 成就系统
├── src/components/plan/ReviewAdjustments.vue  # 复盘调整组件
├── src/components/common/AICoach.vue  # AI辅导组件
├── src/components/common/TaskIssues.vue  # 问题提示组件
```

### B. API扩展清单

```
后端需新增的API:
├── POST /ai/review/apply              # 应用复盘调整
├── GET /tasks/issues                  # 获取任务问题列表
├── POST /tasks/:id/auto-fix           # 自动修复任务问题
├── GET /plan-templates                # 获取计划模板列表
├── POST /plans/from-template          # 从模板创建计划
└── GET /achievements                  # 获取成就列表
```

---

> **文档版本**: v1.0  
> **创建日期**: 2026-03-11  
> **适用项目**: ScheduleApp  
> **维护者**: ScheduleApp Team