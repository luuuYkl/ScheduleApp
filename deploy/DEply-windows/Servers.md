# 智远日程 - Windows 服务器部署指南

## 📋 馂览

本指南将帮助你完成以下任务：

- 在阿里云控制台创建 RDS MySQL 实例
- 在 ECS控制台配置安全组规则
- 在 ECS 服务器配置 PM2 + Windows 服务
- 在服务器上配置静态文件服务

- 通过 IP + 端口访问应用

- 配置 Gitee Go 自动部署流水线

- 在本地测试后推送到服务器

- 使用 SSH 远程部署（需要配置服务器信息)
- 使用 HTTPS 协议时使用 `https://` + `协议://` 卑地址，端口号` 协议://` 协议说明见： [服务器部署指南](./服务器部署指南.md)文档。

## 服务器信息

| 项目 | 值 |
|------|------|
| **操作系统** | Windows Server 2025 数据中心版 |
    **公网 IP** | `121.41.32.229` |
    **服务器用户名** | `Administrator` / `root` |
的 `123456` 凶用强密码
    **服务器公网端口** | 80, 3000 |
    **域名** | 无 |
    **操作系统** | Windows Server 2025 |
    **公网IP** | `121.41.32.229`
 | **远程连接方式** | 庺于 SSH 龽进行远程文件传输
    **数据库** | 阿里云 RDS MySQL |

## 🚀 第1步：下载安装脚本

    访问 https://nodejs.org 下载 Node.js LTS（推荐 v20+)
    2. 运行安装脚本（以管理员身份运行)
    3. 安装 PM2（进程管理器)

      - 以服务形式运行后端服务
      - `pm2-windows-service` 安装为 Windows 服务
      - `serve` 安装静态文件服务器
      - `pm2 start ecosystem.config.cjs` 启动后端服务
      - `pm2 restart` 重载前端并重启后端服务

      - `pm2 stop` 停止所有服务

      - `pm2 save` ecosystem.config.cjs` 保存当前配置
      - `pm2 startup` 启开机自启动运行后端服务

      - 访问 http://121.41.32.229 查看后端服务状态

      - 可访问日志： `pm2 logs --lines 0` 查看详细日志: `pm2 logs`
      - `pm2 info` 查看后端信息
      - `pm2 list` 查看所有进程
      - `pm2 show` 查看系统资源使用情况
      - `pm2 monit` 查看系统资源使用情况
      - `pm2 describe` 查看进程状态
      - `pm2 restart` 重载前端并重启后端服务
      - `pm2 stop` 停止所有服务
      - `pm2 delete` ecosystem.config.cjs` 删除 PM2 配置文件
      - `pm2 save` 韥远日程到 Windows 服务注册表（以便开机自启)
      - 访问 http://121.41.32.229 查看前端静态文件服务状态)
      - 可访问日志: `pm2 logs --lines 0`
      - `pm2 list` 查看进程状态
      - `pm2 show` 查看系统资源使用情况
      - `pm2 monit` 查看系统资源使用情况
      - `pm2 flush`        刷新 PM2 日志
      - `pm2 logs --json` 输出所有日志到文件 `D:/var/www/schedule-app/logs/pm2.log`

      - `pm2 pretty` 输出格式化的日志
      - 可读性更高
      - 可使用 `less` 和 `grep` 獲信息
      - `pm2 monit` 查看后端服务状态
      - `pm2 info` 查看后端版本信息
      - `pm2 info` 查看服务器IP地址
      - `pm2 info` 查看服务器 CPU和内存使用情况
      - `pm2 info` 查看前端访问地址
      - `pm2 info` 查看前端访问地址
      - `pm2 info` 查看数据库连接信息
      - `pm2 info` 查看环境变量配置
      - `pm2 info` 查看 RDS MySQL 连接信息
      - `pm2 info` 查看 RDS 白名单 (需要添加服务器IP)
      - `pm2 info` 查看部署流程
      - `pm2 info` 查看 Git 仓库信息
      - `pm2 info` 查看 Gitee Go 流水线状态
      - `pm2 info` 查看流水线历史记录
      - `pm2 info` 查看其他说明信息
      - `pm2 info` 查看Node.js 和 PM2 版本
      - `pm2 info` 查看服务器操作系统
      - `pm2 info` 查看操作系统类型 (Windows Server 2025)
      - `pm2 info` 查看服务器公网IP (121.41.32.229)
      - `pm2 info` 查看服务器用户名 (用于 SSH 登录)
      - `pm2 info` 查看数据库配置信息
      - `pm2 info` 查看 RDS MySQL 连接信息
      - `pm2 info` 查看 RDS 白名单配置
      - `pm2 info` 查看部署相关说明
      - `pm2 info` - 查看 .部署指南.md 获取详细部署步骤
    - 据自己的实际情况修改此配置
  - 配置阿里云 RDS（在阿里云控制台创建)
    - 记录 RDS 内网IP地址
    - 将服务器IP添加到 RDS白名单
  - 配置安全组规则（开放 80 和 3000 端口)
    - 如果需要配置，请参考部署指南文档。