/** Default settings constants. */
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
    autoUpdateInterval: 0,
    nodeTransformPresets: [],
    announcement: {
        enabled: true,
        title: '2.5 版本更新说明',
        content: '',
        type: 'info',
        dismissible: true,
        updatedAt: null
    },
    guestbook: {
        enabled: false,
        allowAnonymous: true
    },
    subconverter: {
        engineMode: 'builtin',
        defaultBackend: 'https://subapi.cmliussss.net/sub?',
        defaultOptions: {
            udp: true,
            emoji: true,
            scv: true,
            tfo: false,
            sort: false,
            list: false
        }
    },
    customPage: {
        enabled: false,
        type: 'html',
        content: '',
        css: '',
        iframeUrl: '',
        iframeHeight: '100vh',
        iframeFullWidth: true,
        iframeAllowFullscreen: true,
        iframeFillViewport: false,
        iframePaddingY: '0px',
        iframeRadius: '0px',
        iframeShadow: false,
        useDefaultLayout: true,
        allowExternalStylesheets: false,
        allowScripts: false,
        hideBranding: false,
        hideHeader: false,
        hideFooter: false
    }
};

export const DEFAULT_NODE_FORM = {
    name: '',
    url: '',
    enabled: true,
    fetchProxy: ''
};

export const DEFAULT_PROFILE_FORM = {
    name: '',
    customId: '',
    transformConfigMode: 'builtin',
    transformConfig: '',
    ruleLevel: 'base',
    subscriptions: [],
    manualNodes: [],
    enabled: true,
    prefixSettings: {
        enableManualNodes: true,
        enableSubscriptions: true,
        manualNodePrefix: '',
        subscriptionPrefix: '',
        prependGroupName: null
    },
    subconverter: {
        engineMode: 'builtin',
        backend: '',
        options: {
            udp: null,
            emoji: null,
            scv: null,
            sort: null,
            tfo: null,
            list: null
        }
    },
    nodeTransform: null,
    nodeTransformPresetId: ''
};
