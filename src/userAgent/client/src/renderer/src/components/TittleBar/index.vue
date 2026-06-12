<template>
    <div class="custom-title-bar">
        <div class="drag-area" @mousedown="startDrag"></div>
        <div class="controls">
            <button @click="minimize" class="control-btn" title="最小化">－</button>
            <button @click="maximize" class="control-btn" title="最大化">▢</button>
            <button @click="close" class="control-btn close" title="关闭">✕</button>
        </div>
    </div>
</template>

<script setup>
import { invoke } from '@tauri-apps/api/core'
import './index.css'

const minimize = () => invoke('window_control', { action: 'minimize' })
const maximize = () => invoke('window_control', { action: 'maximize' })
const close = () => invoke('window_control', { action: 'close' })
const startDrag = () => invoke('window_start_dragging')
</script>
