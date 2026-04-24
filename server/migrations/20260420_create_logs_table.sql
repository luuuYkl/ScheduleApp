-- 创建日志表
-- 用于存储 AI 自动生成的每日任务总结日志

CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  content TEXT NOT NULL COMMENT 'AI 生成的日志内容',
  tasks_done INT DEFAULT 0 COMMENT '已完成任务数',
  tasks_total INT DEFAULT 0 COMMENT '总任务数',
  schedules_done INT DEFAULT 0 COMMENT '已完成日程数',
  schedules_total INT DEFAULT 0 COMMENT '总日程数',
  mood VARCHAR(20) DEFAULT NULL COMMENT '当日情绪',
  work_hours DECIMAL(4,1) DEFAULT NULL COMMENT '工作时长（小时）',
  highlight TEXT DEFAULT NULL COMMENT '当日亮点',
  efficiency_periods JSON DEFAULT NULL COMMENT '高效时段',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY idx_user_date (user_id, date) COMMENT '每个用户每天只有一条日志',
  INDEX idx_user_id (user_id),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;