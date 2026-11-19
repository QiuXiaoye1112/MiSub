import { describe, it, expect } from 'vitest';
import { generateBuiltinLoonConfig } from '../../functions/modules/subscription/builtin-loon-generator.js';

describe('Loon 内置生成器', () => {
    it('应处理 realityOpts 参数', () => {
        const vless = 'vless://uuid@1.2.3.4:443?type=tcp&security=reality&pbk=pubkey123&sid=shortid#RealityNode';
        const result = generateBuiltinLoonConfig(vless);
        expect(result).toContain('RealityNode = vless');
        expect(result).toContain('reality=true');
        expect(result).toContain('public-key=pubkey123');
        expect(result).toContain('short-id=shortid');
    });

    it('应保留 VLESS flow 参数且不默认跳过证书验证', () => {
        const vless = 'vless://uuid@1.2.3.4:443?type=tcp&security=reality&flow=xtls-rprx-vision&pbk=pubkey123&sid=shortid#RealityFlow';
        const result = generateBuiltinLoonConfig(vless);
        expect(result).toContain('flow=xtls-rprx-vision');
        expect(result).not.toContain('skip-cert-verify=true');
    });

    it('应对重名节点添加 _1 后缀', () => {
        const nodeList = [
            'ss://YWVzLTEyOC1nY206cGFzc3dvcmQ=@1.2.3.4:8388#SameName',
            'ss://YWVzLTEyOC1nY206cGFzc3dvcmQ=@5.6.7.8:8388#SameName'
        ].join('\n');
        const result = generateBuiltinLoonConfig(nodeList);
        expect(result).toContain('SameName = Shadowsocks');
        expect(result).toContain('SameName_1 = Shadowsocks');
    });

    it('应将 SS2022 + obfs-local URL 转为 Loon obfs-name/obfs-host 参数', () => {
        const node = 'ss://2022-blake3-aes-256-gcm:PYO0OMHeCny1V%2BpfA1M1CWvISpASYP81JF5QmhCEZpo%3D%3AJe7aoY9yW19kvQoTRhcPoc6Ub8rfrNh8gYkZaShE%2Fas%3D@dmit.20061112.xyz:2053/?plugin=obfs-local%3Bobfs%3Dhttp%3Bobfs-host%3Dwww.amd.com#SS2022-Ethan';
        const result = generateBuiltinLoonConfig(node);
        expect(result).toContain('SS2022-Ethan = Shadowsocks, dmit.20061112.xyz, 2053, 2022-blake3-aes-256-gcm');
        expect(result).toContain('obfs-name=http');
        expect(result).toContain('obfs-host=www.amd.com');
    });
});
