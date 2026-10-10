'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle, Building2, Check, ChevronLeft, ChevronRight,
  Eye, EyeOff, Loader2, MapPin, ShieldCheck, UserRound,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api/client'
import {
  completeInitialSetup, getSetupStatus, type InitialSetupPayload,
} from '@/lib/api/setup'

const EMPTY_FORM: InitialSetupPayload = {
  company_name: '', company_address: '', company_email: '', company_phone: '',
  branch_name: '', branch_address: '', branch_email: '', branch_phone: '',
  admin_name: '', admin_email: '', admin_password: '', confirm_password: '',
}

const STEPS = [
  { label: 'Company', icon: Building2 },
  { label: 'Main branch', icon: MapPin },
  { label: 'Administrator', icon: UserRound },
]

function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Setup could not be completed. Please try again.'
  const body = error.body as Record<string, unknown>
  if (typeof body?.detail === 'string') return body.detail
  for (const value of Object.values(body ?? {})) {
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
    if (typeof value === 'string') return value
  }
  return `Setup could not be completed (HTTP ${error.status}).`
}

function Field({ label, value, onChange, type = 'text', required = false, autoComplete }: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-600 mb-1.5">
        {label}{required ? ' *' : ''}
      </span>
      <input type={type} value={value} required={required} autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
    </label>
  )
}

export default function SetupPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [checking, setChecking] = useState(true)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getSetupStatus()
      .then((status) => {
        if (!active) return
        if (!status.setup_required) router.replace('/login')
        else setChecking(false)
      })
      .catch(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [router])

  const update = (key: keyof InitialSetupPayload, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
  }

  const stepValid = step === 0
    ? Boolean(form.company_name.trim())
    : step === 1
      ? Boolean(form.branch_name.trim())
      : Boolean(
          form.admin_name.trim() && form.admin_email.trim() &&
          form.admin_password.length >= 8 &&
          form.admin_password === form.confirm_password,
        )

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (step < 2) {
      if (stepValid) setStep((current) => current + 1)
      return
    }
    if (!stepValid || saving) return
    setSaving(true)
    setError('')
    try {
      await completeInitialSetup({
        ...form,
        company_name: form.company_name.trim(),
        branch_name: form.branch_name.trim(),
        admin_name: form.admin_name.trim(),
        admin_email: form.admin_email.trim().toLowerCase(),
      })
      const result = await login(form.admin_email.trim().toLowerCase(), form.admin_password)
      if (result.success) router.replace('/dashboard')
      else router.replace('/login')
    } catch (caught) {
      setError(errorMessage(caught))
      setSaving(false)
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-brand-600 animate-spin" aria-label="Checking setup status" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-7">
          <img src="/images/xantara-logo.png" alt="Xantara" className="h-12 w-auto mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-neutral-800">Set up Xantara POS</h1>
          <p className="mt-1 text-sm text-neutral-400">Create your company, main branch, and first administrator.</p>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2" aria-label="Setup progress">
          {STEPS.map(({ label, icon: Icon }, index) => (
            <div key={label} className={`rounded-xl border px-3 py-3 flex items-center gap-2 ${
              index === step ? 'border-brand-600 bg-brand-50 text-brand-600'
                : index < step ? 'border-success-600/30 bg-success-50 text-success-600'
                  : 'border-neutral-200 bg-white text-neutral-400'
            }`}>
              {index < step ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              <span className="text-xs sm:text-sm font-semibold">{label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            {step === 0 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-800">Company information</h2>
                  <p className="mt-1 text-sm text-neutral-400">This name appears in shared settings and identifies this installation.</p>
                </div>
                <Field label="Company name" required value={form.company_name} onChange={(value) => update('company_name', value)} autoComplete="organization" />
                <Field label="Company address" value={form.company_address} onChange={(value) => update('company_address', value)} autoComplete="street-address" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Company email" type="email" value={form.company_email} onChange={(value) => update('company_email', value)} autoComplete="email" />
                  <Field label="Company phone" type="tel" value={form.company_phone} onChange={(value) => update('company_phone', value)} autoComplete="tel" />
                </div>
              </section>
            )}

            {step === 1 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-800">Main branch</h2>
                  <p className="mt-1 text-sm text-neutral-400">The first administrator and primary POS installation will use this branch.</p>
                </div>
                <Field label="Branch name" required value={form.branch_name} onChange={(value) => update('branch_name', value)} />
                <Field label="Branch address" value={form.branch_address} onChange={(value) => update('branch_address', value)} autoComplete="street-address" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Branch email" type="email" value={form.branch_email} onChange={(value) => update('branch_email', value)} />
                  <Field label="Branch phone" type="tel" value={form.branch_phone} onChange={(value) => update('branch_phone', value)} />
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-800">First administrator</h2>
                  <p className="mt-1 text-sm text-neutral-400">This account receives full access and is assigned to {form.branch_name || 'the main branch'}.</p>
                </div>
                <Field label="Full name" required value={form.admin_name} onChange={(value) => update('admin_name', value)} autoComplete="name" />
                <Field label="Email" required type="email" value={form.admin_email} onChange={(value) => update('admin_email', value)} autoComplete="username" />
                <div className="relative">
                  <Field label="Password" required type={showPassword ? 'text' : 'password'} value={form.admin_password} onChange={(value) => update('admin_password', value)} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
                    className="absolute right-3 top-[34px] text-neutral-400 hover:text-neutral-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Field label="Confirm password" required type={showPassword ? 'text' : 'password'} value={form.confirm_password} onChange={(value) => update('confirm_password', value)} autoComplete="new-password" />
                <p className="text-xs text-neutral-400">Use at least eight characters. Additional security rules are checked when setup is completed.</p>
                {form.confirm_password && form.admin_password !== form.confirm_password && (
                  <p className="text-xs text-danger-600">Passwords do not match.</p>
                )}
              </section>
            )}

            {error && (
              <div role="alert" className="mt-5 flex items-start gap-2 rounded-lg bg-danger-50 p-3 text-xs text-danger-600">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <footer className="border-t border-neutral-100 bg-neutral-50 px-6 sm:px-8 py-4 flex items-center justify-between rounded-b-2xl">
            <button type="button" onClick={() => { setStep((current) => Math.max(0, current - 1)); setError('') }}
              disabled={step === 0 || saving}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-0">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button type="submit" disabled={!stepValid || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 2 ? <ShieldCheck className="w-4 h-4" /> : null}
              {saving ? 'Creating installation…' : step === 2 ? 'Complete setup' : 'Continue'}
              {step < 2 && !saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </footer>
        </form>
      </div>
    </main>
  )
}
