import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleNodePingRequest, isAllowedPingHost } from '../../functions/modules/handlers/node-handler.js';
import { pingNode, pingNodeViaServer } from '../../src/utils/ping.js';

describe('node ping handler & client fallback', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    describe('SSRF protection in isAllowedPingHost', () => {
        it('rejects localhost, internal names, private IPv4 and reserved IPv6', () => {
            const blockedHosts = [
                '',
                'localhost',
                'api.localhost',
                'metadata.google.internal',
                'printer.local',
                'internalhost',
                '127.0.0.1',
                '10.0.0.1',
                '169.254.169.254',
                '172.16.0.5',
                '192.168.1.1',
                '0.0.0.0',
                '::1',
                '[::1]',
                'fe80::1',
                'fc00::1',
                '::ffff:127.0.0.1',
                '1.2.3.4/path',
                '1.2.3.4@evil.com'
            ];

            for (const host of blockedHosts) {
                expect(isAllowedPingHost(host)).toBe(false);
            }
        });

        it('allows public domains and public IPv4/IPv6 addresses', () => {
            expect(isAllowedPingHost('dmit.20061112.xyz')).toBe(true);
            expect(isAllowedPingHost('179.255.145.43')).toBe(true);
            expect(isAllowedPingHost('[2001:4860:4860::8888]')).toBe(true);
            expect(isAllowedPingHost('2606:4700:4700::1111')).toBe(true);
        });
    });

    describe('handleNodePingRequest', () => {
        it('rejects non-POST requests and invalid ports or blocked hosts', async () => {
            const getRes = await handleNodePingRequest(new Request('https://example.com/api/nodes/ping', { method: 'GET' }));
            expect(getRes.status).toBe(405);

            const ssrfRes = await handleNodePingRequest(new Request('https://example.com/api/nodes/ping', {
                method: 'POST',
                body: JSON.stringify({ host: '127.0.0.1', port: 2053 })
            }));
            expect(ssrfRes.status).toBe(400);

            const badPortRes = await handleNodePingRequest(new Request('https://example.com/api/nodes/ping', {
                method: 'POST',
                body: JSON.stringify({ host: 'dmit.20061112.xyz', port: 70000 })
            }));
            expect(badPortRes.status).toBe(400);
        });

        it('returns status ok when obfs HTTP port closes socket without full HTTP response', async () => {
            globalThis.fetch = vi.fn().mockRejectedValue(
                Object.assign(new TypeError('fetch failed'), {
                    cause: Object.assign(new Error('other side closed'), { code: 'UND_ERR_SOCKET' })
                })
            );

            const res = await handleNodePingRequest(new Request('https://example.com/api/nodes/ping', {
                method: 'POST',
                body: JSON.stringify({ host: 'dmit.20061112.xyz', port: 2053, timeoutMs: 3000 })
            }));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.status).toBe('ok');
            expect(data.via).toBe('server');
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringMatching(/^http:\/\/dmit\.20061112\.xyz:2053\/__ping_/),
                expect.objectContaining({ method: 'GET', redirect: 'manual' })
            );
        });

        it('brackets IPv6 hosts and classifies ECONNREFUSED vs AbortError properly', async () => {
            globalThis.fetch = vi.fn().mockRejectedValue(
                Object.assign(new TypeError('fetch failed'), {
                    cause: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' })
                })
            );

            const refusedRes = await handleNodePingRequest(new Request('https://example.com/api/nodes/ping', {
                method: 'POST',
                body: JSON.stringify({ host: '2001:4860:4860::8888', port: 443 })
            }));
            const refusedData = await refusedRes.json();
            expect(refusedData.status).toBe('error');
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringMatching(/^http:\/\/\[2001:4860:4860::8888\]:443\/__ping_/),
                expect.any(Object)
            );

            const abortErr = new Error('The operation was aborted');
            abortErr.name = 'AbortError';
            globalThis.fetch = vi.fn().mockRejectedValue(abortErr);

            const timeoutRes = await handleNodePingRequest(new Request('https://example.com/api/nodes/ping', {
                method: 'POST',
                body: JSON.stringify({ host: 'dmit.20061112.xyz', port: 2053, timeoutMs: 1200 })
            }));
            const timeoutData = await timeoutRes.json();
            expect(timeoutData.status).toBe('timeout');
            expect(timeoutData.latency).toBe(1200);
        });
    });

    describe('frontend pingNode & pingNodeViaServer', () => {
        it('brackets IPv6 literals when calling fetch in pingNode', async () => {
            globalThis.window = { location: { protocol: 'https:' } };
            globalThis.fetch = vi.fn().mockResolvedValue({});

            const result = await pingNode('2001:4860:4860::8888', 443, 1000);
            expect(result.status).toBe('ok');
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringMatching(/^https:\/\/\[2001:4860:4860::8888\]:443\/__ping_/),
                expect.any(Object)
            );
        });

        it('posts host and port to /api/nodes/ping with credentials in pingNodeViaServer', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
                status: 'ok',
                latency: 18,
                via: 'server',
                message: '服务端 HTTP 探测连通'
            }), { status: 200 }));

            const result = await pingNodeViaServer('dmit.20061112.xyz', 2053, 3000);
            expect(result).toEqual({
                status: 'ok',
                latency: 18,
                via: 'server',
                message: '服务端 HTTP 探测连通'
            });
            expect(globalThis.fetch).toHaveBeenCalledWith('/api/nodes/ping', expect.objectContaining({
                method: 'POST',
                credentials: 'include'
            }));
        });
    });
});
