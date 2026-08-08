import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

/**
 * Request a fresh CSRF cookie from Laravel Sanctum.
 * Call this before any stateful request (login, register, etc.).
 */
export async function csrfCookie(): Promise<void> {
  await axios.get(`${API_URL}/sanctum/csrf-cookie`, {
    withCredentials: true,
  })
}

api.interceptors.request.use(
  (config) => {
    // Axios automatically sends the XSRF-TOKEN cookie as X-XSRF-TOKEN header
    // when withCredentials is true. No manual header needed.
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { data, status } = error.response

      const message = data?.message || error.message
      const errors = data?.errors || null

      const normalizedError = {
        message,
        errors,
        status,
        data,
      }

      return Promise.reject(normalizedError)
    }

    return Promise.reject({
      message: error.message || 'Network error',
      errors: null,
      status: 0,
      data: null,
    })
  }
)
