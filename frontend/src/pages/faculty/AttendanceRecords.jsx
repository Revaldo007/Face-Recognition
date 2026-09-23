import { useEffect, useState } from 'react'
import api, { errorMessage } from '../../services/api'
import { Alert, Modal, PageHeader, PercentBadge, StatusBadge, fmtDate, fmtTime } from '../../components/ui'

// Used by both Admin ("Attendance") and Faculty ("Attendance Records")
export default function AttendanceRecords() {
  const [sessions, setSessions] = useState([])
  const [date, setDate] = useState('')
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)

  const load = () =>
    api.get('/attendance/sessions', { params: date ? { date } : {} })
      .then((r) => setSessions(r.data)).catch((e) => setError(errorMessage(e)))
  useEffect(() => { load() }, [date])   // eslint-disable-line react-hooks/exhaustive-deps

  const open = async (id) => {
    try { setDetail((await api.get(`/attendance/session/${id}`)).data) } catch (e) { setError(errorMessage(e)) }
  }

  return (
    <div>
      <PageHeader title="Attendance Records" subtitle="All attendance sessions and their results">
        <input type="date" className="input !w-44" value={date} onChange={(e) => setDate(e.target.value)} />
        {date && <button className="btn-secondary" onClick={() => setDate('')}>Clear</button>}
      </PageHeader>
      <Alert>{error}</Alert>
      <div className="card mt-3 overflow-x-auto !p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>{['Date', 'Subject', 'Class', 'Faculty', 'Time', 'Total', 'Present', 'Absent', '%', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sessions.length === 0 && <tr><td className="td text-center text-slate-500" colSpan={11}>No sessions found.</td></tr>}
            {sessions.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="td">{fmtDate(s.date)}</td>
                <td className="td font-medium">{s.subject}</td>
                <td className="td">{s.course} · Sem {s.semester} · {s.section}</td>
                <td className="td">{s.faculty}</td>
                <td className="td whitespace-nowrap">{fmtTime(s.start_time)}</td>
                <td className="td">{s.total_students}</td>
                <td className="td text-emerald-600">{s.present_count}</td>
                <td className="td text-rose-600">{s.absent_count}</td>
                <td className="td"><PercentBadge value={s.percentage} total={s.total_students} /></td>
                <td className="td"><StatusBadge status={s.status} /></td>
                <td className="td"><button className="text-sm font-medium text-indigo-600 hover:underline" onClick={() => open(s.id)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <Modal title={`${detail.subject} · ${fmtDate(detail.date)} · Section ${detail.section}`} onClose={() => setDetail(null)} wide>
          <div className="grid gap-5 md:grid-cols-2">
            <List title="Present" rows={detail.present} status="PRESENT" />
            <List title={detail.status === 'closed' ? 'Absent' : 'Not yet marked'} rows={detail.absent} status="ABSENT" />
          </div>
        </Modal>
      )}
    </div>
  )
}

function List({ title, rows, status }) {
  return (
    <div>
      <h4 className="mb-2 font-semibold">{title} ({rows.length})</h4>
      <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-lg ring-1 ring-slate-200">
        {rows.length === 0 && <li className="p-3 text-center text-sm text-slate-400">None</li>}
        {rows.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <span>{s.name} <span className="text-slate-400">{s.roll_number}</span></span>
            <span className="flex items-center gap-2">{s.time && <span className="text-xs text-slate-500">{s.time}</span>}<StatusBadge status={status} /></span>
          </li>
        ))}
      </ul>
    </div>
  )
}
