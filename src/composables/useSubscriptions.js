// FILE: src/composables/useSubscriptions.js
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useDataStore } from '../stores/useDataStore';
import { useToastStore } from '../stores/toast.js';
import { fetchNodeCount } from '../lib/api.js';
import { handleError } from '../utils/errorHandler.js';
import { TIMING } from '../constants/timing.js';

const isDev = import.meta.env.DEV;

export function useSubscriptions(markDirty) {
  const { showToast } = useToastStore();
  const dataStore = useDataStore();
  // Rename the store ref to avoid confusion, as it contains ALL items
  const { subscriptions: allSubscriptions } = storeToRefs(dataStore);

  // Filtered computed property: Only http/https links are "Subscriptions"
  const subscriptions = computed(() => {
    return (allSubscriptions.value || []).filter(sub => sub.url && /^https?:\/\//.test(sub.url));
  });

  const subsCurrentPage = ref(1);
  const subsItemsPerPage = 6;

  const enabledSubscriptions = computed(() => subscriptions.value.filter(s => s.enabled));

  const totalRemainingTraffic = computed(() => {
    const REASONABLE_TRAFFIC_LIMIT_BYTES = 10 * 1024 * 1024 * 1024 * 1024 * 1024; // 10 PB in bytes
    return subscriptions.value.reduce((acc, sub) => {
      if (
        sub.enabled &&
        sub.userInfo &&
        sub.userInfo.total > 0 &&
        sub.userInfo.total < REASONABLE_TRAFFIC_LIMIT_BYTES
      ) {
        const used = (sub.userInfo.upload || 0) + (sub.userInfo.download || 0);
        const remaining = sub.userInfo.total - used;
        return acc + Math.max(0, remaining);
      }
      return acc;
    }, 0);
  });

  const subsTotalPages = computed(() => Math.ceil(subscriptions.value.length / subsItemsPerPage));
  const paginatedSubscriptions = computed(() => {
    const start = (subsCurrentPage.value - 1) * subsItemsPerPage;
    const end = start + subsItemsPerPage;
    // Use the filtered list for pagination
    return subscriptions.value.slice(start, end);
  });

  function changeSubsPage(page) {
    if (page < 1 || page > subsTotalPages.value) return;
    subsCurrentPage.value = page;
  }

  async function handleUpdateNodeCount(subId, isInitialLoad = false) {
    // Find in the filtered list
    const subToUpdate = subscriptions.value.find(s => s.id === subId);
    if (!subToUpdate) return { success: false, error: '订阅不存在' };
    // Double check URL just in case
    if (!subToUpdate.url.startsWith('http')) return { success: false, error: '无效的订阅链接' };

    if (!isInitialLoad) {
      subToUpdate.isUpdating = true;
    }

    // 添加超时保护:如果30秒后仍在更新状态,强制重置
    const timeoutId = setTimeout(() => {
      if (subToUpdate.isUpdating) {
        console.warn(`[handleUpdateNodeCount] Timeout protection triggered for ${subToUpdate.name}`);
        subToUpdate.isUpdating = false;
        if (!isInitialLoad) {
          showToast(`${subToUpdate.name || '订阅'} 更新超时,已自动重置`, 'warning');
        }
      }
    }, TIMING.REQUEST_TIMEOUT_MS);

    try {
      const result = await fetchNodeCount(
        subToUpdate.url,
        subToUpdate.fetchProxy,
        Boolean(subToUpdate.plusAsSpace),
        subToUpdate.customUserAgent
      );

      // 清除超时保护
      clearTimeout(timeoutId);

                // 检查是否成功
                if (!result.success) {
                    let userMessage = `${subToUpdate.name || '订阅'} 更新失败`;

                    // 根据 errorType 提供更友好的错误提示
                    switch (result.errorType) {
                        case 'timeout':
                            userMessage = `${subToUpdate.name || '订阅'} 更新超时,请稍后重试`;
                            break;
                        case 'network':
                            userMessage = `${subToUpdate.name || '订阅'} 网络连接失败`;
                            break;
                        case 'server':
                            userMessage = `${subToUpdate.name || '订阅'} 服务器错误`;
                            break;
                        default:
                            userMessage = `${subToUpdate.name || '订阅'} 更新失败: ${result.error || '未知错误'}`;
                    }

                    // 只有非静默加载时才显示 Toast
                    if (!isInitialLoad) showToast(userMessage, 'error');
                    console.error(`[handleUpdateNodeCount] Failed for ${subToUpdate.name}:`, result.error);

                    // 重要: 记录错误到本地对象中(非持久化,仅用于UI展示,直到下次持久化保存)
                    subToUpdate.lastError = result.error;
                    return { success: false, error: result.error || userMessage }; // 失败时不更新 nodeCount,保留旧值
                }

                // 成功获取数据
                const data = result.data.data || result.data; // 兼容后端返回结构
                subToUpdate.nodeCount = data.count || 0;
                subToUpdate.userInfo = data.userInfo || null;
                subToUpdate.lastError = null; // 成功后清除错误状态

                if (!isInitialLoad) {
                    showToast(`${subToUpdate.name || '订阅'} 更新成功！`, 'success');
                    markDirty();
                    // 自动保存手动更新的结果
                    void dataStore.saveData();
                }
                return { success: true };
    } catch (error) {
      // 清除超时保护
      clearTimeout(timeoutId);

      handleError(error, 'Subscription Update Error', {
        subscriptionName: subToUpdate.name,
        subscriptionId: subId,
        isInitialLoad
      });

      const errorMessage = `${subToUpdate.name || '订阅'} 更新过程中发生错误`;
      if (!isInitialLoad) {
        showToast(errorMessage, 'error');
      }
      return { success: false, error: error.message || errorMessage };
    } finally {
      if (subToUpdate) subToUpdate.isUpdating = false;
    }
  }

  function addSubscription(sub) {
    dataStore.addSubscription(sub);
    subsCurrentPage.value = 1;
    handleUpdateNodeCount(sub.id);
    markDirty();
  }

  function updateSubscription(updatedSub) {
    // Verify it exists in our filtered list
    const originalSub = subscriptions.value.find(s => s.id === updatedSub.id);
    if (originalSub) {
      const urlChanged = originalSub.url !== updatedSub.url;
      dataStore.updateSubscription(updatedSub.id, updatedSub);

      if (urlChanged) {
        // Re-fetch from filtered list to get the reactive object
        const sub = subscriptions.value.find(s => s.id === updatedSub.id);
        if (sub) {
          sub.nodeCount = 0;
          handleUpdateNodeCount(sub.id);
        }
      }
      markDirty();
    }
  }

  function deleteSubscription(subId) {
    dataStore.removeSubscription(subId);
    // 清理组合订阅中对该订阅源的引用
    dataStore.removeSubscriptionFromProfiles(subId);
    if (paginatedSubscriptions.value.length === 0 && subsCurrentPage.value > 1) {
      subsCurrentPage.value--;
    }
    markDirty();
  }

  function deleteAllSubscriptions() {
    // Only remove the subscriptions visible in this composable (i.e. HTTP subs)
    // Avoid removing manual nodes which are also in dataStore but filtered out here
    const idsToRemove = subscriptions.value.map(s => s.id);

    // 如果没有订阅，提示并返回
    if (idsToRemove.length === 0) {
      showToast('没有可删除的订阅', 'info');
      return;
    }

    idsToRemove.forEach(id => dataStore.removeSubscription(id));
    // 清理组合订阅中对这些订阅源的引用
    dataStore.removeSubscriptionFromProfiles(idsToRemove);

    subsCurrentPage.value = 1;
    markDirty();
    showToast(`已清空 ${idsToRemove.length} 个订阅`, 'success');
  }

  async function addSubscriptionsFromBulk(subs) {
    // Reverse insert to maintain order
    for (let i = subs.length - 1; i >= 0; i--) {
      dataStore.addSubscription(subs[i]);
    }
    markDirty();

    const subsToUpdate = subs.filter(sub => sub.url && sub.url.startsWith('http'));

    if (subsToUpdate.length > 0) {
      showToast(`正在批量更新 ${subsToUpdate.length} 个订阅...`, 'info');

      // Use individual updates instead of batch backend update
      // This avoids 400 error because backend doesn't have these IDs yet.
      const updatePromises = subsToUpdate.map(sub => handleUpdateNodeCount(sub.id));

      try {
        await Promise.allSettled(updatePromises);
        showToast('批量导入并更新完成！', 'success');
      } catch (e) {
        console.error("Batch update finished with some errors");
      }
    } else {
      showToast('批量导入完成！', 'success');
    }
  }

  async function batchUpdateAllSubscriptions() {
    const subsToUpdate = subscriptions.value.filter(sub =>
      sub.enabled && sub.url && sub.url.startsWith('http') && !sub.isUpdating
    );

    if (subsToUpdate.length === 0) {
      showToast('没有可刷新的订阅', 'info');
      return;
    }

    subsToUpdate.forEach(sub => { sub.isUpdating = true; });
    showToast(`正在刷新 ${subsToUpdate.length} 个订阅...`, 'info');

    try {
      // Use the individual refresh endpoint, which returns both the node count
      // and traffic information and persists the result on the server.
      const results = [];
      for (const sub of subsToUpdate) {
        results.push({
          name: sub.name || '订阅',
          ...await handleUpdateNodeCount(sub.id, true)
        });
      }

      const successCount = results.filter(result => result.success).length;
      const failedResults = results.filter(result => !result.success);
      if (failedResults.length === 0) {
        showToast(`全部刷新完成：成功 ${successCount}/${subsToUpdate.length}`, 'success');
      } else {
        const failureDetails = failedResults
          .map(result => `${result.name}（${result.error || '未知错误'}）`)
          .join('；');
        const status = successCount > 0 ? 'warning' : 'error';
        showToast(`全部刷新完成：成功 ${successCount}/${subsToUpdate.length}，失败 ${failedResults.length}。${failureDetails}`, status);
      }
    } catch (error) {
      handleError(error, 'Batch Subscription Update Error', { subscriptionCount: subsToUpdate.length });
      showToast(`全部刷新失败：${error.message || '未知错误'}`, 'error');
    } finally {
      subsToUpdate.forEach(sub => { sub.isUpdating = false; });
    }
  }

  function reorderSubscriptions(newOrder) {
    // 1. Get all Manual Nodes (to preserve them)
    // We can't rely just on manualNodes computed because it might be filtered or not imported here.
    // Instead, filter from source of truth: allSubscriptions
    const currentManualNodes = (allSubscriptions.value || []).filter(item => !item.url || !/^https?:\/\//.test(item.url));

    // 2. Combine New Ordered Subscriptions + Existing Manual Nodes
    // Logic: Manual Nodes at top, Subscriptions at bottom
    const mergedList = [...currentManualNodes, ...newOrder];

    // 3. Update Store
    dataStore.overwriteSubscriptions(mergedList);

    // 4. Mark Dirty
    markDirty();
  }

  return {
    subscriptions,
    subsCurrentPage,
    subsTotalPages,
    paginatedSubscriptions,
    totalRemainingTraffic,
    enabledSubscriptionsCount: computed(() => enabledSubscriptions.value.length),
    changeSubsPage,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    deleteAllSubscriptions,
    addSubscriptionsFromBulk,
    handleUpdateNodeCount,
    batchUpdateAllSubscriptions,
    reorderSubscriptions,
  };
}
