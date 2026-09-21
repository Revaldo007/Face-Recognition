import { useEffect, useState } from 'react'
import api, { errorMessage } from '../services/api'
import AttendanceTable from '../components/AttendanceTable'
import { Alert, PageHeader, PercentBadge, fmtDate } from '../components/ui'

const TABS = [['daily', 'Daily'], ['monthly', 'Monthly'], ['subject', 'Subject-wise'], ['student', 'Student']]
const todayIso = () => new Date().toLocaleDateString('en-CA')   // YYYY-MM-DD

// Shared by Admin and Faculty
export default function Reports() {
  const [tab, setTab] = useState('daily')
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/subjects').then((r) => setSubjects(r.data)).catch(() => {})
    api.get('/students').then((r) => setStudents(r.data)).catch(() => {})
  }, [])

  return (
    <div>
      <PageHeader title="Attendance Reports" subtitle="Attendance % = (Present Classes / Total Classes) × 100">
        <button className="btn-secondary" onClick={() => window.print()}>Print</button>
      </PageHeader>
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-200 p-1">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setError('') }}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${tab === key ? 'bg-white shadow' : 'text-slate-600'}`}>{label}</button>
        ))}
      </div>
      <Alert>{error}</Alert>
      {tab === 'daily' && <Daily subjects={subjects} onError={setError} />}
      {tab === 'monthly' && <Monthly subjects={subjects} onError={setError} />}
      {tab === 'subject' && <SubjectWise subjects={subjects} onError={setError} />}
      {tab === 'student' && <StudentWise students={students} onError={setError} />}
    </div>
  )
}

function Filters({ children }) { return <div className="card mb-4 flex flex-wrap items-end gap-4">{children}</div> }

function SubjectSelect({ subjects, value, onChange, allowAll }) {
  return (
    <div className="min-w-56">
      <label className="label">Subject</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allowAll ? 'All subjects' : 'Select subject...'}</option>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
      </select>
    </div>
  )
}

function Daily({ subjects, onError }) {
  const [date, setDate] = useState(todayIso())
  const [subject, setSubject] = useState('')
  const [rows, setRows] = useState([])
  useEffect(() => {
    api.get('/reports/daily', { params: { date, subject_id: subject || undefined } })
      .then((r) => { setRows(r.data.rows); onError('') }).catch((e) => onError(errorMessage(e)))
  }, [date, subject])   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Filters>
        <div><label className="label">Date</label><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <SubjectSelect subjects={subjects} value={subject} onChange={setSubject} allowAll />
      </Filters>
      <div className="card overflow-x-auto !p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50"><tr>{['Date', 'Subject', 'Section', 'Total Students', 'Present', 'Absent', 'Attendance %'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && <tr><td colSpan={7} className="td text-center text-slate-500">No sessions on this date.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="td">{fmtDate(r.date)}</td><td className="td font-medium">{r.subject}</td><td className="td">{r.section}</td>
                <td className="td">{r.total_students}</td><td className="td text-emerald-600">{r.present_count}</td>
                <td className="td text-rose-600">{r.absent_count}</td><td className="td"><PercentBadge value={r.percentage} total={r.total_students} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Monthly({ subjects, onError }) {
  const [month, setMonth] = useState(todayIso().slice(0, 7))   // YYYY-MM
  const [subject, setSubject] = useState('')
  const [data, setData] = useState(null)
  useEffect(() => {
    const [year, m] = month.split('-').map(Number)
    if (!year || !m) return
    api.get('/reports/monthly', { params: { year, month: m, subject_id: subject || undefined } })
      .then((r) => { setData(r.data); onError('') }).catch((e) => onError(errorMessage(e)))
  }, [month, subject])   // eslint-disable-line react-hooks/exhaustive-deps

  const Table = ({ head, rows, first }) => (
    <div className="card overflow-x-auto !p-0">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50"><tr>{[head, 'Sessions', 'Total', 'Present', 'Absent', '%'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && <tr><td colSpan={6} className="td text-center text-slate-500">No data.</td></tr>}
          {rows.map((r) => (
            <tr key={r[first]}><td className="td font-medium">{first === 'date' ? fmtDate(r.date) : r[first]}</td><td className="td">{r.sessions}</td><td className="td">{r.total}</td>
              <td className="td text-emerald-600">{r.present}</td><td className="td text-rose-600">{r.absent}</td><td className="td"><PercentBadge value={r.percentage} total={r.total} /></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <>
      <Filters>
        <div><label className="label">Month</label><input type="month" className="input" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
        <SubjectSelect subjects={subjects} value={subject} onChange={setSubject} allowAll />
        {data && <div className="ml-auto text-right"><p className="text-xs text-slate-500">Month attendance</p><p className="text-2xl font-bold"><PercentBadge value={data.summary.percentage} total={data.summary.total} /></p></div>}
      </Filters>
      {data && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div><h4 className="mb-2 font-semibold">By Day</h4><Table head="Date" first="date" rows={data.days} /></div>
          <div><h4 className="mb-2 font-semibold">By Subject</h4><Table head="Subject" first="subject" rows={data.subjects} /></div>
        </div>
      )}
    </>
  )
}

function SubjectWise({ subjects, onError }) {
  const [subject, setSubject] = useState('')
  const [data, setData] = useState(null)
  useEffect(() => {
    if (!subject) return setData(null)
    api.get(`/reports/subject/${subject}`).then((r) => { setData(r.data); onError('') }).catch((e) => onError(errorMessage(e)))
  }, [subject])   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Filters>
        <SubjectSelect subjects={subjects} value={subject} onChange={setSubject} />
        {data && <p className="ml-auto text-sm text-slate-500">Classes conducted: <b>{data.classes_conducted}</b></p>}
      </Filters>
      <div className="card !p-0">
        {data ? <AttendanceTable rows={data.students} variant="students" /> : <p className="p-6 text-center text-sm text-slate-500">Select a subject to see student-wise attendance.</p>}
      </div>
    </>
  )
}

function StudentWise({ students, onError }) {
  const [student, setStudent] = useState('')
  const [data, setData] = useState(null)
  useEffect(() => {
    if (!student) return setData(null)
    api.get(`/reports/student/${student}`).then((r) => { setData(r.data); onError('') }).catch((e) => onError(errorMessage(e)))
  }, [student])   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <Filters>
        <div className="min-w-64">
          <label className="label">Student</label>
          <select className="input" value={student} onChange={(e) => setStudent(e.target.value)}>
            <option value="">Select student...</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
          </select>
        </div>
        {data && <div className="ml-auto text-right"><p className="text-xs text-slate-500">Overall</p><p className="text-2xl font-bold"><PercentBadge value={data.overall.percentage} total={data.overall.classes} /></p></div>}
      </Filters>
      <div className="card !p-0">
        {data ? <AttendanceTable rows={data.subjects} variant="subjects" /> : <p className="p-6 text-center text-sm text-slate-500">Select a student to see subject-wise attendance.</p>}
      </div>
    </>
  )
}
