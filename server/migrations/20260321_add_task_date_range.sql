-- 任务日期范围优化迁移脚本
-- 将任务从单日（task_date）改为日期范围（start_date, end_date）
-- 确保任务的时间段在关联计划的时间段内

-- 检查并添加 start_date 和 end_date 列（如果不存在）
-- 注意：需要先执行数据迁移，再删除 task_date 列

-- 步骤 1: 添加新列
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '任务开始日期' AFTER title,
  ADD COLUMN IF NOT EXISTS end_date DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '任务结束日期' AFTER start_date;

-- 步骤 2: 迁移现有数据（将 task_date 复制到 start_date 和 end_date）
UPDATE tasks 
SET start_date = task_date, 
    end_date = task_date 
WHERE task_date IS NOT NULL;

-- 步骤 3: 验证数据完整性（可选）
-- 检查是否有 start_date > end_date 的异常数据
-- SELECT COUNT(*) FROM tasks WHERE start_date > end_date;

-- 步骤 4: 添加索引优化查询
CREATE INDEX IF NOT EXISTS idx_task_date_range ON tasks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_task_plan_dates ON tasks(plan_id, start_date, end_date);

-- 步骤 5: 删除旧的 task_date 列（在确认数据迁移成功后执行）
-- ALTER TABLE tasks DROP COLUMN task_date;

-- 注意：请先执行上述步骤 1-4，验证数据无误后，再手动执行步骤 5
-- 验证 SQL:
-- SELECT id, title, task_date, start_date, end_date FROM tasks LIMIT 10;