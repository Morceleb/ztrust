<template>
  <div class="policy-editor">
    <div class="editor-toolbar">
      <div class="toolbar-title-wrap">
        <button class="back-btn" type="button" @click="router.push('/decision-graphs')">
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          返回
        </button>
        <div>
          <h2>{{ isNew ? '新建策略' : (form.name || '策略详情') }}</h2>
          <p>{{ readOnly ? '当前策略为只读状态，可查看语义配置与决策图' : '编辑策略语义，右侧将生成只读决策图预览' }}</p>
        </div>
      </div>
      <button v-if="!readOnly" class="btn btn-primary" type="button" :disabled="saving" @click="saveDraft">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        {{ saving ? '保存中...' : '保存草稿' }}
      </button>
    </div>

    <div v-if="loading" class="loading-card">正在加载策略...</div>
    <div v-else class="editor-grid">
      <div class="config-card">
        <div v-if="Object.keys(errors).length" class="validation-summary">
          <strong>表单校验失败</strong><span>{{ firstError }}</span>
        </div>

        <fieldset :disabled="readOnly">
          <section class="form-section">
            <div class="section-heading"><span class="section-index">1</span><div><h3>基本信息</h3><p>定义策略名称、生效时间和说明</p></div></div>
            <div class="form-grid">
              <label class="form-field"><span>策略名称 <em>*</em></span><input v-model="form.name" :class="{ invalid: errors.name }" placeholder="请输入策略名称" /></label>
              <label class="form-field"><span>生效时间</span><input v-model="form.effectiveAt" type="datetime-local" /></label>
              <label class="form-field full"><span>策略说明</span><textarea v-model="form.description" rows="3" placeholder="说明策略的适用场景与目的"></textarea></label>
            </div>
            <div v-if="!isNew" class="readonly-meta">
              <div><span>版本</span><strong>v{{ form.version }}</strong></div><div><span>状态</span><strong>{{ statusLabel(form.status) }}</strong></div>
              <div><span>修订号</span><strong>{{ form.revision }}</strong></div><div><span>策略族 ID</span><strong>{{ form.policyFamilyId }}</strong></div>
            </div>
          </section>

          <section class="form-section">
            <div class="section-heading"><span class="section-index">2</span><div><h3>主体选择器</h3><p>匹配策略适用的访问主体</p></div></div>
            <div class="form-grid">
              <label class="form-field"><span>主体类型 <em>*</em></span><input v-model="form.subjectSelector.subjectType" :class="{ invalid: errors.subjectType }" placeholder="例如：employee" /></label>
              <label class="form-field"><span>选择器 ID</span><input v-model="form.subjectSelector.selectorId" placeholder="可选" /></label>
            </div>
            <div class="repeat-list">
              <div class="repeat-title"><span>主体条件</span><button class="text-btn" type="button" @click="addPredicate">+ 添加条件</button></div>
              <div v-if="!form.subjectSelector.predicates.length" class="inline-empty">暂无主体条件</div>
              <div v-for="(item, index) in form.subjectSelector.predicates" :key="`predicate-${index}`" class="repeat-row predicate-row">
                <input v-model="item.attributePath" placeholder="attributePath *" />
                <select v-model="item.operator"><option v-for="operator in operators" :key="operator">{{ operator }}</option></select>
                <input v-model="item.valuesText" placeholder="values，逗号分隔 *" />
                <button class="remove-btn" type="button" title="删除条件" @click="form.subjectSelector.predicates.splice(index, 1)">×</button>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="section-heading"><span class="section-index">3</span><div><h3>资源</h3><p>描述受策略保护的资源</p></div></div>
            <div class="form-grid three">
              <label class="form-field"><span>资源 ID <em>*</em></span><input v-model="form.resource.resourceId" :class="{ invalid: errors.resourceId }" placeholder="resourceId" /></label>
              <label class="form-field"><span>资源类型 <em>*</em></span><input v-model="form.resource.resourceType" :class="{ invalid: errors.resourceType }" placeholder="例如：web-application" /></label>
              <label class="form-field"><span>资源模式 <em>*</em></span><input v-model="form.resource.resourcePattern" :class="{ invalid: errors.resourcePattern }" placeholder="例如：/finance/**" /></label>
              <label class="form-field"><span>资源级别</span><input v-model="form.resource.resourceLevel" placeholder="可选" /></label>
              <label class="form-field"><span>所属域</span><input v-model="form.resource.ownerDomain" placeholder="可选" /></label>
              <label class="form-field full"><span>资源属性（JSON）</span><textarea v-model="form.resource.attributesText" :class="{ invalid: errors.attributes }" rows="5" placeholder='{&#10;  "environment": "production"&#10;}'></textarea><small>请勿写入 password、secret、privateKey、token 等敏感字段。</small></label>
            </div>
          </section>

          <section class="form-section">
            <div class="section-heading"><span class="section-index">4</span><div><h3>动作</h3><p>定义请求执行的语义动作</p></div></div>
            <div class="form-grid three">
              <label class="form-field"><span>动作 ID</span><input v-model="form.action.actionId" placeholder="可选" /></label>
              <label class="form-field"><span>语义动作 <em>*</em></span><input v-model="form.action.semanticAction" :class="{ invalid: errors.semanticAction }" placeholder="例如：访问财务系统" /></label>
              <label class="form-field"><span>请求方法 <em>*</em></span><input v-model="form.action.requestMethodsText" :class="{ invalid: errors.requestMethods }" placeholder="GET,POST" /></label>
              <label class="form-field checkbox-field"><span>关键动作 <em>*</em></span><span class="checkbox-wrap"><input v-model="form.action.critical" type="checkbox" /> {{ form.action.critical ? '是' : '否' }}</span></label>
              <label class="form-field"><span>关键阈值</span><input v-model.number="form.action.criticalThreshold" :class="{ invalid: errors.criticalThreshold }" type="number" min="0" /></label>
            </div>
          </section>

          <section class="form-section">
            <div class="section-heading"><span class="section-index">5</span><div><h3>条件</h3><p>配置 0 至多个策略约束条件</p></div></div>
            <div class="repeat-list">
              <div class="repeat-title"><span>策略条件</span><button class="text-btn" type="button" @click="addCondition">+ 添加条件</button></div>
              <div v-if="!form.conditions.length" class="inline-empty">暂无策略条件</div>
              <div v-for="(item, index) in form.conditions" :key="`condition-${index}`" class="condition-card">
                <div class="condition-header"><span>条件 {{ index + 1 }}</span><button class="remove-link" type="button" @click="form.conditions.splice(index, 1)">删除</button></div>
                <div class="form-grid three">
                  <label class="form-field"><span>条件 ID</span><input v-model="item.conditionId" placeholder="可选" /></label>
                  <label class="form-field"><span>属性路径 <em>*</em></span><input v-model="item.attributePath" placeholder="attributePath" /></label>
                  <label class="form-field"><span>操作符 <em>*</em></span><select v-model="item.operator"><option v-for="operator in operators" :key="operator">{{ operator }}</option></select></label>
                  <label class="form-field"><span>值 <em>*</em></span><input v-model="item.valuesText" placeholder="逗号分隔" /></label>
                  <label class="form-field"><span>值类型 <em>*</em></span><input v-model="item.valueType" placeholder="例如：string" /></label>
                </div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="section-heading with-toggle"><span class="section-index">6</span><div><h3>风险约束</h3><p>按信任分与风险评估限制访问</p></div><label class="switch-label"><input v-model="form.riskEnabled" type="checkbox" /> 启用风险约束</label></div>
            <div v-if="form.riskEnabled" class="form-grid three">
              <label class="form-field"><span>最低信任分</span><input v-model.number="form.riskConstraint.minTrustScore" :class="{ invalid: errors.riskScore }" type="number" min="0" max="100" /></label>
              <label class="form-field"><span>最高信任分</span><input v-model.number="form.riskConstraint.maxTrustScore" :class="{ invalid: errors.riskScore }" type="number" min="0" max="100" /></label>
              <label class="form-field"><span>允许风险等级</span><input v-model="form.riskConstraint.allowedRiskLevelsText" placeholder="LOW,MEDIUM" /></label>
              <label class="form-field"><span>异常检测</span><select v-model="form.riskConstraint.anomalyDetected"><option value="">不限</option><option value="true">true</option><option value="false">false</option></select></label>
              <label class="form-field"><span>最大评估时效</span><input v-model="form.riskConstraint.maxAssessmentAge" placeholder="例如：PT5M" /></label>
            </div>
            <div v-else class="inline-empty">未启用时保存为 riskConstraint = null</div>
          </section>

          <section class="form-section last">
            <div class="section-heading"><span class="section-index">7</span><div><h3>策略效果</h3><p>定义匹配策略后的最终效果</p></div></div>
            <div class="effect-options">
              <label :class="['effect-option', 'allow', { selected: form.policyEffect.effect === 'ALLOW' }]"><input v-model="form.policyEffect.effect" type="radio" value="ALLOW" /><strong>允许</strong><span>ALLOW</span></label>
              <label :class="['effect-option', 'deny', { selected: form.policyEffect.effect === 'DENY' }]"><input v-model="form.policyEffect.effect" type="radio" value="DENY" /><strong>拒绝</strong><span>DENY</span></label>
            </div>
            <div class="form-grid">
              <label class="form-field"><span>TTL <em>*</em></span><input v-model="form.policyEffect.ttl" :class="{ invalid: errors.ttl }" placeholder="例如：PT10M" /><small>请输入 ISO-8601 Duration。</small></label>
              <label class="form-field"><span>推荐动作</span><input v-model="form.policyEffect.recommendedAction" placeholder="可选" /></label>
            </div>
          </section>
        </fieldset>
      </div>

      <aside class="preview-card">
        <div class="preview-heading"><div><h3>决策图预览</h3><p>由当前策略语义自动生成 · 只读</p></div><span class="readonly-badge">只读</span></div>
        <div class="graph-scroll">
          <div class="graph-canvas" :style="{ height: `${graphHeight}px` }">
            <svg class="graph-lines" :viewBox="`0 0 560 ${graphHeight}`" preserveAspectRatio="none">
              <path v-for="node in previewNodes" :key="`edge-${node.id}`" :d="edgePath(node)" />
            </svg>
            <div class="graph-node root-node" :style="{ top: `${rootTop}px` }">
              <span class="node-type">POLICY</span><strong>{{ form.name || '未命名策略' }}</strong><small>v{{ form.version || 1 }} · {{ statusLabel(form.status || 'DRAFT') }}</small>
            </div>
            <div v-for="node in previewNodes" :key="node.id" class="graph-node target-node" :class="node.className" :style="{ top: `${node.y}px` }">
              <span class="node-type">{{ node.type }}</span><strong :title="node.title">{{ node.title }}</strong><small :title="node.subtitle">{{ node.subtitle }}</small>
            </div>
          </div>
        </div>
        <div class="graph-legend"><span><i></i>由 POLICY 指向语义节点</span><span>{{ previewNodes.length + 1 }} 个节点</span></div>
      </aside>
    </div>

    <Transition name="toast-fade"><div v-if="toast.visible" class="toast" :class="toast.type">{{ toast.message }}</div></Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createPolicy, getPolicy, queryPolicyGraph, updatePolicyDraft } from '@/api/policy.js'

const route = useRoute()
const router = useRouter()
const operators = ['EQ', 'IN', 'CONTAINS_ANY', 'CONTAINS_ALL', 'GTE', 'LTE', 'BETWEEN', 'CIDR_CONTAINS']
const loading = ref(false)
const saving = ref(false)
const errors = reactive({})
const toast = reactive({ visible: false, message: '', type: 'success' })
const persistedGraph = ref(null)
let toastTimer

const blankRisk = () => ({ minTrustScore: 0, maxTrustScore: 100, allowedRiskLevelsText: '', anomalyDetected: '', maxAssessmentAge: '' })
const form = reactive({
  policyId: '', policyFamilyId: '', name: '', description: '', version: 1, status: 'DRAFT', revision: 0, effectiveAt: '',
  subjectSelector: { selectorId: '', subjectType: '', predicates: [] },
  resource: { resourceId: '', resourceType: '', resourcePattern: '', resourceLevel: '', ownerDomain: '', attributesText: '{\n  \"environment\": \"production\"\n}' },
  action: { actionId: '', semanticAction: '', requestMethodsText: '', critical: false, criticalThreshold: 0 },
  conditions: [], riskEnabled: false, riskConstraint: blankRisk(),
  policyEffect: { effect: 'ALLOW', ttl: 'PT10M', recommendedAction: '' }
})

const isNew = computed(() => !route.params.policyId)
const readOnly = computed(() => !isNew.value && (form.status !== 'DRAFT' || route.query.mode === 'view'))
const firstError = computed(() => Object.values(errors)[0] || '')
const statusLabels = { DRAFT: '草稿', SCHEDULED: '已计划', ACTIVE: '生效中', RETIRED: '已退役', ARCHIVED: '已归档', PURGED: '已清除' }
const splitValues = value => String(value || '').split(',').map(item => item.trim()).filter(Boolean)
const nullable = value => String(value || '').trim() || null

function statusLabel(status) { return statusLabels[status] || status || '-' }
function showToast(message, type = 'success') { toast.message = message; toast.type = type; toast.visible = true; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.visible = false }, 2800) }
function addPredicate() { form.subjectSelector.predicates.push({ attributePath: '', operator: 'EQ', valuesText: '' }) }
function addCondition() { form.conditions.push({ conditionId: '', attributePath: '', operator: 'EQ', valuesText: '', valueType: 'string' }) }
function toDateInput(value) { return value ? String(value).slice(0, 16) : '' }

function hydrate(policy) {
  form.policyId = policy.policyId || ''; form.policyFamilyId = policy.policyFamilyId || ''; form.name = policy.name || ''; form.description = policy.description || ''
  form.version = policy.version || 1; form.status = policy.status || 'DRAFT'; form.revision = Number(policy.revision) || 0; form.effectiveAt = toDateInput(policy.effectiveAt)
  form.subjectSelector = { selectorId: policy.subjectSelector?.selectorId || '', subjectType: policy.subjectSelector?.subjectType || '', predicates: (policy.subjectSelector?.predicates || []).map(item => ({ ...item, valuesText: (item.values || []).join(',') })) }
  form.resource = { resourceId: policy.resource?.resourceId || '', resourceType: policy.resource?.resourceType || '', resourcePattern: policy.resource?.resourcePattern || '', resourceLevel: policy.resource?.resourceLevel || '', ownerDomain: policy.resource?.ownerDomain || '', attributesText: JSON.stringify(policy.resource?.attributes || {}, null, 2) }
  form.action = { actionId: policy.action?.actionId || '', semanticAction: policy.action?.semanticAction || '', requestMethodsText: (policy.action?.requestMethods || []).join(','), critical: policy.action?.critical === true, criticalThreshold: Number(policy.action?.criticalThreshold) || 0 }
  form.conditions = (policy.conditions || []).map(item => ({ ...item, conditionId: item.conditionId || '', valuesText: (item.values || []).join(',') }))
  form.riskEnabled = Boolean(policy.riskConstraint)
  form.riskConstraint = policy.riskConstraint ? { minTrustScore: policy.riskConstraint.minTrustScore ?? 0, maxTrustScore: policy.riskConstraint.maxTrustScore ?? 100, allowedRiskLevelsText: (policy.riskConstraint.allowedRiskLevels || []).join(','), anomalyDetected: policy.riskConstraint.anomalyDetected == null ? '' : String(policy.riskConstraint.anomalyDetected), maxAssessmentAge: policy.riskConstraint.maxAssessmentAge || '' } : blankRisk()
  form.policyEffect = { effect: policy.policyEffect?.effect || 'ALLOW', ttl: policy.policyEffect?.ttl || '', recommendedAction: policy.policyEffect?.recommendedAction || '' }
}

async function loadPolicy() {
  if (isNew.value) return
  loading.value = true
  try {
    const [policyRes, graphRes] = await Promise.all([getPolicy(String(route.params.policyId)), queryPolicyGraph({ policyId: String(route.params.policyId) })])
    if (policyRes.code !== 200) throw new Error(policyRes.message || '策略加载失败')
    hydrate(policyRes.data)
    if (graphRes.code === 200) persistedGraph.value = graphRes.data
  } catch (error) {
    showToast(error.message || 'Mock/API 操作失败', 'error')
  } finally { loading.value = false }
}

function validate() {
  Object.keys(errors).forEach(key => delete errors[key])
  if (!form.name.trim()) errors.name = '请输入策略名称'
  if (!form.subjectSelector.subjectType.trim()) errors.subjectType = '请输入主体类型'
  if (!form.resource.resourceId.trim()) errors.resourceId = '请输入资源 ID'
  if (!form.resource.resourceType.trim()) errors.resourceType = '请输入资源类型'
  if (!form.resource.resourcePattern.trim()) errors.resourcePattern = '请输入资源模式'
  if (!form.action.semanticAction.trim()) errors.semanticAction = '请输入语义动作'
  if (!splitValues(form.action.requestMethodsText).length) errors.requestMethods = '请至少填写一个请求方法'
  if (Number(form.action.criticalThreshold) < 0) errors.criticalThreshold = '关键阈值必须大于或等于 0'
  form.subjectSelector.predicates.forEach((item, index) => { if (!item.attributePath.trim() || !operators.includes(item.operator) || !splitValues(item.valuesText).length) errors[`predicate${index}`] = `主体条件 ${index + 1} 信息不完整` })
  form.conditions.forEach((item, index) => { if (!item.attributePath.trim() || !operators.includes(item.operator) || !splitValues(item.valuesText).length || !item.valueType.trim()) errors[`condition${index}`] = `策略条件 ${index + 1} 信息不完整` })
  if (form.riskEnabled) {
    const min = Number(form.riskConstraint.minTrustScore), max = Number(form.riskConstraint.maxTrustScore)
    if (min < 0 || min > 100 || max < 0 || max > 100 || min > max) errors.riskScore = '信任分需在 0 到 100 之间，且最低分不能高于最高分'
  }
  if (!['ALLOW', 'DENY'].includes(form.policyEffect.effect)) errors.effect = '请选择策略效果'
  if (!form.policyEffect.ttl.trim()) errors.ttl = '请输入 TTL（ISO-8601 Duration）'
  try { JSON.parse(form.resource.attributesText || '{}') } catch { errors.attributes = '资源属性不是合法 JSON' }
  return Object.keys(errors).length === 0
}

function buildPayload() {
  const attributes = JSON.parse(form.resource.attributesText || '{}')
  const payload = {
    name: form.name.trim(), description: form.description.trim(),
    subjectSelector: { selectorId: nullable(form.subjectSelector.selectorId), subjectType: form.subjectSelector.subjectType.trim(), predicates: form.subjectSelector.predicates.map(item => ({ attributePath: item.attributePath.trim(), operator: item.operator, values: splitValues(item.valuesText) })) },
    resource: { resourceId: form.resource.resourceId.trim(), resourceType: form.resource.resourceType.trim(), resourcePattern: form.resource.resourcePattern.trim(), resourceLevel: nullable(form.resource.resourceLevel), ownerDomain: nullable(form.resource.ownerDomain), attributes },
    action: { actionId: nullable(form.action.actionId), semanticAction: form.action.semanticAction.trim(), requestMethods: splitValues(form.action.requestMethodsText).map(item => item.toUpperCase()), critical: Boolean(form.action.critical), criticalThreshold: Number(form.action.criticalThreshold) },
    conditions: form.conditions.map(item => ({ conditionId: nullable(item.conditionId), attributePath: item.attributePath.trim(), operator: item.operator, values: splitValues(item.valuesText), valueType: item.valueType.trim() })),
    riskConstraint: form.riskEnabled ? { minTrustScore: Number(form.riskConstraint.minTrustScore), maxTrustScore: Number(form.riskConstraint.maxTrustScore), allowedRiskLevels: splitValues(form.riskConstraint.allowedRiskLevelsText), anomalyDetected: form.riskConstraint.anomalyDetected === '' ? null : form.riskConstraint.anomalyDetected === 'true', maxAssessmentAge: nullable(form.riskConstraint.maxAssessmentAge) } : null,
    policyEffect: { effect: form.policyEffect.effect, ttl: form.policyEffect.ttl.trim(), recommendedAction: nullable(form.policyEffect.recommendedAction) },
    effectiveAt: form.effectiveAt ? new Date(form.effectiveAt).toISOString() : null
  }
  return payload
}

async function saveDraft() {
  if (!validate()) { showToast('表单校验失败，请检查必填项', 'error'); return }
  saving.value = true
  try {
    const payload = buildPayload()
    const res = isNew.value ? await createPolicy(payload) : await updatePolicyDraft(form.policyId, { ...payload, expectedRevision: form.revision })
    if (res.code !== 200) throw new Error(res.message || '保存失败')
    hydrate(res.data)
    showToast(isNew.value ? '策略创建成功' : '草稿保存成功')
    if (isNew.value) await router.replace(`/decision-graphs/${res.data.policyId}`)
  } catch (error) { showToast(error.message || 'Mock/API 操作失败', 'error') } finally { saving.value = false }
}

const previewNodes = computed(() => {
  if (readOnly.value && persistedGraph.value?.nodes?.length) return persistedGraph.value.nodes.filter(node => node.type !== 'POLICY').map((node, index) => graphNode(node.type, node.data || {}, index))
  const raw = [
    ['SUBJECT_SELECTOR', { ...form.subjectSelector, predicates: form.subjectSelector.predicates }],
    ['RESOURCE', form.resource], ['ACTION', form.action],
    ...form.conditions.map(item => ['CONDITION', item]),
    ...(form.riskEnabled ? [['RISK_CONSTRAINT', form.riskConstraint]] : []),
    ['POLICY_EFFECT', form.policyEffect]
  ]
  return raw.map(([type, data], index) => graphNode(type, data, index))
})

function graphNode(type, data, index) {
  const values = data.values || splitValues(data.valuesText)
  const methods = data.requestMethods || splitValues(data.requestMethodsText)
  const detail = {
    SUBJECT_SELECTOR: [data.subjectType || '未填写主体类型', `${data.predicates?.length || 0} 个主体条件`],
    RESOURCE: [data.resourcePattern || '未填写资源模式', data.resourceType || '未填写资源类型'],
    ACTION: [data.semanticAction || '未填写语义动作', methods.join(', ') || '未填写请求方法'],
    CONDITION: [data.attributePath || '未填写属性路径', `${data.operator || 'EQ'} · ${values.join(', ') || '未填写值'}`],
    RISK_CONSTRAINT: ['风险约束', `信任分 ${data.minTrustScore ?? 0}–${data.maxTrustScore ?? 100}`],
    POLICY_EFFECT: [data.effect === 'DENY' ? '拒绝' : '允许', `TTL ${data.ttl || '未填写'}`]
  }[type]
  return { id: `${type}-${index}`, type, title: detail[0], subtitle: detail[1], y: 24 + index * 104, className: type === 'POLICY_EFFECT' ? (data.effect === 'DENY' ? 'node-deny' : 'node-allow') : '' }
}
const graphHeight = computed(() => Math.max(520, previewNodes.value.length * 104 + 32))
const rootTop = computed(() => Math.max(24, (graphHeight.value - 86) / 2))
function edgePath(node) { const y1 = rootTop.value + 43, y2 = node.y + 43; return `M 218 ${y1} C 260 ${y1}, 266 ${y2}, 308 ${y2}` }

onMounted(loadPolicy)
</script>

<style scoped>
.policy-editor { min-height: 100%; color: #303133; }.editor-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 20px; }.toolbar-title-wrap { display: flex; align-items: center; gap: 16px; }.toolbar-title-wrap h2 { margin: 0 0 5px; font-size: 19px; }.toolbar-title-wrap p { margin: 0; color: #909399; font-size: 13px; }.back-btn { display: inline-flex; align-items: center; gap: 5px; height: 36px; padding: 0 12px; border: 1px solid #dcdfe6; border-radius: 6px; background: white; color: #606266; cursor: pointer; }.back-btn:hover { color: #409eff; border-color: #409eff; }.btn { height: 38px; display: inline-flex; align-items: center; gap: 6px; padding: 0 16px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }.btn-primary { background: #409eff; color: white; }.btn-primary:hover:not(:disabled) { background: #66b1ff; }.btn:disabled { opacity: .6; cursor: not-allowed; }
.loading-card,.config-card,.preview-card { background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,.05); }.loading-card { padding: 80px; text-align: center; color: #909399; }.editor-grid { display: grid; grid-template-columns: minmax(560px, 1.18fr) minmax(420px, .82fr); gap: 20px; align-items: start; }.config-card { padding: 24px; }.config-card fieldset { padding: 0; margin: 0; border: none; min-width: 0; }.config-card fieldset:disabled input,.config-card fieldset:disabled select,.config-card fieldset:disabled textarea { color: #606266; background: #f5f7fa; cursor: default; }.validation-summary { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 12px 14px; border: 1px solid #fde2e2; border-radius: 8px; background: #fef0f0; color: #f56c6c; font-size: 13px; }.validation-summary strong { font-size: 14px; }
.form-section { padding: 0 0 26px; margin-bottom: 26px; border-bottom: 1px solid #ebeef5; }.form-section.last { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }.section-heading { display: flex; align-items: center; gap: 11px; margin-bottom: 18px; }.section-heading.with-toggle { align-items: flex-start; }.section-index { width: 27px; height: 27px; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; border-radius: 7px; background: #ecf5ff; color: #409eff; font-size: 13px; font-weight: 600; }.section-heading h3 { margin: 0 0 3px; font-size: 16px; }.section-heading p { margin: 0; color: #909399; font-size: 12px; }.switch-label { margin-left: auto; display: flex; align-items: center; gap: 6px; color: #606266; font-size: 13px; cursor: pointer; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.form-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }.form-field { display: flex; flex-direction: column; gap: 7px; min-width: 0; color: #606266; font-size: 13px; }.form-field.full { grid-column: 1 / -1; }.form-field > span:first-child { font-weight: 500; }.form-field em { color: #f56c6c; font-style: normal; }.form-field input:not([type=checkbox]):not([type=radio]),.form-field select,.form-field textarea,.repeat-row input,.repeat-row select { width: 100%; box-sizing: border-box; border: 1px solid #dcdfe6; border-radius: 6px; background: white; color: #303133; font: inherit; outline: none; transition: border-color .2s; }.form-field input:not([type=checkbox]):not([type=radio]),.form-field select,.repeat-row input,.repeat-row select { height: 38px; padding: 0 11px; }.form-field textarea { padding: 10px 11px; resize: vertical; line-height: 1.5; }.form-field input:focus,.form-field select:focus,.form-field textarea:focus,.repeat-row input:focus,.repeat-row select:focus { border-color: #409eff; }.form-field .invalid { border-color: #f56c6c !important; }.form-field small { color: #909399; line-height: 1.45; }.checkbox-field { justify-content: flex-start; }.checkbox-wrap { height: 38px; display: flex; align-items: center; gap: 7px; font-weight: normal !important; }.readonly-meta { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 17px; padding: 13px; background: #f5f7fa; border-radius: 8px; }.readonly-meta div { display: flex; flex-direction: column; min-width: 0; gap: 4px; }.readonly-meta span { color: #909399; font-size: 12px; }.readonly-meta strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #606266; font-size: 13px; }
.repeat-list { padding: 14px; background: #fafafa; border: 1px solid #ebeef5; border-radius: 8px; }.repeat-title,.condition-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; color: #606266; font-size: 13px; font-weight: 600; }.text-btn,.remove-link { border: none; background: none; color: #409eff; font-size: 13px; cursor: pointer; }.remove-link { color: #f56c6c; }.inline-empty { padding: 16px; text-align: center; color: #909399; font-size: 13px; background: #fafafa; border-radius: 7px; }.repeat-row { display: grid; grid-template-columns: 1.1fr 150px 1.1fr 30px; gap: 9px; margin-top: 9px; }.remove-btn { width: 30px; height: 38px; border: 1px solid #fde2e2; border-radius: 6px; background: #fef0f0; color: #f56c6c; font-size: 20px; cursor: pointer; }.condition-card { margin-top: 10px; padding: 14px; background: white; border: 1px solid #ebeef5; border-radius: 8px; }.condition-header { margin-bottom: 13px; }
.effect-options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }.effect-option { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 9px; padding: 13px; border: 1px solid #dcdfe6; border-radius: 8px; color: #606266; cursor: pointer; }.effect-option span { color: #909399; font-size: 12px; }.effect-option.allow.selected { border-color: #67c23a; background: #f0f9eb; }.effect-option.deny.selected { border-color: #f56c6c; background: #fef0f0; }
.preview-card { position: sticky; top: 0; overflow: hidden; }.preview-heading { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px; border-bottom: 1px solid #ebeef5; }.preview-heading h3 { margin: 0 0 4px; font-size: 16px; }.preview-heading p { margin: 0; color: #909399; font-size: 12px; }.readonly-badge { padding: 4px 9px; border-radius: 11px; background: #f4f4f5; color: #909399; font-size: 12px; }.graph-scroll { overflow: auto; max-height: calc(100vh - 230px); background: #fafafa; }.graph-canvas { position: relative; width: 560px; min-width: 100%; }.graph-lines { position: absolute; inset: 0; width: 560px; height: 100%; pointer-events: none; }.graph-lines path { fill: none; stroke: #c0c4cc; stroke-width: 1.5; }.graph-node { position: absolute; width: 190px; height: 86px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; padding: 11px 13px; border: 1px solid #ebeef5; border-radius: 10px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,.05); }.root-node { left: 28px; border-color: #409eff; box-shadow: 0 3px 10px rgba(64,158,255,.12); }.target-node { left: 308px; }.graph-node .node-type { margin-bottom: 5px; color: #909399; font-size: 10px; letter-spacing: .35px; }.graph-node strong,.graph-node small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.graph-node strong { margin-bottom: 4px; color: #303133; font-size: 13px; }.graph-node small { color: #909399; font-size: 11px; }.node-allow { border-left: 3px solid #67c23a; }.node-deny { border-left: 3px solid #f56c6c; }.graph-legend { display: flex; align-items: center; justify-content: space-between; padding: 13px 20px; border-top: 1px solid #ebeef5; color: #909399; font-size: 11px; }.graph-legend span { display: flex; align-items: center; gap: 6px; }.graph-legend i { width: 20px; height: 1px; background: #c0c4cc; }
.toast { position: fixed; left: 50%; bottom: 28px; transform: translateX(-50%); z-index: 3000; padding: 11px 20px; border-radius: 8px; color: white; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,.16); }.toast.success { background: #67c23a; }.toast.error { background: #f56c6c; }.toast-fade-enter-active,.toast-fade-leave-active { transition: opacity .2s, transform .2s; }.toast-fade-enter-from,.toast-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
@media (max-width: 1180px) { .editor-grid { grid-template-columns: 1fr; }.preview-card { position: static; }.graph-scroll { max-height: 620px; } }
@media (max-width: 760px) { .editor-toolbar { align-items: flex-start; flex-direction: column; }.form-grid,.form-grid.three { grid-template-columns: 1fr; }.readonly-meta { grid-template-columns: 1fr 1fr; }.repeat-row { grid-template-columns: 1fr; }.remove-btn { width: 100%; }.config-card { padding: 18px; } }
</style>
