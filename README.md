# ScheduleApp 计划与任务管理应用

一个使用 **Vue 3 + TypeScript + Vite + Pinia + Vue Router** 构建的移动优先习惯/任务/日程跟踪应用，支持计划创建、任务重复、每日日志与进度概览等功能。采用 Mock-First 模式，前端可在无真实后端的情况下完整运行。

## 技术栈
- Vue 3 `<script setup>` + TypeScript
- Vite 构建，Vitest 单元测试
- Pinia 状态管理（按领域拆分 store）
- Vue Router（权限路由守卫、嵌套路由）
- Mock/真实 API 可切换：`APP_CONFIG.USE_MOCK_API`

## 核心功能
- 用户注册 / 登录（本地持久化 token & 用户）
- 计划管理（开始/结束日期、描述）
- 任务管理（支持每日 / 每月重复，备注，状态切换）
- 日程管理（独立于计划的 Schedule 项）
- 每日日志自动生成（列出已完成任务与日程并鼓励）
- 进度统计与连续签到（Streak）
- 深色模式 / 主题持久化
- 移动端固定顶部栏 + 底部导航

## 最近更新内容（2025-10）
### UI/布局优化
- 顶部栏固定（避免滚动时隐藏），底部导航始终固定
- 页面内容添加顶部/底部内边距避免被遮挡

### 任务与计划增强
- 删除旧的“计划频率”输入，简化计划创建
- 新增任务重复功能：支持 `repeat_type = daily | monthly`，并设置 `repeat_end_date`
- 任务创建限制日期范围：只能选择所属计划的时间段内的日期
- 优化计划进度计算：仅统计该计划日期范围内的任务
- 首页任务列表新增回退逻辑：当天无任务时显示最近即将开始的未来任务（最多 5 条）
- 计划任务页面对重复任务进行分组展示：多日重复仅占一行，显示完成数量/总数与日期范围

### 日志与反馈
- 优化日志生成：只展示已完成任务与日程的清单，移除百分比/统计冗余信息，增加随机鼓励语
- 勾选任务/日程后自动刷新当天日志

### 数据与持久化
- 清理默认示例计划与任务，改为启动时为空
- 用户数据持久化到 `localStorage`（mock 模式下）

### 代码结构改进
- 新增 `repeat-task.ts` 工具：根据重复规则批量生成任务 payload
- 任务分组逻辑在 `PlanTasksPage.vue` 中以 Map 构建（保持后端结构不变，仅前端展示合并）

## 运行与开发
```
npm install
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
	pages/             # 路由页面
	store/             # Pinia stores
	services/          # API / 工具 / 类型
	router/            # 路由配置与守卫
	assets/            # 样式与静态资源
```

## 后续可改进方向
- 首页任务日期切换（今天 / 未来 / 历史）
- 首页对重复任务也做分组展示
- 计划进度可选择统计维度（仅首次、全部重复实例）
- 增加任务与日程搜索 / 过滤组件
- 增加可选的通知提醒（基于浏览器通知）

## License
MIT

---
> 若需进一步优化某一模块或添加测试，请在 Issue 中提出或继续对话。
