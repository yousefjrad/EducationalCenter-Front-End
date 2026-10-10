const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5080/api/v1'
const ACCESS_KEY = 'token'
const REFRESH_KEY = 'refreshToken'

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY)

export function setSession(data) {
  const access = data?.accessToken ?? data?.token
  const refresh = data?.refreshToken
  if (access) localStorage.setItem(ACCESS_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

function toMessage(body, status) {
  if (body && typeof body === 'object') {
    if (body.errors && typeof body.errors === 'object') {
      const all = Object.values(body.errors).flat().filter(Boolean)
      if (all.length) return all.join(' | ')
    }
    const text = body.detail || body.message || body.title
    if (text) return text
  }
  return 'HTTP ' + status
}

async function parseBody(res) {
  if (res.status === 204) return null
  const text = await res.text()
  if (!text) return null
  try { return JSON.parse(text) } catch { return text }
}

let refreshing = null
function refreshSession() {
  const rt = localStorage.getItem(REFRESH_KEY)
  if (!rt) return Promise.resolve(false)
  if (!refreshing) {
    refreshing = fetch(BASE_URL + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    })
      .then(async (r) => {
        if (!r.ok) return false
        setSession(await r.json())
        return true
      })
      .catch(() => false)
      .finally(() => { refreshing = null })
  }
  return refreshing
}

function buildUrl(endpoint, params) {
  const url = new URL(BASE_URL + endpoint)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    })
  }
  return url.toString()
}

async function request(method, endpoint, { body, params, blob = false, retry = true } = {}) {
  const headers = {}
  const token = getAccessToken()
  if (token) headers.Authorization = 'Bearer ' + token
  let payload
  if (body instanceof FormData) payload = body
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(buildUrl(endpoint, params), { method, headers, body: payload })
  } catch {
    throw new ApiError(0, 'Cannot reach the server', null)
  }

  const isAuthCall = /^\/auth\/(login|refresh|logout)/.test(endpoint)
  if (res.status === 401 && retry && !isAuthCall) {
    if (await refreshSession()) return request(method, endpoint, { body, params, blob, retry: false })
    clearSession()
    window.dispatchEvent(new Event('auth:logout'))
  }

  if (!res.ok) {
    const errBody = await parseBody(res)
    throw new ApiError(res.status, toMessage(errBody, res.status), errBody)
  }
  return blob ? res.blob() : parseBody(res)
}

export const api = {
  get: (e, params) => request('GET', e, { params }),
  post: (e, body) => request('POST', e, { body }),
  put: (e, body) => request('PUT', e, { body }),
  patch: (e, body) => request('PATCH', e, { body }),
  delete: (e) => request('DELETE', e),
  download: (e, params) => request('GET', e, { params, blob: true }),
}

export default api