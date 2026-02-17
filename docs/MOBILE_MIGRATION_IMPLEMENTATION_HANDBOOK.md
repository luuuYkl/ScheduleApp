# 移动端迁移实施手册

## 📋 文档版本信息

**版本**: v1.0  
**最后更新**: 2026-02-15  
**整理者**: AI Assistant  
**原始文档来源**: 多个移动端迁移文档合并  

---

## 🎯 文档整合说明

本文档整合了以下原始移动端迁移文档：
- `docs/ANDROID_HARMONY_NEXT_MIGRATION_PLAN.md` - Android与鸿蒙NEXT迁移方案规划
- `docs/migration/ANDROID_IMPLEMENTATION_GUIDE.md` - Android迁移实施指南
- `docs/migration/HARMONY_NEXT_IMPLEMENTATION_GUIDE.md` - Harmony NEXT迁移实施指南
- `docs/migration/EXECUTION_BASELINE.md` - 迁移执行基线
- `mobile/android/EXECUTION_CHECKLIST.md` - Android执行清单
- `docs/migration/reports/PHASE1_STATUS_REPORT.md` - Phase 1状态报告

---

## 🚀 项目概述

### 当前项目现状
- 前端技术栈：**Vue 3 + TypeScript + Vite + Pinia + Vue Router**
- 业务能力完整：登录注册、计划/任务/日程、日志、AI建议、主题切换
- 数据层支持Mock与真实后端切换
- 具备较高的跨端迁移基础

### 迁移目标
1. 在不重写业务规则的前提下，尽快上线Android与鸿蒙NEXT可用版本
2. 保留现有页面结构与核心交互，优先实现功能一致性
3. 后续逐步增强为"接近原生体验"（通知、离线、性能、系统能力集成）

---

## 🛠️ 总体技术路线

### 路线 A：快速上线（Web容器化）

#### Android方案
- 使用WebView容器方案直接承载现有H5
- 优点：上线快、改造少、前端团队可主导
- 适用：MVP、快速验证留存与业务价值

#### 鸿蒙NEXT方案
- 使用鸿蒙NEXT的Web承载能力（ArkUI + Web组件）嵌入现有Web应用
- 构建与Android类似的"容器壳+H5业务"形态，保持双端发布节奏一致

#### 路线A输出
- 双端可安装包
- 与Web端功能基本一致
- 基础登录、计划/任务/日程、日志、AI能力可用

### 路线 B：中长期优化（逐步原生化）
（待后续规划）

---

## 📋 执行基线与分支策略

### 已执行动作
- 建立移动端目录骨架：
  - `mobile/android/`
  - `mobile/harmony-next/`
- 创建双端执行清单
- 创建分支策略：
  - `android-version`
  - `harmony-next-version`

### 分支约定
- `android-version`：仅接收Android相关改动
- `harmony-next-version`：仅接收Harmony NEXT相关改动
- 公共业务变更仍优先在主开发分支完成，再按需合并至双端分支

---

## 🎯 实施阶段规划

### Phase 1：壳工程最小可用

#### Android实施要点
1. 创建Android应用壳工程（仅承载H5）
2. 配置Web容器加载URL（dev/test/prod）
3. 网络权限与HTTPS策略配置
4. 接入JS Bridge V1：
   - `device.getInfo`
   - `app.getVersion`
   - `storage.secureSet/Get`
   - `notification.scheduleLocal/cancelLocal`

#### Harmony NEXT实施要点
1. 创建Stage模型应用壳
2. Web组件加载H5（支持环境配置）
3. 网络访问策略与白名单配置
4. 接入JS Bridge V1（与Android保持同协议）

#### Phase 1验收标准
- ✅ 可冷启动进入首页
- ✅ 登录后token可安全持久化
- ✅ 计划/任务/日志页面可完整浏览与操作
- ✅ 关键报错可在日志系统定位

### Phase 2：稳定性与性能

#### Android优化重点
1. WebView进程回收恢复
2. 首屏性能优化（资源缓存与预热）
3. 弱网策略（重试+提示）
4. 崩溃与埋点接入

#### Harmony NEXT优化重点
1. 生命周期与状态恢复
2. 路由切换与列表性能优化
3. 弱网与离线提示
4. 异常上报与埋点接入

#### 发布前检查
- 隐私协议与权限声明完整
- 应用签名与分发材料齐备
- 双端协议兼容测试通过

---

## 📋 详细执行清单

### Android版本执行清单

#### Phase 0：准备
- [ ] 确认包名、签名、最低支持版本
- [ ] 确认API域名与证书策略（HTTPS）
- [ ] 明确隐私与权限弹窗文案

#### Phase 1：容器化落地
- [ ] 初始化Android壳工程
- [ ] 接入Web容器并加载现有H5
- [ ] 完成本地调试/测试/生产环境配置切换
- [ ] 完成JS Bridge V1（设备信息/安全存储/版本号/通知）

#### Phase 2：稳定性与体验
- [ ] 首屏耗时基线与优化
- [ ] 前后台切换与状态恢复
- [ ] 弱网重试与离线提示
- [ ] 崩溃与埋点接入

#### Phase 3：原生增强
（待规划）

### Harmony NEXT执行清单
（结构与Android类似，具体细节待补充）

---

## 📊 项目状态跟踪

### Phase 1当前状态
**生成时间**：2026-02-10 10:48:43

#### Android
- 已完成：0
- 待完成：14

#### Harmony NEXT
- 已完成：0
- 待完成：14

#### 说明
- 数据来源：
  - `docs/migration/backlog/ANDROID_PHASE1_TASKS.md`
  - `docs/migration/backlog/HARMONY_NEXT_PHASE1_TASKS.md`

---

## ⚠️ 关键约束与注意事项

### 技术约束
- 当前前端大量依赖浏览器能力（localStorage、DOM、主题属性切换等），需要评估在容器内是否行为一致
- AI接口与API域名在移动端需要考虑网络安全策略、证书、白名单与隐私合规

### 实施建议
1. 优先完成Phase 1基础功能，确保核心业务可用
2. 保持双端开发节奏一致，避免分支 divergence
3. 建立完善的测试用例和验收标准
4. 做好版本管理和回滚预案

---

## 📚 相关文档链接

- [JS Bridge V1规范](./migration/bridge/JS_BRIDGE_V1_SPEC.md)
- [Phase 1执行手册](./migration/runbooks/PHASE1_EXECUTION_RUNBOOK.md)
- [跨平台验收测试](./migration/testing/CROSS_PLATFORM_ACCEPTANCE.md)

---
*本文档将持续更新，跟踪移动端迁移项目的实施进展*