// src/modules/behaviorCollector/composables/useKeystrokeTracker.js
import { ref, onMounted, onUnmounted } from 'vue';

export function useKeystrokeTracker() {
    const timings = ref([]);  // 当前采样周期内的按键时间戳

    const handleKeydown = () => {
        timings.value.push(Date.now());
    };

    onMounted(() => {
        document.addEventListener('keydown', handleKeydown);
    });

    onUnmounted(() => {
        document.removeEventListener('keydown', handleKeydown);
    });

    // 计算当前采样周期的统计特征
    const getStats = () => {
        if (timings.value.length < 2) return null;

        const intervals = [];
        for (let i = 1; i < timings.value.length; i++) {
            intervals.push(timings.value[i] - timings.value[i - 1]);
        }

        const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;

        return {
            meanInterval: mean,
            stdDev: Math.sqrt(variance)
        };
    };

    // 新增：清空当前采样周期的数据
    const clear = () => {
        timings.value = [];
    };

    return { getStats, clear };
}
