# Phase 1 Web 侧 Bridge 适配说明

为支持 Android / Harmony NEXT 双端壳工程接入，本仓库新增了 Web 侧 Bridge 访问层：

- `src/services/bridge.ts`
  - 提供统一调用封装（`device.getInfo`、`storage.secureSet/Get` 等）
  - 在无原生桥接时自动回退到 `localStorage`
- `src/services/__tests__/bridge.spec.ts`
  - 覆盖“无桥接回退”和“有桥接直连”两类场景

## 接入建议

1. 在登录态与敏感信息持久化流程中逐步替换 `localStorage` 直写逻辑，统一走 `secureSet/secureGet`。
2. 在壳工程接入后，实现 `window.ScheduleAppBridge.invoke` 与 `bridge-v1.contract.json` 对齐。
3. 保留回退逻辑，确保 Web 独立运行不受影响。


## 当前实现补充

- 已新增 `src/services/secure-storage.ts`，对认证键增加 `auth:` 前缀，便于与普通本地缓存隔离。
- `src/store/user.ts` 已接入该服务完成登录态链路迁移。

- Bridge 增加能力缓存与能力探测接口（`refreshBridgeCapabilities` / `isBridgeMethodSupported`），便于壳工程按能力渐进启用功能。
- 存储回退策略调整为仅在 `BRIDGE_NOT_SUPPORTED` 或 `BRIDGE_METHOD_NOT_FOUND` 时回退，权限拒绝等错误会向上抛出。
- 新增遗留键迁移：`migrateLegacyAuthStorageIfNeeded` 会把旧 `token/user` 迁移到 `auth:` 命名空间，降低历史数据兼容风险。
- `src/services/api.ts` 的登录/登出 helper 已切换到安全存储，避免再写入旧 `token/user` 键。
- Bridge 调用默认超时 1500ms，可通过运行时配置调整；超时返回 `BRIDGE_TIMEOUT` 并保持错误可观测。
- 新增校验脚本 `scripts/migration/validate-runtime-auth-path.sh`，用于阻止运行时代码回写旧 `token/user` 键。
- Bridge 发生运行时异常时统一返回 `BRIDGE_INTERNAL_ERROR`，便于平台侧统一告警与追踪。
- Bridge 已提供运行时指标与事件观察器，可接入埋点系统对超时/内部错误进行告警。
