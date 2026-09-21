import { useEffect, useState } from 'react'
import api, { errorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Alert, PageHeader } from '../../components/ui'

export default function Profile() {
  const { user } = useAuth()
  const [s, setS] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/students/${user.profile_id}`).then((r) => setS(r.data)).catch((e) => setError(errorMessage(e)))
  }, [user.profile_id])

  const rows = s && [
    ['Student ID', s.student_id], ['Roll Number', s.roll_number], ['Name', s.name], ['Email', s.email],
    ['Phone', s.phone || '-'], ['Department', s.department_name], ['Course', s.course_name],
    ['Year', s.year], ['Semester', s.semester], ['Section', s.section],
    ['Face Enrolled', s.face_enrolled ? 'Yes' : 'No'],
  ]
  return (
    <div>
      <PageHeader title="My Profile" />
      <Alert>{error}</Alert>
      {s && (
        <div className="card max-w-2xl">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">{s.name[0]}</div>
            <div><p className="text-xl font-bold">{s.name}</p><p className="text-sm text-slate-500">{s.course_name} · Semester {s.semester}</p></div>
          </div>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {rows.map(([k, v]) => <div key={k}><dt className="text-xs uppercase text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></div>)}
          </dl>
        </div>
      )}
    </div>
  )
}
