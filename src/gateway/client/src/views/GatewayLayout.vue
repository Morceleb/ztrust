<template>
  <div class="gw-layout">
    <aside class="gw-sidebar">
      <div class="gw-brand">
        <div class="gw-brand-logo" />
        <span class="gw-brand-title">零信任网关监控面板</span>
      </div>

      <nav class="gw-nav">
        <div class="gw-nav-group">
          <button
            type="button"
            class="gw-nav-parent"
            :class="{ open: monitorOpen }"
            @click="monitorOpen = !monitorOpen"
          >
            <span class="gw-nav-parent-inner">
              <svg class="gw-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>网关监控</span>
            </span>
            <svg class="gw-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <ul v-show="monitorOpen" class="gw-subnav">
            <li>
              <router-link to="/overview" class="gw-subnav-link" active-class="active">概览</router-link>
            </li>
            <li>
              <router-link to="/resources" class="gw-subnav-link" active-class="active">资源管理</router-link>
            </li>
            <li>
              <router-link to="/logs" class="gw-subnav-link" active-class="active">日志管理</router-link>
            </li>
          </ul>
        </div>
      </nav>

      <div class="gw-sidebar-foot">
        <div class="gw-user">
          <div class="gw-user-avatar">管</div>
          <div class="gw-user-meta">
            <span class="gw-user-name">管理员</span>
            <span class="gw-user-role">网关运维</span>
          </div>
        </div>
      </div>
    </aside>

    <main class="gw-main">
      <header class="gw-header">
        <h1 class="gw-page-title">{{ pageTitle }}</h1>
      </header>
      <div class="gw-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const monitorOpen = ref(true)

const pageTitle = computed(() => route.meta?.title || '概览')
</script>

<style scoped>
.gw-layout {
  display: flex;
  min-height: 100vh;
  background: #f0f2f5;
}

.gw-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #0b3a5c 0%, #0d4a6e 48%, #0a3550 100%);
  color: rgba(255, 255, 255, 0.88);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);
}

.gw-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.gw-brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #69c0ff 0%, #1890ff 100%);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.45);
  flex-shrink: 0;
}

.gw-brand-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: 0.02em;
}

.gw-nav {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}

.gw-nav-group {
  padding: 0 10px;
}

.gw-nav-parent {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.gw-nav-parent:hover {
  background: rgba(255, 255, 255, 0.1);
}

.gw-nav-parent.open .gw-chevron {
  transform: rotate(180deg);
}

.gw-nav-parent-inner {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gw-ico {
  width: 18px;
  height: 18px;
  opacity: 0.9;
  flex-shrink: 0;
}

.gw-chevron {
  width: 16px;
  height: 16px;
  opacity: 0.65;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.gw-subnav {
  list-style: none;
  margin: 6px 0 0;
  padding: 0 0 4px 8px;
}

.gw-subnav li {
  margin: 2px 0;
}

.gw-subnav-link {
  display: block;
  padding: 10px 12px 10px 36px;
  border-radius: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.72);
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
  position: relative;
}

.gw-subnav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.gw-subnav-link.active {
  color: #fff;
  background: rgba(230, 247, 255, 0.18);
  font-weight: 500;
}

.gw-subnav-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: #69c0ff;
}

.gw-sidebar-foot {
  padding: 14px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.gw-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gw-user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #40a9ff, #096dd9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.gw-user-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gw-user-name {
  font-size: 14px;
  font-weight: 500;
}

.gw-user-role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.gw-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.gw-header {
  height: 56px;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.06);
  flex-shrink: 0;
}

.gw-page-title {
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

.gw-content {
  flex: 1;
  padding: 20px 24px 28px;
  overflow: auto;
}
</style>
