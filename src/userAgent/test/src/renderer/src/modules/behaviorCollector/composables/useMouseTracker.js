/**
 * 鼠标轨迹采集
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { BEHAVIOR_CONFIG } from '../config';

export function useMouseTracker(intervalMs = 50) {
    const events = ref([]);
    const isTracking = ref(false);
    let intervalId = null;
    let lastPosition = { x: 0, y: 0 };
    let moveCount = 0;

    // 记录鼠标移动
    const handleMouseMove = (event) => {
        const currentTime = Date.now();
        
        // 采样：只在一定时间间隔内记录
        if (currentTime - (events.value[events.value.length - 1]?.time || 0) < intervalMs) {
            return;
        }

        const deltaX = event.clientX - lastPosition.x;
        const deltaY = event.clientY - lastPosition.y;
        const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        events.value.push({
            type: 'move',
            x: event.clientX,
            y: event.clientY,
            deltaX,
            deltaY,
            velocity,
            time: currentTime,
        });

        lastPosition = { x: event.clientX, y: event.clientY };
        moveCount++;

        // 限制存储数量
        if (events.value.length > 1000) {
            events.value = events.value.slice(-500);
        }
    };

    // 记录鼠标点击
    const handleClick = (event) => {
        events.value.push({
            type: 'click',
            x: event.clientX,
            y: event.clientY,
            button: event.button,
            time: Date.now(),
        });
    };

    // 记录鼠标按下
    const handleMouseDown = (event) => {
        events.value.push({
            type: 'down',
            x: event.clientX,
            y: event.clientY,
            button: event.button,
            time: Date.now(),
        });
    };

    // 记录鼠标释放
    const handleMouseUp = (event) => {
        events.value.push({
            type: 'up',
            x: event.clientX,
            y: event.clientY,
            button: event.button,
            time: Date.now(),
        });
    };

    // 开始追踪
    const start = () => {
        if (isTracking.value) return;

        isTracking.value = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('click', handleClick);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

        console.log('[MouseTracker] 启动');
    };

    // 停止追踪
    const stop = () => {
        isTracking.value = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleClick);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);

        console.log('[MouseTracker] 停止');
    };

    // 获取数据
    const getData = () => {
        if (events.value.length === 0) return null;

        // 计算统计特征
        const positions = events.value.filter(e => e.type === 'move');
        const velocities = positions.map(e => e.velocity);
        const avgVelocity = velocities.length > 0 
            ? velocities.reduce((a, b) => a + b, 0) / velocities.length 
            : 0;
        const maxVelocity = velocities.length > 0 
            ? Math.max(...velocities) 
            : 0;

        return {
            eventCount: events.value.length,
            moveCount,
            clickCount: events.value.filter(e => e.type === 'click').length,
            avgVelocity,
            maxVelocity,
            positions: positions.slice(-100), // 只保留最近100个位置
            timestamp: new Date().toISOString(),
        };
    };

    // 清空数据
    const clear = () => {
        events.value = [];
        moveCount = 0;
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

export default useMouseTracker;
