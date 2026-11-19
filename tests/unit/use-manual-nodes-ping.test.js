import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useManualNodes } from '../../src/composables/useManualNodes.js';
import { pingNode, pingNodeViaServer } from '../../src/utils/ping.js';

vi.mock('../../src/stores/toast.js', () => ({
  useToastStore: () => ({ showToast: vi.fn() })
}));

vi.mock('../../src/utils/ping.js', () => ({
  pingNode: vi.fn(),
  pingNodeViaServer: vi.fn()
}));

describe('useManualNodes pingNodeId fallback', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('falls back to pingNodeViaServer when browser pingNode times out', async () => {
    pingNode.mockResolvedValue({ status: 'timeout', latency: 3000 });
    pingNodeViaServer.mockResolvedValue({ status: 'ok', latency: 142, via: 'server' });

    const { addNode, pingNodeId, pingResults } = useManualNodes(vi.fn());
    addNode({
      id: 'ss-obfs-1',
      name: 'SS2022-Ethan',
      url: 'ss://2022-blake3-aes-256-gcm:PYO0OMHeCny1V%2BpfA1M1CWvISpASYP81JF5QmhCEZpo%3D%3AJe7aoY9yW19kvQoTRhcPoc6Ub8rfrNh8gYkZaShE%2Fas%3D@dmit.20061112.xyz:2053/?plugin=obfs-local%3Bobfs%3Dhttp%3Bobfs-host%3Dwww.amd.com#SS2022-Ethan',
      enabled: true
    });

    await pingNodeId('ss-obfs-1');

    expect(pingNode).toHaveBeenCalledWith('dmit.20061112.xyz', '2053', 3000);
    expect(pingNodeViaServer).toHaveBeenCalledWith('dmit.20061112.xyz', '2053', 3000);
    expect(pingResults.value['ss-obfs-1']).toEqual({ status: 'ok', latency: 142, via: 'server' });
  });

  it('keeps timeout result when pingNodeViaServer also fails or times out', async () => {
    pingNode.mockResolvedValue({ status: 'timeout', latency: 3000 });
    pingNodeViaServer.mockResolvedValue({ status: 'timeout', latency: 3000, via: 'server' });

    const { addNode, pingNodeId, pingResults } = useManualNodes(vi.fn());
    addNode({
      id: 'ss-obfs-2',
      name: 'TimeoutNode',
      url: 'ss://YWVzLTEyOC1nY206cGFzc3dvcmQ=@1.2.3.4:2053/?plugin=obfs-local%3Bobfs%3Dhttp#TimeoutNode',
      enabled: true
    });

    await pingNodeId('ss-obfs-2');

    expect(pingResults.value['ss-obfs-2']).toEqual({ status: 'timeout', latency: 3000 });
  });
});
