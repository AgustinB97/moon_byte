import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // envía cookies en cada request (auth-token + csrf-token)
})

// Lee el csrf-token de la cookie y lo agrega como header en requests mutantes
api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase() ?? ''
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCookie('csrf-token')
    if (csrfToken) config.headers['X-CSRF-Token'] = csrfToken
  }
  // Backward compat: si hay token en localStorage (sesiones previas) lo envía como Bearer
  const legacyToken = localStorage.getItem('token')
  if (legacyToken && !document.cookie.includes('auth-token')) {
    config.headers.Authorization = `Bearer ${legacyToken}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export default api
