export const TRANSFORM_ASSETS = {
    configs: [
        {
            id: 0,
            name: 'MiSub 内置 极简默认分流',
            url: 'builtin:clash_misub_minimal',
            group: 'MiSub Builtin',
            is_default: true,
            sourceType: 'builtin-preset',
            recommendedFor: ['clash', 'singbox', 'surge', 'loon', 'quanx'],
            compatibleClients: ['clash', 'mihomo', 'clash-meta', 'singbox', 'surge', 'loon', 'quanx'],
            strategy: 'model-driven',
            description: 'MiSub 自带的默认极简模板，适合日常通用、新手用户和优先稳定的场景。'
        }
    ]
};

export function getTransformAssetByUrl(url) {
    return TRANSFORM_ASSETS.configs.find(item => item.url === url) || null;
}

export function isBuiltinTransformAssetUrl(url) {
    return typeof url === 'string' && url.startsWith('builtin:');
}
