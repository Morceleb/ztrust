// src/modules/behaviorCollector/composables/useDeviceFingerprint.js
import { ref, onMounted } from 'vue';


export function useDeviceFingerprint() {
    const fingerprint = ref('');       // 最终的 64 位哈希指纹
    const isLoading = ref(true);

    // 1. Canvas 指纹
    const getCanvasFP = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return 'unsupported';

        ctx.textBaseline = 'top';
        ctx.font = '14px "Arial"';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Hello, World! 😃', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Canvas FP', 4, 17);

        return canvas.toDataURL();
    };

    // 2. WebGL 指纹
    const getWebGLFP = () => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return 'unsupported';

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return {
            vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
            renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
        };
    };

    // 3. AudioContext 指纹
    const getAudioFP = async () => {
        const AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        if (!AudioContext) return 'unsupported';

        const context = new AudioContext(1, 5000, 44100);
        const oscillator = context.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.value = 10000;

        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;

        oscillator.connect(compressor);
        compressor.connect(context.destination);
        oscillator.start(0);

        const buffer = await context.startRendering();
        const channelData = buffer.getChannelData(0);

        // 简单哈希
        let hash = 0;
        for (let i = 0; i < channelData.length; i += 100) {
            hash = ((hash << 5) - hash + channelData[i]) | 0;
        }
        return hash.toString();
    };

    // 4. 字体检测
    const getFontsFP = () => {
        const fonts = [
            'Comic Sans MS', 'Arial Black', 'Times New Roman', 'Courier New',
            'Georgia', 'Verdana', 'Trebuchet MS', 'Impact', 'Palatino'
        ];
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testString = 'mmmmmmmmmmlli';
        const testSize = '72px';

        const span = document.createElement('span');
        span.style.fontSize = testSize;
        span.style.position = 'absolute';
        span.style.left = '-9999px';
        span.style.visibility = 'hidden';
        span.innerHTML = testString;
        document.body.appendChild(span);

        const defaultWidths = baseFonts.map(font => {
            span.style.fontFamily = font;
            return span.offsetWidth;
        });

        const detected = fonts.filter(font => {
            span.style.fontFamily = `"${font}", ${baseFonts[0]}`;
            return !defaultWidths.includes(span.offsetWidth);
        });

        document.body.removeChild(span);
        return detected.join(',');
    };

    // 5. 基础信息
    const getBasicFP = () => ({
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: navigator.deviceMemory || 'unknown',
        doNotTrack: navigator.doNotTrack
    });

    // 主函数：采集并生成最终指纹
    const generateFingerprint = async () => {
        isLoading.value = true;

        const canvas = getCanvasFP();
        const webgl = getWebGLFP();
        const audio = await getAudioFP();
        const fonts = getFontsFP();
        const basic = getBasicFP();

        fingerprint.value = { canvas, webgl, audio, fonts, basic };
        isLoading.value = false;
    };

    onMounted(() => {
        generateFingerprint();
    });

    return {
        fingerprint,       // 最终指纹
        isLoading,
        regenerate: generateFingerprint  // 手动重新生成
    };
}