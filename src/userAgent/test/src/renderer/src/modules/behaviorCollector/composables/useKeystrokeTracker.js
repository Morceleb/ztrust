/**
 * 键盘输入采集
 */

import { ref, onMounted, onUnmounted } from 'vue';

export function useKeystrokeTracker() {
    const events = ref([]);
    const isTracking = ref(false);
    let keyDownTime = null;

    // 记录按键按下
    const handleKeyDown = (event) => {
        // 忽略功能键和组合键
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        if (event.key.length > 1) return; // 只记录可打印字符

        keyDownTime = Date.now();
        
        events.value.push({
            type: 'down',
            key: event.key,
            code: event.code,
            time: keyDownTime,
        });
    };

    // 记录按键释放
    const handleKeyUp = (event) => {
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        if (event.key.length > 1) return;

        const pressDuration = keyDownTime ? Date.now() - keyDownTime : 0;
        
        events.value.push({
            type: 'up',
            key: event.key,
            code: event.code,
            time: Date.now(),
            duration: pressDuration,
        });

        keyDownTime = null;
    };

    // 开始追踪
    const start = () => {
        if (isTracking.value) return;

        isTracking.value = true;
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        console.log('[KeystrokeTracker] 启动');
    };

    // 停止追踪
    const stop = () => {
        isTracking.value = false;
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
    };

    // 获取数据
    const getData = () => {
        if (events.value.length === 0) return null;

        // 统计特征
        const keyFrequencies = {};
        const durations = [];

        events.value.forEach(event => {
            if (event.type === 'up') {
                keyFrequencies[event.key] = (keyFrequencies[event.key] || 0) + 1;
                if (event.duration) {
                    durations.push(event.duration);
                }
            }
        });

        const avgDuration = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;

        return {
            keystrokeCount: events.value.filter(e => e.type === 'up').length,
            uniqueKeys: Object.keys(keyFrequencies).length,
            keyFrequencies,
            avgDuration,
            timestamp: new Date().toISOString(),
        };
    };

    // 清空数据
    const clear = () => {
        events.value = [];
    };

    // 清理
    onUnmounted(() => {
        stop();
        clear();
    });

    return {
        events,
        isTracking,
        start,
        stop,
        getData,
        clear,
    };
}

export default useKeystrokeTracker;
