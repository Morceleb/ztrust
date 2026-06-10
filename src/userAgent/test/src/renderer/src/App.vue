<template>
  <div id="app">
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBehaviorCollector } from './modules/behaviorCollector'
import { useMouseTracker } from '@/modules/behaviorCollector/composables/useMouseTracker'
import activityMonitor from '@/utils/activityMonitorWrapper'
import store from '@/store'

const router = useRouter()
const { register, start, stop } = useBehaviorCollector()

const mouseTracker = useMouseTracker(20)

register('mouse', mouseTracker)

// 超时处理
const handleTimeout = () => {
    store.dispatch('auth/timeoutLogout')
    router.push('/login')
}

onMounted(() => {
    activityMonitor.onTimeout(handleTimeout)
});

onUnmounted(() => {
    stop()
    activityMonitor.removeAllListeners()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>