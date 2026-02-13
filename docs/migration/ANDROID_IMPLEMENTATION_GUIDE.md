# Android 迁移实施指南（Phase 1~2）

## Phase 1：壳工程最小可用

1. 创建 Android 应用壳工程（仅承载 H5）
2. 配置 Web 容器加载 URL（dev/test/prod）
3. 网络权限与 HTTPS 策略配置
4. 接入 JS Bridge V1：
   - `device.getInfo`
   - `app.getVersion`
   - `storage.secureSet/Get`
   - `notification.scheduleLocal/cancelLocal`

## Phase 1 验收

- 可冷启动进入首页
- 登录后 token 可安全持久化
- 计划/任务/日志页面可完整浏览与操作
- 关键报错可在日志系统定位

## Phase 2：稳定性与性能

1. WebView 进程回收恢复
2. 首屏性能优化（资源缓存与预热）
3. 弱网策略（重试+提示）
4. 崩溃与埋点接入

## 发布前检查

- 隐私协议与权限声明完整
- 包名、签名、版本号符合发布要求
- 回归用例通过率达标
