# AI功能配置指南

## 当前状态
目前项目使用DeepSeek API作为AI服务提供商，**API密钥已配置完成**。

✅ **已配置API密钥**: sk-043276931aa142ab8ec2c4a5fe0717ea
✅ **服务状态**: 可用
✅ **功能状态**: 实时AI建议已启用

## 配置步骤

### 1. 获取DeepSeek API Key
1. 访问 [DeepSeek官网](https://www.deepseek.com/)
2. 注册账号并登录
3. 在控制台获取API密钥

### 2. 配置环境变量
编辑 `.env.local` 文件，将 `your-deepseek-api-key-here` 替换为实际的API密钥：

```env
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_OPENAI_BASE_URL=https://api.deepseek.com/v1
VITE_AI_MODEL=deepseek-chat
```

### 3. 重启开发服务器
配置完成后，需要重启开发服务器使配置生效：
```bash
npm run dev
```

## 功能说明

### AI智能优化功能
- **计划分析**: 分析计划的合理性、时间安排
- **任务推荐**: 自动生成推荐任务列表
- **优化建议**: 提供具体的改进建议
- **Mock模式**: 无API Key时自动降级到模拟建议

### 当前配置详情
- **AI启用状态**: `true`
- **默认API地址**: `https://api.deepseek.com/v1`
- **默认模型**: `deepseek-chat`
- **降级策略**: API不可用时使用内置模拟建议

## 测试验证

配置完成后，可以通过以下方式验证：
1. 在应用中创建新计划
2. 点击"AI优化建议"按钮
3. 查看是否能获得真实的AI建议

## 注意事项
- API密钥请妥善保管，不要提交到版本控制系统
- `.env.local` 文件已被添加到 `.gitignore` 中
- 项目支持Mock模式，即使没有API Key也能正常使用核心功能

## 故障排除
如果遇到问题：
1. 检查API密钥是否正确
2. 确认网络连接正常
3. 查看浏览器控制台的错误信息
4. 验证环境变量是否正确加载