# ScheduleApp 计划与任务管理应用

一个使用 **Vue 3 + TypeScript + Vite + Pinia + Vue Router** 构建的移动优先习惯/任务/日程跟踪应用，支持计划创建、任务重复、每日日志与进度概览等功能。采用 Mock-First 模式，前端可在无真实后端的情况下完整运行。

## 📚 文档结构

为了更好地组织项目文档，我们建立了以下核心文档体系：

### 🎯 用户文档
- [`docs/USER_FUNCTIONALITY_MANUAL.md`](docs/USER_FUNCTIONALITY_MANUAL.md) - **用户功能手册**
  - 产品概述与快速开始
  - 核心功能使用指南
  - 界面与交互说明
  - 故障排除与最佳实践

### 🛠️ 技术文档
- [`docs/PROJECT_OPTIMIZATION_OVERVIEW.md`](docs/PROJECT_OPTIMIZATION_OVERVIEW.md) - **项目优化总览报告**
  - 技术实施报告整合
  - 样式系统重建
  - 主题逻辑优化
  - 响应式布局升级

- [`docs/UI_DESIGN_SYSTEM.md`](docs/UI_DESIGN_SYSTEM.md) - **UI设计系统规范**
  - 设计哲学与原则
  - 设计系统架构
  - 组件设计规范
  - 交互与动效标准

- [`docs/MOBILE_MIGRATION_IMPLEMENTATION_HANDBOOK.md`](docs/MOBILE_MIGRATION_IMPLEMENTATION_HANDBOOK.md) - **移动端迁移实施手册**
  - Android/Web容器化迁移方案
  - 鸿蒙NEXT技术路线规划
  - 双端统一实施阶段
  - 执行清单与验收标准

- [`docs/ISSUE_REPAIR_MAINTENANCE.md`](docs/ISSUE_REPAIR_MAINTENANCE.md) - **问题修复与维护记录**
  - 核心问题修复记录
  - 维护最佳实践
  - 问题统计与分析
  - 持续改进计划

## 技术栈
- Vue 3 `<script setup>` + TypeScript
- Vite 构建，Vitest 单元测试
- Pinia 状态管理（按领域拆分 store）
- Vue Router（权限路由守卫、嵌套路由）
- Mock/真实 API 可切换：`APP_CONFIG.USE_MOCK_API`

## 核心功能
- 用户注册 / 登录（本地持久化 token & 用户）
- 计划管理（开始/结束日期、描述）
- **AI 智能优化**：分析计划并提供优化建议，自动拆解任务清单
- 任务管理（支持每日 / 每月重复，备注，状态切换）
- 日程管理（独立于计划的 Schedule 项）
- 每日日志自动生成（列出已完成任务与日程并鼓励）
- 进度统计与连续签到（Streak）
- 深色模式 / 主题持久化
- 响应式设计：桌面端左侧导航 + 移动端底部导航

## 最近更新内容（2026-03）

### 🎨 个人中心界面优化
- **移除成就系统**：简化界面，去除徽章墙和成就展示功能
- **移除经验系统**：去除等级显示、经验进度条和经验值奖励
- **保留任务洞察**：保留关键指标速览（连续天数、周完成率、活跃计划）
- **保留深度分析**：保留完成情况洞察（黄金时段、专注峰值、习惯坚持、冲刺记录）
- **界面简洁化**：专注于核心的用户数据统计和设置功能

### 🎨 全面UI优化升级（2026-02）
- **响应式布局重构**：实现桌面端左侧导航 + 移动端底部导航的双模式设计
- **设计系统标准化**：建立统一的Design Tokens、组件库和交互规范
- **主题系统优化**：收敛JS强写变量逻辑，统一通过CSS Tokens管理
- **可访问性增强**：完善ARIA标签、键盘导航和焦点管理

### 🛠️ 技术架构改进
- **样式系统重建**：清理损坏的CSS文件，建立三层模块化架构
- **组件标准化**：统一Button、Card、Input等基础组件规范
- **布局组件抽象**：创建PageScaffold页面模板组件
- **代码质量提升**：修复类型问题，优化构建配置

### 🐛 问题修复
- 修复任务勾选后日志自动生成功能
- 解决CSS样式文件污染问题
- 优化Store返回值一致性
- 改进ID冲突处理机制

## 运行与开发
```bash
npm install

# 可选：配置 AI 功能（复制并编辑环境变量）
cp .env.example .env.local
# 在 .env.local 中填入你的 OpenAI API Key

npm run dev      # 启动开发服务器
npm run build    # 构建生产包（包含类型检查）
npm run test     # 运行测试
npm run coverage # 覆盖率报告
```

## 切换 Mock / 后端
编辑 `src/config.ts`：
```ts
export const APP_CONFIG = {
	USE_MOCK_API: true,
	BASE_URL: 'http://localhost:3000'
};
```
设置 `USE_MOCK_API = false` 后需保证后端接口符合 `src/services/api.types.ts` 中的类型签名。

## 目录结构概览
```
src/
	components/        # 业务与通用组件
	  plan/
	    AISuggestions.vue  # AI 建议展示组件
	pages/             # 路由页面
	store/             # Pinia stores
	services/          # API / 工具 / 类型
	  ai.ts            # AI 优化服务
	  api.types.ts     # API 类型（含 AI 相关类型）
	router/            # 路由配置与守卫
	assets/            # 样式与静态资源
	config.ts          # 全局配置（含 AI 配置）

docs/               # 核心文档
	USER_FUNCTIONALITY_MANUAL.md          # 用户功能手册
	PROJECT_OPTIMIZATION_OVERVIEW.md      # 项目优化总览
	UI_DESIGN_SYSTEM.md                  # UI设计系统规范
	MOBILE_MIGRATION_IMPLEMENTATION_HANDBOOK.md # 移动端迁移手册
	ISSUE_REPAIR_MAINTENANCE.md          # 问题修复与维护记录
```

## 后续可改进方向
- AI 功能增强：支持任务优先级排序、时间冲突检测
- AI 个性化：根据用户历史数据提供更精准的建议
- 首页任务日期切换（今天 / 未来 / 历史）
- 首页对重复任务也做分组展示
- 计划进度可选择统计维度（仅首次、全部重复实例）
- 增加任务与日程搜索 / 过滤组件
- 增加可选的通知提醒（基于浏览器通知）

## License
MIT

---
> 若需进一步优化某一模块或添加测试，请在 Issue 中提出或继续对话。
