<script setup>
import { computed } from 'vue';
import draggable from 'vuedraggable';

const props = defineProps({
  nodes: {
    type: Array,
    default: () => []
  },
  filteredNodes: {
    type: Array,
    default: () => []
  },
  searchTerm: {
    type: String,
    default: ''
  },
  activeGroupFilter: {
    type: String,
    default: null
  },
  groups: {
    type: Array,
    default: () => []
  },
  selectedIds: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits([
  'update:searchTerm',
  'update:groupFilter',
  'update:selectedIds',
  'toggle-selection',
  'select-all',
  'deselect-all'
]);

const searchModel = computed({
  get: () => props.searchTerm,
  set: (val) => emit('update:searchTerm', val)
});

// 根据 selectedIds 顺序获取已选节点对象列表
const orderedSelectedNodes = computed({
  get() {
    const nodeMap = new Map(props.nodes.map(n => [n.id, n]));
    return props.selectedIds
      .map(id => nodeMap.get(id))
      .filter(Boolean);
  },
  set(newList) {
    // 拖拽排序后更新 ID 顺序
    emit('update:selectedIds', newList.map(n => n.id));
  }
});
</script>

<template>
  <section class="min-w-0 rounded-xl border border-gray-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.02]">
    <div class="mb-3 flex min-h-7 flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2"><h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200">手动节点</h4><span class="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">已选 {{ selectedIds.length }} / {{ nodes.length }}</span></div>
      <div class="flex shrink-0 items-center gap-3">
        <button @click="emit('select-all')" class="text-xs text-indigo-600 hover:underline">全选</button>
        <button @click="emit('deselect-all')" class="text-xs text-indigo-600 hover:underline">全不选</button>
      </div>
    </div>
    <div class="mb-3 flex items-center gap-2">
    <div class="relative min-w-0 flex-1">
      <input type="text" v-model="searchModel" placeholder="搜索节点..."
        class="h-10 w-full pl-9 pr-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 misub-radius-md shadow-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg"
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
      <select
        aria-label="筛选手动节点分组"
        :value="activeGroupFilter ?? ''"
        @change="emit('update:groupFilter', $event.target.value || null)"
        class="h-10 min-w-0 max-w-[45%] rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      >
        <option value="">全部分组</option>
        <option value="默认">未分组</option>
        <option v-for="group in groups" :key="group" :value="group">{{ group }}</option>
      </select>
    </div>
    <div
      class="overflow-y-auto space-y-2 p-3 bg-gray-50 dark:bg-gray-900/50 misub-radius-md border dark:border-gray-700 h-48 lg:h-56">
      <div v-for="node in filteredNodes" :key="node.id">
        <label class="flex min-h-9 items-center gap-3 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-white/5">
          <input type="checkbox" :checked="selectedIds.includes(node.id)" @change="emit('toggle-selection', node.id)"
            class="h-4 w-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          <span class="text-sm text-gray-800 dark:text-gray-200 truncate" :title="node.name">{{ node.name || '未命名节点'
          }}</span>
        </label>
      </div>
      <div v-if="filteredNodes.length === 0" class="text-center text-gray-500 text-sm py-4">
        {{ nodes.length ? '没有找到匹配的节点' : '暂无可用的手动节点' }}
      </div>
    </div>

    <!-- 已选节点拖拽排序区域 -->
    <div v-if="orderedSelectedNodes.length > 0" class="mt-3">
      <div class="flex justify-between items-center mb-1.5">
        <h5 class="text-xs font-medium text-gray-500 dark:text-gray-400">
          已选 ({{ orderedSelectedNodes.length }}) - 拖拽调整顺序
        </h5>
      </div>
      <draggable v-model="orderedSelectedNodes" item-key="id" handle=".drag-handle" ghost-class="opacity-40"
        class="space-y-1 p-2 bg-indigo-50 dark:bg-indigo-900/20 misub-radius-md border border-indigo-200 dark:border-indigo-800 max-h-40 overflow-y-auto">
        <template #item="{ element, index }">
          <div
            class="flex items-center gap-2 px-2 py-1.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-xs">
            <span
              class="drag-handle cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              </svg>
            </span>
            <span class="text-xs font-medium text-indigo-600 dark:text-indigo-400 w-5">{{ index + 1 }}</span>
            <span class="text-sm text-gray-800 dark:text-gray-200 truncate flex-1" :title="element.name">
              {{ element.name || '未命名节点' }}
            </span>
            <button @click="emit('toggle-selection', element.id)"
              class="text-gray-400 hover:text-red-500 transition-colors" title="移除">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </template>
      </draggable>
    </div>
  </section>
</template>
