import axios from 'axios'

// All requests go to FastAPI. In development '/api' is proxied by Vite (see vite.config.js).
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If the token is expired/invalid, go back to the login page
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginCall = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && !isLoginCall) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Turn an axios error into a readable message
export function errorMessage(err, fallback = 'Something went wrong') {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ')
  return err?.message || fallback
}

export default api
