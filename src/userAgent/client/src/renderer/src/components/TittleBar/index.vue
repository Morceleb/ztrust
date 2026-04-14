<template>
    <div class="custom-title-bar">
        <div class="drag-area"></div>
        <div class="controls">
            <button @click="minimize" class="control-btn">－</button>
            <button @click="maximize" class="control-btn">▢</button>
            <button @click="close" class="control-btn close">✕</button>
        </div>
    </div>
</template>

<script setup>
const minimize = () => window.electronAPI.controlWindow('minimize')
const maximize = () => window.electronAPI.controlWindow('maximize')
const close = () => window.electronAPI.controlWindow('close')
</script>

<style scoped>
@import url(./index.css);
</style>