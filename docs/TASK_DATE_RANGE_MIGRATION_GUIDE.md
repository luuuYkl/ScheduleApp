# 任务日期范围优化实施指南

## 已完成的工作

### 1. 类型定义更新 ✅
- **文件**: `src/services/api.types.ts`
- **修改内容**:
  - `Task` 接口：将 `task_date` 改为 `start_date` 和 `end_date`
  - `CreateTaskPayload` 接口：更新为日期范围字段
  - `UpdateTaskPayload` 接口：更新为日期范围字段
  - `AIRecommendedTask` 接口：更新为日期范围字段

### 2. 后端API更新 ✅
- **文件**: `server/src/routes/tasks.ts`
- **修改内容**:
  - 创建任务路由：添加日期范围验证，确保任务时间段在计划范围内
  - 更新任务路由：添加日期范围验证逻辑
  - 添加错误提示：如果任务日期超出计划范围，返回详细错误信息

### 3. 数据库迁移脚本 ✅
- **文件**: `server/migrations/20260321_add_task_date_range.sql`
- **功能**:
  - 添加 `start_date` 和 `end_date` 列
  - 迁移现有数据（`task_date` → `start_date = end_date`）
  - 添加索引优化查询
  - 删除旧的 `task_date` 列（需要手动执行）

### 4. 前端Store更新 ✅
- **文件**: `src/store/tasks.ts`
- **修改内容**:
  - `toggleTaskStatus` 函数：更新为检查任务日期范围是否包含今天
  - 逻辑：`t.start_date <= today && t.end_date >= today`

### 5. 前端页面部分更新 ✅
- **文件**: `src/pages/Plan/PlanTasksPage.vue`
- **已完成**:
  - 更新 `quickForm`：添加 `start_date` 和 `end_date`
  - 更新 `editForm`：添加日期范围字段
  - 更新 `quickAddTask` 函数：添加日期范围验证和提交逻辑
  - 更新 `startEdit` 和 `saveEdit` 函数：使用日期范围字段
  - 更新 `weeklyStats` 计算属性：检查任务日期范围是否包含本周
  - 更新模板：添加两个日期输入框（开始日期和结束日期）

## 剩余待完成的工作

### 1. PlanTasksPage.vue - 模板显示逻辑

需要修改以下位置（都在模板部分）：

#### 1.1 编辑表单中的日期输入
**位置**: 模板中的 `task-edit-form` 部分
**当前代码**:
```vue
<input v-model="editForm.task_date" type="date" class="edit-date" />
```
**需要改为**:
```vue
<input v-model="editForm.start_date" type="date" class="edit-date" title="开始日期" />
<input v-model="editForm.end_date" type="date" class="edit-date" title="结束日期" />
```

#### 1.2 任务列表中的日期显示
**位置**: 模板中的 `task-meta` 部分
**当前代码**:
```vue
<span class="task-date">{{ formatDateShort(task.task_date) }}</span>
```
**需要改为**（显示日期范围）:
```vue
<span class="task-date">
  {{ formatDateShort(task.start_date) }}
  <span v-if="task.start_date !== task.end_date"> - {{ formatDateShort(task.end_date) }}</span>
</span>
```

#### 1.3 分组逻辑中的日期比较
**位置**: `filteredGroups` 计算属性
**需要更新以下过滤逻辑**：

**今天**:
```typescript
const todayTasks = tasks.filter(t => 
  t.start_date <= today && t.end_date >= today
);
```

**明天**:
```typescript
const tomorrowTasks = tasks.filter(t => 
  t.start_date <= tomorrow && t.end_date >= tomorrow
);
```

**本周**:
```typescript
const weekTasks = tasks.filter(t => {
  return t.start_date <= weekEndStr && t.end_date >= weekStartStr;
});
```

**逾期**:
```typescript
const overdueTasks = tasks.filter(t => 
  t.end_date < today && t.status !== 'done'
);
```

**未来**:
```typescript
const futureTasks = tasks.filter(t => 
  t.start_date > weekEnd.toISOString().slice(0, 10)
);
```

**扁平视图排序**:
```typescript
tasks.sort((a, b) => a.start_date.localeCompare(b.start_date))
```

#### 1.4 月视图中的日期匹配
**位置**: `calendarDays` 计算属性
**当前代码**:
```typescript
const tasks = taskStore.tasks.filter(t => 
  t.plan_id === planId && t.task_date === dateStr
);
```
**需要改为**:
```typescript
const tasks = taskStore.tasks.filter(t => 
  t.plan_id === planId && 
  t.start_date <= dateStr && 
  t.end_date >= dateStr
);
```

### 2. 其他可能需要更新的文件

#### 2.1 TaskCard.vue
**文件**: `src/components/TaskCard.vue`
**需要更新**:
- Props: 如果接收 `task_date`，需要改为 `start_date` 和 `end_date`
- 显示逻辑：显示日期范围而不是单个日期

#### 2.2 api.ts
**文件**: `src/services/api.ts`
**需要检查**:
- 确保所有调用 `createTask` 和 `updateTask` 的地方传递正确的参数
- 检查是否有硬编码的 `task_date` 引用

#### 2.3 ai.ts
**文件**: `src/services/ai.ts`
**需要检查**:
- `task_date` 引用需要改为 `start_date` 和 `end_date`
- AI生成任务时需要生成日期范围

#### 2.4 PlanCreatePage.vue
**文件**: `src/pages/Plan/PlanCreatePage.vue`
**需要检查**:
- 任务创建逻辑是否使用正确的字段

#### 2.5 TimelineView.vue
**文件**: `src/components/home/TimelineView.vue`
**需要检查**:
- 时间线显示逻辑需要适配日期范围

### 3. 数据库迁移执行

执行以下步骤（按顺序）:

1. **备份数据库**:
   ```bash
   mysqldump -u root -p scheduleapp > backup_20260321.sql
   ```

2. **执行迁移脚本**（分步执行）:
   ```sql
   -- 步骤1: 添加新列
   ALTER TABLE tasks 
     ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '任务开始日期' AFTER title,
     ADD COLUMN IF NOT EXISTS end_date DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '任务结束日期' AFTER start_date;

   -- 步骤2: 迁移数据
   UPDATE tasks 
   SET start_date = task_date, 
       end_date = task_date 
   WHERE task_date IS NOT NULL;

   -- 步骤3: 验证数据
   SELECT id, title, task_date, start_date, end_date FROM tasks LIMIT 10;

   -- 步骤4: 添加索引
   CREATE INDEX IF NOT EXISTS idx_task_date_range ON tasks(start_date, end_date);
   CREATE INDEX IF NOT EXISTS idx_task_plan_dates ON tasks(plan_id, start_date, end_date);

   -- 步骤5: 删除旧列（确认数据无误后执行）
   ALTER TABLE tasks DROP COLUMN task_date;
   ```

3. **验证迁移结果**:
   ```sql
   -- 检查表结构
   DESCRIBE tasks;
   
   -- 检查数据完整性
   SELECT COUNT(*) as total, 
          SUM(CASE WHEN start_date IS NULL OR end_date IS NULL THEN 1 ELSE 0 END) as null_dates,
          SUM(CASE WHEN start_date > end_date THEN 1 ELSE 0 END) as invalid_ranges
   FROM tasks;
   ```

## 测试清单

完成所有修改后，需要测试以下功能：

### 基本功能
- [ ] 创建任务时能选择开始日期和结束日期
- [ ] 开始日期不能晚于结束日期
- [ ] 任务日期必须在计划日期范围内
- [ ] 编辑任务时能修改日期范围
- [ ] 删除任务功能正常

### 显示功能
- [ ] 任务列表正确显示日期范围
- [ ] 单日任务只显示一个日期
- [ ] 多日任务显示"开始日期 - 结束日期"
- [ ] 月视图正确显示跨日期范围的任务
- [ ] 分组视图（今天/明天/本周等）正确筛选任务

### 统计功能
- [ ] 本周统计正确包含所有时间范围内的任务
- [ ] 完成率计算正确
- [ ] 筛选功能（全部/待完成/已完成）正常工作

### 交互功能
- [ ] 快速添加任务后，表单正确重置
- [ ] 编辑任务后，数据正确更新
- [ ] 切换任务状态，日志正确生成

## 注意事项

1. **向后兼容性**: 如果有现有数据，确保先执行迁移脚本再部署前端代码
2. **性能优化**: 对于大量任务，考虑使用虚拟滚动优化性能
3. **用户体验**: 日期范围输入框可以添加更友好的提示和验证
4. **移动端适配**: 确保在小屏幕上日期选择器仍然易用

## 完成标志

当所有测试项目都通过，且没有TypeScript错误时，此优化任务即完成。