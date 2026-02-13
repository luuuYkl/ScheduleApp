# Android / Harmony NEXT 跨端验收用例（V1）

## A. 账户与会话
- [ ] 首次安装启动到首页
- [ ] 登录成功后重启应用仍保持会话
- [ ] 退出登录后敏感缓存清除

## B. 计划与任务
- [ ] 创建计划
- [ ] 创建任务（含重复任务）
- [ ] 勾选任务后首页与日志联动刷新

## C. 日程与日志
- [ ] 创建日程
- [ ] 每日日志生成正确
- [ ] 弱网下失败提示与重试可用

## D. AI 能力
- [ ] 有配置时可获取 AI 建议
- [ ] 无配置时可降级为 mock 结果
- [ ] 超时/失败时提示友好

## E. 主题与显示
- [ ] 深浅色切换正确
- [ ] 页面滚动不遮挡顶部/底部导航

## F. 桥接能力
- [ ] `device.getInfo`
- [ ] `app.getVersion`
- [ ] `storage.secureSet/Get/Remove`
- [ ] `notification.scheduleLocal/cancelLocal`
