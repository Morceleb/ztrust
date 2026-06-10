/**
 * 行为采集器入口
 * 统一导出所有行为采集 composables
 */

export { useBehaviorCollector } from './composables/useBehaviorService';
export { useDeviceFingerprint } from './composables/useDeviceFingerprint';
export { useKeystrokeTracker } from './composables/useKeystrokeTracker';
export { useMouseTracker } from './composables/useMouseTracker';
export { usePageTiming } from './composables/usePageTiming';

export { BEHAVIOR_CONFIG } from './config';
export { calculateFingerprintSimilarity } from './utils/fingerprintSimilarity';
