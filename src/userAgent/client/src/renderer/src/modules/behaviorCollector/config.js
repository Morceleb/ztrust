// src/modules/behaviorCollector/config.js
export const CONFIG = {
    collectInterval: 30000,     // 每30秒采集并发送一次
    bufferSize: 50,             // 鼠标/键盘缓冲区大小
    weights: {
        device: 0.4,              // 设备指纹一致性
        geoIp: 0.3,               // IP/地理一致性（后端返回）
        timing: 0.2,              // 操作时序规律性
        input: 0.1                // 鼠标键盘统计特征
    },
    trustThreshold: 0.7         // 低于此值视为异常
};