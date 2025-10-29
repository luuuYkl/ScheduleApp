// ============================================
// 浏览器控制台快速清理脚本
// ============================================
// 使用方法：
// 1. 按 F12 打开开发者工具
// 2. 切换到 Console (控制台) 标签
// 3. 复制粘贴下面的代码并回车

// ======== 清空所有数据 ========
(function clearAllStorage() {
  // 清除 localStorage
  localStorage.clear();
  
  // 清除 sessionStorage
  sessionStorage.clear();
  
  // 清除 cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  console.log('%c✅ 所有存储数据已清空！', 'color: #22c55e; font-size: 16px; font-weight: bold;');
  console.log('%c📍 即将刷新页面...', 'color: #3b82f6; font-size: 14px;');
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
})();

// ======== 仅清除登录信息 ========
// (function clearAuthOnly() {
//   localStorage.removeItem('token');
//   localStorage.removeItem('user');
//   sessionStorage.removeItem('token');
//   sessionStorage.removeItem('user');
//   
//   console.log('%c✅ 登录信息已清除！', 'color: #22c55e; font-size: 16px; font-weight: bold;');
//   console.log('%c📍 即将跳转到登录页...', 'color: #3b82f6; font-size: 14px;');
//   
//   setTimeout(() => {
//     window.location.href = '/login';
//   }, 1000);
// })();

// ======== 查看当前存储数据 ========
// (function viewStorage() {
//   console.log('%c📦 LocalStorage 数据:', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
//   for (let i = 0; i < localStorage.length; i++) {
//     const key = localStorage.key(i);
//     const value = localStorage.getItem(key);
//     console.log(`  ${key}:`, value);
//   }
//   
//   console.log('%c📦 SessionStorage 数据:', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
//   for (let i = 0; i < sessionStorage.length; i++) {
//     const key = sessionStorage.key(i);
//     const value = sessionStorage.getItem(key);
//     console.log(`  ${key}:`, value);
//   }
// })();
