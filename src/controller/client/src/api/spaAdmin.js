/**
 * 管理员端 SPA 安全码接口（经 Vite 代理到 identity 服务）
 * POST /identity/admin/spa/users/{userId}/issue
 * POST /identity/admin/spa/users/{userId}/issue?rotate=true
 * POST /identity/admin/spa/users/{userId}/disable
 * POST /identity/admin/spa/users/{userId}/able
 */

const IDENTITY_PREFIX = '/identity'

async function readBody(res) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { code: res.status, message: text || '请求失败', data: null }
  }
}

export async function issueSpaToken(userId, rotate = false) {
  const q = rotate ? '?rotate=true' : ''
  const url = `${IDENTITY_PREFIX}/admin/spa/users/${encodeURIComponent(userId)}/issue${q}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  return readBody(res)
}

export async function disableSpaToken(userId) {
  const url = `${IDENTITY_PREFIX}/admin/spa/users/${encodeURIComponent(userId)}/disable`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  return readBody(res)
}

export async function enableSpaToken(userId) {
  const url = `${IDENTITY_PREFIX}/admin/spa/users/${encodeURIComponent(userId)}/able`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  return readBody(res)
}
