import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Alert, PageHeader, PercentBadge, StatCard } from '../../components/ui'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/reports/student/${user.profile_id}`).then((r) => setReport(r.data)).catch((e) => setError(errorMessage(e)))
  }, [user.profile_id])

  const overall = report?.overall
  return (
    <div>
      <PageHeader title={`Hello, ${user.name}`} subtitle="Your attendance at a glance">
        <Link to="/student/attendance" className="btn-primary">View Full Attendance</Link>
      </PageHeader>
      <Alert>{error}</Alert>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Overall Attendance" value={overall ? `${overall.percentage}%` : '-'} icon="📊" color="indigo" />
        <StatCard label="Classes Attended" value={overall?.present} icon="✅" color="emerald" />
        <StatCard label="Classes Missed" value={overall?.absent} icon="❌" color="rose" />
        <StatCard label="Total Classes" value={overall?.classes} icon="🗓️" color="sky" />
      </div>
      {overall && overall.classes > 0 && overall.percentage < 75 && (
        <div className="mt-4"><Alert>Your attendance is below 75%. Please attend classes regularly.</Alert></div>
      )}

      <h3 className="mb-3 mt-6 font-semibold">Subject-wise Attendance</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {report?.subjects.map((s) => (
          <div key={s.subject_id} className="card">
            <div className="flex items-start justify-between">
              <div><p className="font-semibold">{s.subject}</p><p className="text-xs text-slate-500">{s.code}</p></div>
              <span className="text-xl"><PercentBadge value={s.percentage} total={s.classes} /></span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${s.percentage >= 75 ? 'bg-emerald-500' : s.percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${s.percentage}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-500">{s.present}/{s.classes} classes attended</p>
          </div>
        ))}
        {report && report.subjects.length === 0 && <p className="text-sm text-slate-500">No subjects found for your course and semester.</p>}
      </div>
    </div>
  )
}
