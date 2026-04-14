import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';  // 如果用了路由

const pageStayTimes = ref([]);  // 每个页面的停留时间（ms）

export function usePageTiming() {
    let startTime = Date.now();

    const recordStay = () => {
        pageStayTimes.value.push(Date.now() - startTime);
        startTime = Date.now();
    };

    onMounted(() => {
        if (useRouter) {
            useRouter().afterEach(recordStay);
        }
        window.addEventListener('beforeunload', recordStay);
    });

    onBeforeUnmount(() => recordStay());

    const getStdDev = () => {
        if (pageStayTimes.value.length === 0) return 0;
        const mean = pageStayTimes.value.reduce((a, b) => a + b, 0) / pageStayTimes.value.length;
        const variance = pageStayTimes.value.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pageStayTimes.value.length;
        return Math.sqrt(variance);
    };

    return { getStdDev };
}