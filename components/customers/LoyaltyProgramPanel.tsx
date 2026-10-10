'use client'

import { useEffect, useState } from 'react'
import { Star, Pencil, Plus, Trash2, Loader2 } from 'lucide-react'
import {
  type LoyaltyPromo, type LoyaltyPromoInput, type PromoStatus,
  getLoyaltyPromos, createLoyaltyPromo, updateLoyaltyPromo, deleteLoyaltyPromo,
} from '@/lib/api/loyalty'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/context/AuthContext'
import Badge, { type BadgeVariant } from '@/components/shared/Badge'
import DrawerModal from '@/components/shared/DrawerModal'
import ConfirmModal from '@/components/shared/ConfirmModal'

const authToken = () => localStorage.getItem('xantara_pos_access') ?? undefined

const STATUS: Record<PromoStatus, { label: string; variant: BadgeVariant }> = {
  running:  { label: 'Running now', variant: 'success' },
  upcoming: { label: 'Upcoming',    variant: 'info' },
  ended:    { label: 'Ended',       variant: 'neutral' },
  paused:   { label: 'Paused',      variant: 'warning' },
}

const peso = (value: number | string) =>
  `₱${Number(value).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`

// Dates are plain YYYY-MM-DD; build them in local time so they never shift a day.
function day(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function formatRange(start: string, end: string) {
  const short = { month: 'short', day: 'numeric' } as const
  const full = { ...short, year: 'numeric' } as const
  if (start === end) return day(start).toLocaleDateString('en-PH', full)
  return `${day(start).toLocaleDateString('en-PH', short)} – ${day(end).toLocaleDateString('en-PH', full)}`
}

function errorText(err: unknown, fallback: string) {
  if (err instanceof ApiError) {
    if (err.status === 403) return 'Only an administrator or manager can change promos.'
    const body = err.body
    if (body && typeof body === 'object') {
      const messages = Object.values(body as Record<string, unknown>).flat().filter((m): m is string => typeof m === 'string')
      if (messages.length) return messages.join(' ')
    }
  }
  return fallback
}

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
const EMPTY_PROMO = { name: '', start_date: '', end_date: '', spend: '100', is_active: true }
type PromoForm = typeof EMPTY_PROMO

const inputClass = 'w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600'
const labelClass = 'block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5'

export default function LoyaltyProgramPanel() {
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'manager'

  const [promos, setPromos] = useState<LoyaltyPromo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [promoTarget, setPromoTarget] = useState<LoyaltyPromo | 'new' | null>(null)
  const [promoForm, setPromoForm] = useState<PromoForm>(EMPTY_PROMO)
  const [promoError, setPromoError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<LoyaltyPromo | null>(null)
  const [saving, setSaving] = useState(false)

  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    getLoyaltyPromos(authToken())
      .then((list) => { if (!cancelled) setPromos(list) })
      .catch(() => { if (!cancelled) setLoadError('Could not load promo periods. Please check your connection and retry.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [attempt])
  const retry = () => { setLoading(true); setLoadError(''); setAttempt((n) => n + 1) }

  const earningNow = promos.some((p) => p.status === 'running')

  function openPromo(target: LoyaltyPromo | 'new') {
    setPromoError('')
    setPromoForm(target === 'new'
      ? { ...EMPTY_PROMO, start_date: today(), end_date: today() }
      : { name: target.name, start_date: target.start_date, end_date: target.end_date, spend: String(Number(target.spend_per_point)), is_active: target.is_active })
    setPromoTarget(target)
  }

  const spend = Number(promoForm.spend)
  const spendValid = Number.isFinite(spend) && spend >= 0.01
  const example = spendValid ? Math.floor(250 / spend) : 0
  const promoValid = promoForm.name.trim() !== '' && promoForm.start_date !== '' && promoForm.end_date !== ''
    && promoForm.end_date >= promoForm.start_date && spendValid

  async function savePromo() {
    if (!promoTarget) return
    setSaving(true); setPromoError('')
    const body: LoyaltyPromoInput = { name: promoForm.name.trim(), start_date: promoForm.start_date, end_date: promoForm.end_date,
      spend_per_point: spend, is_active: promoForm.is_active }
    try {
      if (promoTarget === 'new') await createLoyaltyPromo(body, authToken())
      else await updateLoyaltyPromo(promoTarget.id, body, authToken())
      setPromos(await getLoyaltyPromos(authToken()))   // reload: the server decides each promo's status
      setPromoTarget(null)
    } catch (err) { setPromoError(errorText(err, 'Could not save the promo. Please try again.')) }
    finally { setSaving(false) }
  }

  async function removePromo() {
    if (!deleteTarget) return
    try {
      await deleteLoyaltyPromo(deleteTarget.id, authToken())
      setPromos((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    } catch { /* the promo simply stays in the list; the user can retry */ }
    setDeleteTarget(null)
  }

  return (
    <section className="mx-6 mb-4 bg-white rounded-xl border border-neutral-200 overflow-hidden" aria-label="Loyalty points">
      <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-warning-600" />
          <h2 className="text-sm font-bold text-neutral-800">Loyalty points</h2>
          {!loading && !loadError && <Badge variant={earningNow ? 'success' : 'neutral'}>{earningNow ? 'Earning now' : 'No promo running'}</Badge>}
        </div>
        {canEdit && !loadError && (
          <button onClick={() => openPromo('new')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-800">
            <Plus className="w-3.5 h-3.5" /> New promo
          </button>
        )}
      </div>

      <div className="px-4 py-4">
        <p className="text-xs text-neutral-400 mb-3">
          Customers earn points only while a promo period is running. Each promo sets how much of a sale, excluding VAT, equals 1 point.
          If promos overlap, the one that earns the customer the most applies.
        </p>
        {loading ? (
          <div className="flex items-center gap-2 py-3 text-sm text-neutral-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : loadError ? (
          <div role="alert" className="text-sm text-danger-600 flex items-center gap-3">
            {loadError}<button onClick={retry} className="underline font-semibold">Retry</button>
          </div>
        ) : promos.length === 0 ? (
          <p className="text-sm text-neutral-400">No promo periods yet.{canEdit && ' Create one to start giving points.'}</p>
        ) : (
          <ul className="divide-y divide-neutral-100 border border-neutral-100 rounded-lg">
            {promos.map((promo) => (
              <li key={promo.id} className="flex items-center gap-3 flex-wrap px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-neutral-800 truncate">{promo.name}</div>
                  <div className="text-xs text-neutral-400">{formatRange(promo.start_date, promo.end_date)}</div>
                </div>
                <Badge variant="info">{peso(promo.spend_per_point)} = 1 pt</Badge>
                <Badge variant={STATUS[promo.status].variant}>{STATUS[promo.status].label}</Badge>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openPromo(promo)} aria-label={`Edit ${promo.name}`}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:bg-brand-50 hover:text-brand-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteTarget(promo)} aria-label={`Delete ${promo.name}`}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:bg-danger-50 hover:text-danger-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <DrawerModal isOpen={promoTarget !== null} onClose={() => setPromoTarget(null)}
        title={promoTarget === 'new' ? 'New promo period' : 'Edit promo period'}
        footer={
          <div className="px-6 py-4 flex flex-col gap-2">
            {promoError && <p role="alert" className="text-xs text-danger-600">{promoError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setPromoTarget(null)} disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 disabled:opacity-40">Cancel</button>
              <button onClick={savePromo} disabled={!promoValid || saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save promo
              </button>
            </div>
          </div>
        }>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="promo-name" className={labelClass}>Promo name *</label>
            <input id="promo-name" type="text" maxLength={100} placeholder="Payday Points" value={promoForm.name}
              onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="promo-from" className={labelClass}>From *</label>
              <input id="promo-from" type="date" value={promoForm.start_date}
                onChange={(e) => setPromoForm({ ...promoForm, start_date: e.target.value, end_date: promoForm.end_date < e.target.value ? e.target.value : promoForm.end_date })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="promo-to" className={labelClass}>To *</label>
              <input id="promo-to" type="date" min={promoForm.start_date} value={promoForm.end_date}
                onChange={(e) => setPromoForm({ ...promoForm, end_date: e.target.value })} className={inputClass} />
            </div>
          </div>
          <p className="text-xs text-neutral-400 -mt-2">Both dates are included.</p>
          <div>
            <label htmlFor="promo-spend" className={labelClass}>Spend per point (₱, excluding VAT) *</label>
            <input id="promo-spend" type="number" min="0.01" step="0.01" inputMode="decimal" value={promoForm.spend}
              onChange={(e) => setPromoForm({ ...promoForm, spend: e.target.value })} className={`${inputClass} max-w-[12rem]`} />
            <p className="text-xs text-neutral-400 mt-1.5">
              {spendValid
                ? `Every ${peso(spend)} of a sale (VAT not counted) earns 1 point. Example: a ${peso(250)} sale earns ${example} ${example === 1 ? 'point' : 'points'}. Any amount short of a full step earns nothing.`
                : 'Enter an amount of at least ₱0.01.'}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={promoForm.is_active} onChange={(e) => setPromoForm({ ...promoForm, is_active: e.target.checked })} />
            Customers earn points during this promo (untick to pause it)
          </label>
        </div>
      </DrawerModal>

      <ConfirmModal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} onConfirm={removePromo}
        title="Delete promo period?"
        message={<><span className="font-semibold text-neutral-600">{deleteTarget?.name}</span> will be removed and stop earning points. Points customers already earned from it are kept.</>}
        confirmLabel="Delete" variant="danger" />
    </section>
  )
}
