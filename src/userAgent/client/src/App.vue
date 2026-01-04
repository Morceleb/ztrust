<template>
  <div id="app">
    <main class="main">
      <router-view />
    </main>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)


onMounted(() => {
  try {
    const raw = localStorage.getItem('casdoor_user')
    if (raw) user.value = JSON.parse(raw)
  } catch (e) {
    console.warn('failed to parse stored user', e)
  }
})
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.nav {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn {
  padding: 6px 10px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
}

.main {
  min-height: 60vh;
  padding: 12px 0;
}
</style>
