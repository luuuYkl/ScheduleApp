-- 添加 repeat_group_id 字段到 tasks 表
-- 用于标识同一组的重复任务，实现独立的状态管理

ALTER TABLE tasks 
ADD COLUMN repeat_group_id BIGINT AFTER repeat_end_date;

-- 为现有数据设置默认值（可选）
UPDATE tasks SET repeat_group_id = NULL WHERE repeat_group_id IS NULL;

-- 创建索引以提高查询性能（可选）
CREATE INDEX idx_repeat_group_id ON tasks(repeat_group_id);