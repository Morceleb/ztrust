<template>
  <div class="overview">
    <div class="grid-top">
      <section class="panel panel-util">
        <h2 class="panel-title">系统资源占用</h2>
        <div class="donut-row">
          <div v-for="m in metrics" :key="m.key" class="donut-cell">
            <div :ref="(el) => setDonutRef(el, m.key)" class="donut-chart" />
            <span class="donut-label">{{ m.label }}</span>
          </div>
        </div>
      </section>
      <section class="panel panel-summary">
        <h2 class="panel-title">资源状态汇总</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-num summary-total">{{ resourceStats.total }}</span>
            <span class="summary-cap">资源总数</span>
          </div>
          <div class="summary-item">
            <span class="summary-num summary-ok">{{ resourceStats.active }}</span>
            <span class="summary-cap">启用资源数</span>
          </div>
          <div class="summary-item">
            <span class="summary-num summary-bad">{{ resourceStats.inactive }}</span>
            <span class="summary-cap">禁用资源数</span>
          </div>
        </div>
      </section>
    </div>

    <div class="grid-mid">
      <section class="panel panel-anomaly">
        <h2 class="panel-title">异常拦截</h2>
        <p class="anomaly-num">{{ anomalyCount }}</p>
        <p class="anomaly-note">备注：备选库为空时可点击刷新重试</p>
        <button type="button" class="btn-ghost" @click="refreshAnomaly">刷新</button>
      </section>
      <section class="panel panel-chart">
        <h2 class="panel-title">最活跃用户</h2>
        <div ref="roseRef" class="chart-box chart-rose" />
      </section>
      <section class="panel panel-chart">
        <h2 class="panel-title">实时访问量</h2>
        <div ref="trafficRef" class="chart-box" />
      </section>
    </div>

    <section class="panel panel-wide">
      <h2 class="panel-title">最常被访问资源</h2>
      <div ref="trendRef" class="chart-box chart-trend" />
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { listResources } from '@/api/resource.js'

const metrics = [
  { key: 'cpu', label: 'CPU 占用', value: 27 },
  { key: 'mem', label: '内存占用', value: 60 },
  { key: 'bw', label: '带宽占用', value: 69 }
]

const resourceStats = ref({ total: 0, active: 0, inactive: 0 })
const anomalyCount = ref(12)

const donutRefs = {}
const chartInstances = {}

function setDonutRef(el, key) {
  if (el) donutRefs[key] = el
}

function donutOption(pct) {
  const rest = 100 - pct
  return {
    animationDuration: 600,
    series: [
      {
        type: 'pie',
        radius: ['58%', '78%'],
        silent: true,
        label: { show: false },
        data: [
          { value: pct, itemStyle: { color: '#1890ff' } },
          { value: rest, itemStyle: { color: '#e8ecf0' } }
        ]
      }
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: { text: `${pct}%`, fontSize: 20, fontWeight: 600, fill: '#262626' }
      }
    ]
  }
}

function buildRoseOption() {
  return {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: [16, 90],
        roseType: 'area',
        itemStyle: { borderRadius: 4 },
        label: { color: '#595959' },
        data: [
          { value: 32, name: '张三', itemStyle: { color: '#1890ff' } },
          { value: 28, name: '李四', itemStyle: { color: '#40a9ff' } },
          { value: 22, name: '王五', itemStyle: { color: '#69c0ff' } },
          { value: 18, name: '赵六', itemStyle: { color: '#91d5ff' } },
          { value: 14, name: '其他', itemStyle: { color: '#bae7ff' } }
        ]
      }
    ]
  }
}

function buildTrafficOption() {
  const times = ['12:25', '12:26', '12:27', '12:28', '12:29', '12:30']
  const vals = [12, 28, 22, 45, 38, 52]
  return {
    grid: { left: 48, right: 16, top: 24, bottom: 28 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: times, axisLine: { lineStyle: { color: '#d9d9d9' } } },
    yAxis: {
      type: 'value',
      max: 60,
      splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } }
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: '#1890ff' },
        areaStyle: { color: 'rgba(24,144,255,0.12)' },
        data: vals
      }
    ]
  }
}

function buildTrendOption() {
  const days = ['3月1日', '3月2日', '3月3日', '3月4日', '3月5日', '3月6日']
  return {
    grid: { left: 52, right: 24, top: 40, bottom: 28 },
    legend: {
      data: ['资源1', '资源2', '资源3', '资源4'],
      top: 4,
      textStyle: { color: '#595959' }
    },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', boundaryGap: false, data: days },
    yAxis: { type: 'value', max: 250, splitLine: { lineStyle: { type: 'dashed' } } },
    series: [
      { name: '资源1', type: 'line', smooth: true, data: [120, 132, 101, 134, 90, 130], color: '#1890ff' },
      { name: '资源2', type: 'line', smooth: true, data: [80, 92, 71, 94, 120, 110], color: '#52c41a' },
      { name: '资源3', type: 'line', smooth: true, data: [60, 72, 91, 64, 109, 140], color: '#faad14' },
      { name: '资源4', type: 'line', smooth: true, data: [40, 62, 51, 84, 69, 90], color: '#722ed1' }
    ]
  }
}

const roseRef = ref(null)
const trafficRef = ref(null)
const trendRef = ref(null)

function resizeAll() {
  Object.values(chartInstances).forEach((c) => c?.resize())
}

function refreshAnomaly() {
  anomalyCount.value = 8 + Math.floor(Math.random() * 10)
}

async function fetchResourceStats() {
  const res = await listResources({})
  if (res.code !== 200) {
    resourceStats.value = { total: 0, active: 0, inactive: 0 }
    return
  }
  const raw = res.data
  const list = Array.isArray(raw)
    ? raw
    : (Array.isArray(raw?.list) ? raw.list : Array.isArray(raw?.records) ? raw.records : [])

  const total = list.length
  const active = list.filter((item) => Boolean(item.isActive ?? item.is_active)).length
  resourceStats.value = { total, active, inactive: total - active }
}

onMounted(() => {
  metrics.forEach((m) => {
    const el = donutRefs[m.key]
    if (!el) return
    const ch = echarts.init(el)
    chartInstances[m.key] = ch
    ch.setOption(donutOption(m.value))
  })

  if (roseRef.value) {
    const r = echarts.init(roseRef.value)
    chartInstances.rose = r
    r.setOption(buildRoseOption())
  }
  if (trafficRef.value) {
    const t = echarts.init(trafficRef.value)
    chartInstances.traffic = t
    t.setOption(buildTrafficOption())
  }
  if (trendRef.value) {
    const tr = echarts.init(trendRef.value)
    chartInstances.trend = tr
    tr.setOption(buildTrendOption())
  }

  window.addEventListener('resize', resizeAll)
  fetchResourceStats()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeAll)
  Object.values(chartInstances).forEach((c) => c?.dispose())
})
</script>

<style scoped>
.overview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.panel-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 600;
  color: #262626;
}

.grid-top {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 16px;
}

@media (max-width: 1100px) {
  .grid-top { grid-template-columns: 1fr; }
}

.donut-row {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.donut-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 120px;
}

.donut-chart {
  width: 140px;
  height: 140px;
}

.donut-label {
  font-size: 12px;
  color: #8c8c8c;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-items: center;
  min-height: 140px;
}

@media (max-width: 768px) {
  .summary-grid { grid-template-columns: 1fr; }
}

.summary-item {
  text-align: center;
  padding: 12px;
  border-radius: 10px;
  background: #fafafa;
}

.summary-num {
  display: block;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

.summary-total { color: #1890ff; }
.summary-ok { color: #52c41a; }
.summary-bad { color: #f5222d; }

.summary-cap {
  font-size: 13px;
  color: #8c8c8c;
  margin-top: 4px;
  display: block;
}

.grid-mid {
  display: grid;
  grid-template-columns: 220px 1fr 1fr;
  gap: 16px;
}

@media (max-width: 1200px) {
  .grid-mid { grid-template-columns: 1fr; }
}

.panel-anomaly {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.anomaly-num {
  font-size: 42px;
  font-weight: 700;
  color: #f5222d;
  margin: 0 0 8px;
  line-height: 1;
}

.anomaly-note {
  font-size: 12px;
  color: #8c8c8c;
  margin: 0 0 12px;
  line-height: 1.5;
}

.btn-ghost {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #595959;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.btn-ghost:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.chart-box {
  width: 100%;
  height: 260px;
}

.chart-rose {
  min-height: 260px;
}

.chart-trend {
  height: 320px;
}

.panel-wide {
  min-height: 360px;
}
</style>
