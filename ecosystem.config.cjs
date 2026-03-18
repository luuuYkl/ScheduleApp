// PM2 配置文件
// 用于管理前端和后端进程

module.exports = {
  apps: [
    {
      name: 'schedule-app-api',
      script: 'dist/index.js',
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
      script: 'cmd',          // 关键修复：用 cmd 执行
      args: '/c serve -s dist -l 80', // 关键修复：加 /c
      cwd: './',
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