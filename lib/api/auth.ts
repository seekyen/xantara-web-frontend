import { apiFetch, ApiError } from './client'

export interface BranchDetail {
  id: number
  name: string
  address: string
  is_active: boolean
  staff_count: number
}

export interface LoginUser {
  id: number
  name: string
  email: string
  phone: string
  role: string
  status: string
  initials: string
  branch: number
  branch_detail: BranchDetail
}

export interface LoginResponse {
  access: string
  refresh: string
  user: LoginUser
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/v1/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function parseLoginError(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as Record<string, unknown>
    // Django REST Framework returns errors in various shapes
    if (typeof body?.detail === 'string') return body.detail
    if (typeof body?.non_field_errors === 'object') {
      const msgs = body.non_field_errors as string[]
      if (msgs.length) return msgs[0]
    }
    if (err.status === 400) return 'Invalid email or password.'
    if (err.status === 401) return 'Invalid email or password.'
    if (err.status >= 500) return 'Server error. Please try again later.'
  }
  return 'Something went wrong. Please try again.'
}
