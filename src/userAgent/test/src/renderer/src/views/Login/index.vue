<!-- src/views/LoginPage.vue -->
<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { invoke } from '@tauri-apps/api/core'

import './index.css'

import LoginLogo from '@/components/CustomUI/CustomLogo/index.vue'
import LoginInput from '@/components/CustomUI/CustomInput/index.vue'
import LoginButton from '@/components/CustomUI/CustomButton/index.vue'
import LoginDivider from '@/components/CustomUI/CustomDivider/index.vue'
import SocialLogin from '@/components/CustomUI/SocialLogin/index.vue'
import request from '@/utils/request'
import store from '@/store'
import { sendSpaPacket } from '@/utils/spa'
import {
    saveSecurityCode,
    getSecurityCode,
    saveUsername,
    getUsername,
    savePassword,
    getPassword,
    keyringDelete,
    clearLocalStorageCredentials,
} from '@/utils/keyringService'
import { getDeviceId, getDeviceMeta, getDeviceToken, saveDeviceToken, clearDeviceToken, hasCompleteDeviceCredentials } from '@/utils/deviceService'

const router = useRouter()
const route = useRoute()

// 步骤控制：'company' | 'login'
const currentStep = ref('company')

// 公司地址 step 提交后是否自动接着调用 handleLogin（用于"登录失败回退到图1重输安全码 → 提交后自动重试"）
const autoLoginAfterCompanySubmit = ref(false)

// 配置对象 - 支持从后端动态加载
const config = ref({
    logo: { show: true, text: '我的公司', imageUrl: '', showImage: true },
    username: { show: true, label: '用户名', placeholder: '请输入用户名' },
    password: { show: true, label: '密码', placeholder: '请输入密码' },
    loginButton: { show: true, text: '登录' },
    divider: { show: true, text: '' },
    socialLogin: { show: true, providers: ['wechat', 'google'] },
    footerText: '© 2026 我的公司 版权所有',
    reminder: {
        show: true,
        title: '温馨提示',
        content: '为了您的账户安全，请使用公司内部账号登录。如遇登录问题，请联系管理员。'
    }
})

// 公司地址相关
const companyAddress = ref('')
const companyError = ref('')
const isCompanyLoading = ref(false)

// 安全码相关
const securityCode = ref('')
const securityCodeError = ref('')
const needSecurityCode = ref(false)   // 是否降级要求输入安全码
const trustedDeviceHint = ref('')     // 设备可信提示
const deviceUntrustedNotice = ref('') // 设备不可信提示（localStorage 里有 id+token 但服务端拒绝时使用）
const deviceTokenInvalidDialog = ref(false) // device_token 存在但服务端校验不通过时的弹窗

// 登录表单相关
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const loginError = ref('')

// 表单验证错误
const errors = reactive({
    username: '',
    password: ''
})

// 记住我表单
const rememberMe = ref(false)

// 动态获取密码输入类型
const passwordInputType = computed(() => showPassword.value ? 'text' : 'password')

// 解析地址，提取 host（用于 API 调用）
const extractHost = (address) => {
    let host = address.replace(/^https?:\/\//, '').replace(/\/$/, '')
    // 移除端口
    host = host.replace(/:\d+$/, '')
    return host
}

// 在 Tauri 环境下发送 SPA 报文以打开目标服务器端口
// 该函数为幂等操作：失败仅记录错误，不抛出
const ensureSpaPacketSent = async (rawAddress, securityCodeValue) => {
    const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
    if (!isTauri) return;

    try {
        const parsedHost = extractHost(rawAddress)
        console.log('[Login] 自动发送 SPA 报文以开放端口', { host: parsedHost });

        const deviceInfo = await invoke('get_device_info');
        await sendSpaPacket(
            parsedHost,
            securityCodeValue.trim(),
            deviceInfo.layered.hardware_hash,
            '7f8e3d2a1c9b4e6f5a0d8c2b7e4f1a3c'
        );
        console.log('[Login] SPA 报文自动发送完成');
    } catch (err) {
        console.warn('[Login] SPA 报文自动发送失败（将在登录时重试）:', err);
    }
}

const loadRemoteLoginConfig = async () => {
    try {
        const baseURL = localStorage.getItem('companyAddress') || import.meta.env.VITE_API_BASE_URL;
        if (!baseURL) return;

        // 提取 host 用于 API 调用
        const apiHost = extractHost(baseURL)
        const res = await fetch(`${apiHost}/api/tenant/login-config`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
            const data = await res.json();
            if (data.config) {
                config.value = { ...config.value, ...data.config };
                console.log('[Login] 登录配置加载成功');
            }
        }
    } catch (err) {
        console.log('[Login] 登录配置加载失败（这可能是正常的）:', err.message);
    }
}

// 加载配置和已保存的公司地址
onMounted(async () => {
    // 检测环境
    const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
    console.log('[Login] 页面加载，环境:', isTauri ? 'Tauri' : 'Browser');

    // 总是先读取一次已保存的地址和安全码
    // 安全码现在只在"账号密码页 + 降级安全码框"里用，不再用于 company step
    // 但仍然提前预填，方便下次打开程序就进图 2 时安全码有默认内容（连按确认即可）
    const savedAddress = localStorage.getItem('companyAddress');
    if (savedAddress) {
        companyAddress.value = savedAddress;
        // 安全码：Tauri 从密钥库读，其他从 localStorage 读
        if (isTauri) {
            const savedSecurityCode = await getSecurityCode();
            if (savedSecurityCode) securityCode.value = savedSecurityCode;
        } else {
            const savedSecurityCode = localStorage.getItem('securityCode');
            if (savedSecurityCode) securityCode.value = savedSecurityCode;
        }
    }

    // 若 URL 上带 mode=company（设置页"切换"触发），强制进入"接入地址/域名 + 安全码"页面
    if (route.query.mode === 'company') {
        currentStep.value = 'company'
        return
    }

    // 正常登录流程：
    //   - 没有可信设备凭证（device_token） → 必须先去 company step 输入安全码
    //   - 有 device_token → 跳过安全码，直达 username/password 页（尝试免二次认证）
    const hasDeviceToken = !!getDeviceToken();

    if (savedAddress && hasDeviceToken) {
        currentStep.value = 'login';
        console.log('[Login] 已加载保存的公司地址（可信设备免安全码）:', savedAddress);

        if (isTauri) {
            const savedUsernameVal = await getUsername();
            const savedPasswordVal = await getPassword();
            if (savedUsernameVal) {
                username.value = savedUsernameVal;
                console.log('[Login] 已从密钥库恢复用户名');
            }
            if (savedPasswordVal) {
                password.value = savedPasswordVal;
                rememberMe.value = true;
                console.log('[Login] 已从密钥库恢复密码');
            }
        } else {
            const savedUsernameVal = localStorage.getItem('savedUsername');
            const savedPasswordVal = localStorage.getItem('savedPassword');
            if (savedUsernameVal) username.value = savedUsernameVal;
            if (savedPasswordVal) {
                password.value = savedPasswordVal;
                rememberMe.value = true;
            }
        }

        if (!isTauri) {
            await loadRemoteLoginConfig();
        }

        // 设备字段检查仅用于统计/诊断；图 2 没有降级安全码框了（安全码统一在图 1 输入）
        console.log('[Login] 设备字段完整? ', hasCompleteDeviceCredentials(),
                    '| needSecurityCode=' + needSecurityCode.value + '（图 2 已无降级框，本值不再影响 UI）');
    }
});

// 保存公司地址并切换到登录步骤
// 注意：安全码输入框在"接入地址/域名"页（company step），与账号密码登录分离
const handleCompanySubmit = async () => {
    if (!companyAddress.value.trim()) {
        companyError.value = '请输入公司地址'
        return
    }

    if (!securityCode.value.trim()) {
        securityCodeError.value = '请输入安全码'
        return
    }

    isCompanyLoading.value = true

    // 解析用户输入的地址
    const rawAddress = companyAddress.value.trim()
    let parsedPort = null

    // 检查是否包含端口号（:数字）
    const hostPart = rawAddress.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const portMatch = hostPart.match(/:(\d+)$/)
    if (portMatch) {
        parsedPort = portMatch[1]
    }

    try {
        // Tauri 环境：安全码存入密钥库
        if (isTauri) {
            await saveSecurityCode(securityCode.value.trim());
        } else {
            // 非 Tauri 环境：存入 localStorage（向后兼容）
            localStorage.setItem('securityCode', securityCode.value.trim());
        }

        // 保存到 localStorage（保存完整地址，包括端口）
        localStorage.setItem('companyAddress', rawAddress)
        localStorage.setItem('companyPort', parsedPort || '80')

        // 切换到登录步骤
        currentStep.value = 'login'
        await loadRemoteLoginConfig()

        // 如果是因为"登录需要安全码"回退到图1再回到这里的，自动接着登录（保留用户名密码）
        if (autoLoginAfterCompanySubmit.value && username.value && password.value) {
            console.log('[Login] 回退后自动重试登录');
            autoLoginAfterCompanySubmit.value = false;
            // 切到 login step 后表单刚渲染，给 Vue 一点反应时间再触发 handleLogin
            await nextTick();
            await handleLogin();
        }
    } catch (error) {
        console.error('[Login] 初始化失败:', error);
        companyError.value = `连接失败: ${error.message || error}`;
    } finally {
        isCompanyLoading.value = false
    }
}

const clearCompanyError = () => {
    companyError.value = ''
}

/**
 * 弹窗"设备令牌验证失败"的确认处理：
 *   1. 关闭弹窗
 *   2. 切到 company step（输入安全码 + 接入地址的页面）
 *   3. 标记 autoLoginAfterCompanySubmit=true → 用户改完安全码点"下一步"自动接着登录
 */
const confirmDeviceTokenInvalidDialog = () => {
    deviceTokenInvalidDialog.value = false;
    autoLoginAfterCompanySubmit.value = true;
    securityCodeError.value = '设备令牌验证失败，请重新输入安全码';
    currentStep.value = 'company';
}

const clearSecurityCodeError = () => {
    securityCodeError.value = ''
}

// 返回修改公司地址
const backToCompany = () => {
    currentStep.value = 'company'
}

// 清除单个字段错误
const clearError = (field) => {
    errors[field] = ''
    loginError.value = ''
}

// 表单验证
const validate = () => {
    let valid = true

    if (!config.value.username?.show) {
        return valid
    }

    if (config.value.username?.show && !username.value.trim()) {
        errors.username = '请输入用户名'
        valid = false
    }
    if (config.value.password?.show && !password.value) {
        errors.password = '请输入密码'
        valid = false
    }
    return valid
}

/**
 * 发送 SPA 报文（每次登录前都发，幂等）
 */
const sendLoginSpa = async () => {
    const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
    if (!isTauri) return;
    const rawAddress = localStorage.getItem('companyAddress');
    if (!rawAddress) return;
    try {
        const securityCode = await getSecurityCode();
        if (!securityCode) return;
        await ensureSpaPacketSent(rawAddress, securityCode);
    } catch (e) {
        console.warn('[Login] SPA 报文发送失败:', e);
    }
};

/**
 * 登录请求：device_token 存在时**不**带 security_code，走"可信设备免安全码"路径
 *
 * 路径选择：
 *   - device_token 存在 → 只带 device_id + device_token，让 8900 调 Identity verify，
 *     verify=true 则跳过安全码直接登录成功，verify=false 才回 1007 让我们回图 1
 *   - device_token 不存在 → 带 device_id + security_code，让 8900 走 Casdoor 安全码校验，
 *     校验通过后 remember 设备并下发新的 device_token
 *
 * 回退链：
 *   1007（缺安全码）/ 1005（设备凭证失效）→ 切到 company step 让用户重输安全码，
 *   自动 autoLoginAfterCompanySubmit=true → 提交后自动重试登录。
 *   重试时 device_token 仍为空（重输安全码不会生成新 device_token），所以仍会带 security_code。
 */
const tryLoginSilent = async () => {
    const deviceId = await getDeviceId();
    const deviceToken = getDeviceToken();
    const hasToken = !!(deviceToken && deviceToken.trim());

    const payload = {
        username: username.value,
        password: password.value,
        device_id: deviceId,
    };

    if (hasToken) {
        // 可信设备：只带 device_token，不带 security_code（让 8900 走 verify 路径）
        payload.device_token = deviceToken;
    } else {
        // 不可信或首次：带安全码让 8900 走 Casdoor 校验 + Identity remember
        const securityCode = await getSecurityCode() || '';
        payload.security_code = securityCode || undefined;
    }

    return request.post('/auth/login', payload);
};

/**
 * （旧）带安全码重发 —— 已不再使用，安全码统一在图 1 输入并随 tryLoginSilent 一同发出。
 * 留空函数体但保留变量定义可让旧引用不报错；若严格 lint，可整段删除。
 */

/**
 * 处理登录（乐观 + 按需降级安全码）
 */
const handleLogin = async () => {
    if (!validate()) return;

    isLoading.value = true;
    loginError.value = '';
    deviceUntrustedNotice.value = '';
    needSecurityCode.value = false;
    trustedDeviceHint.value = '';

    // 每次登录前都发 SPA 报文打开目标端口
    await sendLoginSpa();

    const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

    try {
        // ---- 第一步：静默尝试（不带安全码）----
        let response;
        let deviceTrusted = false;

        try {
            response = await tryLoginSilent();
            // 没抛异常说明成功了（可能是免安全码直接通过）
            const rawData = response.data?.data || response.data || {};
            deviceTrusted = rawData.device_trusted === true;
        } catch (err) {
            // 服务端要求安全码（1007）或带的安全码/设备凭证失效（1005）
            const status = err.response?.status;
            const code = err.response?.data?.code;
            if (status === 400 && (code === '1007' || code === '1005')) {
                const deviceTokenSent = !!getDeviceToken();

                if (deviceTokenSent) {
                    // 带 device_token 仍被拒 → 设备不可信 → 清掉本地 token 避免下次踩坑
                    console.warn('[Login] 带 device_token 仍被拒绝 (code=' + code + ')，判定设备不可信，清除本地 device_token');
                    clearDeviceToken();
                    // 弹窗提示：要求用户确认后再跳到安全码输入页
                    deviceUntrustedNotice.value = '';
                    securityCodeError.value = '';
                    deviceTokenInvalidDialog.value = true;
                    isLoading.value = false;
                    loginError.value = '';
                    return;
                }

                // 没带 device_token 时（如首次登录 1007）：直接跳 company step，不需要弹窗
                deviceUntrustedNotice.value = '';
                securityCodeError.value = code === '1005'
                    ? '设备或安全码无效，请重新输入安全码'
                    : '服务端要求安全码，请输入安全码';
                // 切到 company step；保留 username/password；提交后会自动接着登录
                autoLoginAfterCompanySubmit.value = true;
                currentStep.value = 'company';
                isLoading.value = false;
                loginError.value = '';
                return;
            }
            // 其他错误继续抛出去
            throw err;
        }

        console.log('[Login] 登录响应原始:', JSON.stringify(response));
        console.log('[Login] 响应结构分析:', {
            responseType: typeof response,
            hasData: 'data' in (response || {}),
            responseData: response?.data,
            responseDataKeys: response?.data ? Object.keys(response.data) : [],
            dataDataKeys: response?.data?.data ? Object.keys(response.data.data) : [],
        });

        // 提取 token 和 user
        const rawData = response.data?.data || response.data || {};
        const access_token = rawData.access_token || rawData.token;
        const refresh_token = rawData.refresh_token;
        const user = rawData.user;
        const newDeviceToken = rawData.device_token;   // 仅新签发时有

        // 保存 device_token（若有新签发）
        if (newDeviceToken) {
            saveDeviceToken(newDeviceToken);
            console.log('[Login] ✓ device_token 已保存（首次安全码通过）');
        }

        // 若此次可信设备登录成功，提示用户
        if (deviceTrusted) {
            trustedDeviceHint.value = '已记住此设备，下次无需安全码';
        }

        // 若勾选记住我，保存用户名和密码
        if (rememberMe.value) {
            if (isTauri) {
                await saveUsername(username.value);
                await savePassword(password.value);
                localStorage.setItem('rememberMe', 'true');
            } else {
                localStorage.setItem('savedUsername', username.value);
                localStorage.setItem('savedPassword', password.value);
            }
            localStorage.setItem('rememberMe', 'true');
            console.log('[Login] ✓ 已保存用户名和密码');
        } else {
            if (isTauri) {
                await keyringDelete('username');
                await keyringDelete('password');
            }
            localStorage.removeItem('savedUsername');
            localStorage.removeItem('savedPassword');
            localStorage.removeItem('rememberMe');
        }

        // 保存认证信息到 sessionStorage
        if (access_token) {
            sessionStorage.setItem('auth_token', access_token);
            console.log('[Login] ✓ access_token 已保存，长度:', access_token.length);

            if (isTauri) {
                try {
                    const deviceId = await getDeviceId();
                    const deviceMeta = await getDeviceMeta();
                    const deviceToken = getDeviceToken();

                    // Tauri 环境：安全码从密钥库读（仅第一步成功后才存）
                    const storedSecurityCode = await getSecurityCode();

                    await invoke('save_auth_info', {
                        token: access_token,
                        securityCode: storedSecurityCode || '',
                        deviceId: deviceId,
                        licenseId: '7f8e3d2a1c9b4e6f5a0d8c2b7e4f1a3c',
                        deviceToken: deviceToken || null,
                    });
                    console.log('[Login] ✓ 认证信息已保存到 Tauri store');
                } catch (err) {
                    console.error('[Login] 保存认证信息到 Tauri store 失败:', err);
                }
            }
        } else {
            console.error('[Login] ✗ access_token 为空，无法保存！响应结构:', rawData);
        }

        if (refresh_token) {
            sessionStorage.setItem('refresh_token', refresh_token);
            console.log('[Login] ✓ refresh_token 已保存');
        }
        if (user) {
            sessionStorage.setItem('user_info', JSON.stringify(user));
            console.log('[Login] ✓ 用户信息已保存:', user);
        }

        // 登录成功
        await store.dispatch('auth/loginSuccess', user);
        router.replace('/index');
    } catch (err) {
        console.error('[Login] 登录失败:', {
            message: err.message,
            code: err.code,
            status: err.response?.status,
            responseData: err.response?.data,
            isTauri: isTauri,
        });

        // 错误映射（同原有逻辑）
        const messageMap = {
            'user does not exist': '用户不存在',
            'user not found': '用户不存在',
            'user doesn\'t exist': '用户不存在',
            'user not exist': '用户不存在',
            'no such user': '用户不存在',
            'invalid user': '用户不存在',
            'invalid username or password': '密码错误',
            'invalid credentials': '密码错误',
            'invalid username or password: password or code is incorrect': '密码错误',
            'username or password is incorrect': '密码错误',
            'incorrect username or password': '密码错误',
            'wrong username or password': '密码错误',
            'wrong password': '密码错误',
            'bad password': '密码错误',
            'password is incorrect': '密码错误',
            'password incorrect': '密码错误',
            'account is disabled': '账户已被禁用',
            'account disabled': '账户已被禁用',
            'account locked': '账户已被锁定',
            'account is locked': '账户已被锁定',
            'account is inactive': '账户已停用',
            'too many login attempts': '登录尝试次数过多',
            'too many failed attempts': '登录失败次数过多',
            'rate limit exceeded': '请求过于频繁，请稍后再试',
            'unauthorized': '未授权，请重新登录',
            'access denied': '访问被拒绝',
            'forbidden': '禁止访问',
            'permission denied': '权限不足',
            'token is invalid': '登录已过期，请重新登录',
            'token expired': '登录已过期，请重新登录',
            'invalid token': '登录已过期，请重新登录',
            'expired token': '登录已过期，请重新登录',
            'refresh token': '令牌刷新失败',
            'invalid code': '验证码错误',
            'code is incorrect': '验证码错误',
            'incorrect code': '验证码错误',
            'verification code': '验证码错误',
            'internal server error': '服务器内部错误，请稍后再试',
            'service unavailable': '服务暂时不可用',
            'bad request': '请求参数错误',
            'validation failed': '数据验证失败',
        };

        const getChineseMessage = (msg) => {
            if (!msg) return null;
            const lowerMsg = msg.toLowerCase();
            // 提取剩余次数（同时支持 "remaining" 和 "chances" 两种关键词）
            const remainingMatch =
                msg.match(/(\d+)\s*remaining/i) ||
                msg.match(/(\d+)\s*chances?/i);
            for (const [key, value] of Object.entries(messageMap)) {
                if (lowerMsg.includes(key.toLowerCase())) {
                    if (remainingMatch) {
                        // 带剩余次数的"用户不存在/密码错误"统一显示"密码错误，还剩 N 次机会"，
                        // 因为 Casdoor 在密码错时也可能返 "the user does not exist"。
                        if (value === '用户不存在' || value === '密码错误') {
                            return `密码错误，还剩 ${remainingMatch[1]} 次机会`;
                        }
                        return `${value}，还剩 ${remainingMatch[1]} 次机会`;
                    }
                    return value;
                }
            }
            return msg;
        };

        const status = err.response?.status;
        const backendMessage = err.response?.data?.message;

        if (!err.response) {
            loginError.value = '网络请求失败，请检查公司地址是否正确配置';
        } else if (status === 401) {
            loginError.value = getChineseMessage(backendMessage) || '用户名或密码错误';
        } else if (status === 403) {
            loginError.value = getChineseMessage(backendMessage) || '账户已被禁用或无访问权限';
        } else if (status === 429) {
            loginError.value = getChineseMessage(backendMessage) || '登录尝试次数过多，请稍后再试';
        } else if (status === 500) {
            loginError.value = backendMessage || '服务器错误，请稍后再试';
        } else {
            loginError.value = getChineseMessage(backendMessage) || '登录失败，请检查用户名和密码';
        }
    } finally {
        isLoading.value = false;
    }
};

// handleSecurityCodeSubmit 已移除 —— 安全码输入统一在图 1（接入地址/域名页），
// 登录失败需要安全码时回退到图 1 重输，然后 handleCompanySubmit 自动接着重试登录。

const getChineseMessage = (msg) => {
    if (!msg) return null;
    const lowerMsg = msg.toLowerCase();
    const messageMap = {
        'user does not exist': '用户不存在',
        'user not found': '用户不存在',
        'invalid username or password': '密码错误',
        'invalid credentials': '密码错误',
        'username or password is incorrect': '密码错误',
        'incorrect username or password': '密码错误',
        'wrong username or password': '密码错误',
        'wrong password': '密码错误',
        'bad password': '密码错误',
        'password is incorrect': '密码错误',
        'password incorrect': '密码错误',
        'account is disabled': '账户已被禁用',
        'account disabled': '账户已被禁用',
        'account locked': '账户已被锁定',
        'account is locked': '账户已被锁定',
        'account is inactive': '账户已停用',
        'unauthorized': '未授权，请重新登录',
        'forbidden': '禁止访问',
        'permission denied': '权限不足',
        'token expired': '登录已过期，请重新登录',
        'invalid token': '登录已过期，请重新登录',
        'internal server error': '服务器内部错误，请稍后再试',
        'service unavailable': '服务暂时不可用',
        'rate limit exceeded': '请求过于频繁，请稍后再试',
    };
    for (const [key, value] of Object.entries(messageMap)) {
        if (lowerMsg.includes(key.toLowerCase())) {
            const remainingMatch =
                msg.match(/(\d+)\s*remaining/i) ||
                msg.match(/(\d+)\s*chances?/i);
            if (remainingMatch) {
                if (value === '用户不存在' || value === '密码错误') {
                    return `密码错误，还剩 ${remainingMatch[1]} 次机会`;
                }
                return `${value}，还剩 ${remainingMatch[1]} 次机会`;
            }
            return value;
        }
    }
    return msg;
};

// 社交登录
const handleSocialClick = (provider) => {
    console.log('第三方登录:', provider)
}

// 处理公司地址输入回车
const handleCompanyKeydown = (e) => {
    if (e.key === 'Enter') {
        handleCompanySubmit()
    }
}

// 处理登录表单回车
const handleLoginKeydown = (e) => {
    if (e.key === 'Enter') {
        handleLogin()
    }
}
</script>

<template>
    <main class="login-container">
        <!-- 左侧温馨提示区域 -->
        <div class="left-content">
            <div v-if="config.reminder?.show" class="reminder">
                <h3 class="reminder-title">{{ config.reminder.title }}</h3>
                <p class="reminder-content">{{ config.reminder.content }}</p>
            </div>
        </div>

        <!-- 右侧登录表单区域 -->
        <div class="login-page">
            <!-- Logo -->
            <LoginLogo v-if="config.logo?.show" :text="config.logo.text" :image-url="config.logo.imageUrl"
                :show-image="config.logo.showImage" />

            <!-- ==================== 步骤一：公司地址输入 ==================== -->
            <div v-if="currentStep === 'company'" class="form-area">
                <div class="form-group" :class="{ 'has-error': companyError }">
                    <label class="form-label">接入地址 / 域名</label>
                    <div class="input-wrapper">
                        <div class="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        </div>
                        <input v-model="companyAddress" type="text" class="form-input company-input"
                            placeholder="例如：company.example.com 或 https://company.com" @input="clearCompanyError"
                            @keydown="handleCompanyKeydown" />
                    </div>
                    <p v-if="companyError" class="error-msg">{{ companyError }}</p>
                </div>

                <div class="form-group" :class="{ 'has-error': securityCodeError }">
                    <label class="form-label">安全码</label>
                    <div class="input-wrapper">
                        <div class="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <input v-model="securityCode" type="text" class="form-input" placeholder="请输入安全码"
                            @input="clearSecurityCodeError" @keydown="handleCompanyKeydown" />
                    </div>
                    <p v-if="securityCodeError" class="error-msg">{{ securityCodeError }}</p>
                </div>

                <!-- 加载动画替代按钮 -->
                <div v-if="isCompanyLoading" class="login-btn loading">
                    <span class="loading-dots">
                        <span></span><span></span><span></span>
                    </span>
                </div>
                <LoginButton v-else-if="config.loginButton?.show" text="下一步" @click="handleCompanySubmit" />
            </div>

            <!-- ==================== 步骤二：用户登录表单 ==================== -->
            <div v-else class="form-area">
                <!-- 返回修改公司地址 -->
                <button class="back-btn" @click="backToCompany">
                    ← 返回修改接入地址
                </button>

                <p class="login-subtitle">
                    正在登录：{{ companyAddress }}
                </p>

                <!-- 输入框区域 -->
                <LoginInput v-if="config.username?.show" v-model="username" :label="config.username.label"
                    :placeholder="config.username.placeholder" @input="clearError('username')"
                    @keydown="handleLoginKeydown" />

                <!-- 密码输入（带显示/隐藏切换） -->
                <div v-if="config.password?.show" class="input-group" :class="{ 'has-error': errors.password }">
                    <label>{{ config.password.label }}</label>
                    <div class="input-wrapper">
                        <input :type="passwordInputType" v-model="password" :placeholder="config.password.placeholder"
                            class="form-input" @input="clearError('password')" @keydown="handleLoginKeydown" />
                        <button type="button" class="input-toggle" @click="showPassword = !showPassword" tabindex="-1">
                            <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path
                                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        </button>
                    </div>
                    <p v-if="errors.password" class="error-msg">{{ errors.password }}</p>
                </div>

                <!-- 记住我 -->
                <div class="form-options">
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="rememberMe" class="checkbox-input" />
                        <span class="checkbox-custom"></span>
                        <span class="checkbox-text">记住我</span>
                    </label>
                    <a href="#" class="forgot-link" @click.prevent>忘记密码?</a>
                </div>

                <!-- 错误提示 -->
                <Transition name="alert-slide">
                    <div v-if="loginError" class="login-error-alert">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{{ loginError }}</span>
                    </div>
                </Transition>

                <!-- 可信设备提示 -->
                <Transition name="alert-slide">
                    <div v-if="trustedDeviceHint" class="login-success-hint">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <span>{{ trustedDeviceHint }}</span>
                    </div>
                </Transition>

                <!-- 设备不可信提示（带 device_token 仍被服务端拒绝） -->
                <Transition name="alert-slide">
                    <div v-if="deviceUntrustedNotice" class="login-error-alert">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <span>{{ deviceUntrustedNotice }}</span>
                    </div>
                </Transition>

                <!--
                  说明：图 2（账号密码页）原本有"降级安全码框"（v-if=needSecurityCode）。
                  现在安全码只放在图 1（company step）输入，所以这里删掉降级框。
                  若登录请求需要安全码（1007/1005），应回退到图 1 让用户重新输入安全码。
                -->

                <!--
                  设备令牌验证失败弹窗（账号密码页 → 弹窗 → 确认 → 跳到 company step）
                  触发条件：本地 device_token 存在，服务端 verify 失败返 1005
                -->
                <Teleport to="body">
                    <Transition name="alert-slide">
                        <div v-if="deviceTokenInvalidDialog" class="ztrust-modal-mask" @click.self="confirmDeviceTokenInvalidDialog">
                            <div class="ztrust-modal-card" role="alertdialog" aria-modal="true">
                                <div class="ztrust-modal-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                </div>
                                <div class="ztrust-modal-title">设备令牌验证失败</div>
                                <div class="ztrust-modal-desc">请重新输入安全码</div>
                                <button class="ztrust-modal-confirm" type="button"
                                    @click="confirmDeviceTokenInvalidDialog">确认</button>
                            </div>
                        </div>
                    </Transition>
                </Teleport>

                <!-- 加载状态按钮 -->
                <div v-if="isLoading" class="login-btn loading">
                    <span class="loading-dots">
                        <span></span><span></span><span></span>
                    </span>
                </div>
                <LoginButton v-else-if="config.loginButton?.show"
                    :text="config.loginButton.text"
                    @click="handleLogin()" />

                <!-- 分割线 -->
                <LoginDivider v-if="config.divider?.show" :text="config.divider.text" />

                <!-- 社交登录 -->
                <SocialLogin v-if="config.socialLogin?.show" :providers="config.socialLogin.providers"
                    @social-click="handleSocialClick" />
            </div>

            <!-- 当没有输入框时显示占位图 -->
            <img v-if="!config.username?.show && !config.password?.show && currentStep === 'login'"
                src="@/assets/placeholder-form.png" class="form-placeholder" alt="表单占位图" />

            <!-- 页脚 -->
            <div v-if="config.footerText" class="footer">
                {{ config.footerText }}
            </div>
        </div>
    </main>
</template>
