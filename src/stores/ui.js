import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const isSettingsModalVisible = ref(false);
  const layoutMode = ref('modern');

  function show() {
    isSettingsModalVisible.value = true;
  }

  function hide() {
    isSettingsModalVisible.value = false;
  }

  return { isSettingsModalVisible, layoutMode, show, hide };
});
