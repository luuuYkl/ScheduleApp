/**
 * Bytenode 字节码编译脚本
 * 将核心 JavaScript 文件编译为 V8 字节码 (.jsc)
 * 
 * 使用方法: node scripts/compile-bytecode.js
 */
const bytenode = require('bytenode');
const fs = require('fs');
const path = require('path');

// 需要编译为字节码的核心文件
const FILES_TO_COMPILE = [
  // Electron 主进程
  'electron/main.js',
  'electron/preload.js',
  
  // 核心服务（构建后的 JS 文件）
  // 注意：这些路径是构建后的路径
  'dist/assets/*.js', // 所有构建后的 JS 文件
];

// 输出目录
const PROTECTED_DIR = 'electron/protected';

/**
 * 确保目录存在
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 编译单个文件为字节码
 */
async function compileFile(inputPath, outputPath) {
  try {
    console.log(`Compiling: ${inputPath} -> ${outputPath}`);
    
    // 使用 bytenode 编译
    await bytenode.compileFile({
      filename: inputPath,
      output: outputPath,
    });
    
    console.log(`  ✓ Compiled successfully`);
    return true;
  } catch (error) {
    console.error(`  ✗ Failed to compile: ${error.message}`);
    return false;
  }
}

/**
 * 编译目录下的所有 JS 文件
 */
async function compileDirectory(inputDir, outputDir) {
  ensureDir(outputDir);
  
  const files = fs.readdirSync(inputDir);
  let successCount = 0;
  let failCount = 0;
  
  for (const file of files) {
    if (file.endsWith('.js') && !file.endsWith('.jsc')) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file.replace('.js', '.jsc'));
      
      const success = await compileFile(inputPath, outputPath);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
  }
  
  return { successCount, failCount };
}

/**
 * 主函数
 */
async function main() {
  console.log('=== Bytenode 字节码编译 ===\n');
  
  // 确保输出目录存在
  ensureDir(PROTECTED_DIR);
  
  let totalSuccess = 0;
  let totalFail = 0;
  
  // 编译 Electron 主进程文件
  console.log('\n📦 编译 Electron 主进程文件...');
  
  const mainFile = 'electron/main.js';
  const preloadFile = 'electron/preload.js';
  
  // 先检查是否存在编译后的 JS 文件
  if (fs.existsSync(mainFile)) {
    const result = await compileFile(mainFile, path.join(PROTECTED_DIR, 'main.jsc'));
    if (result) totalSuccess++;
    else totalFail++;
  }
  
  if (fs.existsSync(preloadFile)) {
    const result = await compileFile(preloadFile, path.join(PROTECTED_DIR, 'preload.jsc'));
    if (result) totalSuccess++;
    else totalFail++;
  }
  
  // 编译 dist/assets 下的所有 JS 文件
  const distAssetsDir = 'dist/assets';
  if (fs.existsSync(distAssetsDir)) {
    console.log('\n📦 编译前端构建产物...');
    const result = await compileDirectory(distAssetsDir, path.join(PROTECTED_DIR, 'assets'));
    totalSuccess += result.successCount;
    totalFail += result.failCount;
  }
  
  // 输出统计
  console.log('\n=== 编译完成 ===');
  console.log(`✓ 成功: ${totalSuccess}`);
  console.log(`✗ 失败: ${totalFail}`);
  
  // 创建字节码加载器入口
  const loaderContent = `/**
 * 字节码加载器入口
 * 此文件用于加载编译后的字节码
 */
const bytenode = require('bytenode');
const path = require('path');

// 加载主进程字节码
require(path.join(__dirname, 'main.jsc'));
`;
  
  fs.writeFileSync(path.join(PROTECTED_DIR, 'loader.js'), loaderContent);
  console.log('\n✓ 字节码加载器已创建');
  
  if (totalFail > 0) {
    process.exit(1);
  }
}

main().catch(console.error);