/**
 * 设备指纹采集
 */

import { ref, onMounted } from 'vue';

export function useDeviceFingerprint() {
    const fingerprint = ref('');
    const deviceInfo = ref({});
    const isReady = ref(false);

    // 生成指纹
    const generate = async () => {
        try {
            // 基础信息
            const baseInfo = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                languages: navigator.languages?.join(','),
                cookieEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack,
                hardwareConcurrency: navigator.hardwareConcurrency,
                deviceMemory: navigator.deviceMemory,
                screenWidth: screen.width,
                screenHeight: screen.height,
                screenColorDepth: screen.colorDepth,
                pixelRatio: window.devicePixelRatio,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timezoneOffset: new Date().getTimezoneOffset(),
            };

            // Canvas 指纹
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('ZTrust Device', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('ZTrust Device', 4, 17);
            baseInfo.canvas = canvas.toDataURL();

            // WebGL 指纹
            try {
                const gl = document.createElement('canvas').getContext('webgl');
                if (gl) {
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    baseInfo.webglVendor = gl.getParameter(debugInfo?.UNMASKED_VENDOR_WEBGL);
                    baseInfo.webglRenderer = gl.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL);
                }
            } catch (e) {
                console.warn('[DeviceFingerprint] WebGL 不可用:', e);
            }

            // 音频指纹
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const analyser = audioContext.createAnalyser();
                const gainNode = audioContext.createGain();
                const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                oscillator.connect(analyser);
                analyser.connect(scriptProcessor);
                scriptProcessor.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.start(0);

                const fingerprintData = [];
                scriptProcessor.onaudioprocess = (event) => {
                    const output = event.inputBuffer.getChannelData(0);
                    for (let i = 0; i < output.length; i++) {
                        fingerprintData.push(Math.abs(output[i]));
                    }
                };

                // 简化：使用一个随机值模拟音频指纹
                baseInfo.audioFingerprint = fingerprintData.reduce((acc, val) => acc + val, 0);
                
                setTimeout(() => {
                    oscillator.stop();
                    audioContext.close();
                }, 100);
            } catch (e) {
                console.warn('[DeviceFingerprint] 音频指纹不可用:', e);
            }

            // 生成哈希
            const dataString = JSON.stringify(baseInfo);
            fingerprint.value = await hashString(dataString);
            deviceInfo.value = baseInfo;
            isReady.value = true;

            console.log('[DeviceFingerprint] 生成完成:', fingerprint.value);

            return {
                fingerprint: fingerprint.value,
                deviceInfo: deviceInfo.value,
            };
        } catch (error) {
            console.error('[DeviceFingerprint] 生成失败:', error);
            return null;
        }
    };

    // 简单的哈希函数
    const hashString = async (str) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // 获取指纹
    const getFingerprint = () => {
        return fingerprint.value;
    };

    // 获取设备信息
    const getDeviceInfo = () => {
        return deviceInfo.value;
    };

    onMounted(() => {
        if (!fingerprint.value) {
            generate();
        }
    });

    return {
        fingerprint,
        deviceInfo,
        isReady,
        generate,
        getFingerprint,
        getDeviceInfo,
    };
}

export default useDeviceFingerprint;
