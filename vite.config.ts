import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { fileURLToPath, URL } from "url";

// 在 ESM 环境下创建 __dirname 等价路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 判断是否为生产构建
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [vue()],
  
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },

  // 生产构建配置
  build: {
    // 禁用 Source Map 防止源码泄露
    sourcemap: false,
    
    // 输出目录
    outDir: "dist",
    
    // 资源目录
    assetsDir: "assets",
    
    // 代码分割策略
    rollupOptions: {
      output: {
        // 手动分割代码块
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'arco-design': ['@arco-design/web-vue'],
          'axios-vendor': ['axios'],
        },
        // 混淆文件名
        chunkFileNames: 'assets/[hash].js',
        entryFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash].[ext]'
      }
    },
    
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        // 生产环境移除 console
        drop_console: isProduction,
        drop_debugger: isProduction,
        // 移除无用代码
        dead_code: true,
        // 内联简单函数
        inline: 2,
      },
      format: {
        // 移除注释
        comments: false,
      },
      mangle: {
        // 混淆变量名
        toplevel: true,
        safari10: true,
      }
    },
    
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    
    // 块大小警告限制
    chunkSizeWarningLimit: 1000,
  },

  // 开发服务器配置
  server: {
    port: 5173,
    host: true,
    strictPort: true,
  },

  // CSS 配置
  css: {
    devSourcemap: false,
  },

  // 定义环境变量
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
});