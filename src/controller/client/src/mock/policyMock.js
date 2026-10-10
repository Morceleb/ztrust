const STORAGE_KEY = 'ztrust.policy.mock.v1'

const clone = (value) => JSON.parse(JSON.stringify(value))

const nowIso = () => new Date().toISOString()

const demoPolicies = [
  {
    policyId: 'demo-policy-draft-allow', policyFamilyId: 'demo-family-finance', tenantId: 'demo-tenant',
    name: '财务系统办公网访问策略', description: '允许财务组从办公网络访问财务系统。', version: 1,
    status: 'DRAFT', revision: 0, effectiveAt: null, retiredAt: null, archivedAt: null, retentionUntil: null,
    subjectSelector: { selectorId: 'demo-selector-finance', subjectType: 'employee', predicates: [{ attributePath: 'department', operator: 'EQ', values: ['finance'] }] },
    resource: { resourceId: 'finance-system', resourceType: 'web-application', resourcePattern: '/finance/**', resourceLevel: 'internal', ownerDomain: 'finance', attributes: { environment: 'production' } },
    action: { actionId: 'demo-action-finance', semanticAction: '访问财务系统', requestMethods: ['GET', 'POST'], critical: true, criticalThreshold: 70 },
    conditions: [{ conditionId: 'demo-condition-office', attributePath: 'network.zone', operator: 'EQ', values: ['office'], valueType: 'string' }],
    riskConstraint: { minTrustScore: 70, maxTrustScore: 100, allowedRiskLevels: ['LOW', 'MEDIUM'], anomalyDetected: false, maxAssessmentAge: 'PT5M' },
    policyEffect: { effect: 'ALLOW', ttl: 'PT10M', recommendedAction: '持续评估终端风险' },
    createdBy: 'demo-admin', createdAt: '2026-08-20T02:00:00.000Z', updatedBy: 'demo-admin', updatedAt: '2026-08-24T08:20:00.000Z'
  },
  {
    policyId: 'demo-policy-draft-deny', policyFamilyId: 'demo-family-external', tenantId: 'demo-tenant',
    name: '外部设备高危操作拒绝策略', description: '拒绝未受管设备执行高危操作。', version: 2,
    status: 'DRAFT', revision: 3, effectiveAt: null, retiredAt: null, archivedAt: null, retentionUntil: null,
    subjectSelector: { selectorId: null, subjectType: 'contractor', predicates: [{ attributePath: 'device.managed', operator: 'EQ', values: ['false'] }] },
    resource: { resourceId: 'operation-console', resourceType: 'console', resourcePattern: '/operations/critical/**', resourceLevel: 'critical', ownerDomain: 'security', attributes: { environment: 'production' } },
    action: { actionId: null, semanticAction: '执行高危操作', requestMethods: ['POST'], critical: true, criticalThreshold: 85 },
    conditions: [], riskConstraint: null,
    policyEffect: { effect: 'DENY', ttl: 'PT10M', recommendedAction: '联系安全管理员' },
    createdBy: 'demo-admin', createdAt: '2026-08-18T03:00:00.000Z', updatedBy: 'demo-admin', updatedAt: '2026-08-23T06:40:00.000Z'
  },
  {
    policyId: 'demo-policy-scheduled', policyFamilyId: 'demo-family-maintenance', tenantId: 'demo-tenant',
    name: '生产维护窗口访问策略', description: '计划在维护窗口开放生产运维入口。', version: 1,
    status: 'SCHEDULED', revision: 1, effectiveAt: '2026-09-01T00:00:00.000Z', retiredAt: null, archivedAt: null, retentionUntil: null,
    subjectSelector: { selectorId: 'demo-selector-ops', subjectType: 'operator', predicates: [{ attributePath: 'team', operator: 'IN', values: ['ops', 'sre'] }] },
    resource: { resourceId: 'prod-maintenance', resourceType: 'service', resourcePattern: '/production/maintenance/**', resourceLevel: 'critical', ownerDomain: 'platform', attributes: { environment: 'production' } },
    action: { actionId: 'demo-action-maintain', semanticAction: '生产维护', requestMethods: ['POST'], critical: true, criticalThreshold: 90 },
    conditions: [{ conditionId: 'demo-condition-ticket', attributePath: 'request.ticketId', operator: 'CONTAINS_ANY', values: ['CHG'], valueType: 'string' }],
    riskConstraint: { minTrustScore: 80, maxTrustScore: 100, allowedRiskLevels: ['LOW'], anomalyDetected: false, maxAssessmentAge: 'PT5M' },
    policyEffect: { effect: 'ALLOW', ttl: 'PT30M', recommendedAction: '记录完整审计日志' },
    createdBy: 'demo-admin', createdAt: '2026-08-17T04:00:00.000Z', updatedBy: 'demo-admin', updatedAt: '2026-08-22T05:30:00.000Z'
  },
  {
    policyId: 'demo-policy-active', policyFamilyId: 'demo-family-vpn', tenantId: 'demo-tenant',
    name: '远程办公 VPN 策略', description: '为可信设备提供远程办公 VPN 访问。', version: 4,
    status: 'ACTIVE', revision: 8, effectiveAt: '2026-08-01T00:00:00.000Z', retiredAt: null, archivedAt: null, retentionUntil: null,
    subjectSelector: { selectorId: 'demo-selector-staff', subjectType: 'employee', predicates: [{ attributePath: 'employment.status', operator: 'EQ', values: ['active'] }] },
    resource: { resourceId: 'corporate-vpn', resourceType: 'network', resourcePattern: 'vpn://corporate/**', resourceLevel: 'internal', ownerDomain: 'infrastructure', attributes: { environment: 'production' } },
    action: { actionId: 'demo-action-connect', semanticAction: '建立 VPN 连接', requestMethods: ['CONNECT'], critical: false, criticalThreshold: 0 },
    conditions: [{ conditionId: 'demo-condition-device', attributePath: 'device.trustScore', operator: 'GTE', values: ['70'], valueType: 'number' }],
    riskConstraint: { minTrustScore: 70, maxTrustScore: 100, allowedRiskLevels: ['LOW', 'MEDIUM'], anomalyDetected: null, maxAssessmentAge: 'PT30M' },
    policyEffect: { effect: 'ALLOW', ttl: 'PT1H', recommendedAction: '' },
    createdBy: 'demo-admin', createdAt: '2026-07-20T02:00:00.000Z', updatedBy: 'demo-admin', updatedAt: '2026-08-21T02:15:00.000Z'
  },
  {
    policyId: 'demo-policy-retired', policyFamilyId: 'demo-family-legacy', tenantId: 'demo-tenant',
    name: '旧版报表系统访问策略', description: '已退役的旧版报表系统策略。', version: 3,
    status: 'RETIRED', revision: 5, effectiveAt: '2026-01-01T00:00:00.000Z', retiredAt: '2026-08-10T00:00:00.000Z', archivedAt: null, retentionUntil: null,
    subjectSelector: { selectorId: null, subjectType: 'employee', predicates: [] },
    resource: { resourceId: 'legacy-report', resourceType: 'web-application', resourcePattern: '/legacy/report/**', resourceLevel: 'internal', ownerDomain: 'data', attributes: {} },
    action: { actionId: null, semanticAction: '查看报表', requestMethods: ['GET'], critical: false, criticalThreshold: 0 },
    conditions: [], riskConstraint: null,
    policyEffect: { effect: 'DENY', ttl: 'PT10M', recommendedAction: '使用新版报表平台' },
    createdBy: 'demo-admin', createdAt: '2025-12-20T02:00:00.000Z', updatedBy: 'demo-admin', updatedAt: '2026-08-10T00:00:00.000Z'
  }
]

function readPolicies() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoPolicies))
    return clone(demoPolicies)
  }
  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : clone(demoPolicies)
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoPolicies))
    return clone(demoPolicies)
  }
}

function writePolicies(policies) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(policies))
}

function summary(policy) {
  return {
    policyId: policy.policyId, policyFamilyId: policy.policyFamilyId, name: policy.name,
    version: policy.version, revision: policy.revision, status: policy.status,
    effect: policy.policyEffect?.effect, effectiveAt: policy.effectiveAt, updatedAt: policy.updatedAt
  }
}

export async function mockListPolicies(params = {}) {
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.max(1, Number(params.pageSize) || 10)
  const keyword = String(params.keyword || '').trim().toLowerCase()
  const status = String(params.status || '').trim()
  let items = readPolicies()
  if (keyword) items = items.filter(item => item.name.toLowerCase().includes(keyword))
  if (status) items = items.filter(item => item.status === status)
  items.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  const total = items.length
  const list = items.slice((page - 1) * pageSize, page * pageSize).map(summary)
  return { code: 200, message: 'success', data: { list, total, page, pageSize } }
}

export async function mockGetPolicy(policyId) {
  const policy = readPolicies().find(item => item.policyId === policyId)
  return policy
    ? { code: 200, message: 'success', data: clone(policy) }
    : { code: 404, message: '策略不存在', data: null }
}

export async function mockCreatePolicy(data) {
  const policies = readPolicies()
  const createdAt = nowIso()
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const policy = {
    ...clone(data), policyId: `mock-policy-${suffix}`, policyFamilyId: `mock-family-${suffix}`,
    tenantId: 'mock-tenant', version: 1, status: 'DRAFT', revision: 0,
    retiredAt: null, archivedAt: null, retentionUntil: null,
    createdBy: 'mock-admin', createdAt, updatedBy: 'mock-admin', updatedAt: createdAt
  }
  policies.unshift(policy)
  writePolicies(policies)
  return { code: 200, message: 'success', data: clone(policy) }
}

export async function mockUpdatePolicyDraft(policyId, data) {
  const policies = readPolicies()
  const index = policies.findIndex(item => item.policyId === policyId)
  if (index < 0) return { code: 404, message: '策略不存在', data: null }
  const current = policies[index]
  if (current.status !== 'DRAFT') return { code: 409, message: '只有草稿策略允许修改', data: null }
  if (Number(data.expectedRevision) !== Number(current.revision)) return { code: 409, message: '策略已被更新，请刷新后重试', data: null }
  const updated = {
    ...current, ...clone(data), policyId: current.policyId, policyFamilyId: current.policyFamilyId,
    tenantId: current.tenantId, version: current.version, status: current.status,
    revision: current.revision + 1, updatedBy: 'mock-admin', updatedAt: nowIso()
  }
  delete updated.expectedRevision
  policies[index] = updated
  writePolicies(policies)
  return { code: 200, message: 'success', data: clone(updated) }
}

export function buildPolicyGraph(policy) {
  const nodes = [{ id: 'policy', type: 'POLICY', data: { name: policy.name, version: policy.version, status: policy.status } }]
  const edges = []
  const addNode = (id, type, data, edgeType) => {
    nodes.push({ id, type, data })
    edges.push({ id: `policy-${id}`, source: 'policy', target: id, type: edgeType })
  }
  addNode('subject', 'SUBJECT_SELECTOR', clone(policy.subjectSelector || {}), 'APPLIES_TO_SUBJECT')
  addNode('resource', 'RESOURCE', clone(policy.resource || {}), 'APPLIES_TO_RESOURCE')
  addNode('action', 'ACTION', clone(policy.action || {}), 'APPLIES_TO_ACTION')
  ;(policy.conditions || []).forEach((condition, index) => addNode(`condition-${index}`, 'CONDITION', clone(condition), 'REQUIRES_CONDITION'))
  if (policy.riskConstraint) addNode('risk', 'RISK_CONSTRAINT', clone(policy.riskConstraint), 'CONSTRAINED_BY_RISK')
  addNode('effect', 'POLICY_EFFECT', clone(policy.policyEffect || {}), 'YIELDS_EFFECT')
  return { nodes, edges }
}

export async function mockQueryPolicyGraph(params = {}) {
  const policy = readPolicies().find(item => item.policyId === params.policyId)
  return policy
    ? { code: 200, message: 'success', data: buildPolicyGraph(policy) }
    : { code: 404, message: '策略不存在', data: null }
}

export { STORAGE_KEY as POLICY_MOCK_STORAGE_KEY }
