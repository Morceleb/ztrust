/**
 * 键盘输入采集
 * 支持快捷键检测和后端记录
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';

// 快捷键到语义操作的映射
const SHORTCUT_SEMANTIC_MAP = {
    'Ctrl+C': 'Copy',
    'Ctrl+V': 'Paste',
    'Ctrl+X': 'Cut',
    'Ctrl+Z': 'Undo',
    'Ctrl+Y': 'Redo',
    'Ctrl+S': 'Save',
    'Ctrl+A': 'SelectAll',
    'Ctrl+F': 'Find',
    'Ctrl+P': 'Print',
    'Delete': 'Delete',
    'Backspace': 'Delete',
    'Enter': 'Confirm',
    'Escape': 'Cancel',
    'Tab': 'Tab',
    'Ctrl+N': 'New',
    'Ctrl+O': 'Open',
    'Ctrl+W': 'Close',
    'Ctrl+Q': 'Quit',
    'Alt+F4': 'Quit',
    'Alt+Tab': 'SwitchWindow',
    'Ctrl+Tab': 'SwitchTab',
    'Ctrl+Shift+T': 'ReopenClosedTab',
    'F5': 'Refresh',
    'F11': 'Fullscreen',
    'Ctrl++': 'ZoomIn',
    'Ctrl+-': 'ZoomOut',
    'Ctrl+0': 'ZoomReset',
    'Ctrl+D': 'Bookmark',
    'Ctrl+Shift+N': 'NewIncognito',
    'Ctrl+Shift+P': 'NewPrivateWindow',
    'Ctrl+Shift+Delete': 'ClearBrowsingData',
    'Ctrl+Shift+Esc': 'TaskManager',
    'Ctrl+Alt+Delete': 'SecurityOptions',
    'Win+D': 'ShowDesktop',
    'Win+E': 'Explorer',
    'Win+R': 'Run',
    'Win+L': 'Lock',
    'Win+I': 'Settings',
};

// 检测是否是快捷键
const detectShortcut = (event) => {
    const parts = [];

    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');

    // 获取按键名称
    let key = event.key;
    if (key === ' ') key = 'Space';
    if (key.length === 1) key = key.toUpperCase();
    parts.push(key);

    return parts.join('+');
};

// 格式化快捷键用于显示
const formatShortcut = (event) => {
    return detectShortcut(event);
};

export function useKeystrokeTracker() {
    const events = ref([]);
    const isTracking = ref(false);
    let keyDownTime = null;

    // 记录按键按下
    const handleKeyDown = async (event) => {
        // 检测快捷键（包含修饰键的组合键）
        const hasModifier = event.ctrlKey || event.altKey || event.metaKey || event.shiftKey;
        const isFunctional = ['Delete', 'Backspace', 'Enter', 'Escape', 'Tab', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(event.key);

        if (hasModifier || isFunctional) {
            const keyCombo = formatShortcut(event);

            // 记录到本地
            events.value.push({
                type: 'shortcut',
                combo: keyCombo,
                code: event.code,
                time: Date.now(),
            });

            // 尝试记录到后端
            try {
                if (window.__TAURI__) {
                    await invoke('activity_record_shortcut', { keyCombo });
                    console.log('[KeystrokeTracker] 快捷键已记录:', keyCombo);
                }
            } catch (err) {
                console.log('[KeystrokeTracker] 后端记录失败:', err);
            }

            // 如果是带修饰键的组合键，跳过普通按键记录
            if (hasModifier) return;
        }

        // 忽略功能键和组合键（仅记录可打印单字符）
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        if (event.key.length > 1) return;

        keyDownTime = Date.now();

        events.value.push({
            type: 'down',
            key: event.key,
            code: event.code,
            time: keyDownTime,
        });
    };

    // 记录按键释放
    const handleKeyUp = (event) => {
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        if (event.key.length > 1) return;

        const pressDuration = keyDownTime ? Date.now() - keyDownTime : 0;

        events.value.push({
            type: 'up',
            key: event.key,
            code: event.code,
            time: Date.now(),
            duration: pressDuration,
        });

        keyDownTime = null;
    };

    // 开始追踪
    const start = () => {
        if (isTracking.value) return;

        isTracking.value = true;
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        console.log('[KeystrokeTracker] 启动');
    };

    // 停止追踪
    const stop = () => {
        isTracking.value = false;
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
    };

    // 获取数据
    const getData = () => {
        if (events.value.length === 0) return null;

        // 统计普通按键
        const keyFrequencies = {};
        const durations = [];
        const shortcutEvents = [];
        let keyDownTime = null;

        events.value.forEach(event => {
            if (event.type === 'shortcut') {
                shortcutEvents.push(event);
            } else if (event.type === 'down') {
                keyDownTime = event.time;
            } else if (event.type === 'up') {
                keyFrequencies[event.key] = (keyFrequencies[event.key] || 0) + 1;
                if (keyDownTime) {
                    durations.push(event.time - keyDownTime);
                }
            }
        });

        // 统计快捷键
        const shortcutFrequencies = {};
        shortcutEvents.forEach(event => {
            shortcutFrequencies[event.combo] = (shortcutFrequencies[event.combo] || 0) + 1;
        });

        const avgDuration = durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;

        return {
            keystrokeCount: events.value.filter(e => e.type === 'up').length,
            uniqueKeys: Object.keys(keyFrequencies).length,
            keyFrequencies,
            avgDuration,
            // 快捷键统计
            shortcutCount: shortcutEvents.length,
            uniqueShortcuts: Object.keys(shortcutFrequencies).length,
            shortcutFrequencies,
            timestamp: new Date().toISOString(),
        };
    };

    // 清空数据
    const clear = () => {
        events.value = [];
    };

    // 清理
    onUnmounted(() => {
        stop();
        clear();
    });

    return {
        events,
        isTracking,
        start,
        stop,
        getData,
        clear,
    };
}

export default useKeystrokeTracker;
