<template>
    <div class="download-page">
        <button type="button" class="back-btn" @click="handleBack">
            <span class="back-icon" aria-hidden="true">←</span>
            <span>返回</span>
        </button>

        <div class="page-header">
            <h1 class="title">下载客户端</h1>
            <div class="subtitle">同时支持 iOS, Android, macOS, Windows, Linux 版本</div>
        </div>

        <section class="section">
            <div class="section-title">
                <span class="bar"></span>
                <span class="text">电脑端</span>
            </div>
            <div class="card-grid">
                <a
                    v-for="item in desktopClients"
                    :key="item.key"
                    class="client-card"
                    :class="{ current: item.isCurrent }"
                    :href="item.href || undefined"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click.prevent="handleCardClick(item)"
                >
                    <div class="icon-wrap" aria-hidden="true">
                        <component :is="item.icon" class="icon" />
                    </div>
                    <div class="label">{{ item.label }}</div>
                    <div v-if="item.isCurrent" class="hint">本机</div>
                </a>
            </div>
        </section>

        <section class="section">
            <div class="section-title">
                <span class="bar"></span>
                <span class="text">移动端</span>
            </div>
            <div class="card-grid mobile">
                <a
                    v-for="item in mobileClients"
                    :key="item.key"
                    class="client-card"
                    :class="{ current: item.isCurrent }"
                    :href="item.href || undefined"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click.prevent="handleCardClick(item)"
                >
                    <div class="icon-wrap" aria-hidden="true">
                        <component :is="item.icon" class="icon" />
                    </div>
                    <div class="label">{{ item.label }}</div>
                    <div v-if="item.isCurrent" class="hint">本机</div>
                </a>
            </div>
        </section>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const detectPlatform = () => {
    const ua = navigator.userAgent || ''
    const p = navigator.platform || ''
    const lower = (ua + ' ' + p).toLowerCase()

    if (/android/.test(lower)) return 'android'
    if (/iphone|ipad|ipod/.test(lower)) return 'ios'
    if (/mac/.test(lower)) return 'mac'
    if (/win/.test(lower)) return 'windows'
    return 'linux'
}

const platformKey = computed(() => detectPlatform())

const desktopClients = computed(() => ([
    { key: 'windows', label: 'Windows客户端', icon: WindowsIcon, href: '' },
    { key: 'mac', label: 'macOS客户端', icon: MacIcon, href: '' },
    { key: 'kylin', label: '麒麟客户端', icon: KylinIcon, href: '' },
    { key: 'uos', label: 'UOS客户端', icon: UosIcon, href: '' },
    { key: 'ubuntu', label: 'Ubuntu客户端', icon: UbuntuIcon, href: '' },
].map((x) => ({ ...x, isCurrent: x.key === platformKey.value }))))

const mobileClients = computed(() => ([
    { key: 'android', label: 'Android客户端', icon: AndroidIcon, href: '' },
    { key: 'ios', label: 'iOS客户端', icon: AppleIcon, href: '' },
].map((x) => ({ ...x, isCurrent: x.key === platformKey.value }))))

const handleCardClick = (item) => {
    if (item.href) {
        window.open(item.href, '_blank', 'noopener,noreferrer')
        return
    }
    // 这里先不做下载地址绑定：后续接入真实链接时填充 item.href 即可
}

const handleBack = () => {
    if (window.history.length > 1) {
        router.back()
        return
    }
    router.push('/')
}

const WindowsIcon = {
    name: 'WindowsIcon',
    template: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M2.2 4.2 10.7 3v8.3H2.2V4.2Zm9.6-1.3L22 1.5v9.8H11.8V2.9ZM2.2 12.7h8.5V21l-8.5-1.2v-7.1Zm9.6 0H22v9.8l-10.2-1.4v-8.4Z"/>
      </svg>
    `,
}

const MacIcon = {
    name: 'MacIcon',
    template: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.6 2.1c.1 1-.3 2.1-1 3-.8 1-2.1 1.7-3.3 1.6-.1-1 .4-2.1 1.1-2.9.8-1 2.1-1.7 3.2-1.7ZM20.9 17.2c-.7 1.7-1 2.4-1.9 3.9-1.2 2-2.9 4.5-5 4.5-1.9 0-2.4-1.2-4.7-1.2-2.3 0-2.9 1.2-4.7 1.2-2.1 0-3.6-2.2-4.8-4.2C2 18.6 1 12.6 4.4 9.2c1.3-1.3 3-2 4.6-2 1.8 0 3.3 1.2 4.7 1.2 1.3 0 2.1-.4 3.3-.9 1-.4 2.1-.6 3.2-.4.9.1 3.2.4 4.7 2.8-3.9 2.1-3.2 7.8.9 9.5Z"/>
      </svg>
    `,
}

const AndroidIcon = {
    name: 'AndroidIcon',
    template: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7.6 6.4 6.3 4.2a.6.6 0 1 1 1-.6l1.4 2.3c1-.5 2.1-.8 3.3-.8 1.2 0 2.3.3 3.3.8l1.4-2.3a.6.6 0 1 1 1 .6l-1.3 2.2c1.7 1.1 2.9 3 2.9 5.2H4.7c0-2.2 1.2-4.1 2.9-5.2Zm-1.7 6.4h12.2V20c0 .9-.7 1.6-1.6 1.6h-9c-.9 0-1.6-.7-1.6-1.6v-7.2Zm1.4-2.6a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Zm9.4 0a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Z"/>
      </svg>
    `,
}

const AppleIcon = {
    name: 'AppleIcon',
    template: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.6 2.1c.1 1-.3 2.1-1 3-.8 1-2.1 1.7-3.3 1.6-.1-1 .4-2.1 1.1-2.9.8-1 2.1-1.7 3.2-1.7Zm4.3 15.1c-.7 1.7-1 2.4-1.9 3.9-1.2 2-2.9 4.5-5 4.5-1.9 0-2.4-1.2-4.7-1.2-2.3 0-2.9 1.2-4.7 1.2-2.1 0-3.6-2.2-4.8-4.2C2 18.6 1 12.6 4.4 9.2c1.3-1.3 3-2 4.6-2 1.8 0 3.3 1.2 4.7 1.2 1.3 0 2.1-.4 3.3-.9 1-.4 2.1-.6 3.2-.4.9.1 3.2.4 4.7 2.8-3.9 2.1-3.2 7.8.9 9.5Z"/>
      </svg>
    `,
}

const KylinIcon = {
    name: 'KylinIcon',
    template: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2c2.6 0 4.7 2.1 4.7 4.7 0 1.8-1 3.4-2.5 4.2.9.7 1.5 1.7 1.5 3 0 2.2-1.8 4-4 4H9.3c-2.2 0-4-1.8-4-4 0-1.3.6-2.4 1.5-3-1.5-.8-2.5-2.4-2.5-4.2C4.3 4.1 6.4 2 9 2h3Zm-3 2.1c-1.4 0-2.6 1.2-2.6 2.6S7.6 9.3 9 9.3h.6c.3-1.2 1.4-2.1 2.7-2.1s2.4.9 2.7 2.1H15c1.4 0 2.6-1.2 2.6-2.6S16.4 4.1 15 4.1H9Zm.3 9.2c-1 0-1.8.8-1.8 1.8s.8 1.8 1.8 1.8h2.4c1 0 1.8-.8 1.8-1.8s-.8-1.8-1.8-1.8H9.3Z"/>
      </svg>
    `,
}

const UosIcon = {
    name: 'UosIcon',
    template: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Zm2.2 5.2h1.8v6.1c0 1.1.7 1.8 1.7 1.8s1.7-.7 1.7-1.8V9.2h1.8v6.2c0 2.2-1.4 3.6-3.5 3.6s-3.5-1.4-3.5-3.6V9.2Z"/>
      </svg>
    `,
}

const UbuntuIcon = {
    name: 'UbuntuIcon',
    template: `
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 .001 20A10 10 0 0 0 12 2Zm0 4.2a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2Zm-5.2 6.5a2.1 2.1 0 1 1-3.6 2.1 2.1 2.1 0 0 1 3.6-2.1Zm12.4 0a2.1 2.1 0 1 1-3.6 2.1 2.1 2.1 0 0 1 3.6-2.1ZM12 13.7a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2Z"/>
      </svg>
    `,
}
</script>

<style scoped>
.download-page {
    padding: 36px 24px 40px;
    min-height: calc(100vh - 16px);
    background: #f5f7fb;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    position: relative;
}

.back-btn {
    position: absolute;
    top: 16px;
    left: 16px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid rgba(15, 23, 42, 0.10);
    background: rgba(255, 255, 255, 0.85);
    color: #0f172a;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    backdrop-filter: blur(6px);
}

.back-btn:hover {
    transform: translateY(-1px);
    background: #ffffff;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.back-icon {
    font-size: 14px;
    line-height: 1;
}

.page-header {
    text-align: center;
    margin: 8px auto 26px;
}

.title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #0f172a;
}

.subtitle {
    margin-top: 10px;
    font-size: 14px;
    color: #64748b;
}

.section {
    max-width: 980px;
    margin: 0 auto 22px;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0 14px;
    color: #0f172a;
}

.section-title .bar {
    width: 3px;
    height: 14px;
    background: #2563eb;
    border-radius: 2px;
}

.section-title .text {
    font-size: 13px;
    font-weight: 600;
}

.card-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 18px;
}

.card-grid.mobile {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 420px;
}

.client-card {
    text-decoration: none;
    background: #ffffff;
    border-radius: 10px;
    border: 1px solid rgba(15, 23, 42, 0.06);
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
    height: 132px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #0f172a;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    position: relative;
}

.client-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 26px rgba(15, 23, 42, 0.09);
    border-color: rgba(37, 99, 235, 0.22);
}

.client-card.current::after {
    content: " ";
    position: absolute;
    inset: 0;
    border-radius: 10px;
    box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.22);
    pointer-events: none;
}

.icon-wrap {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: rgba(37, 99, 235, 0.10);
    display: grid;
    place-items: center;
    color: #2563eb;
}

.icon {
    width: 28px;
    height: 28px;
}

.label {
    font-size: 13px;
    font-weight: 500;
    color: #334155;
}

.hint {
    font-size: 11px;
    color: #94a3b8;
    background: #f1f5f9;
    padding: 3px 8px;
    border-radius: 999px;
    line-height: 1;
    margin-top: -4px;
}

@media (max-width: 980px) {
    .card-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .download-page {
        padding: 28px 14px 34px;
    }

    .title {
        font-size: 24px;
    }

    .card-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
    }
}
</style>
