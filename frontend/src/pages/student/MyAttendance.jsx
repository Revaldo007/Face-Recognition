import { useEffect, useState } from 'react'
import api, { errorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import AttendanceTable from '../../components/AttendanceTable'
import { Alert, PageHeader, PercentBadge } from '../../components/ui'

export default function MyAttendance() {
  const { user } = useAuth()
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/reports/student/${user.profile_id}`).then((r) => setReport(r.data)).catch((e) => setError(errorMessage(e)))
  }, [user.profile_id])

  return (
    <div>
      <PageHeader title="My Attendance" subtitle="Students cannot mark attendance manually - it is recorded by the face-recognition camera">
        {report && <div className="text-right"><p className="text-xs text-slate-500">Overall</p><p className="text-2xl font-bold"><PercentBadge value={report.overall.percentage} total={report.overall.classes} /></p></div>}
      </PageHeader>
      <Alert>{error}</Alert>
      <h3 className="mb-2 mt-2 font-semibold">Subject-wise</h3>
      <div className="card !p-0"><AttendanceTable rows={report?.subjects} variant="subjects" /></div>
      <h3 className="mb-2 mt-6 font-semibold">Attendance History</h3>
      <div className="card !p-0"><AttendanceTable rows={report?.history} variant="history" /></div>
    </div>
  )
}
