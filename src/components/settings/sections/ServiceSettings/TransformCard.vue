<script setup>
import { computed } from 'vue';
import Switch from '@/components/ui/Switch.vue';
import Input from '@/components/ui/Input.vue';
import SectionHeader from '../../SectionHeader.vue';

const props = defineProps({
  settings: {
    type: Object,
    required: true
  }
});

if (!Object.prototype.hasOwnProperty.call(props.settings, 'externalTemplateEnabled')) {
  props.settings.externalTemplateEnabled =
    ['custom', 'preset'].includes(props.settings.transformConfigMode)
    && Boolean(String(props.settings.transformConfig || '').trim());
}

const externalTemplateEnabled = computed({
  get: () => props.settings.externalTemplateEnabled === true,
  set: (enabled) => {
    props.settings.externalTemplateEnabled = enabled;
    props.settings.transformConfigMode = enabled ? 'custom' : 'builtin';
  }
});
</script>

<template>
  <div class="rounded-xl border border-gray-100/80 bg-white/90 p-6 shadow-xs dark:border-white/10 dark:bg-gray-900/70">
    <SectionHeader title="外部规则模板" description="默认使用 MiSub 内置基础模板。启用并填写外部 URL 后才会替换内置模板。" tone="purple">
      <template #icon>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </template>
    </SectionHeader>

    <div class="mt-5 space-y-4">
      <div class="flex items-center justify-between rounded-lg border border-gray-200/70 bg-gray-50/70 p-4 dark:border-white/10 dark:bg-white/5">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-200">启用外部模板</p>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">关闭或未填写 URL 时，使用内置基础模板</p>
        </div>
        <Switch v-model="externalTemplateEnabled" />
      </div>

      <div>
        <Input
          label="外部模板 URL"
          v-model="settings.transformConfig"
          placeholder="https://example.com/config.ini"
          type="url"
        />
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          需要填写可访问的 `.ini` 模板地址，并打开上面的开关才会生效。
        </p>
      </div>
    </div>
  </div>
</template>
