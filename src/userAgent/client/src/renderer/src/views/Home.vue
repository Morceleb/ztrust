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
        console.log('资源列表请求成功，状态:', response.status)
        resources.value = response.data?.data || []
        console.log('最终资源数:', resources.value.length)
    } catch (error) {
        console.error('请求失败:', { name: error?.name, status: error?.response?.status })
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
