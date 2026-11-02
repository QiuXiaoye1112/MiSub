import { describe, expect, it } from 'vitest';
import { compilePriorityFilter, parsePriorityRules, serializePriorityRules } from '../../src/shared/priority-rules.js';

const nodes = [
    { protocol: 'trojan', name: 'US 100 GB' },
    { protocol: 'trojan', name: 'HK 50 GB' },
    { protocol: 'trojan', name: 'US ordinary' },
    { protocol: 'trojan', name: 'HK ordinary' },
    { protocol: 'anytls', name: 'US AnyTLS' },
    { protocol: 'anytls', name: 'HK AnyTLS' }
];
const filter = text => nodes.filter(compilePriorityFilter(text)).map(node => node.name);

describe('category priority rules', () => {
    it('keeps GB exceptions while excluding the rest of the protocol', () => {
        expect(filter('keyword:keep:GB\nprotocol:exclude:trojan')).toEqual(['US 100 GB', 'HK 50 GB', 'US AnyTLS', 'HK AnyTLS']);
    });
    it('applies keyword > region > protocol regardless of text order', () => {
        expect(filter('protocol:exclude:trojan\nregion:exclude:US\nkeyword:keep:GB')).toEqual(['US 100 GB', 'HK 50 GB', 'HK AnyTLS']);
    });
    it('lets keyword exclusions override region and protocol inclusions', () => {
        expect(filter('keyword:exclude:GB\nregion:keep:US\nprotocol:keep:trojan')).toEqual(['US ordinary', 'HK ordinary', 'US AnyTLS']);
    });
    it('lets region exclusions override protocol inclusion', () => {
        expect(filter('region:exclude:US\nprotocol:keep:trojan')).toEqual(['HK 50 GB', 'HK ordinary']);
    });
    it('supports keyword-only include and exclude defaults', () => {
        expect(filter('keyword:keep:GB')).toEqual(['US 100 GB', 'HK 50 GB']);
        expect(filter('keyword:exclude:GB')).toEqual(['US ordinary', 'HK ordinary', 'US AnyTLS', 'HK AnyTLS']);
    });
    it('supports multiple patterns within one category', () => {
        expect(filter('keyword:keep:100 GB\nkeyword:keep:50 GB\nprotocol:exclude:trojan')).toEqual(['US 100 GB', 'HK 50 GB', 'US AnyTLS', 'HK AnyTLS']);
    });
    it('recognizes protocol aliases and regions on parsed nodes', () => {
        const match = compilePriorityFilter('region:exclude:香港\nprotocol:keep:ss');
        expect(match({ protocol: 'shadowsocks', name: 'a', region: '香港' })).toBe(false);
        expect(match({ protocol: 'shadowsocks', name: 'b', region: '美国' })).toBe(true);
    });
    it('round-trips category modes and custom keyword patterns', () => {
        const text = serializePriorityRules([{ type: 'custom', pattern: 'GB' }, { type: 'protocol', pattern: 'proto:trojan' }], { keyword: 'keep', protocol: 'exclude' });
        expect(parsePriorityRules(text)).toEqual({ keyword: { mode: 'keep', patterns: ['GB'] }, protocol: { mode: 'exclude', patterns: ['trojan'] } });
    });
    it('leaves legacy rules to the legacy engine', () => {
        expect(compilePriorityFilter('proto:trojan\n---\nkeep:GB')).toBeNull();
        expect(compilePriorityFilter('')).toBeNull();
    });
    it.each(['keyword:keep:[', 'protocol:keep:', 'keyword:keep:GB\nproto:trojan', 'region:include:US', 'keyword:keep:GB\nkeyword:exclude:US'])('rejects invalid or ambiguous rules: %s', text => {
        expect(() => compilePriorityFilter(text)).toThrow();
    });
});
