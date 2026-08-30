<script setup>
import SectionHeader from '../SectionHeader.vue';
const props = defineProps({
  settings: {
    type: Object,
    required: true
  }
});

import Input from '../../ui/Input.vue';
import Switch from '../../ui/Switch.vue';
import { watch, computed } from 'vue';
import { useToastStore } from '../../../stores/toast';

const { showToast } = useToastStore();

// 系统保留路径列表，这些路径会与前端路由或后端 API 冲突
const RESERVED_PATHS = [
  'settings', 'login', 'groups', 'nodes', 'subscriptions', 'dashboard',
  'api', 'explore', 'sub', 'cron', 'assets', '@vite', 'public', 'profile', 'offline',
  'logout', 'auth_debug', 'auth_check', 'data', 'kv_test',
  'clients', 'system', 'github', 'telegram', 'test_notification',
  'misubs', 'node_count', 'fetch_external_url', 'batch_update_nodes',
  'subscription_nodes', 'debug_subscription', 'preview'
];

const getPathSegment = (value) => value.replace(/^\/+/, '').split('/')[0].toLowerCase();

const myTokenError = computed(() => {
  const value = props.settings.mytoken;
  if (!value) return '';

  const pathSegment = getPathSegment(value);
  return RESERVED_PATHS.includes(pathSegment) ? '系统保留路径不可用作自定义订阅 Token' : '';
});

const profileTokenError = computed(() => {
  const value = props.settings.profileToken;
  if (!value) return '';

  const pathSegment = getPathSegment(value);
  return RESERVED_PATHS.includes(pathSegment) ? '系统保留路径不可用作订阅组分享 Token' : '';
});

watch(() => props.settings.mytoken, (val) => {
  if (!val) return;
  const pathSegment = getPathSegment(val);
  if (RESERVED_PATHS.includes(pathSegment)) {
    showToast('系统保留路径不可用作自定义订阅Token', 'error');
  }
});

watch(() => props.settings.profileToken, (val) => {
  if (!val) return;
  const pathSegment = getPathSegment(val);
  if (RESERVED_PATHS.includes(pathSegment)) {
    showToast('系统保留路径不可用作订阅组分享Token', 'error');
  }
});


</script>

<template>
  <div class="space-y-8">
    <!-- 订阅基本信息配置 -->
    <div class="rounded-xl border border-gray-100/80 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-gray-900/70">
      <SectionHeader title="订阅配置" description="统一管理订阅文件名、订阅 Token 和订阅组分享链接规则。" tone="indigo">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </template>
      </SectionHeader>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <Input 
            label="自定义订阅文件名"
            v-model="settings.FileName"
            class="misub-radius-lg"
          />
        </div>
        <div>
          <Input 
            label="自定义订阅Token"
            v-model="settings.mytoken"
            :error="myTokenError"
            class="misub-radius-lg"
          />
        </div>
        <div>
          <Input 
            label="订阅组分享Token"
            v-model="settings.profileToken"
            placeholder="用于生成订阅组链接专用Token"
            :error="profileTokenError"
            class="misub-radius-lg"
          />
        </div>
      </div>
    </div>

    <!-- 功能开关区域 -->
    <div class="rounded-xl border border-gray-100/80 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-gray-900/70">
      <SectionHeader title="功能控制" description="统一管理订阅自动更新和流量统计功能。" tone="green">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </template>
      </SectionHeader>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 订阅自动更新间隔 -->
        <div
          class="p-4 bg-white/70 dark:bg-gray-900/50 border border-gray-200/70 dark:border-white/10 misub-radius-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-200">订阅自动更新间隔</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">页面打开时自动刷新订阅节点数和流量</p>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-3">
            <div class="flex items-center gap-2">
              <input
                type="number"
                :value="![0, 30, 60, 120].includes(settings.autoUpdateInterval) ? settings.autoUpdateInterval : ''"
                @input="e => { const v = parseInt(e.target.value); if (v >= 5) settings.autoUpdateInterval = v; }"
                placeholder="自定义"
                min="5"
                class="w-24 px-2.5 py-2 text-sm bg-white/70 dark:bg-black/20 border border-gray-200/80 dark:border-white/10 misub-radius-md text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all"
              >
              <span class="text-xs text-gray-500 dark:text-gray-400">分钟</span>
            </div>
            <span class="text-xs text-gray-400 dark:text-gray-500 self-center">快捷选择</span>
            <button
              v-for="option in [
                { value: 0, label: '禁用' },
                { value: 30, label: '30分钟' },
                { value: 60, label: '1小时' }
              ]"
              :key="option.value"
              @click="settings.autoUpdateInterval = option.value"
              :aria-pressed="settings.autoUpdateInterval === option.value"
              :class="[
                'px-3 py-2 text-xs font-medium misub-radius-md border transition-colors',
                settings.autoUpdateInterval === option.value
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-500/30'
                  : 'bg-white/70 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200/70 dark:border-white/10 hover:bg-white dark:hover:bg-gray-800'
              ]"
            >
              {{ option.label }}
            </button>
          </div>
          <p v-if="settings.autoUpdateInterval === 0" class="text-xs text-amber-600 dark:text-amber-400 mt-2">
            ⚠️ 自动更新已禁用，订阅信息需手动刷新
          </p>
        </div>

        <!-- 流量统计节点 -->
        <div
          class="flex items-center justify-between p-4 bg-white/70 dark:bg-gray-900/50 border border-gray-200/70 dark:border-white/10 misub-radius-lg">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-200">显示流量统计节点</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">在订阅中生成虚拟节点显示剩余流量</p>
          </div>
          <Switch
            v-model="settings.enableTrafficNode"
          />
        </div>
      </div>
    </div>



  </div>
</template>

<style scoped>
/* Toggle Switch CSS */


.animate-fade-in-down {
  animation: fadeInDown 0.3s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
