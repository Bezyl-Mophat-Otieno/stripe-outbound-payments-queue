export async function apiCall(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers)

  // Attach token to request
  const token = localStorage.getItem('accessToken')
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, { ...options, headers })

  // Handle 401 and attempt token refresh
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'x-refresh-token': refreshToken,
          },
        })

        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          const newToken = data.accessToken
          localStorage.setItem('accessToken', newToken)

          // Retry original request with new token
          headers.set('Authorization', `Bearer ${newToken}`)
          return fetch(url, { ...options, headers })
        }
      } catch (error) {
        console.error('[v0] Token refresh failed:', error)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    }
  }

  return response
}
