// PM2 配置文件
// 用于管理前端和后端进程

module.exports = {
  apps: [
    {
      name: 'schedule-app-api',
      script: 'npm',
      args: 'run',
      start',
      cwd: './server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 5,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'schedule-app-frontend',
      script: 'npx',
      args: 'run',
      serve',
      cwd: './dist',
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 5,
      env: {
        NODE_ENV: 'production',
        PORT: 80
      }
    }
  ]
};