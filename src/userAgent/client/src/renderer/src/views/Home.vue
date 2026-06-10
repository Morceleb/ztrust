<template>
    <main class="home-container">
        <resourceList :resources="resources"></resourceList>

    </main>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';

import request from '@/utils/request'

import resourceList from '../components/resourceList.vue'

const resources = ref([])

onBeforeMount(async () => {
    try {
        const response = await request.get('/auth/access/resources')
        console.log('原始响应:', response)
        console.log('response.data:', response.data)
        console.log('response.data.data:', response.data?.data)
        resources.value = response.data?.data || []
        console.log('最终 resources:', resources.value)
    } catch (error) {
        console.error('请求失败:', error)
        resources.value = []
    }
})


</script>

<style scoped>
.home-container {
    width: 100%;
    height: 100%;
    padding: 35px 0 0 40px;

}
</style>