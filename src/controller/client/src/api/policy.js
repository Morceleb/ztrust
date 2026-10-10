import { apiClient, normalizeError } from './axios.js'
import {
  mockListPolicies,
  mockGetPolicy,
  mockCreatePolicy,
  mockUpdatePolicyDraft,
  mockQueryPolicyGraph
} from '@/mock/policyMock.js'

// 后端恢复后只需关闭此开关；页面业务代码无需修改。
export const USE_POLICY_MOCK = true

export async function listPolicies(params = {}) {
  if (USE_POLICY_MOCK) return mockListPolicies(params)
  try {
    const res = await apiClient.get('/policies', { params })
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function getPolicy(policyId) {
  if (USE_POLICY_MOCK) return mockGetPolicy(policyId)
  try {
    const res = await apiClient.get(`/policies/${encodeURIComponent(policyId)}`)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function createPolicy(data) {
  if (USE_POLICY_MOCK) return mockCreatePolicy(data)
  try {
    const res = await apiClient.post('/policies', data)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function updatePolicyDraft(policyId, data) {
  if (USE_POLICY_MOCK) return mockUpdatePolicyDraft(policyId, data)
  try {
    const res = await apiClient.put(`/policies/${encodeURIComponent(policyId)}/draft`, data)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function queryPolicyGraph(params) {
  if (USE_POLICY_MOCK) return mockQueryPolicyGraph(params)
  try {
    const res = await apiClient.post('/policy-graph/query', params)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}
