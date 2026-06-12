import { ref } from 'vue'

export function useBehaviorCollector() {
    const collectors = ref(new Map())     // key: 'mouse', value: { getData, clear }
    const isCollecting = ref(false)
    let intervalId = null

    // 注册采集器
    const register = (name, { getData, clear }) => {
        collectors.value.set(name, { getData, clear })
    }

    const collectAll = () => {
        const snapshot = {}

        collectors.value.forEach((collector, name) => {
            const data = collector.getData?.()
            if (data) {
                snapshot[name] = data
            }
        })

        // 加上公共信息
        return {
            timestamp: new Date().toISOString(),
            ...snapshot,
            // 公共字段：userAgent, screen, timezone 等
            meta: {
                userAgent: navigator.userAgent,
                screen: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        }
    }

    const send = async (payload) => {
        // 可以在这里加重试、队列、beacon 等
        try {
            await fetch('/api/context/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
        } catch (e) {
            console.error('发送失败', e)
            // 可选：存 indexedDB 等
        }
    }

    const start = (intervalMs = 30000) => {
        if (isCollecting.value) return
        isCollecting.value = true

        // 第一次立即采集
        const firstData = collectAll()
        // send(firstData)
        console.log('BehaviorCollector first data:', firstData)

        intervalId = setInterval(() => {
            const data = collectAll()
            // send(data)
            console.log('BehaviorCollector data:', data)
        }, intervalMs)
    }

    const stop = () => {
        if (intervalId) clearInterval(intervalId)
        isCollecting.value = false
    }

    const clearAll = () => {
        collectors.value.forEach(c => c.clear?.())
    }

    return {
        register,
        start,
        stop,
        clearAll,
        isCollecting
    }
}