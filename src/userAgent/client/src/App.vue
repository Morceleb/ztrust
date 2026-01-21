<template>
  <div id="app">
    <main class="main">
      <router-view />
    </main>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useBehaviorCollector } from './modules/behaviorCollector'
import { useMouseTracker } from '@/modules/behaviorCollector/composables/useMouseTracker'
const { register, start, stop } = useBehaviorCollector()

const mouseTracker = useMouseTracker(20)

register('mouse', mouseTracker)

onMounted(() => {



  start(10000);
});


onUnmounted(() => {
  stop()
})


</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>