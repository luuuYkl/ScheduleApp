# 智远日程 - Windows 服务器部署指南

## 📋 概览

本指南帮助你在阿里云 ECS 服务器上完成以下任务

- 在服务器上安装必要的软件 (- 配置安全组规则、- 配置 PM2 进程管理
    - 开机自启动服务
    - 通过 IP + 端口访问应用
    - 配置 Gitee Go 自动部署流水线

    - 配置 RDS 白名单
    - 配置 Gitee Go 流水线（可选)
    - 配置环境变量 (复制 `.env.example 为 `.env`)
2. 构建前端项目
    - 运行: `npm run build --prefix client`
    - 运行: `pm2 start` 塬启动服务

    - 运行: `serve -s dist`
    - 启动静态文件服务
    - 运行, `pm2 save` 保存当前进程列表

    - 运行, `pm2-startup` 设置开机自启动

</task_progress>
</write_to_file>