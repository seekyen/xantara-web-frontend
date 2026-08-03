const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`API error ${status}`)
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  // FormData bodies must NOT get a manual Content-Type — the browser sets its
  // own multipart boundary. Only default to JSON when the body isn't FormData.
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  // 401 on an authenticated request (a token was sent) means the session's
  // expired/invalid — clear it and bounce to login. Skip this for unauthenticated
  // calls (e.g. the login endpoint itself), where a 401 just means wrong credentials.
  if (res.status === 401 && token && typeof window !== 'undefined') {
    localStorage.removeItem('xantara_pos_user')
    localStorage.removeItem('xantara_pos_access')
    localStorage.removeItem('xantara_pos_refresh')
    window.location.href = '/login'
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body)
  }

  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export type PagedResponse<T> = {
  count:    number
  next:     string | null
  previous: string | null
  results:  T[]
}

/** Follows `next` across every page and returns the combined results — use for dropdowns. */
export async function fetchAll<T>(path: string, token?: string): Promise<T[]> {
  const results: T[] = []
  let nextPath: string | null = path

  while (nextPath) {
    const data: T[] | PagedResponse<T> = await apiFetch<T[] | PagedResponse<T>>(nextPath, {}, token)
    if (Array.isArray(data)) {
      results.push(...data)
      break
    }
    results.push(...data.results)
    if (data.next) {
      const u: URL = new URL(data.next)
      nextPath = u.pathname + u.search
    } else {
      nextPath = null
    }
  }

  return results
}
