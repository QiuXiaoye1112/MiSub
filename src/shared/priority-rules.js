// Explicit category rules coexist with the legacy syntax without changing saved legacy rules.
export const RULE_PRIORITY = ['keyword', 'region', 'protocol'];
const CATEGORY_PREFIX = /^(keyword|region|protocol):/i;
const RULE_LINE = /^(keyword|region|protocol):(keep|exclude):(.+)$/i;

export function parsePriorityRules(text = '') {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    if (!lines.some(line => CATEGORY_PREFIX.test(line))) return null;
    const groups = {};
    for (const line of lines) {
        const match = line.match(RULE_LINE);
        if (!match) throw new Error('优先级规则格式：类别:keep或exclude:匹配内容；不能混用旧规则');
        const [, rawCategory, rawMode, rawPattern] = match;
        const category = rawCategory.toLowerCase();
        const mode = rawMode.toLowerCase();
        const pattern = rawPattern.trim();
        if (!pattern) throw new Error('匹配内容不能为空');
        if (groups[category] && groups[category].mode !== mode) {
            throw new Error('同一类别须使用相同的包含或排除模式');
        }
        if (category === 'protocol') {
            if (!/^[a-z0-9-]+(?:\s*,\s*[a-z0-9-]+)*$/i.test(pattern)) throw new Error('协议名称格式无效');
        } else {
            try { new RegExp(pattern, 'i'); } catch { throw new Error('正则无效'); }
        }
        groups[category] ??= { mode, patterns: [] };
        groups[category].patterns.push(pattern);
    }
    return groups;
}

export function serializePriorityRules(rules, modes) {
    return rules.map(rule => {
        const category = rule.type === 'custom' ? 'keyword' : rule.type;
        const pattern = category === 'protocol' ? rule.pattern.replace(/^proto:/i, '') : rule.pattern;
        return `${category}:${modes[category] || 'exclude'}:${pattern}`;
    }).join('\n');
}

export function compilePriorityFilter(text) {
    const groups = parsePriorityRules(text);
    if (!groups) return null;
    const aliases = {
        hysteria: ['hysteria', 'hysteria2', 'hy2'],
        hysteria2: ['hysteria', 'hysteria2', 'hy2'],
        ss: ['ss', 'shadowsocks'], shadowsocks: ['ss', 'shadowsocks'],
        socks5: ['socks5', 'socks']
    };
    const ordered = RULE_PRIORITY.filter(category => groups[category]).map(category => {
        const group = groups[category];
        const patterns = category === 'protocol'
            ? new Set(group.patterns.flatMap(pattern => pattern.toLowerCase().split(',').flatMap(p => aliases[p.trim()] || [p.trim()])))
            : group.patterns.map(pattern => new RegExp(pattern, 'i'));
        return { category, mode: group.mode, patterns };
    });
    return node => {
        for (const group of ordered) {
            const hit = group.category === 'protocol'
                ? group.patterns.has((node.protocol || '').toLowerCase())
                : group.patterns.some(regex => regex.test(node.name || '') || (group.category === 'region' && regex.test(node.region || '')));
            if (hit) return group.mode === 'keep';
        }
        // The lowest configured category defines the fallback: whitelist denies, blacklist allows.
        return ordered.at(-1)?.mode !== 'keep';
    };
}
