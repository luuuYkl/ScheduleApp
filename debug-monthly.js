// 调试月度重复任务算法
function debugMonthlyRepeat() {
  const startDate = "2024-01-31";
  const endDate = "2024-04-30";
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  console.log("开始日期:", start.toISOString().split('T')[0]);
  console.log("结束日期:", end.toISOString().split('T')[0]);
  
  const dates = [];
  let current = new Date(start);
  const anchorDay = start.getDate();
  
  console.log("锚点日:", anchorDay);
  
  while (current <= end) {
    const formattedDate = current.toISOString().split('T')[0];
    console.log("添加日期:", formattedDate);
    dates.push(formattedDate);
    
    // 增加月份
    const currentMonth = current.getMonth();
    current.setMonth(currentMonth + 1);
    
    // 获取目标月份最后一天
    const lastDayOfMonth = new Date(
      current.getFullYear(),
      current.getMonth() + 1,
      0
    ).getDate();
    
    const targetDay = Math.min(anchorDay, lastDayOfMonth);
    current.setDate(targetDay);
    
    console.log("下一次迭代前:", current.toISOString().split('T')[0]);
    console.log("---");
  }
  
  console.log("最终结果:", dates);
}

debugMonthlyRepeat();