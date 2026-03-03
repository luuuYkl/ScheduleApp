# Phase 1 执行 Runbook（Android / Harmony NEXT）

## 目标
在双端实现“壳工程 + H5 装载 + Bridge V1 最小能力”并可完成核心业务链路验收。

## 执行步骤

1. **对齐分支**
   - 运行：`scripts/migration/setup-platform-branches.sh work`
   - 进入对应分支开发：
     - Android：`git checkout android-version`
     - Harmony NEXT：`git checkout harmony-next-version`

2. **初始化平台壳工程**
   - Android：在 `mobile/android/app-shell/` 下创建工程。
   - Harmony NEXT：在 `mobile/harmony-next/app-shell/` 下创建 Stage 工程。

3. **配置环境文件**
   - 复制并填写：
     - `mobile/android/config/env.sample.json`
     - `mobile/harmony-next/config/env.sample.json`

4. **接入 Bridge V1**
   - 对齐协议：`docs/migration/bridge/JS_BRIDGE_V1_SPEC.md`
   - 对齐契约：`mobile/common/contracts/bridge-v1.contract.json`

5. **执行验收用例**
   - 依据：`docs/migration/testing/CROSS_PLATFORM_ACCEPTANCE.md`
   - 输出：在各分支提交测试记录与问题清单。

## 退出条件（DoD）

- 双端冷启动均可进入首页。
- 登录/计划/任务/日志/AI 的核心链路均可走通。
- Bridge V1 六个方法具备可用实现。
- 基线检查脚本通过：`scripts/migration/verify-migration-baseline.sh`。
