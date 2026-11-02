<script setup>
import { computed, ref, watch } from 'vue';
import { parsePriorityRules, serializePriorityRules } from '../../shared/priority-rules.js';
import { useToastStore } from '../../stores/toast.js';
import Modal from '../forms/Modal.vue';
import EditForm from './SubscriptionEditModal/EditForm.vue';
import RuleSection from './SubscriptionEditModal/RuleSection.vue';
import AdvancedOptions from './SubscriptionEditModal/AdvancedOptions.vue';
const props = defineProps({
  show: Boolean,
  isNew: Boolean,
  editingSubscription: Object
});

const emit = defineEmits(['update:show', 'confirm']);
const { showToast } = useToastStore();


// === 可视化规则编辑器 ===
const isAdvancedMode = ref(false);
const isRuleExpanded = ref(false); // 折叠状态
const groupModes = ref({ keyword: 'exclude', region: 'exclude', protocol: 'exclude' });
const customKeyword = ref('');

// 预设标签
const presetRegions = [
  { label: '香港', pattern: '(香港|HK|Hong Kong)', icon: '🇭🇰' },
  { label: '台湾', pattern: '(台湾|TW|Taiwan)', icon: '🇨🇳' },
  { label: '日本', pattern: '(日本|JP|Japan)', icon: '🇯🇵' },
  { label: '新加坡', pattern: '(新加坡|SG|Singapore)', icon: '🇸🇬' },
  { label: '美国', pattern: '(美国|US|USA)', icon: '🇺🇸' },
  { label: '韩国', pattern: '(韩国|KR|Korea)', icon: '🇰🇷' },
  { label: '德国', pattern: '(德国|DE|Germany)', icon: '🇩🇪' },
  { label: '英国', pattern: '(英国|UK|Britain)', icon: '🇬🇧' },
];

const presetProtocols = [
  { label: 'SS', pattern: 'proto:ss' },
  { label: 'VMess', pattern: 'proto:vmess' },
  { label: 'VLESS', pattern: 'proto:vless' },
  { label: 'Trojan', pattern: 'proto:trojan' },
  { label: 'Hysteria', pattern: 'proto:hysteria' },
  { label: 'AnyTLS', pattern: 'proto:anytls' },
  { label: 'TUIC', pattern: 'proto:tuic' },
  { label: 'WireGuard', pattern: 'proto:wireguard' },
];

const presetKeywords = [
  { label: '官网', pattern: '官网' },
  { label: '过期', pattern: '过期' },
  { label: '剩余', pattern: '(剩余|流量)' },
  { label: '倍率', pattern: '倍率' },
  { label: 'GB', pattern: 'GB' },
];

// 已选择的规则（内置+自定义）
const selectedRules = ref([]);

// 检查标签是否已选中
const isSelected = (pattern) => {
  return selectedRules.value.some(rule => rule.pattern === pattern);
};

// 切换标签选择
const toggleTag = (tag, type) => {
  const index = selectedRules.value.findIndex(rule => rule.pattern === tag.pattern);
  if (index !== -1) {
    selectedRules.value.splice(index, 1);
  } else {
    selectedRules.value.push({
      ...tag,
      type // 'region' | 'protocol' | 'keyword' | 'custom'
    });
  }
  syncToText();
};

// 添加自定义关键字
const addCustomKeyword = () => {
  const keyword = customKeyword.value.trim();
  if (!keyword) return;

  try {
    new RegExp(keyword, 'i');
  } catch {
    showToast('关键字正则无效，请检查后重试', 'error');
    return;
  }

  // 检查是否已存在
  if (selectedRules.value.some(rule => rule.pattern === keyword || rule.label === keyword)) {
    showToast('该关键字已添加', 'warning');
    return;
  }

  selectedRules.value.push({
    label: keyword,
    pattern: keyword,
    type: 'custom'
  });
  customKeyword.value = '';
  syncToText();
};

// 移除规则
const removeRule = (index) => {
  selectedRules.value.splice(index, 1);
  syncToText();
};

// 将可视化选择同步到文本格式
const syncToText = () => {
  if (!props.editingSubscription) return;

  props.editingSubscription.exclude = serializePriorityRules(selectedRules.value, groupModes.value);
};

// 从文本解析到可视化状态
const parseFromText = () => {
  const text = props.editingSubscription?.exclude || '';
  selectedRules.value = [];
  groupModes.value = { keyword: 'exclude', region: 'exclude', protocol: 'exclude' };
  const allPresets = [...presetRegions, ...presetProtocols, ...presetKeywords];
  const addRule = (pattern, category) => {
    const preset = allPresets.find(p => p.pattern === pattern);
    selectedRules.value.push({ ...(preset || { label: pattern.replace(/^proto:/i, ''), pattern }), type: category });
  };
  try {
    const priority = parsePriorityRules(text);
    if (priority) {
      for (const [category, group] of Object.entries(priority)) {
        groupModes.value[category] = group.mode;
        group.patterns.forEach(pattern => addRule(category === 'protocol' ? `proto:${pattern}` : pattern, category));
      }
      return;
    }
  } catch {
    isAdvancedMode.value = true;
    return;
  }
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  // Keep complex legacy rules in advanced mode until the user edits them explicitly.
  if (lines.includes('---')) {
    isAdvancedMode.value = true;
    return;
  }
  const modes = {};
  for (const line of lines) {
    const keep = /^keep:/i.test(line);
    const pattern = keep ? line.substring(5).trim() : line;
    const category = /^proto:/i.test(pattern) ? 'protocol'
      : presetRegions.some(p => p.pattern === pattern) ? 'region' : 'keyword';
    const mode = keep ? 'keep' : 'exclude';
    if (modes[category] && modes[category] !== mode) {
      isAdvancedMode.value = true;
      return;
    }
    modes[category] = mode;
    groupModes.value[category] = mode;
    addRule(pattern, category);
  }
};

const setGroupMode = (category, mode) => {
  groupModes.value[category] = mode;
  syncToText();
};

// 监听弹窗显示，解析现有规则
watch(() => props.show, (newVal) => {
  if (newVal) {
    isAdvancedMode.value = false;
    parseFromText();
  }
}, { immediate: true });

// === 高级模式相关（保留原有逻辑） ===
const excludeRuleTextarea = ref(null);
const excludeRuleHighlight = ref(null);

const excludeRuleLines = computed(() => {
  const text = props.editingSubscription?.exclude ?? '';
  const lines = text.split('\n');
  return lines.length ? lines : [''];
});

const excludeRuleState = computed(() => {
  const text = props.editingSubscription?.exclude ?? '';
  const rawLines = text.split('\n');
  const lines = rawLines.map(line => line.trim());
  const hasContent = lines.some(line => line);
  const dividerIndex = lines.findIndex(line => line === '---');
  const hasDivider = dividerIndex !== -1;
  const hasKeepPrefix = lines.some(line => line.toLowerCase().startsWith('keep:'));

  try {
    if (parsePriorityRules(text)) return {
      tag: '优先级', tagClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200', errors: [], errorsText: ''
    };
  } catch (error) {
    return { tag: '规则有误', tagClass: 'text-red-600', errors: [{ line: 1, message: error.message }], errorsText: error.message };
  }

  let tag = '未设置';
  if (hasContent) {
    if (hasDivider) tag = '混合';
    else if (hasKeepPrefix) tag = '仅包含';
    else tag = '排除';
  }

  const tagClassMap = {
    '未设置': 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300',
    '排除': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
    '仅包含': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
    '混合': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200'
  };

  const errors = [];
  rawLines.forEach((rawLine, index) => {
    let line = rawLine.trim();
    if (!line) return;
    if (line === '---') return;

    if (line.toLowerCase().startsWith('keep:')) {
      line = line.substring('keep:'.length).trim();
      if (!line) {
        errors.push({ line: index + 1, message: 'keep: 后内容为空' });
        return;
      }
    }

    if (line.toLowerCase().startsWith('proto:')) {
      const protocols = line.substring('proto:'.length)
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);
      if (protocols.length === 0) {
        errors.push({ line: index + 1, message: 'proto: 后未填写协议' });
      }
      return;
    }

    try {
      new RegExp(line);
    } catch (e) {
      errors.push({ line: index + 1, message: '正则无效' });
    }
  });

  return {
    tag,
    tagClass: tagClassMap[tag] || tagClassMap['未设置'],
    errors,
    errorsText: errors.map(item => `第${item.line}行：${item.message}`).join('；')
  };
});

const excludeRuleErrorLines = computed(() => new Set(
  excludeRuleState.value.errors.map(item => item.line)
));

const syncExcludeRuleScroll = () => {
  if (!excludeRuleTextarea.value || !excludeRuleHighlight.value) return;
  excludeRuleHighlight.value.scrollTop = excludeRuleTextarea.value.scrollTop;
  excludeRuleHighlight.value.scrollLeft = excludeRuleTextarea.value.scrollLeft;
};



const handleConfirm = () => {
  if (!isAdvancedMode.value) syncToText();
  if (excludeRuleState.value.errors.length > 0) {
    showToast('包含/排除规则有误，请先修正', 'error');
    return;
  }
  emit('confirm');
};

// 切换到高级模式
const switchToAdvanced = () => {
  isAdvancedMode.value = true;
};

// 切换到可视化模式
const switchToVisual = () => {
  isAdvancedMode.value = false;
  parseFromText();
};
</script>

<template>
  <Modal v-if="editingSubscription" :show="show" size="2xl"
    :confirm-disabled="excludeRuleState.errors.length > 0" confirm-button-title="请先修正规则"
    @update:show="emit('update:show', $event)" @confirm="handleConfirm">
    <template #title>
      <div class="flex items-center gap-3">
        <div class="p-2 misub-radius-lg bg-indigo-500/10">
          <!-- Standard RSS/Link Icon for Subscription -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-800 dark:text-white">
            {{ isNew ? '新增订阅' : '编辑订阅' }}
          </h3>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">统一管理订阅链接、筛选规则和高级转换选项。</p>
        </div>
      </div>
    </template>
    <template #body>
      <div class="space-y-4">
        <EditForm :editing-subscription="editingSubscription" />

        <RuleSection
          :editing-subscription="editingSubscription"
          :is-rule-expanded="isRuleExpanded"
          :is-advanced-mode="isAdvancedMode"
          :group-modes="groupModes"
          :custom-keyword="customKeyword"
          :selected-rules="selectedRules"
          :preset-regions="presetRegions"
          :preset-protocols="presetProtocols"
          :preset-keywords="presetKeywords"
          :exclude-rule-state="excludeRuleState"
          :toggle-tag="toggleTag"
          :is-selected="isSelected"
          :add-custom-keyword="addCustomKeyword"
          :remove-rule="removeRule"
          :switch-to-advanced="switchToAdvanced"
          :switch-to-visual="switchToVisual"
          @toggle-expand="isRuleExpanded = !isRuleExpanded"
          @update:group-mode="setGroupMode"
          @update:custom-keyword="customKeyword = $event"
        />

        <AdvancedOptions :editing-subscription="editingSubscription" />
      </div>
    </template>
  </Modal>
</template>

 
