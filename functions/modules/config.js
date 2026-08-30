/**
 * Unified config file.
 * Includes constants, KV keys, and default settings for the worker.
 */

// KV storage keys
export const KV_KEY_SUBS = 'misub_subscriptions_v1';
export const KV_KEY_PROFILES = 'misub_profiles_v1';
export const KV_KEY_GUESTBOOK = 'misub_guestbook_v1';
export const KV_KEY_SETTINGS = 'worker_settings_v1';

// Auth
export const COOKIE_NAME = 'auth_session';
export const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

// Default settings
export const DEFAULT_SETTINGS = {
    FileName: 'MiSub',
    mytoken: 'auto',
    profileToken: 'profiles',
    transformConfigMode: 'builtin',
    transformConfig: '',
    externalTemplateEnabled: false,
    ruleLevel: 'base',
    builtinSkipCertVerify: false,
    builtinEnableUdp: true,
    builtinLoonSkipCertVerify: false,
    enableAccessLog: false,
    accessLogPersistenceMode: 'light',
    NotifyThresholdDays: 3,
    NotifyThresholdPercent: 90,
    enableTrafficNode: false,
    enableFlagEmoji: true,
    enablePublicPage: true,
    storageType: 'kv',
    // 新增：借鉴Sub-Store和miaomiaowu的功能
    enableSubscriptionSync: true,      // 启用订阅同步
    subscriptionCacheExpireMinutes: 60, // 订阅缓存过期时间（分钟）
    enableTrafficMonitor: true,        // 启用流量监控
    enableTemplateEngine: true,        // 启用模板引擎
    enableEnhancedLogging: true,       // 启用增强日志
    maxSubscriptionConcurrency: 3,     // 最大订阅并发数
    defaultUserAgent: 'clash-meta/2.5.0', // 默认User-Agent
    nodeTransformPresets: [],
    // 公告设置
    announcement: {
        enabled: false,
        title: '',
        content: '',
        type: 'info',
        dismissible: true,
        updatedAt: null
    },
    // 留言板设置
    guestbook: {
        enabled: false,
        allowAnonymous: true
    },
    // 自定义公开页设置
    customPage: {
        enabled: false,           // 是否启用自定义页面
        type: 'html',            // 页面渲染方式
        content: '',             // 页面代码内容
        css: '',                 // 自定义全局样式
        useDefaultLayout: true,  // 是否包裹在默认的基础布局中 (包含背景、容器等)
        allowExternalStylesheets: false, // 是否允许加载 HTML 源码中的外链样式表
        allowScripts: false,     // 是否允许执行 HTML 源码中的 script
        hideBranding: false,     // 是否隐藏公开页中的 MiSub 品牌标识
        hideHeader: false,       // 自定义公开页是否隐藏全局页头
        hideFooter: false        // 自定义公开页是否隐藏全局页脚
    },
    // 订阅转换设置
    subconverter: {
        engineMode: "builtin",
        defaultBackend: "https://subapi.cmliussss.net/sub?",
        defaultOptions: {
            udp: true,
            emoji: true,
            scv: true,
            tfo: false,
            sort: false,
            list: false
        }
    }
};

// System constants
export const SYSTEM_CONSTANTS = {
    VERSION: '2.6.4',
    // Use v2rayN UA to fetch subscriptions reliably.
    FETCHER_USER_AGENT: 'v2rayN/7.23'
};
