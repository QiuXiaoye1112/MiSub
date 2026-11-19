import { describe, it, expect } from 'vitest';
import { validateSS2022Node, fixSS2022Node } from '../../functions/modules/utils/ss2022-validator.js';

describe('ss2022-validator', () => {
    it('accepts SIP022 plain method:password with colon-separated server:user 32-byte keys', () => {
        const url = 'ss://2022-blake3-aes-256-gcm:PYO0OMHeCny1V%2BpfA1M1CWvISpASYP81JF5QmhCEZpo%3D%3AJe7aoY9yW19kvQoTRhcPoc6Ub8rfrNh8gYkZaShE%2Fas%3D@dmit.20061112.xyz:2053/?plugin=obfs-local%3Bobfs%3Dhttp%3Bobfs-host%3Dwww.amd.com#SS2022-Ethan';
        expect(validateSS2022Node(url)).toEqual({ valid: true });
    });

    it('accepts 2022-blake3-chacha20-poly1305 with 32-byte key', () => {
        const key32 = btoa('a'.repeat(32));
        const url = `ss://2022-blake3-chacha20-poly1305:${encodeURIComponent(key32)}@example.com:443#ChaCha2022`;
        expect(validateSS2022Node(url)).toEqual({ valid: true });
    });

    it('detects mismatched key length in SIP022 plain format and fixes preserving plain encoding', () => {
        const key16 = btoa('a'.repeat(16));
        const url = `ss://2022-blake3-aes-256-gcm:${encodeURIComponent(key16)}@example.com:443/?plugin=obfs-local#BadCipher`;
        const validation = validateSS2022Node(url);
        expect(validation.valid).toBe(false);
        expect(validation.details?.suggestedCipher).toBe('2022-blake3-aes-128-gcm');

        const fixed = fixSS2022Node(url);
        expect(fixed.fixed).toBe(true);
        expect(fixed.fixedUrl).toContain('ss://2022-blake3-aes-128-gcm:');
        expect(fixed.fixedUrl).toContain('@example.com:443/?plugin=obfs-local#BadCipher');
        expect(validateSS2022Node(fixed.fixedUrl)).toEqual({ valid: true });
    });

    it('supports Base64-encoded userinfo even when fragment or query contains @', () => {
        const key32 = btoa('b'.repeat(32));
        const userinfoB64 = btoa(`2022-blake3-aes-256-gcm:${key32}`);
        const url = `ss://${userinfoB64}@example.com:443/?foo=bar@baz#name@node`;
        expect(validateSS2022Node(url)).toEqual({ valid: true });
    });
});
