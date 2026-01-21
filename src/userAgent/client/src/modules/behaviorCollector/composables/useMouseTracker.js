import { ref, onMounted, onUnmounted } from 'vue';

export function useMouseTracker(sampleEveryNFrames = 5) {
    const points = ref([]);

    let rafId = null;
    let frameCount = 0;
    let lastX = 0;
    let lastY = 0;

    // 常量定义，便于调整
    const MIN_DT_MS = 8;          // 最小时间间隔，防止噪声放大
    const SPEED_LOW_THRESHOLD = 50;   // px/s，低速阈值（犹豫/阅读）
    const SPEED_HIGH_THRESHOLD = 500; // px/s，高速阈值（快速/紧张）
    const JERK_HIGH_THRESHOLD = 5000; // px/s³，急动阈值

    const tick = () => {
        frameCount++;

        if (frameCount % sampleEveryNFrames === 0) {
            if (lastX !== 0 || lastY !== 0) {
                const now = Date.now();
                const newPoint = { x: lastX, y: lastY, t: now };

                // 计算速度和加速度（需要至少前前点）
                if (points.value.length >= 2) {
                    const curr = { x: lastX, y: lastY, t: now };
                    const prev = points.value[points.value.length - 1];
                    const pprev = points.value[points.value.length - 2];

                    const dt1 = prev.t - pprev.t;
                    const dt2 = now - prev.t;

                    // 加强过滤：dt 太小或太大都跳过
                    if (dt1 >= MIN_DT_MS && dt2 >= MIN_DT_MS && dt1 + dt2 <= 1500) {
                        // 前一段速度
                        const dx1 = prev.x - pprev.x;
                        const dy1 = prev.y - pprev.y;
                        const ds1 = Math.hypot(dx1, dy1);
                        const v1 = ds1 / dt1 * 1000;

                        // 后一段速度
                        const dx2 = curr.x - prev.x;
                        const dy2 = curr.y - prev.y;
                        const ds2 = Math.hypot(dx2, dy2);
                        const v2 = ds2 / dt2 * 1000;

                        // 当前速度：前后平均（更平滑）
                        newPoint.v = (v1 + v2) / 2;

                        // 加速度：中心差分
                        const totalDtSec = (dt1 + dt2) / 1000;
                        newPoint.a = (v2 - v1) / totalDtSec;
                    }
                }

                points.value.push(newPoint);

                if (points.value.length > 2000) {
                    points.value.shift();
                }
            }
        }

        rafId = requestAnimationFrame(tick);
    };

    const updatePosition = (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
    };

    const getData = () => {
        const pts = points.value;
        if (pts.length < 4) {
            return {
                pointCount: pts.length,
                durationMs: 0,
                velocity: { mean: 0, max: 0, count: 0, lowRatio: 0, highRatio: 0 },
                acceleration: { mean: 0, maxAbs: 0, std: 0, count: 0, positiveRatio: 0 },
                jerkStats: null
            };
        }

        // 1. 速度统计
        const velocities = pts
            .filter(p => typeof p.v === 'number')
            .map(p => p.v);

        const meanV = velocities.length > 0 ? velocities.reduce((s, v) => s + v, 0) / velocities.length : 0;
        const maxV = velocities.length > 0 ? Math.max(...velocities) : 0;

        // 速度分桶比例
        let lowCount = 0, highCount = 0;
        velocities.forEach(v => {
            if (v < SPEED_LOW_THRESHOLD) lowCount++;
            if (v > SPEED_HIGH_THRESHOLD) highCount++;
        });
        const lowRatio = velocities.length > 0 ? lowCount / velocities.length : 0;
        const highRatio = velocities.length > 0 ? highCount / velocities.length : 0;

        // 2. 加速度统计
        const accelerations = pts
            .filter(p => typeof p.a === 'number')
            .map(p => p.a);

        const meanA = accelerations.length > 0 ? accelerations.reduce((s, v) => s + v, 0) / accelerations.length : 0;
        const maxAbsA = accelerations.length > 0 ? Math.max(...accelerations.map(Math.abs)) : 0;
        const stdA = accelerations.length > 0
            ? Math.sqrt(accelerations.reduce((s, v) => s + (v - meanA) ** 2, 0) / accelerations.length)
            : 0;

        // 正/负加速度比例（启动 vs 刹车习惯）
        let positiveCount = accelerations.filter(a => a > 0).length;
        const positiveRatio = accelerations.length > 0 ? positiveCount / accelerations.length : 0;

        // 3. jerk 计算（使用中心差分，更精确）
        const jerks = [];
        for (let i = 2; i < pts.length; i++) {
            const p0 = pts[i - 2];
            const p1 = pts[i - 1];
            const p2 = pts[i];

            if (typeof p0.a !== 'number' || typeof p1.a !== 'number' || typeof p2.a !== 'number') continue;

            const dt = (p2.t - p0.t) / 1000;  // 使用更宽窗口，减少噪声
            if (dt <= 0 || dt > 0.5) continue;

            // 中心差分 jerk
            const j = (p2.a - p0.a) / dt;
            jerks.push(j);
        }

        let jerkStats = null;
        if (jerks.length > 0) {
            const meanJerk = jerks.reduce((s, v) => s + v, 0) / jerks.length;
            const absMeanJerk = jerks.reduce((s, v) => s + Math.abs(v), 0) / jerks.length;
            const maxAbsJerk = Math.max(...jerks.map(Math.abs));
            const stdJerk = Math.sqrt(jerks.reduce((s, v) => s + (v - meanJerk) ** 2, 0) / jerks.length);

            // 急动次数统计
            const highJerkCount = jerks.filter(j => Math.abs(j) > JERK_HIGH_THRESHOLD).length;
            const highJerkRatio = jerks.length > 0 ? highJerkCount / jerks.length : 0;

            jerkStats = {
                count: jerks.length,
                mean: meanJerk,
                absMean: absMeanJerk,
                maxAbs: maxAbsJerk,
                std: stdJerk,
                highCount: highJerkCount,
                highRatio: highJerkRatio
            };
        }

        // 4. 方向性特征（水平 vs 垂直移动占比）
        let horizontalMove = 0;
        let verticalMove = 0;
        for (let i = 1; i < pts.length; i++) {
            const dx = Math.abs(pts[i].x - pts[i - 1].x);
            const dy = Math.abs(pts[i].y - pts[i - 1].y);
            if (dx > dy) horizontalMove += dx;
            else verticalMove += dy;
        }
        const totalMove = horizontalMove + verticalMove;
        const horizontalRatio = totalMove > 0 ? horizontalMove / totalMove : 0;

        return {
            pointCount: pts.length,
            durationMs: pts.length > 0 ? pts[pts.length - 1].t - pts[0].t : 0,

            velocity: {
                mean: meanV,
                max: maxV,
                count: velocities.length,
                lowRatio,      // 低速占比（犹豫/阅读）
                highRatio      // 高速占比（快速/紧张）
            },

            acceleration: {
                mean: meanA,
                maxAbs: maxAbsA,
                std: stdA,
                count: accelerations.length,
                positiveRatio  // 正加速度占比（启动倾向）
            },

            jerkStats,

            direction: {
                horizontalRatio  // 水平移动占比（>0.5 表示偏好左右移动）
            }

            // 如果需要原始轨迹，可取消注释
            // points: pts.map(p => ({ ...p }))
        };
    };

    onMounted(() => {
        document.addEventListener('mousemove', updatePosition);
        rafId = requestAnimationFrame(tick);
    });

    onUnmounted(() => {
        document.removeEventListener('mousemove', updatePosition);
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    });

    return {
        getData,
        clear: () => {
            points.value = [];
        }
    };
}