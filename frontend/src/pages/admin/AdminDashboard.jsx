import { useEffect, useState } from 'react'
import api, { errorMessage } from '../../services/api'
import { Alert, PageHeader, StatCard } from '../../components/ui'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/reports/dashboard').then((r) => setStats(r.data)).catch((e) => setError(errorMessage(e)))
  }, [])

  const today = stats?.today
  const total = (today?.present ?? 0) + (today?.absent ?? 0)
  const presentPct = total ? Math.round((today.present / total) * 100) : 0

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Overview of the college attendance system" />
      <Alert>{error}</Alert>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Students" value={stats?.students} icon="🎓" color="indigo" />
        <StatCard label="Total Faculty" value={stats?.faculty} icon="👨‍🏫" color="sky" />
        <StatCard label="Total Departments" value={stats?.departments} icon="🏢" color="violet" />
        <StatCard label="Total Courses" value={stats?.courses} icon="📚" color="amber" />
        <StatCard label="Total Subjects" value={stats?.subjects} icon="📖" color="rose" />
        <StatCard label="Sessions Today" value={today?.sessions} icon="📷" color="emerald" />
      </div>

      <div className="card mt-6">
        <h3 className="mb-4 font-semibold">Today's Attendance</h3>
        <div className="mb-3 flex gap-8">
          <div><p className="text-sm text-slate-500">Present</p><p className="text-3xl font-bold text-emerald-600">{today?.present ?? 0}</p></div>
          <div><p className="text-sm text-slate-500">Absent</p><p className="text-3xl font-bold text-rose-600">{today?.absent ?? 0}</p></div>
          <div><p className="text-sm text-slate-500">Present %</p><p className="text-3xl font-bold">{presentPct}%</p></div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-rose-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${presentPct}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-400">Counted across all attendance sessions held today.</p>
      </div>
    </div>
  )
}
