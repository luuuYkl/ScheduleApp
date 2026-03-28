// src/composables/useVirtualScroll.ts
// 虚拟滚动组合式函数

import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import type { LogGroup, LogEntryUI, VirtualItem } from '@/utils/log-grouping';

/** 虚拟滚动配置 */
const VIRTUAL_CONFIG = {
  itemHeight: 100, // 摘要模式高度（估算）
  expandedHeight: 450, // 详细模式高度（估算）
  groupHeight: 60, // 分组标题高度
  overscan: 3, // 预渲染数量
};

/**
 * 虚拟滚动组合式函数
 */
export function useVirtualScroll(groups: () => LogGroup[]) {
  const containerRef = ref<HTMLElement | null>(null);
  const scrollTop = ref(0);
  const viewportHeight = ref(600);
  const itemHeights = ref<Map<string | number, number>>(new Map());

  // 构建虚拟列表
  const virtualList = computed(() => {
    const items: VirtualItem[] = [];
    
    for (const group of groups()) {
      // 添加分组标题（带前缀避免 key 冲突）
      items.push({
        type: 'group',
        id: `group-${group.period}`,
        data: group
      });
      
      // 如果分组展开，添加日志项（带前缀避免 key 冲突）
      if (group.expanded) {
        for (const logItem of group.logs) {
          items.push({
            type: 'log',
            id: `log-${logItem.log.id}`,
            data: logItem
          });
        }
      }
    }
    
    return items;
  });

  // 计算总高度
  const totalHeight = computed(() => {
    let height = 0;
    
    for (const group of groups()) {
      height += VIRTUAL_CONFIG.groupHeight;
      
      if (group.expanded) {
        for (const logItem of group.logs) {
          const actualHeight = itemHeights.value.get(logItem.log.id);
          height += actualHeight || 
            (logItem.expanded 
              ? VIRTUAL_CONFIG.expandedHeight 
              : VIRTUAL_CONFIG.itemHeight);
        }
      }
    }
    
    return height;
  });

  // 获取项的高度
  function getItemHeightById(id: string | number, item?: VirtualItem): number {
    // 如果是日志项，优先根据展开状态返回估算高度
    if (item?.type === 'log') {
      const logItem = item.data as LogEntryUI;
      const cachedHeight = itemHeights.value.get(id);
      
      // 只有在展开状态下才使用缓存的高度
      if (cachedHeight && logItem.expanded) {
        return cachedHeight;
      }
      
      // 折叠时或没有缓存时，根据展开状态返回估算高度
      return logItem.expanded 
        ? VIRTUAL_CONFIG.expandedHeight 
        : VIRTUAL_CONFIG.itemHeight;
    }
    
    // 分组项或其他情况
    if (item?.type === 'group') {
      return itemHeights.value.get(id) || VIRTUAL_CONFIG.groupHeight;
    }
    
    // 默认返回缓存或估算高度
    return itemHeights.value.get(id) || VIRTUAL_CONFIG.itemHeight;
  }
  
  // 清除特定项的高度缓存
  function clearItemHeightCache(id: string | number) {
    itemHeights.value.delete(id);
  }

  // 计算可见范围（使用累积高度计算）
  const visibleRange = computed(() => {
    let startOffset = scrollTop.value;
    let endOffset = scrollTop.value + viewportHeight.value;
    
    // 扩展可见范围（预渲染）
    const overscanHeight = VIRTUAL_CONFIG.overscan * VIRTUAL_CONFIG.itemHeight;
    startOffset = Math.max(0, startOffset - overscanHeight);
    endOffset += overscanHeight;
    
    // 遍历虚拟列表，找到可见范围
    let startIndex = 0;
    let currentOffset = 0;
    
    for (let i = 0; i < virtualList.value.length; i++) {
      const item = virtualList.value[i];
      const height = getItemHeightById(item.id, item);
      
      if (currentOffset + height >= startOffset && startIndex === 0) {
        startIndex = i;
      }
      
      currentOffset += height;
      
      if (currentOffset >= endOffset) {
        return { startIndex, endIndex: i + 1 };
      }
    }
    
    return { startIndex, endIndex: virtualList.value.length };
  });

  // 可见项列表
  const visibleItems = computed(() => {
    const { startIndex, endIndex } = visibleRange.value;
    return virtualList.value.slice(startIndex, endIndex);
  });

  // 计算项的累积偏移
  function getItemOffset(item: VirtualItem): number {
    let offset = 0;
    
    for (const currentItem of virtualList.value) {
      if (currentItem.id === item.id) {
        return offset;
      }
      
      const height = getItemHeightById(currentItem.id, currentItem);
      offset += height;
    }
    
    return offset;
  }

  // 滚动处理（带节流，使用 requestAnimationFrame）
  let scrollFrame: number | null = null;
  
  function handleScroll(e: Event) {
    if (scrollFrame !== null) {
      cancelAnimationFrame(scrollFrame);
    }
    
    scrollFrame = requestAnimationFrame(() => {
      scrollTop.value = (e.target as HTMLElement).scrollTop;
      scrollFrame = null;
    });
  }

  // 更新项高度
  function updateItemHeight(id: string | number, height: number) {
    itemHeights.value.set(id, height);
  }

  // 批量更新高度
  function updateItemHeights(heights: Map<string | number, number>) {
    for (const [id, height] of heights.entries()) {
      itemHeights.value.set(id, height);
    }
  }

  // 监听容器尺寸
  function observeContainer() {
    if (!containerRef.value) return;
    
    // 初始化高度
    viewportHeight.value = containerRef.value.clientHeight;
    containerRef.value.addEventListener('scroll', handleScroll);
    
    // 使用 ResizeObserver 监听容器尺寸变化
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        viewportHeight.value = entry.contentRect.height;
      }
    });
    
    resizeObserver.observe(containerRef.value);
    
    return () => {
      resizeObserver.disconnect();
      containerRef.value?.removeEventListener('scroll', handleScroll);
      if (scrollFrame !== null) {
        cancelAnimationFrame(scrollFrame);
      }
    };
  }

  // 清理函数引用
  let cleanupFn: (() => void) | null = null;

  // 监听分组变化，重置高度
  watch(groups, () => {
    itemHeights.value.clear();
  });

  // 监听容器 ref 变化，延迟绑定观察器
  watch(containerRef, (newRef) => {
    // 清理旧的观察器
    if (cleanupFn) {
      cleanupFn();
      cleanupFn = null;
    }
    // 绑定新的观察器
    if (newRef) {
      cleanupFn = observeContainer() ?? null;
    }
  });

  // 生命周期
  onMounted(() => {
    const cleanup = observeContainer();
    cleanupFn = cleanup ?? null;
    if (cleanup) {
      onBeforeUnmount(cleanup);
    }
  });

  // 确保组件卸载时清理
  onBeforeUnmount(() => {
    if (cleanupFn) {
      cleanupFn();
      cleanupFn = null;
    }
  });

  return {
    // Refs
    containerRef,
    scrollTop,
    viewportHeight,
    
    // Computed
    virtualList,
    totalHeight,
    visibleRange,
    visibleItems,
    
    // Methods
    getItemOffset,
    updateItemHeight,
    updateItemHeights,
    clearItemHeightCache,
  };
}