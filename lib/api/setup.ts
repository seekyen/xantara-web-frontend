import { apiFetch } from './client'

export interface SetupStatus {
  setup_required: boolean
  setup_completed: boolean
  business_id: string
  company: {
    name: string
    address: string
    email: string
    phone: string
  } | null
}

export interface InitialSetupPayload {
  company_name: string
  company_address: string
  company_email: string
  company_phone: string
  branch_name: string
  branch_address: string
  branch_email: string
  branch_phone: string
  admin_name: string
  admin_email: string
  admin_password: string
  confirm_password: string
}

export const getSetupStatus = () =>
  apiFetch<SetupStatus>('/api/v1/setup/status/')

export const completeInitialSetup = (payload: InitialSetupPayload) =>
  apiFetch<SetupStatus>('/api/v1/setup/status/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
