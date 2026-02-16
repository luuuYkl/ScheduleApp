# Migration: UI 文档体系补充（美学蓝图 + 顺序优化指南）

- **Date**: 2026-02-16
- **Type**: documentation-only
- **Scope**: `docs/UI_AESTHETIC_MASTER_PLAN.md`, `docs/UI_OPTIMIZATION_SEQUENTIAL_GUIDE.md`
- **Risk Level**: low

## 1) 背景与目的
本次变更用于补齐 ScheduleApp 的 UI 设计基线文档，明确：
- 目标视觉语言与布局架构；
- 可执行的分阶段优化顺序；
- 文档类更新发布策略（doc-only 可直发 main）。

## 2) 变更内容
1. 新增《UI_AESTHETIC_MASTER_PLAN》：定义视觉目标、页面模板、组件规范、动效与可访问性基线。
2. 新增《UI_OPTIMIZATION_SEQUENTIAL_GUIDE》：提供 Step 0~9 的落地顺序及可复制代码样例。
3. 在顺序指南中补充文档发布策略说明（Step 9）。

## 3) 对运行时的影响
- 无运行时代码改动。
- 无数据库 schema 改动。
- 无 API 合约变更。
- 不影响现有构建产物与功能行为。

## 4) 迁移动作（执行方）
> 本迁移为文档迁移（knowledge migration），无需执行脚本。

- [x] 确认文档路径已纳入版本控制。
- [x] 确认文档与现有实现现状一致（指出问题并给出修复路径）。
- [x] 确认后续 UI 改造遵循指南顺序推进。

## 5) 回滚方案
如需回滚：
1. 回退对应文档提交（`git revert <commit>`）；
2. 删除本迁移文档；
3. 恢复至变更前的文档状态。

> 回滚仅影响文档，不影响线上功能。

## 6) 验证清单
- [x] 迁移文档存在于 `docs/migrations/`。
- [x] 迁移文档包含影响评估、回滚方案、验证清单。
- [ ] `npm run build` 在当前仓库基线存在既有 TypeScript 错误（与本次文档变更无关），需在独立修复 PR 处理。

## 7) 责任人与审阅建议
- Author: Codex
- Reviewer: 前端负责人 / 产品设计负责人
- 建议在首次 UI 改造 PR 时，逐条对照 Step 0~9 打勾验收。
