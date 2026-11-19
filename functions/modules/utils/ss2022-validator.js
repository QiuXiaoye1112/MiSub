/**
 * Shadowsocks 2022 节点验证工具
 * 用于检测 SS 2022 节点的密钥长度是否与加密方式匹配
 */

/**
 * SS 2022 加密方式与密钥长度映射表
 */
const SS2022_KEY_LENGTHS = {
    '2022-blake3-aes-128-gcm': 16,
    '2022-blake3-aes-256-gcm': 32,
    '2022-blake3-chacha20-poly1305': 32,
};

function safeDecodeURIComponent(value) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function decodeBase64ToBytes(input) {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(padLength);
    const binaryString = atob(padded);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function parseSsUserinfo(nodeUrl) {
    const withoutHash = nodeUrl.split('#')[0];
    const withoutQuery = withoutHash.split('?')[0];
    const atIndex = withoutQuery.indexOf('@');

    if (atIndex === -1) {
        return { atIndex: -1, withoutQuery };
    }

    const rawUserinfo = withoutQuery.slice(5, atIndex);

    // SIP022 常见格式允许明文 method:percentEncodedPassword，Base64 不会包含冒号
    if (rawUserinfo.includes(':')) {
        const colonIndex = rawUserinfo.indexOf(':');
        return {
            atIndex,
            withoutQuery,
            encoding: 'plain',
            cipher: safeDecodeURIComponent(rawUserinfo.slice(0, colonIndex)),
            password: safeDecodeURIComponent(rawUserinfo.slice(colonIndex + 1))
        };
    }

    const bytes = decodeBase64ToBytes(rawUserinfo);
    const decoded = new TextDecoder('utf-8').decode(bytes);
    const colonIndex = decoded.indexOf(':');
    if (colonIndex === -1) {
        return { atIndex, withoutQuery, encoding: 'base64', missingColon: true };
    }

    return {
        atIndex,
        withoutQuery,
        encoding: 'base64',
        cipher: decoded.slice(0, colonIndex),
        password: decoded.slice(colonIndex + 1)
    };
}

/**
 * 验证 SS 2022 节点的配置是否正确
 * @param {string} nodeUrl - SS 节点 URL
 * @returns {Object} 验证结果
 */
export function validateSS2022Node(nodeUrl) {
    if (!nodeUrl || typeof nodeUrl !== 'string') {
        return { valid: true };
    }

    if (!nodeUrl.startsWith('ss://')) {
        return { valid: true };
    }

    try {
        let parsed;
        try {
            parsed = parseSsUserinfo(nodeUrl);
        } catch (e) {
            return { valid: true, warning: `无法解码 SS 节点: ${e.message}` };
        }

        if (parsed.atIndex === -1) {
            const possibleBase64 = parsed.withoutQuery.slice(5);
            if (/^[A-Za-z0-9+/=_-]+$/.test(possibleBase64)) {
                return { valid: true };
            }
            return { valid: true, warning: 'SS 节点格式不标准 (缺少 @)' };
        }

        if (parsed.missingColon) {
            return { valid: true, warning: 'SS 节点格式不标准 (缺少 :)' };
        }

        const { cipher, password } = parsed;

        // 检查是否为 SS 2022 加密方式
        if (!cipher.startsWith('2022-')) {
            return { valid: true }; // 不是 SS 2022,跳过验证
        }

        // 获取期望的密钥长度
        const expectedLength = SS2022_KEY_LENGTHS[cipher];
        if (!expectedLength) {
            return {
                valid: true,
                warning: `未知的 SS 2022 加密方式: ${cipher}`
            };
        }

        // SS 2022 密码为单个 Base64 密钥，或服务端:用户多段 Base64 密钥
        const keyParts = password.split(':');
        if (keyParts.some(part => !part)) {
            return {
                valid: false,
                error: 'SS 2022 密码包含空密钥段',
                details: {
                    cipher,
                    password: password.substring(0, 20) + '...'
                }
            };
        }

        let mismatchedKeyBytes = null;
        for (const keyPart of keyParts) {
            let keyBytes;
            try {
                keyBytes = decodeBase64ToBytes(keyPart).length;
            } catch (e) {
                return {
                    valid: false,
                    error: `SS 2022 密码不是有效的 Base64: ${e.message}`,
                    details: {
                        cipher,
                        password: password.substring(0, 20) + '...'
                    }
                };
            }

            if (keyBytes !== expectedLength) {
                mismatchedKeyBytes = keyBytes;
                break;
            }
        }

        // 验证密钥长度
        if (mismatchedKeyBytes !== null) {
            // 根据实际密钥长度推荐正确的加密方式
            let suggestion = '请联系节点提供商修正配置';
            let suggestedCipher = null;

            for (const [cipherName, requiredLength] of Object.entries(SS2022_KEY_LENGTHS)) {
                if (requiredLength === mismatchedKeyBytes) {
                    suggestedCipher = cipherName;
                    suggestion = `建议使用 ${cipherName} 加密方式`;
                    break;
                }
            }

            return {
                valid: false,
                error: `SS 2022 密钥长度不匹配`,
                details: {
                    cipher,
                    expectedKeyLength: expectedLength,
                    actualKeyLength: mismatchedKeyBytes,
                    suggestedCipher,
                    suggestion
                }
            };
        }

        return { valid: true };
    } catch (e) {
        return {
            valid: true,
            warning: `验证 SS 节点时出错: ${e.message}`
        };
    }
}

/**
 * 尝试修复 SS 2022 节点的加密方式
 * @param {string} nodeUrl - 原始 SS 节点 URL
 * @returns {Object} 修复结果
 */
export function fixSS2022Node(nodeUrl) {
    const validation = validateSS2022Node(nodeUrl);

    if (validation.valid || !validation.details?.suggestedCipher) {
        return {
            fixed: false,
            originalUrl: nodeUrl,
            reason: validation.valid ? '节点配置正确,无需修复' : '无法自动修复'
        };
    }

    try {
        const parsed = parseSsUserinfo(nodeUrl);
        const serverPart = nodeUrl.substring(parsed.atIndex);
        const suggestedCipher = validation.details.suggestedCipher;

        let fixedUrl;
        if (parsed.encoding === 'plain') {
            fixedUrl = `ss://${encodeURIComponent(suggestedCipher)}:${encodeURIComponent(parsed.password)}${serverPart}`;
        } else {
            const newConfig = `${suggestedCipher}:${parsed.password}`;
            const newBase64 = btoa(unescape(encodeURIComponent(newConfig)));
            fixedUrl = `ss://${newBase64}${serverPart}`;
        }

        return {
            fixed: true,
            originalUrl: nodeUrl,
            fixedUrl,
            changes: {
                from: validation.details.cipher,
                to: suggestedCipher,
                reason: validation.details.suggestion
            }
        };
    } catch (e) {
        return {
            fixed: false,
            originalUrl: nodeUrl,
            error: `修复失败: ${e.message}`
        };
    }
}

/**
 * 批量验证节点列表
 * @param {Array<string>} nodeUrls - 节点 URL 列表
 * @returns {Object} 验证统计
 */
export function validateNodeList(nodeUrls) {
    if (!Array.isArray(nodeUrls)) {
        return { error: '输入必须是数组' };
    }

    const results = {
        total: nodeUrls.length,
        valid: 0,
        invalid: 0,
        warnings: 0,
        invalidNodes: [],
        warningNodes: []
    };

    nodeUrls.forEach((url, index) => {
        const validation = validateSS2022Node(url);

        if (!validation.valid) {
            results.invalid++;
            results.invalidNodes.push({
                index,
                url,
                error: validation.error,
                details: validation.details
            });
        } else if (validation.warning) {
            results.warnings++;
            results.warningNodes.push({
                index,
                url,
                warning: validation.warning
            });
        } else {
            results.valid++;
        }
    });

    return results;
}
