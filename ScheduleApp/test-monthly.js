// 测试月度重复任务算法
import { generateRepeatDates } from './src/services/repeat-task.ts';

console.log('测试用例: { start: "2024-01-31", end: "2024-02-28", expectedLength: 2 }');
const result = generateRepeatDates('2024-01-31', '2024-02-28', 'monthly');
console.log('结果:', result);
console.log('长度:', result.length);
console.log('期望长度: 2');