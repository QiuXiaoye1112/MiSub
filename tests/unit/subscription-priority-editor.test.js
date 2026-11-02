import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import SubscriptionEditModal from '../../src/components/modals/SubscriptionEditModal.vue';

function editor(exclude = '') {
    const subscription = { id: 's1', name: 'Test', url: 'https://example.com', exclude };
    const wrapper = mount(SubscriptionEditModal, {
        props: { show: true, editingSubscription: subscription },
        global: { plugins: [createPinia()], stubs: {
            Modal: { template: `<div><slot name="body" /><button data-testid="confirm" @click="$emit('confirm')">确认</button></div>` }, EditForm: true, AdvancedOptions: true
        } }
    });
    return { wrapper, subscription };
}
const button = (wrapper, text) => wrapper.findAll('button').find(b => b.text().trim() === text);

describe('subscription priority editor', () => {
    it('saves independent modes and restores them on reopening', async () => {
        const { wrapper, subscription } = editor();
        await wrapper.get('label').trigger('click');
        await button(wrapper, 'GB').trigger('click');
        await wrapper.get('[aria-label="关键词包含"]').trigger('click');
        await button(wrapper, 'Trojan').trigger('click');
        expect(subscription.exclude).toBe('keyword:keep:GB\nprotocol:exclude:trojan');
        expect(wrapper.text()).toContain('GB · 包含');
        expect(wrapper.text()).toContain('Trojan · 排除');
        wrapper.unmount();
        const reopened = editor(subscription.exclude);
        expect(reopened.wrapper.get('[aria-label="关键词包含"]').attributes('aria-pressed')).toBe('true');
        expect(reopened.wrapper.get('[aria-label="协议排除"]').attributes('aria-pressed')).toBe('true');
        expect(reopened.subscription.exclude).toBe(subscription.exclude);
        reopened.wrapper.unmount();
    });
    it('preserves legacy text until edited and round-trips advanced mode', async () => {
        const { wrapper, subscription } = editor('keep:proto:trojan\nkeep:GB');
        expect(subscription.exclude).toBe('keep:proto:trojan\nkeep:GB');
        await wrapper.get('label').trigger('click');
        await wrapper.get('[aria-label="协议排除"]').trigger('click');
        expect(subscription.exclude).toBe('protocol:exclude:trojan\nkeyword:keep:GB');
        await button(wrapper, '高级模式').trigger('click');
        expect(wrapper.get('textarea').element.value).toBe(subscription.exclude);
        await wrapper.get('textarea').setValue('keyword:exclude:GB\nregion:keep:US');
        await button(wrapper, '可视化模式').trigger('click');
        expect(wrapper.get('[aria-label="关键词排除"]').attributes('aria-pressed')).toBe('true');
        expect(wrapper.get('[aria-label="地区包含"]').attributes('aria-pressed')).toBe('true');
        wrapper.unmount();
    });
    it('converts visual legacy selections when confirmed', async () => {
        const { wrapper, subscription } = editor('keep:GB\nproto:trojan');
        expect(subscription.exclude).toBe('keep:GB\nproto:trojan');
        await wrapper.get('[data-testid="confirm"]').trigger('click');
        expect(subscription.exclude).toBe('keyword:keep:GB\nprotocol:exclude:trojan');
        expect(wrapper.emitted('confirm')).toHaveLength(1);
        wrapper.unmount();
    });
    it('keeps malformed or mixed rules in advanced mode', () => {
        const { wrapper, subscription } = editor('keyword:keep:GB\nproto:trojan');
        expect(wrapper.find('textarea').exists()).toBe(true);
        expect(wrapper.text()).toContain('不能混用旧规则');
        expect(subscription.exclude).toBe('keyword:keep:GB\nproto:trojan');
        wrapper.unmount();
    });
});
