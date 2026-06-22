const STORAGE_KEYS = {
  nickname: 'gateway_admin_nickname',
  loggedIn: 'gateway_admin_logged_in',
  username: 'gateway_admin_username',
  rememberMe: 'gateway_admin_remember_me',
  adminId: 'gateway_admin_id'
}

export function getStoredAdminNickname() {
  return localStorage.getItem(STORAGE_KEYS.nickname)
}

export function getStoredAdminUsername() {
  return localStorage.getItem(STORAGE_KEYS.username)
}

export function isAdminLoggedIn() {
  return localStorage.getItem(STORAGE_KEYS.loggedIn) === 'true'
}

export function setAdminSession({ nickname, username, adminId, rememberMe }) {
  localStorage.setItem(STORAGE_KEYS.nickname, nickname)
  localStorage.setItem(STORAGE_KEYS.loggedIn, 'true')
  localStorage.setItem(STORAGE_KEYS.username, username)

  if (adminId !== undefined && adminId !== null) {
    localStorage.setItem(STORAGE_KEYS.adminId, String(adminId))
  } else {
    localStorage.removeItem(STORAGE_KEYS.adminId)
  }

  if (rememberMe) {
    localStorage.setItem(STORAGE_KEYS.rememberMe, 'true')
  } else {
    localStorage.removeItem(STORAGE_KEYS.rememberMe)
  }
}

export function clearAdminSession() {
  localStorage.removeItem(STORAGE_KEYS.nickname)
  localStorage.removeItem(STORAGE_KEYS.loggedIn)
  localStorage.removeItem(STORAGE_KEYS.username)
  localStorage.removeItem(STORAGE_KEYS.rememberMe)
  localStorage.removeItem(STORAGE_KEYS.adminId)
}
