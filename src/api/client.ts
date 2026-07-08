import { getAccessToken, setAccessToken } from './tokenStore'

const BASE = '/api'

export class ApiError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  skipAuthRetry?: boolean
}

async function rawRequest(path: string, options: RequestOptions) {
  const token = getAccessToken()
  const headers: Record<string, string> = {}
  const isFormData = options.body instanceof FormData
  if (options.body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  return fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    credentials: 'include',
    body: isFormData ? (options.body as FormData) : options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
}

async function parseBody(res: Response): Promise<any> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

// Coalesce concurrent 401s into a single refresh attempt rather than firing one
// per failed request.
let refreshPromise: Promise<boolean> | null = null

async function attemptRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
        if (!res.ok) return false
        const data = await parseBody(res)
        if (data?.accessToken) {
          setAccessToken(data.accessToken)
          return true
        }
        return false
      } catch {
        return false
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await rawRequest(path, options)

  // Retry at most once - if the retried request also 401s, surface that error
  // rather than looping.
  if (res.status === 401 && !options.skipAuthRetry) {
    const refreshed = await attemptRefresh()
    if (refreshed) {
      res = await rawRequest(path, options)
    }
  }

  const data = await parseBody(res)

  if (!res.ok) {
    const message = data?.error?.message ?? res.statusText ?? 'Request failed'
    throw new ApiError(res.status, message, data?.error?.code, data?.error?.details)
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown, options?: Pick<RequestOptions, 'skipAuthRetry'>) =>
    request<T>(path, { method: 'POST', body, ...options }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
