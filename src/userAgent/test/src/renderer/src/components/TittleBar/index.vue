<template>
    <div class="custom-title-bar" data-tauri-drag-region>
        <div class="drag-area" @mousedown="handleDrag"></div>
        <div class="controls">
            <button @click="minimize" class="control-btn" title="最小化">－</button>
            <button @click="maximize" class="control-btn" title="最大化">▢</button>
            <button @click="close" class="control-btn close" title="关闭">✕</button>
        </div>
    </div>
</template>

<script setup>
import { invoke } from '@tauri-apps/api/core';

const minimize = async () => {
    try {
        await invoke('window_control', { action: 'minimize' });
    } catch (e) {
        console.error('最小化失败:', e);
    }
};

const maximize = async () => {
    try {
        await invoke('window_control', { action: 'maximize' });
    } catch (e) {
        console.error('最大化失败:', e);
    }
};

const close = async () => {
    try {
        await invoke('window_control', { action: 'close' });
    } catch (e) {
        console.error('关闭失败:', e);
    }
};

const handleDrag = async () => {
    try {
        await invoke('window_start_dragging');
    } catch (e) {
        console.error('拖动失败:', e);
    }
};
</script>

<style scoped>
.custom-title-bar {
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    background: transparent;
    color: rgba(248, 250, 252, 0.92);
    user-select: none;
    padding-right: 8px;
}

.drag-area {
    flex: 1;
    height: 100%;
    cursor: default;
}

.controls {
    display: flex;
    align-items: center;
    gap: 4px;
}

.control-btn {
    width: 36px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: #232c39;
    cursor: pointer;
    font-size: 16px;
    border-radius: 4px;
    transition: background 0.15s, color 0.15s;
}

.control-btn:hover {
    background: rgba(0, 0, 0, 0.08);
    color: #1f2937;
}

.control-btn.close:hover {
    background: #ef4444;
    color: white;
}

.control-btn:active {
    transform: scale(0.95);
}
</style>
