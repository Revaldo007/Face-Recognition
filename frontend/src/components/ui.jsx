// Small reusable UI pieces: Modal, StatCard, StatusBadge, PercentBadge, Alert, PageHeader

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className={`mt-10 w-full rounded-xl bg-white shadow-xl ${wide ? 'max-w-3xl' : 'max-w-xl'}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button className="text-xl text-slate-400 hover:text-slate-700" onClick={onClose}>×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function StatCard({ label, value, color = 'indigo', icon }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600', emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600', violet: 'bg-violet-50 text-violet-600',
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold">{value ?? '-'}</p>
      </div>
    </div>
  )
}

export function StatusBadge({ status }) {
  const map = {
    PRESENT: 'bg-emerald-100 text-emerald-700', ABSENT: 'bg-rose-100 text-rose-700',
    active: 'bg-emerald-100 text-emerald-700', closed: 'bg-slate-200 text-slate-600',
  }
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || 'bg-slate-100'}`}>{status}</span>
}

export function PercentBadge({ value, total }) {
  if (total === 0) return <span className="text-slate-400">-</span>
  const color = value >= 75 ? 'text-emerald-600' : value >= 60 ? 'text-amber-600' : 'text-rose-600'
  return <span className={`font-semibold ${color}`}>{value}%</span>
}

export function Alert({ type = 'error', children }) {
  if (!children) return null
  const styles = { error: 'bg-red-50 text-red-700 ring-red-200', success: 'bg-emerald-50 text-emerald-700 ring-emerald-200', info: 'bg-sky-50 text-sky-700 ring-sky-200' }
  return <div className={`rounded-lg px-4 py-2.5 text-sm ring-1 ${styles[type]}`}>{children}</div>
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  )
}

export const fmtTime = (t) => {
  if (!t) return '-'
  const [hStr, mStr, sStr] = t.split(':')
  let h = parseInt(hStr, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${mStr}:${sStr ? sStr.slice(0, 2) : '00'} ${ampm}`
}
export const fmtDate = (d) => (d ? d.split('-').reverse().join('-') : '-')   // 2026-09-21 -> 21-09-2026
