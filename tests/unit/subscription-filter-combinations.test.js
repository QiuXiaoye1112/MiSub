import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateCombinedNodeList } from '../../functions/services/subscription-service.js';
import { fetchSubscriptionNodes } from '../../functions/modules/subscription/node-fetcher.js';

const fixtures = [
    ['hysteria2', 'US Hysteria'],
    ['hysteria2', 'HK Hysteria'],
    ['hysteria2', 'HK 100 GB'],
    ['trojan', 'US Trojan'],
    ['trojan', 'HK Trojan']
];
const source = fixtures.map(([protocol, name]) => `${protocol}://pass@example.com:443#${encodeURIComponent(name)}`).join('\n');
const names = text => text.trim().split('\n').filter(Boolean).map(line => decodeURIComponent(line.split('#')[1]));

afterEach(() => vi.unstubAllGlobals());

describe('protocol and country filter combinations', () => {
    it.each([
        ['keyword:keep:GB\nprotocol:exclude:hysteria', ['HK 100 GB', 'US Trojan', 'HK Trojan']],
        ['keyword:keep:GB\nregion:exclude:HK\nprotocol:exclude:hysteria', ['HK 100 GB', 'US Trojan']],
        ['keyword:exclude:GB\nregion:keep:US\nprotocol:keep:hysteria', ['US Hysteria']],
        ['protocol:keep:hysteria\nregion:exclude:HK', ['US Hysteria']],
        ['keep:proto:hysteria\nkeep:(美国|US|USA)', ['US Hysteria']],
        ['keep:proto:hysteria', ['US Hysteria', 'HK Hysteria', 'HK 100 GB']],
        ['keep:(美国|US|USA)', ['US Hysteria', 'US Trojan']],
        ['proto:hysteria\n(美国|US|USA)', ['HK Trojan']],
        ['(香港|HK)\n---\nkeep:proto:hysteria\nkeep:(美国|US|USA)', ['US Hysteria']],
        ['keep:proto:hysteria,trojan\nkeep:(美国|US|USA)', ['US Hysteria', 'US Trojan']],
        ['keep:proto:hysteria\nkeep:(美国|US|USA)\nkeep:(香港|HK)', ['US Hysteria', 'HK Hysteria', 'HK 100 GB']]
    ])('applies %s consistently to preview and subscription output', async (exclude, expected) => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(source, { status: 200 })));
        const preview = await fetchSubscriptionNodes('https://airport.example/sub', 'Fixture', 'ClashMeta', null, false, exclude);
        expect(preview.success).toBe(true);
        expect(preview.nodes.map(node => node.name)).toEqual(expected);

        const result = await generateCombinedNodeList({}, { enableAccessLog: false, enableFlagEmoji: false }, 'ClashMeta', [{
            id: 'filter-fixture', name: 'Fixture', url: 'https://airport.example/sub', enabled: true, exclude
        }], '', { enableSubscriptions: true });
        expect(names(result)).toEqual(expected.map(name => `Fixture - ${name}`));
    });
});


describe('GB exceptions with US AnyTLS constraints', () => {
    const links = [
        ['anytls', 'US AnyTLS'], ['anytls', 'HK AnyTLS'],
        ['trojan', 'US Trojan'], ['trojan', 'HK 100 GB'],
        ['anytls', 'JP 50 GB'], ['anytls', 'US 20 GB']
    ].map(([protocol, name]) => `${protocol}://pass@example.com:443#${encodeURIComponent(name)}`);
    it.each([
        ['keyword:keep:GB\nregion:keep:(美国|US|USA)\nprotocol:keep:anytls', ['US AnyTLS', 'HK 100 GB', 'JP 50 GB', 'US 20 GB']],
        ['region:keep:(美国|US|USA)\nprotocol:keep:anytls', ['US AnyTLS', 'US 20 GB']],
        ['keyword:exclude:GB\nregion:keep:(美国|US|USA)\nprotocol:keep:anytls', ['US AnyTLS']],
        ['region:keep:(美国|US|USA)\nprotocol:exclude:trojan', ['US AnyTLS', 'US 20 GB']],
        ['protocol:keep:anytls\nregion:keep:(美国|US|USA)\nkeyword:keep:GB', ['US AnyTLS', 'HK 100 GB', 'JP 50 GB', 'US 20 GB']]
    ])('filters preview and subscription consistently: %s', async (exclude, expected) => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(links.join('\n'), { status: 200 })));
        const preview = await fetchSubscriptionNodes('https://airport.example/sub', 'Fixture', 'ClashMeta', null, false, exclude);
        expect(preview.success).toBe(true);
        expect(preview.nodes.map(node => node.name)).toEqual(expected);
        const output = await generateCombinedNodeList({}, { enableAccessLog: false, enableFlagEmoji: false }, 'ClashMeta', [{
            id: 'priority-regression', name: 'Fixture', url: 'https://airport.example/sub', enabled: true, exclude
        }], '', { enableSubscriptions: true });
        expect(names(output)).toEqual(expected.map(name => `Fixture - ${name}`));
    });
});
