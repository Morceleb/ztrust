/**
 * 页面时序采集
 */

import { ref, onMounted, onUnmounted } from 'vue';

export function usePageTiming() {
    const timing = ref({});
    const isCollecting = ref(false);
    let intervalId = null;

    // 采集页面时序数据
    const collect = () => {
        if (!window.performance || !window.performance.timing) {
            return null;
        }

        const t = window.performance.timing;

        // 计算关键指标
        const timingData = {
            // 网络相关
            dns: t.domainLookupEnd - t.domainLookupStart,           // DNS 查询时间
            tcp: t.connectEnd - t.connectStart,                    // TCP 连接时间
            ssl: t.secureConnectionStart > 0 
                ? t.connectEnd - t.secureConnectionStart 
                : 0,                                              // SSL/TLS 时间
            ttfb: t.responseStart - t.requestStart,               // 首字节时间
            download: t.responseEnd - t.responseStart,            // 下载时间
            
            // 页面加载相关
            domReady: t.domContentLoadedEventEnd - t.navigationStart,  // DOM 准备时间
            domComplete: t.domComplete - t.navigationStart,          // DOM 完成时间
            loadComplete: t.loadEventEnd - t.navigationStart,         // 页面完全加载时间
            
            // 首次渲染
            firstPaint: getFirstPaint(),                           // 首次绘制
            firstContentfulPaint: getFirstContentfulPaint(),       // 首次内容绘制
            
            // 资源加载
            transferred: window.performance?.memory?.usedJSHeapSize || 0, // 使用内存
            resources: performance.getEntriesByType('resource')?.length || 0, // 资源数量
            
            // 时间戳
            timestamp: new Date().toISOString(),
        };

        timing.value = timingData;
        return timingData;
    };

    // 获取首次绘制时间
    const getFirstPaint = () => {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(e => e.name === 'first-paint');
        return firstPaint?.startTime || 0;
    };

    // 获取首次内容绘制时间
    const getFirstContentfulPaint = () => {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
        return fcp?.startTime || 0;
    };

    // 获取资源时序
    const getResourceTiming = () => {
        const resources = performance.getEntriesByType('resource');
        return resources.map(r => ({
            name: r.name,
            duration: r.duration,
            size: r.transferSize,
            type: r.initiatorType,
        }));
    };

    // 获取导航时序
    const getNavigationTiming = () => {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length === 0) return null;

        const nav = navEntries[0];
        return {
            type: nav.type,
            redirectCount: nav.redirectCount,
            duration: nav.duration,
        };
    };

    // 开始采集
    const start = (intervalMs = 1000) => {
        if (isCollecting.value) return;

        isCollecting.value = true;
        
        // 立即采集一次
        collect();

        // 定期采集
        intervalId = setInterval(collect, intervalMs);

        console.log('[PageTiming] 启动');
    };

    // 停止采集
    const stop = () => {
        isCollecting.value = false;
        
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }

        console.log('[PageTiming] 停止');
    };

    // 获取数据
    const getData = () => {
        return timing.value;
    };

    // 清空数据
    const clear = () => {
        timing.value = {};
    };

    // 清理
    onUnmounted(() => {
        stop();
    });

    return {
        timing,
        isCollecting,
        start,
        stop,
        getData,
        clear,
        collect,
        getResourceTiming,
        getNavigationTiming,
    };
}

export default usePageTiming;
