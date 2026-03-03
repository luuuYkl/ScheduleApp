# 代码保护与安全实施指南

## 📋 概述

本文档说明 ScheduleApp 的代码保护实施方案，采用 **Electron + Bytenode + JavaScript 混淆** 三重保护策略。

## 🔒 保护层级

```
┌─────────────────────────────────────────────────────────────┐
│                    代码保护架构                              │
├─────────────────────────────────────────────────────────────┤
│  第 1 层: Vite Terser 压缩                                   │
│  - 变量名混淆                                                │
│  - 删除注释和空白                                            │
│  - 移除 console/debugger                                    │
├─────────────────────────────────────────────────────────────┤
│  第 2 层: Bytenode 字节码编译                                │
│  - Electron 主进程编译为 .jsc                                │
│  - V8 字节码，无法直接阅读                                   │
├─────────────────────────────────────────────────────────────┤
│  第 3 层: ASAR 打包                                          │
│  - 所有资源打包为单个文件                                    │
│  - 防止直接文件访问                                          │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 安装依赖

```bash
# 使用国内镜像加速（推荐）
# 项目已配置 .npmrc 镜像文件
npm install
```

### 开发模式

```bash
# 启动 Web 开发服务器
npm run dev

# 启动 Electron 开发模式
npm run electron:dev
```

### 生产构建

```bash
# 构建受保护的 Windows 可执行文件
npm run build:protected
```

## 📁 项目结构

```
ScheduleApp/
├── electron/                    # Electron 相关文件
│   ├── main.ts                  # 主进程入口 (源码)
│   ├── main.js                  # 主进程入口 (编译后)
│   ├── preload.ts               # 预加载脚本 (源码)
│   ├── preload.js               # 预加载脚本 (编译后)
│   └── protected/               # 字节码保护目录
│       ├── main.jsc             # 主进程字节码
│       ├── preload.jsc          # 预加载字节码
│       └── assets/              # 前端资源字节码
│           └── *.jsc
├── scripts/
│   └── compile-bytecode.js      # 字节码编译脚本
├── dist/                        # Web 构建产物
├── release/                     # Electron 打包产物
├── electron-builder.yml         # Electron Builder 配置
└── tsconfig.electron.json       # Electron TypeScript 配置
```

## 🛠️ NPM 脚本说明

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 构建 Web 应用 |
| `npm run electron:dev` | Electron 开发模式 |
| `npm run electron:build` | 构建 Electron 应用 |
| `npm run electron:build:win` | 构建 Windows 安装包 |
| `npm run compile:electron` | 编译 Electron TypeScript |
| `npm run compile:bytecode` | 编译字节码 |
| `npm run build:protected` | **完整保护构建** |

## 🔧 配置文件说明

### vite.config.ts

- **sourcemap: false** - 禁用 Source Map
- **minify: 'terser'** - 使用 Terser 压缩
- **drop_console** - 生产环境移除 console
- **mangle.toplevel** - 顶级作用域变量混淆

### electron-builder.yml

- **asar: true** - 启用 ASAR 打包
- **files** - 包含/排除文件规则
- **nsis** - Windows 安装程序配置

### tsconfig.electron.json

- **module: "CommonJS"** - Electron 使用 CommonJS
- **sourceMap: false** - 禁用 Source Map

## ⚠️ 注意事项

### Bytenode 限制

1. **V8 版本兼容性**: 字节码必须在相同 V8 版本下运行
2. **native 模块**: 包含 native 代码的模块无法编译
3. **动态 require**: 动态路径的 require 可能失效

### 安全建议

1. **敏感数据**: 不要在前端代码中存储敏感信息
2. **API 密钥**: 使用环境变量或服务端代理
3. **加密存储**: 使用 Electron 的安全存储 API

### 性能考虑

1. **字节码加载**: 首次加载可能有轻微延迟
2. **文件体积**: ASAR 打包后体积约 150MB+
3. **内存占用**: Electron 应用内存占用较高

## 🔄 工作流程

```
源代码 (TypeScript/Vue)
    │
    ├── Vite 构建 ──────────────────┐
    │   ├── Vue SFC 编译            │
    │   ├── Terser 压缩             │
    │   └── 代码分割                │
    │                               │
    └── Electron 构建 ──────────────┤
        ├── TypeScript 编译         │
        ├── Bytenode 字节码编译     │
        └── ASAR 打包               │
                                    │
                        ┌───────────┘
                        ▼
              ┌─────────────────────┐
              │  Windows 安装包     │
              │  (.exe)             │
              └─────────────────────┘
```

## 📊 保护效果对比

| 保护措施 | 反编译难度 | 性能影响 |
|----------|------------|----------|
| 无保护 | ⭐ 极易 | 无 |
| Terser 压缩 | ⭐⭐ 简单 | 极小 |
| JS 混淆 | ⭐⭐⭐ 中等 | 小 |
| 字节码编译 | ⭐⭐⭐⭐ 困难 | 中 |
| **组合保护** | ⭐⭐⭐⭐⭐ 极难 | 中 |

## 🔍 验证保护效果

### 检查构建产物

```bash
# 构建
npm run build:protected

# 检查 dist 目录
ls dist/assets/

# 检查 release 目录
ls release/
```

### 检查字节码文件

字节码文件 (.jsc) 是二进制格式，无法直接阅读：

```bash
# 查看字节码文件（应该是乱码）
cat electron/protected/main.jsc
```

## 📚 参考资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [Bytenode GitHub](https://github.com/bytenode/bytenode)
- [Terser 文档](https://terser.org/docs/api-reference)
- [electron-builder 文档](https://www.electron.build/)