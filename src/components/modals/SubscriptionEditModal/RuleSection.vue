<script setup>
import { computed } from 'vue';

const props = defineProps({
  editingSubscription: {
    type: Object,
    required: true
  },
  isRuleExpanded: {
    type: Boolean,
    default: false
  },
  isAdvancedMode: {
    type: Boolean,
    default: false
  },
  groupModes: {
    type: Object,
    default: () => ({ keyword: 'exclude', region: 'exclude', protocol: 'exclude' })
  },
  customKeyword: {
    type: String,
    default: ''
  },
  selectedRules: {
    type: Array,
    default: () => []
  },
  presetRegions: {
    type: Array,
    default: () => []
  },
  presetProtocols: {
    type: Array,
    default: () => []
  },
  presetKeywords: {
    type: Array,
    default: () => []
  },
  excludeRuleState: {
    type: Object,
    required: true
  },
  toggleTag: {
    type: Function,
    required: true
  },
  isSelected: {
    type: Function,
    required: true
  },
  addCustomKeyword: {
    type: Function,
    required: true
  },
  removeRule: {
    type: Function,
    required: true
  },
  switchToAdvanced: {
    type: Function,
    required: true
  },
  switchToVisual: {
    type: Function,
    required: true
  }
});

const emit = defineEmits(['toggle-expand', 'update:group-mode', 'update:customKeyword']);

// 顺序调整：地区最上面，其次协议，然后关键词
const groups = computed(() => [
  { type: 'region', label: '📍 地区', name: '地区', tags: props.presetRegions },
  { type: 'protocol', label: '📡 协议', name: '协议', tags: props.presetProtocols },
  { type: 'keyword', label: '🏷️ 关键词', name: '关键词', tags: props.presetKeywords }
]);

const customKeywordModel = computed({
  get: () => props.customKeyword,
  set: (val) => emit('update:customKeyword', val)
});

</script>

<template>
  <!-- 包含/排除节点卡片 -->
  <div class="border border-gray-200/90 dark:border-gray-700/80 rounded-xl overflow-hidden bg-white dark:bg-gray-800/40 shadow-xs">
    <!-- 折叠头部 -->
    <div @click="emit('toggle-expand')"
      class="flex items-center justify-between px-4 py-3 bg-gray-50/80 dark:bg-gray-800/70 cursor-pointer hover:bg-gray-100/70 dark:hover:bg-gray-700/50 transition-colors select-none">
      <div class="flex items-center gap-2.5">
        <svg class="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200"
          :class="{ 'rotate-90': isRuleExpanded }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <label class="text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">包含/排除节点</label>
        <span v-if="selectedRules.length > 0"
          class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200 shadow-2xs">
          {{ selectedRules.length }}
        </span>
      </div>
      <div class="flex items-center gap-2" @click.stop>
        <button v-if="!isAdvancedMode" @click="switchToAdvanced"
          class="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          高级模式
        </button>
        <button v-else @click="switchToVisual"
          class="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          可视化模式
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <Transition name="collapse">
      <div v-show="isRuleExpanded" class="px-4 py-3.5 border-t border-gray-200/90 dark:border-gray-700/80 bg-white/60 dark:bg-gray-800/20">
        <!-- 可视化模式 -->
        <div v-if="!isAdvancedMode" class="space-y-3">
          <!-- 优先级导览说明 -->
          <div class="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100/80 dark:border-indigo-900/50 flex items-start gap-2.5 text-xs text-indigo-950 dark:text-indigo-200/90 leading-relaxed">
            <div class="mt-0.5 flex-shrink-0 text-indigo-500 dark:text-indigo-400">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="flex-1 space-y-0.5">
              <div class="font-semibold text-indigo-900 dark:text-indigo-200">
                优先级：关键词 ＞ 地区 = 协议
              </div>
              <p class="text-indigo-700/90 dark:text-indigo-300/80 text-[11px]">
                关键词命中时优先保留或排除；其余节点须同时满足地区和协议条件。
              </p>
            </div>
          </div>

          <!-- 分类卡片列表（地区 -> 协议 -> 关键词） -->
          <div v-for="group in groups" :key="group.type"
            class="border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-2.5 space-y-2 transition-colors hover:border-gray-200 dark:hover:border-gray-700">
            <!-- 分组标题 & 包含/排除分段控制器 -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-semibold text-gray-800 dark:text-gray-200">{{ group.label }}</span>
              </div>
              <!-- 现代分段切换器 (Segmented Switch) -->
              <div class="inline-flex p-0.5 rounded-lg bg-gray-200/70 dark:bg-gray-800 border border-gray-300/40 dark:border-gray-700/60 shadow-2xs">
                <button v-for="mode in ['exclude', 'keep']" :key="mode" type="button"
                  :aria-label="`${group.name}${mode === 'keep' ? '包含' : '排除'}`"
                  :aria-pressed="groupModes[group.type] === mode"
                  @click="emit('update:group-mode', group.type, mode)"
                  :class="[
                    'px-2.5 py-0.5 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer select-none !min-h-0',
                    groupModes[group.type] === mode
                      ? mode === 'keep'
                        ? 'bg-emerald-600 text-white shadow-xs font-semibold dark:bg-emerald-500'
                        : 'bg-amber-500 text-white shadow-xs font-semibold dark:bg-amber-500'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  ]">{{ mode === 'keep' ? '包含' : '排除' }}</button>
              </div>
            </div>

            <!-- 标签列表：紧凑间距，确保单行排布 -->
            <div class="flex flex-wrap items-center gap-1 sm:gap-1.5">
              <button v-for="tag in group.tags" :key="tag.pattern" type="button"
                @click="toggleTag(tag, group.type)"
                :aria-pressed="isSelected(tag.pattern)"
                :class="[
                  'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-all duration-150 cursor-pointer select-none active:scale-95 !min-h-0 !min-w-0 flex-shrink-0',
                  isSelected(tag.pattern)
                    ? groupModes[group.type] === 'keep'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-600 shadow-2xs font-semibold ring-1 ring-emerald-500/20'
                      : 'bg-amber-50 text-amber-700 border border-amber-400 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-600 shadow-2xs font-semibold ring-1 ring-amber-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-2xs'
                ]">
                <span v-if="tag.icon">{{ tag.icon }}</span>
                <span>{{ tag.label }}</span>
              </button>
            </div>
          </div>

          <!-- 自定义关键字输入卡片（紧跟在关键词后面） -->
          <div class="border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-2.5 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-semibold text-gray-800 dark:text-gray-200">✏️ 自定义关键字</span>
              </div>
              <span class="text-[11px] text-gray-400 dark:text-gray-500">支持正则</span>
            </div>
            <div class="relative flex items-center">
              <input type="text" v-model="customKeywordModel" @keyup.enter="addCustomKeyword"
                placeholder="输入关键字或正则，回车添加..."
                class="w-full pl-3 pr-20 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-2xs">
              <button @click="addCustomKeyword" type="button"
                class="absolute right-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer !min-h-0 !min-w-0">
                <span>添加</span>
                <span class="text-[10px] opacity-70">↵</span>
              </button>
            </div>
          </div>

          <!-- 已选规则展示卡片 -->
          <div v-if="selectedRules.length > 0" class="border border-gray-200/80 dark:border-gray-700/70 bg-gray-50/80 dark:bg-gray-800/40 rounded-xl p-2.5 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-gray-800 dark:text-gray-200">📋 已选规则</span>
                <span class="inline-flex items-center justify-center px-1.5 py-0.2 text-[11px] font-mono font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  {{ selectedRules.length }}
                </span>
              </div>
              <span class="text-[11px] text-gray-400 dark:text-gray-500">点击 × 移除</span>
            </div>

            <div class="flex flex-wrap gap-1.5 p-2 bg-white/70 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50 min-h-[40px] items-center">
              <span v-for="(rule, index) in selectedRules" :key="index" :class="[
                'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all duration-150 !min-h-0 !min-w-0 shadow-2xs',
                rule.type === 'region'
                  ? 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60'
                  : rule.type === 'protocol'
                    ? 'bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60'
                    : rule.type === 'custom'
                      ? 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60'
                      : 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
              ]">
                <span>{{ rule.icon || '' }}{{ rule.label }} · {{ groupModes[rule.type === 'custom' ? 'keyword' : rule.type] === 'keep' ? '包含' : '排除' }}</span>
                <button @click="removeRule(index)" type="button"
                  class="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-red-500 transition-colors cursor-pointer !min-h-0 !min-w-0"
                  title="移除规则">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            </div>
          </div>

        </div>

        <!-- 高级模式（简化版文本编辑器） -->
        <div v-else class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 dark:text-gray-400">规则模式：</span>
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium shadow-2xs', excludeRuleState.tagClass]">
                {{ excludeRuleState.tag }}
              </span>
            </div>
            <span class="text-[11px] text-gray-400 dark:text-gray-500 font-mono">优先级规则语法</span>
          </div>

          <textarea id="sub-edit-exclude" v-model="editingSubscription.exclude"
            placeholder="keyword:keep:GB&#10;region:exclude:(美国|US|USA)&#10;protocol:exclude:trojan"
            rows="8" :class="[
              'w-full px-3.5 py-2.5 rounded-xl sm:text-sm font-mono dark:text-white leading-6 resize-none bg-white dark:bg-gray-800/90 transition-all shadow-2xs',
              excludeRuleState.errors.length
                ? 'border border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-hidden'
                : 'border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden'
            ]"></textarea>

          <div v-if="excludeRuleState.errors.length" class="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-300 flex items-start gap-2">
            <svg class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <span class="font-semibold">规则有误：</span>{{ excludeRuleState.errorsText }}
            </div>
          </div>

          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400 space-y-1.5 leading-relaxed">
            <p class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>每行一条规则，支持正则表达式。<code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/60 text-indigo-600 dark:text-indigo-300 rounded font-mono text-[11px]">proto:</code> 用于协议匹配。</span>
            </p>
            <p class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>优先级语法格式：<code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/60 text-indigo-600 dark:text-indigo-300 rounded font-mono text-[11px]">keyword:keep:GB</code>、<code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/60 text-indigo-600 dark:text-indigo-300 rounded font-mono text-[11px]">region:exclude:US</code>、<code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/60 text-indigo-600 dark:text-indigo-300 rounded font-mono text-[11px]">protocol:exclude:trojan</code>。</span>
            </p>
            <p class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><code class="font-mono text-emerald-600 dark:text-emerald-400">keep</code> 表示包含，<code class="font-mono text-amber-600 dark:text-amber-400">exclude</code> 表示排除；同一类别模式须保持一致。</span>
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 1000px;
}
</style>
