<script setup>
import SectionHeader from '../SectionHeader.vue';
const props = defineProps({
  settings: {
    type: Object,
    required: true
  }
});

import Input from '../../ui/Input.vue';
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
