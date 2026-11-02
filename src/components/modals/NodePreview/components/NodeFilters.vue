<script setup>
import { computed } from 'vue';

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  protocolFilter: {
    type: String,
    default: 'all'
  },
  regionFilter: {
    type: String,
    default: 'all'
  },
  viewMode: {
    type: String,
    default: 'list'
  },
  showProcessed: {
    type: Boolean,
    default: false
  },
  availableProtocols: {
    type: Array,
    default: () => []
  },
  availableRegions: {
    type: Array,
    default: () => []
  },
  profileId: {
    type: String,
    default: ''
  },
  apiEndpoint: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'update:searchQuery',
  'update:protocolFilter',
  'update:regionFilter',
  'update:viewMode',
  'update:showProcessed'
]);

const searchModel = computed({
  get: () => props.searchQuery,
  set: (val) => emit('update:searchQuery', val)
});

const protocolModel = computed({
  get: () => props.protocolFilter,
  set: (val) => emit('update:protocolFilter', val)
});

const regionModel = computed({
  get: () => props.regionFilter,
  set: (val) => emit('update:regionFilter', val)
});

const isProcessedToggleVisible = computed(() => {
  return props.profileId && props.apiEndpoint !== '/api/public/preview';
});
</script>

<template>
  <div class="border-b border-gray-100 bg-gray-50/50 px-3 sm:px-4 py-2 dark:border-gray-800 dark:bg-gray-900/30">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <!-- 左侧：搜索 + 协议 + 地区筛选 -->
      <div class="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        <!-- 搜索 -->
        <div class="relative flex-1 min-w-[150px] max-w-xs group">
          <input
            v-model="searchModel"
            type="text"
            placeholder="搜索节点名称 / 地址..."
            class="w-full h-8.5 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all shadow-xs"
          />
          <div class="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <!-- 协议筛选 -->
        <div class="relative">
          <select
            v-model="protocolModel"
            class="h-8.5 rounded-lg border border-gray-200 bg-white pl-2.5 pr-6 text-xs font-medium text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition-all shadow-xs appearance-none cursor-pointer"
          >
            <option value="all">全部协议 ({{ availableProtocols.length }})</option>
            <option v-for="protocol in availableProtocols" :key="protocol" :value="protocol">
              {{ protocol.toUpperCase() }}
            </option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-400">
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        <!-- 地区筛选 -->
        <div class="relative">
          <select
            v-model="regionModel"
            class="h-8.5 rounded-lg border border-gray-200 bg-white pl-2.5 pr-6 text-xs font-medium text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition-all shadow-xs appearance-none cursor-pointer"
          >
            <option value="all">全部地区 ({{ availableRegions.length }})</option>
            <option v-for="region in availableRegions" :key="region" :value="region">
              {{ region }}
            </option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-400">
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      <!-- 右侧：优化模式与视图切换 -->
      <div class="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
        <!-- 处理模式 toggler -->
        <button
          v-if="isProcessedToggleVisible"
          @click="emit('update:showProcessed', !showProcessed)"
          :class="showProcessed ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'"
          class="flex h-8.5 items-center gap-1.5 px-2.5 rounded-lg text-xs font-medium transition-all"
          :title="showProcessed ? '当前显示：处理后名称' : '当前显示：原始名称'"
        >
          <svg v-if="showProcessed" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <span>{{ showProcessed ? '已优化' : '原始名' }}</span>
        </button>

        <!-- 视图切换 (仅桌面端) -->
        <div class="hidden lg:flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5">
          <button
            @click="emit('update:viewMode', 'list')"
            :class="viewMode === 'list' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'"
            class="flex h-7.5 w-7.5 items-center justify-center rounded-md text-xs transition-all"
            title="列表视图"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 10h16M4 14h16"></path>
            </svg>
          </button>
          <button
            @click="emit('update:viewMode', 'card')"
            :class="viewMode === 'card' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'"
            class="flex h-7.5 w-7.5 items-center justify-center rounded-md text-xs transition-all"
            title="卡片视图"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
