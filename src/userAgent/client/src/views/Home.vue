<template>
    <div>
        <resourceList :resources="data.resources"></resourceList>
    </div>
</template>

<script setup>

import resourceList from '../components/resourceList.vue'

import data from '@/assets/resource-list.json'

</script>

<style scoped>
input {
    padding: 8px;
    width: 200px;
    font-size: 16px;
}

button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
}

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>