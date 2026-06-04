const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

const getErrorMessage = async (response) => {
  try {
    const data = await response.json()
    const message = data?.message || data?.error

    if (Array.isArray(message)) {
      return message.join(', ')
    }

    if (typeof message === 'string') {
      return message
    }

    return 'حدث خطأ ما. حاول مرة أخرى.'
  } catch {
    return 'حدث خطأ ما. حاول مرة أخرى.'
  }
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('morafeq_access_token')
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const authApi = {
  register: (payload) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  confirm: (payload) =>
    apiRequest('/auth/confirm', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  forgotPassword: (payload) =>
    apiRequest('/auth/forgetPassword', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  resetPassword: (payload) =>
    apiRequest('/auth/resetPassword', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  resendOtp: (payload) =>
    apiRequest('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => apiRequest('/auth/me'),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
}

export const googleAuthUrl = `${API_URL}/auth/google`
