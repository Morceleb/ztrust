/**
 * 设备指纹采集
 */

import { ref, onMounted } from 'vue'
import { generateBrowserFingerprint } from '@/utils/fingerprintService'

export function useDeviceFingerprint() {
    const fingerprint = ref('')
    const deviceInfo = ref({})
    const isReady = ref(false)

    const generate = async () => {
        try {
            const result = await generateBrowserFingerprint()
            fingerprint.value = result.fingerprint
            deviceInfo.value = result.deviceInfo
            isReady.value = true

            console.log('[DeviceFingerprint] 生成完成:', fingerprint.value)

            return result
        } catch (error) {
            console.error('[DeviceFingerprint] 生成失败:', error)
            return null
        }
    }

    const getFingerprint = () => fingerprint.value
    const getDeviceInfo = () => deviceInfo.value

    onMounted(() => {
        if (!fingerprint.value) {
            generate()
        }
    })

    return {
        fingerprint,
        deviceInfo,
        isReady,
        generate,
        getFingerprint,
        getDeviceInfo,
    }
}

export default useDeviceFingerprint
