'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch, ApiError } from '@/lib/api/client'

type Company = { registered_name: string; tin: string; address: string; tax_type: string; locked_at?: string | null }
type Branch = { id: number; branch: number; branch_name: string; stock_code: string; branch_code: string; rdo: string; registered_address: string; locked_at: string | null }
type Terminal = { id: string; branch: number; terminal_code: string; machine_serial: string; min: string; ptu: string; ptu_issued_on: string; starting_serial: number; activated_at: string | null; enrolled: boolean }
type Snapshot = { business_id: string; company: Company | null; branches: Branch[]; terminals: Terminal[]; available_branches: { id: number; name: string; code: string }[]; audit: { id: number; action: string; actor__email: string; created_at: string; before: unknown; after: unknown }[] }
const emptyCompany: Company = { registered_name: '', tin: '', address: '', tax_type: 'vat' }
const inputClass = 'w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm disabled:bg-neutral-100'
const buttonClass = 'rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50'
const endpoint = '/api/v1/settings/fiscal/'

export default function CompanyRegistrationPanel() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [company, setCompany] = useState<Company>(emptyCompany)
  const [branch, setBranch] = useState({ id: 0, branch: '', branch_code: '', rdo: '', registered_address: '' })
  const [terminal, setTerminal] = useState({ id: '', branch: '', terminal_code: '', machine_serial: '', min: '', ptu: '', ptu_issued_on: '', starting_serial: '1' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [activation, setActivation] = useState<Terminal | null>(null)
  const [password, setPassword] = useState('')
  const [reviewed, setReviewed] = useState(false)
  const [enrollment, setEnrollment] = useState<{ terminal_id: string; enrollment_code: string } | null>(null)
  const token = () => localStorage.getItem('xantara_pos_access') ?? undefined
  const load = useCallback(async () => {
    const data = await apiFetch<Snapshot>(endpoint, {}, token())
    setSnapshot(data)
    setCompany(data.company ?? emptyCompany)
  }, [])
  const fail = (e: unknown) => setError(e instanceof ApiError ? (e.status === 403 ? 'An active administrator account is required.' : JSON.stringify(e.body)) : 'Could not reach the server. Please retry.')
  useEffect(() => {
    let cancelled = false
    apiFetch<Snapshot>(endpoint, {}, token()).then(data => {
      if (!cancelled) { setSnapshot(data); setCompany(data.company ?? emptyCompany) }
    }).catch(e => { if (!cancelled) fail(e) })
    return () => { cancelled = true }
  }, [])

  async function save(kind: string, data: unknown, id?: string | number) {
    setBusy(true); setError(''); setMessage('')
    try {
      await apiFetch(endpoint, { method: 'POST', body: JSON.stringify({ kind, id, data }) }, token())
      await load(); setMessage('Registration details saved.')
    } catch (e) { fail(e) } finally { setBusy(false) }
  }
  async function activate() {
    if (!activation) return
    setBusy(true); setError('')
    try {
      const result = await apiFetch<{ terminal_id: string; enrollment_code: string }>(`${endpoint}terminals/${activation.id}/activate/`, { method: 'POST', body: JSON.stringify({ password, reviewed }) }, token())
      setEnrollment(result); setActivation(null); setPassword(''); setReviewed(false)
      await load()
    } catch (e) { fail(e) } finally { setBusy(false) }
  }
  const field = (label: string, value: string, change: (v: string) => void, disabled = false, type = 'text') => (
    <label className="block text-sm text-neutral-700">{label}<input required type={type} className={`${inputClass} mt-1`} value={value} disabled={disabled || busy} onChange={e => change(e.target.value)} /></label>
  )
  return <div className="space-y-6">
    <div><h2 className="text-lg font-bold">Company &amp; BIR Details</h2><p className="text-sm text-neutral-500 mt-1">Manage the registered company, branch addresses and POS terminals. Saving or activating here does not constitute BIR approval.</p></div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="text-sm text-green-700">{message}</p>}
    {!snapshot ? <button className={buttonClass} onClick={() => load().catch(fail)}>Load registration details</button> : <>
      <p className="text-xs text-neutral-500">Business ID: {snapshot.business_id}</p>
      <form className="space-y-3" onSubmit={e => { e.preventDefault(); save('company', company) }}>
        <h3 className="font-semibold">1. Registered company {company.locked_at && '— Locked'}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {field('Registered company name', company.registered_name, v => setCompany({ ...company, registered_name: v }), !!company.locked_at)}
          {field('TIN (9 digits, without branch code)', company.tin, v => setCompany({ ...company, tin: v }), !!company.locked_at)}
          {field('Registered company address', company.address, v => setCompany({ ...company, address: v }), !!company.locked_at)}
          <label className="text-sm">Tax registration<select className={`${inputClass} mt-1`} value={company.tax_type} disabled={busy || !!company.locked_at} onChange={e => setCompany({ ...company, tax_type: e.target.value })}><option value="vat">VAT registered</option><option value="nonVat">Non-VAT registered</option></select></label>
        </div>
        {!company.locked_at && <button disabled={busy} className={buttonClass}>Save company</button>}
      </form>
      <section className="border-t pt-5 space-y-3">
        <h3 className="font-semibold">2. Registered branches</h3>
        {snapshot.branches.map(b => <div key={b.id} className="rounded-lg bg-neutral-50 p-3 text-sm flex justify-between gap-3"><span>{b.branch_name} ({b.stock_code}) · {b.branch_code} · RDO {b.rdo}<br />{b.registered_address}</span>{b.locked_at ? <span>Locked</span> : <button type="button" disabled={busy} onClick={() => setBranch({ ...b, branch: String(b.branch) })}>Edit</button>}</div>)}
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); save('branch', { ...branch, branch: Number(branch.branch) }, branch.id || undefined) }}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">Operational branch<select required className={`${inputClass} mt-1`} disabled={busy} value={branch.branch} onChange={e => setBranch({ ...branch, branch: e.target.value })}><option value="">Choose a branch</option>{snapshot.available_branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}</select></label>
            {field('BIR branch code (5 digits)', branch.branch_code, v => setBranch({ ...branch, branch_code: v }))}
            {field('RDO code (3 digits)', branch.rdo, v => setBranch({ ...branch, rdo: v }))}
            {field('Registered branch address', branch.registered_address, v => setBranch({ ...branch, registered_address: v }))}
          </div>
          <button disabled={busy} className={buttonClass}>{branch.id ? 'Update branch registration' : 'Save branch registration'}</button>
          {!!branch.id && <button type="button" className="ml-3 text-sm" onClick={() => setBranch({ id: 0, branch: '', branch_code: '', rdo: '', registered_address: '' })}>New branch registration</button>}
          <p className="text-xs text-neutral-500">Create operational branches in Branches first. Fiscal addresses are stored separately from contact addresses.</p>
        </form>
      </section>
      <section className="border-t pt-5 space-y-3">
        <h3 className="font-semibold">3. POS terminals</h3>
        {snapshot.terminals.map(t => <div key={t.id} className="rounded-lg border p-3 text-sm space-y-2"><p className="font-semibold">{t.terminal_code} · {snapshot.branches.find(b => b.id === t.branch)?.branch_name} · {t.enrolled ? 'Enrolled' : t.activated_at ? 'Awaiting POS enrollment' : 'Draft'}</p><p>Serial: {t.machine_serial} · MIN: {t.min} · PTU: {t.ptu} ({t.ptu_issued_on}) · Starting invoice: {t.starting_serial}</p>{!t.activated_at && <div className="flex gap-4"><button disabled={busy} onClick={() => setTerminal({ ...t, branch: String(t.branch), starting_serial: String(t.starting_serial) })}>Edit</button><button disabled={busy || !snapshot.company} onClick={() => { setActivation(t); setPassword(''); setReviewed(false) }}>Review &amp; activate</button></div>}{t.activated_at && !t.enrolled && <button disabled={busy} onClick={() => { setActivation(t); setPassword(''); setReviewed(false) }}>Replace lost enrollment code</button>}</div>)}
        <form className="space-y-3" onSubmit={e => { e.preventDefault(); save('terminal', { ...terminal, branch: Number(terminal.branch), starting_serial: Number(terminal.starting_serial) }, terminal.id || undefined) }}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">Registered branch<select required className={`${inputClass} mt-1`} disabled={busy} value={terminal.branch} onChange={e => setTerminal({ ...terminal, branch: e.target.value })}><option value="">Choose a registered branch</option>{snapshot.branches.map(b => <option key={b.id} value={b.id}>{b.branch_name} ({b.branch_code})</option>)}</select></label>
            {field('Terminal code (unique, uppercase letters/digits)', terminal.terminal_code, v => setTerminal({ ...terminal, terminal_code: v }))}
            {field('Machine serial number', terminal.machine_serial, v => setTerminal({ ...terminal, machine_serial: v }))}
            {field('BIR-issued MIN', terminal.min, v => setTerminal({ ...terminal, min: v }))}
            {field('Permit to Use number', terminal.ptu, v => setTerminal({ ...terminal, ptu: v }))}
            {field('PTU issue date', terminal.ptu_issued_on, v => setTerminal({ ...terminal, ptu_issued_on: v }), false, 'date')}
            {field('Starting invoice serial', terminal.starting_serial, v => setTerminal({ ...terminal, starting_serial: v }), false, 'number')}
          </div>
          <button disabled={busy} className={buttonClass}>{terminal.id ? 'Update terminal draft' : 'Save terminal draft'}</button>
          {!!terminal.id && <button type="button" className="ml-3 text-sm" onClick={() => setTerminal({ id: '', branch: '', terminal_code: '', machine_serial: '', min: '', ptu: '', ptu_issued_on: '', starting_serial: '1' })}>New terminal</button>}
        </form>
      </section>
      {activation && <section className="border border-amber-300 bg-amber-50 rounded-lg p-4 space-y-3"><h3 className="font-semibold">{activation.activated_at ? 'Replace enrollment code for' : 'Activate'} {activation.terminal_code}</h3><p className="text-sm">Replacing a code invalidates the previous code and is available only before enrollment. Activation locks this terminal and its company/branch fiscal identity. Check the saved details above against your registration documents. Existing invoice series must not restart.</p>{field('Administrator password', password, setPassword, false, 'password')}<label className="flex gap-2 text-sm"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} />I verified the company, branch, terminal and invoice starting serial.</label><button className={buttonClass} disabled={busy || !reviewed || !password} onClick={activate}>{activation.activated_at ? 'Replace enrollment code' : 'Activate and generate enrollment code'}</button><button className="ml-3 text-sm" disabled={busy} onClick={() => { setActivation(null); setPassword('') }}>Cancel</button></section>}
      {enrollment && <section className="rounded-lg border border-green-300 bg-green-50 p-4 space-y-2"><h3 className="font-semibold">Enroll this terminal in the POS</h3><p className="text-sm">Open the POS setup screen and select Enroll from admin dashboard. Use the same administrator account. Save this code securely now; it is displayed only once and is bound to the first installation that claims it.</p><p className="text-sm break-all">Terminal ID: <code>{enrollment.terminal_id}</code></p><p className="text-sm break-all">Enrollment code: <code>{enrollment.enrollment_code}</code></p><button className="text-sm underline" onClick={() => setEnrollment(null)}>I saved the code — dismiss</button></section>}
      <section className="border-t pt-5"><h3 className="font-semibold mb-2">Registration history (latest 100)</h3>{snapshot.audit.map(a => <details key={a.id} className="text-xs py-2 border-b"><summary>{new Date(a.created_at).toLocaleString()} · {a.action} · {a.actor__email}</summary><pre className="whitespace-pre-wrap break-all mt-2">{JSON.stringify({ before: a.before, after: a.after }, null, 2)}</pre></details>)}</section>
    </>}
  </div>
}
