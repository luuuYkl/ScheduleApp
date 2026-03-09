// PM2 配置文件
// 用于管理前端和后端进程

module.exports = {
  apps: [
    {
      name: 'schedule-app-api',
      script: 'npm run start',
      cwd: './server',
      instances: 1,
      watch: false,
      autorestart: true,
      max_restarts: 5,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'schedule-app-frontend',
      script: 'serve -s dist -p 80',
      cwd: './client/dist',
      instances: 1,
      watch: true,
      autorestart: true,
      max_restarts: 5,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
      console.error("⚠️  .env file not found");
      console.warn("Creating .env with default values");
      env_file = ".env";
    }
  },
  log("Application closed.", logFile);

  // 数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "schedule_app",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  pool.getConnection((err) => {
    console.error("❌ 数据库连接失败:", err.message);
    process.exit(1);
  }
});

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ 数据库连接成功");
    connection.release();
    return true;
  } catch (err) => {
    console.error("❌ 数据库连接失败:", err);
    return false;
  }
};

// 初始化数据库表
const initDatabase = async () => {
  const connection = await pool.getConnection();
  
  try {
    // 用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100),
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        frequency VARCHAR(20) DEFAULT 'daily',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    // 任务表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        plan_id INT NOT NULL,
        user_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        task_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        status ENUM('pending', 'done', 'missed') DEFAULT 'pending',
        note TEXT,
        repeat_type ENUM('none', 'daily', 'weekly', 'monthly') DEFAULT 'none',
        repeat_end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        INDEX idx_plan_id (plan_id),
        INDEX idx_user_id (user_id),
        INDEX idx_task_date (task_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    // 日程表（独立于计划)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        INDEX idx_user_id (user_id)
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    // 签到记录表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS streaks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        current_streak INT DEFAULT 0,
        longest_streak INT DEFAULT 0,
        last_checkin DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ 数据库表初始化完成");
  } finally {
    connection.release();
  }
});

// 启动服务器
async function startServer() {
  try {
    // 加载环境变量
    require("dotenv").config();
    
    console.log("🔧 环境变量配置:");
    console.log(`  - PORT: ${process.env.PORT}`);
    console.log(`  - Node Env: ${process.env.NODE_ENV}`);
    console.log(`  - JWT Secret: ${process.env.JWT_SECRET}`);
    console.log(`  - Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log("✅ 环境变量加载完成");

    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error("❌ 数据库连接失败， 请检查数据库配置");
      process.exit(1);
    }

    
    // 初始化数据库表
    await initDatabase();
    console.log("✅ 数据库表初始化完成");

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 智远日程 API 服务已启动`);
      console.log(`📡 服务地址: http://localhost:${PORT}`);
      console.log(`📋 API 端点:`);
      console.log("   - POST /auth/register");
      console.log("   - POST /auth/login");
      console.log("   - GET /auth/profile");
      console.log("   - GET /plans");
      console.log("   - POST /plans");
      console.log("   - PUT /plans/:id");
      console.log("   - DELETE /plans/:id");
      console.log("   - GET /tasks");
      console.log("   - POST /tasks");
      console.log("   - PUT /tasks/:id");
      console.log("   - DELETE /tasks/:id");
      console.log("   - GET /schedules");
      console.log("   - POST /schedules");
      console.log("   - PUT /schedules/:id");
      console.log("   - DELETE /schedules/:id");
      console.log("   - GET /streak/:userId");
      console.log("   - POST /streak/checkin");
    }
    
    // 等待数据库准备就绪
    console.log("⏳ 等待数据库准备就绪...");
    await pool.end();
    
    console.log("✅ 数据库连接池已关闭");
    process.exit(1);
  }
});
  console.log("🎉 智远日程 API 服务运行成功!");
  console.log("========================================");
});
</final_file_content>
IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base her SEARCH/REplace operations on this final version to ensure accuracy.
</task_progress>
</write_to_file>