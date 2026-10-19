import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import MySubscriptionsView from '../../src/views/MySubscriptionsView.vue';
import Dashboard from '../../src/components/features/Dashboard/Dashboard.vue';
import ProfilePanel from '../../src/components/profiles/ProfilePanel.vue';
import ProfileCard from '../../src/components/profiles/ProfileCard.vue';
import { useDataStore } from '../../src/stores/useDataStore.js';
import { api } from '../../src/lib/http.js';

vi.mock('../../src/lib/http.js', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

let wrapper;
afterEach(() => {
  wrapper?.unmount();
  vi.restoreAllMocks();
});

for (const [layout, component] of [['modern', MySubscriptionsView], ['legacy', Dashboard]]) {
  describe(`${layout} profile sorting`, () => {
    it('enters sorting, moves profiles across page boundaries, and saves the new order', async () => {
      const pinia = createPinia();
      setActivePinia(pinia);
      const store = useDataStore();
      store.profiles = Array.from({ length: 8 }, (_, i) => ({
        id: `p${i}`, name: `Profile ${i}`, enabled: true, subscriptions: [], manualNodes: []
      }));
      vi.spyOn(store, 'fetchData').mockResolvedValue();
      wrapper = shallowMount(component, {
        global: { plugins: [pinia], stubs: { ProfilePanel: false, ProfileCard: false } }
      });
      await flushPromises();
      const panel = wrapper.findComponent(ProfilePanel);
      const sortButton = () => panel.findAll('button').find(b => /^(手动排序|完成排序)$/.test(b.text()));
      expect(panel.findAllComponents(ProfileCard)).toHaveLength(layout === 'modern' ? 6 : 8);
      expect(panel.findAll('button[title="上移"]')).toHaveLength(0);
      await sortButton().trigger('click');
      expect(panel.findAllComponents(ProfileCard)).toHaveLength(8);
      expect(panel.find('button[title="上移"]').attributes('disabled')).toBeDefined();
      expect(panel.findAll('button[title="下移"]').at(-1).attributes('disabled')).toBeDefined();
      await panel.findAllComponents(ProfileCard)[6].find('button[title="上移"]').trigger('click');
      expect(store.profiles.map(p => p.id)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p6', 'p5', 'p7']);
      expect(store.isDirty).toBe(true);
      await sortButton().trigger('click');
      expect(panel.findAll('button[title="上移"]')).toHaveLength(0);
      api.post.mockResolvedValue({ success: true });
      await store.saveData();
      expect(api.post).toHaveBeenLastCalledWith('/api/misubs', expect.objectContaining({
        profiles: expect.arrayContaining([expect.objectContaining({ id: 'p6' })])
      }));
      expect(api.post.mock.calls.at(-1)[1].profiles.map(p => p.id)).toEqual(store.profiles.map(p => p.id));
      expect(store.isDirty).toBe(false);
    });
  });
}
