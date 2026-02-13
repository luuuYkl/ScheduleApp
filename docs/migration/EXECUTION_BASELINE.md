# 迁移执行基线（Android / Harmony NEXT）

本文件用于把 `ANDROID_HARMONY_NEXT_MIGRATION_PLAN.md` 从“规划”推进到“可执行状态”。

## 已执行动作

- 建立移动端目录骨架：
  - `mobile/android/`
  - `mobile/harmony-next/`
- 创建双端执行清单：
  - `mobile/android/EXECUTION_CHECKLIST.md`
  - `mobile/harmony-next/EXECUTION_CHECKLIST.md`
- 创建分支策略：
  - `android-version`
  - `harmony-next-version`

## 分支约定

- `android-version`
  - 仅接收 Android 相关壳工程、桥接、发布与测试改动。
- `harmony-next-version`
  - 仅接收 Harmony NEXT 相关壳工程、桥接、发布与测试改动。
- 公共业务变更仍优先在主开发分支完成，再按需合并至双端分支。

## 下一步（建议立即执行）

1. Android 壳工程初始化（Web 容器加载 + 网络策略 + 启动流程）
2. Harmony NEXT 壳工程初始化（Stage 模型 + Web 组件加载）
3. 统一 JS Bridge 协议（最小能力：设备信息/安全存储/版本号/通知）
4. 制定双端验收用例（登录、计划、任务、日志、AI）

## 本轮继续推进结果

- 已补充统一桥接协议文档：`docs/migration/bridge/JS_BRIDGE_V1_SPEC.md`
- 已补充双端实施指南：
  - `docs/migration/ANDROID_IMPLEMENTATION_GUIDE.md`
  - `docs/migration/HARMONY_NEXT_IMPLEMENTATION_GUIDE.md`
- 已补充跨端验收用例：`docs/migration/testing/CROSS_PLATFORM_ACCEPTANCE.md`
- 已补充公共桥接方法对照：`mobile/common/BRIDGE_METHODS.md`
- 已建立双端壳工程占位目录：
  - `mobile/android/app-shell/`
  - `mobile/harmony-next/app-shell/`
- 已新增 CI 基础检查工作流：`.github/workflows/migration-doc-lint.yml`

## 本轮继续推进结果（第二阶段）

- 新增迁移脚本：
  - `scripts/migration/setup-platform-branches.sh`（一键对齐平台分支）
  - `scripts/migration/verify-migration-baseline.sh`（一键校验迁移基线）
- 新增 Bridge 契约文件：`mobile/common/contracts/bridge-v1.contract.json`
- 新增双端环境样例：
  - `mobile/android/config/env.sample.json`
  - `mobile/harmony-next/config/env.sample.json`
- 新增 Phase 1 执行 Runbook：`docs/migration/runbooks/PHASE1_EXECUTION_RUNBOOK.md`
- CI 工作流升级为直接执行基线校验脚本。

## 本轮继续推进结果（第三阶段）

- 新增决策记录：`docs/migration/decisions/ADR-001-bridge-versioning.md`
- 新增双端 Phase1 任务分解：
  - `docs/migration/backlog/ANDROID_PHASE1_TASKS.md`
  - `docs/migration/backlog/HARMONY_NEXT_PHASE1_TASKS.md`
- 新增双端 Bridge 实施记录模板：
  - `mobile/android/bridge/IMPLEMENTATION_NOTES.md`
  - `mobile/harmony-next/bridge/IMPLEMENTATION_NOTES.md`
- 新增状态报告脚本：`scripts/migration/generate-phase1-report.sh`
- 新增 Phase1 状态报告产物：`docs/migration/reports/PHASE1_STATUS_REPORT.md`
- CI 新增阶段状态报告生成步骤，确保迁移任务可持续跟踪。

## 本轮继续推进结果（第四阶段）

- 新增 Web 侧 Bridge 适配层：`src/services/bridge.ts`
- 新增 Bridge 单元测试：`src/services/__tests__/bridge.spec.ts`
- 新增适配说明文档：`docs/migration/runbooks/PHASE1_WEB_ADAPTER.md`
- 目标：在不破坏 Web 现有运行方式的前提下，为 Android/Harmony 壳工程提供统一调用入口。

## 本轮继续推进结果（第五阶段）

- Bridge V1 新增删除能力：`storage.secureRemove`（契约、规范、验收点已同步）
- Web 侧适配层新增 `secureRemove` 实现，并已在单测覆盖回退场景
- 用户认证存储链路已改为优先走 Bridge 安全存储（含恢复、登录、注册、登出）


## 本轮继续推进结果（第六阶段）

- 新增认证安全存储服务：`src/services/secure-storage.ts`（认证 key 统一 `auth:` 命名空间）
- 用户 store 改为通过该服务访问 Bridge 存储，降低直接依赖桥接细节
- 新增 `secure-storage` 单元测试并将相关代码纳入迁移基线校验

## 本轮继续推进结果（第七阶段）

- 修复 TypeScript 构建阻塞项：
  - `tsconfig.app.json` / `tsconfig.json` 统一 `moduleResolution: bundler`（兼容当前 vitest 类型解析）
  - `src/store/__tests__/log.spec.ts` 补齐 `Task` 显式类型，修复 `status` 类型不匹配
- 目标：确保迁移期间主构建链路可持续通过，避免平台集成阶段被基础编译错误阻塞。


## 本轮继续推进结果（第八阶段）

- Bridge 适配层新增能力缓存与能力探测接口（支持按能力灰度启用）
- 存储回退策略收敛：仅对“桥接不可用/方法不存在”回退，避免吞掉权限错误
- 补充桥接单测覆盖：权限拒绝不回退、能力缓存行为

## 本轮继续推进结果（第九阶段）

- 新增认证遗留键迁移：启动会话恢复时自动将 `token/user` 迁移到 `auth:` 命名空间
- 路由守卫移除对旧 `localStorage token` 的兜底依赖，统一以 store/安全存储为准
- App 调试日志不再打印认证信息，减少敏感数据暴露


## 本轮继续推进结果（第十阶段）

- `src/services/api.ts` 认证 helper（login/register/logout）已切换为安全存储实现
- 新增 `api-auth-storage` 单测，验证 helper 不再写入旧 `token/user` 键
- 迁移基线校验新增该测试文件，确保持续受检


## 本轮继续推进结果（第十一阶段）

- Bridge 调用新增默认超时治理（1500ms），超时统一返回 `BRIDGE_TIMEOUT`
- 新增桥接超时单测，确保超时错误不被本地回退掩盖
- Web 适配 runbook 与协议文档已补充超时策略说明


## 本轮继续推进结果（第十二阶段）

- 新增运行时认证路径校验脚本：`scripts/migration/validate-runtime-auth-path.sh`
- 基线校验与 CI 流程已接入该脚本，防止迁移后出现旧 `token/user` 直接读写回归
- Web 适配 runbook 已补充该治理项


## 本轮继续推进结果（第十三阶段）

- Bridge 调用新增异常兜底映射：native invoke 抛错统一返回 `BRIDGE_INTERNAL_ERROR`
- Bridge 超时定时器新增 clear 释放，降低长期运行资源泄漏风险
- `setBridgeTimeoutMs` 增加最小值归一化（>=1ms），并补充对应单测


## 本轮继续推进结果（第十四阶段）

- Bridge 运行时新增可观测性能力：指标统计与事件观察器
- 单测补充指标与事件上报行为，确保迁移阶段可诊断性
- 协议文档与 Web 适配 runbook 已同步可观测性方案
