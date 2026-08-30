export const BUILTIN_TEMPLATE_REGISTRY = {
    clash_misub_minimal: {
        id: 'clash_misub_minimal',
        name: 'MiSub 极简默认分流',
        target: 'clash',
        format: 'ini',
        description: '更偏日常使用的极简模板，仅保留主选择、自动选择、常用媒体与兜底分组，适合作为统一模板主线默认配置。',
        content: `[custom]
ruleset=节点选择,https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/ProxyMedia.list
ruleset=节点选择,https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/Telegram.list
ruleset=节点选择,https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/ChinaDomain.list
ruleset=DIRECT,[]GEOIP,CN
ruleset=节点选择,[]FINAL

custom_proxy_group=节点选择\`select\`.*

enable_rule_generator=true
overwrite_original_rules=true`
    }
};

export function getBuiltinTemplate(templateId) {
    return BUILTIN_TEMPLATE_REGISTRY[templateId] || null;
}
