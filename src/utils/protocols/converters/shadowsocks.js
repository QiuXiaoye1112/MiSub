import { base64Encode } from '../common/base64.js';

/**
 * Shadowsocks配置转换为URL
 * 支持完整参数：SS2022、插件(obfs/v2ray-plugin)、UDP
 */
export function convertShadowsocksToUrl(proxy) {
    try {
        if (!proxy.server || !proxy.port || !proxy.cipher || !proxy.password) {
            return null;
        }

        const cipher = proxy.cipher;
        const password = proxy.password;

        // 检测是否为 SS2022 格式 (2022-*)
        const isSS2022 = cipher.startsWith('2022-');
        const host = proxy.server.includes(':') && !proxy.server.startsWith('[')
            ? `[${proxy.server}]`
            : proxy.server;

        let url;

        if (isSS2022) {
            // SS2022 格式: ss://method:password@server:port
            // 密码通常是 base64 格式，需要 URL 编码
            url = `ss://${encodeURIComponent(cipher)}:${encodeURIComponent(password)}@${host}:${proxy.port}`;
        } else {
            // 传统格式: ss://base64(method:password)@server:port
            const userinfo = `${cipher}:${password}`;
            const encodedUserinfo = base64Encode(userinfo);
            url = `ss://${encodedUserinfo}@${host}:${proxy.port}`;
        }

        // 插件参数（遵循 SIP002: plugin=<name>;opt1=val1;opt2=val2）
        const params = new URLSearchParams();

        if (proxy.plugin) {
            const pluginName = (proxy.plugin === 'obfs' || proxy.plugin === 'simple-obfs')
                ? 'obfs-local'
                : proxy.plugin;
            const pluginSegments = [pluginName];

            // 插件选项
            if (proxy['plugin-opts']) {
                const opts = proxy['plugin-opts'];

                if (proxy.plugin === 'obfs' || proxy.plugin === 'obfs-local' || proxy.plugin === 'simple-obfs') {
                    const mode = opts.mode || opts.obfs;
                    const obfsHost = opts.host || opts['obfs-host'];
                    const obfsUri = opts.uri || opts['obfs-uri'];
                    if (mode) pluginSegments.push(`obfs=${mode}`);
                    if (obfsHost) pluginSegments.push(`obfs-host=${obfsHost}`);
                    if (obfsUri) pluginSegments.push(`obfs-uri=${obfsUri}`);
                } else if (proxy.plugin === 'v2ray-plugin') {
                    if (opts.mode) pluginSegments.push(`mode=${opts.mode}`);
                    if (opts.host) pluginSegments.push(`host=${opts.host}`);
                    if (opts.path) pluginSegments.push(`path=${opts.path}`);
                    if (opts.tls) pluginSegments.push('tls');
                    if (opts.mux) pluginSegments.push('mux=true');
                    if (opts['skip-cert-verify']) pluginSegments.push('skipCertVerify=true');
                } else if (proxy.plugin === 'shadow-tls') {
                    if (opts.host) pluginSegments.push(`host=${opts.host}`);
                    if (opts.password) pluginSegments.push(`password=${opts.password}`);
                    if (opts.version) pluginSegments.push(`version=${opts.version}`);
                }
            }

            params.set('plugin', pluginSegments.join(';'));
        }

        // UDP 支持
        if (proxy.udp !== undefined) {
            params.set('udp', proxy.udp ? '1' : '0');
        }

        // 添加参数（SIP002 规范使用 /?plugin=...）
        const paramsStr = params.toString();
        if (paramsStr) {
            url += proxy.plugin ? `/?${paramsStr}` : `?${paramsStr}`;
        }

        // Fragment (节点名称)
        url += `#${encodeURIComponent(proxy.name || 'SS')}`;

        return url;
    } catch (e) {
        console.error('Shadowsocks转换失败:', e);
        return null;
    }
}

/**
 * ShadowsocksR配置转换为URL
 */
export function convertShadowsocksRToUrl(proxy) {
    try {
        if (!proxy.server || !proxy.port || !proxy.password) {
            return null;
        }

        // SSR URL 格式: ssr://base64(server:port:protocol:method:obfs:base64(password)/?params)
        const password64 = base64Encode(proxy.password);
        const remarks64 = base64Encode(proxy.name || 'SSR');

        const baseStr = [
            proxy.server,
            proxy.port,
            proxy.protocol || 'origin',
            proxy.cipher || 'rc4-md5',
            proxy.obfs || 'plain',
            password64
        ].join(':');

        // 可选参数
        const params = [];
        params.push(`remarks=${remarks64}`);

        if (proxy['obfs-param']) {
            params.push(`obfsparam=${base64Encode(proxy['obfs-param'])}`);
        }
        if (proxy['protocol-param']) {
            params.push(`protoparam=${base64Encode(proxy['protocol-param'])}`);
        }
        if (proxy.group) {
            params.push(`group=${base64Encode(proxy.group)}`);
        }

        const fullStr = params.length > 0
            ? `${baseStr}/?${params.join('&')}`
            : baseStr;

        return `ssr://${base64Encode(fullStr)}`;
    } catch (e) {
        console.error('ShadowsocksR转换失败:', e);
        return null;
    }
}
