import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Alert, PageHeader, PercentBadge, StatusBadge, fmtDate } from '../../components/ui'

export default function FacultyDashboard() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/subjects'), api.get('/attendance/sessions')])
      .then(([s, a]) => { setSubjects(s.data); setSessions(a.data.slice(0, 6)) })
      .catch((e) => setError(errorMessage(e)))
  }, [])

  return (
    <div>
      <PageHeader title={`Welcome, ${user.name}`} subtitle="Your subjects and recent attendance sessions">
        <Link to="/faculty/enroll" className="btn-secondary">Enroll Faces</Link>
        <Link to="/faculty/session" className="btn-primary">Take Attendance</Link>
      </PageHeader>
      <Alert>{error}</Alert>

      <h3 className="mb-3 mt-2 font-semibold">Assigned Subjects</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.length === 0 && <p className="text-sm text-slate-500">No subjects assigned yet. Ask the admin to assign subjects to you.</p>}
        {subjects.map((s) => (
          <div key={s.id} className="card">
            <p className="text-xs font-semibold uppercase text-indigo-600">{s.code}</p>
            <p className="text-lg font-semibold">{s.name}</p>
            <p className="text-sm text-slate-500">{s.course_name} · Semester {s.semester}</p>
            <Link to={`/faculty/session?subject=${s.id}`} className="btn-primary mt-4 w-full">Start Attendance</Link>
          </div>
        ))}
      </div>

      <h3 className="mb-3 mt-8 font-semibold">Recent Sessions</h3>
      <div className="card overflow-x-auto !p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50"><tr>{['Date', 'Subject', 'Section', 'Present', 'Absent', '%', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {sessions.length === 0 && <tr><td className="td text-center text-slate-500" colSpan={7}>No sessions yet.</td></tr>}
            {sessions.map((s) => (
              <tr key={s.id}>
                <td className="td">{fmtDate(s.date)}</td><td className="td">{s.subject}</td><td className="td">{s.section}</td>
                <td className="td text-emerald-600">{s.present_count}</td><td className="td text-rose-600">{s.absent_count}</td>
                <td className="td"><PercentBadge value={s.percentage} total={s.total_students} /></td>
                <td className="td"><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
