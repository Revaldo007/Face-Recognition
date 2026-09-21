import { PercentBadge, StatusBadge, fmtDate } from './ui'

// Generic attendance tables used on several pages.
// variant="students": list of students (present/absent list)
// variant="subjects": subject-wise attendance
// variant="history":  date-wise history
export default function AttendanceTable({ rows, variant = 'subjects' }) {
  if (!rows?.length) return <p className="py-6 text-center text-sm text-slate-500">No records found.</p>

  const heads = {
    subjects: ['Subject', 'Classes', 'Present', 'Absent', 'Attendance %'],
    students: ['Roll No', 'Student', 'Classes', 'Present', 'Absent', 'Attendance %'],
    history: ['Date', 'Subject', 'Status', 'Time'],
  }[variant]

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50"><tr>{heads.map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">
          {variant === 'subjects' && rows.map((r) => (
            <tr key={r.subject_id}>
              <td className="td font-medium">{r.subject} <span className="text-slate-400">({r.code})</span></td>
              <td className="td">{r.present}/{r.classes}</td>
              <td className="td text-emerald-600">{r.present}</td>
              <td className="td text-rose-600">{r.absent}</td>
              <td className="td"><PercentBadge value={r.percentage} total={r.classes} /></td>
            </tr>
          ))}
          {variant === 'students' && rows.map((r) => (
            <tr key={r.id}>
              <td className="td">{r.roll_number}</td>
              <td className="td font-medium">{r.name}</td>
              <td className="td">{r.total_classes}</td>
              <td className="td text-emerald-600">{r.present}</td>
              <td className="td text-rose-600">{r.absent}</td>
              <td className="td"><PercentBadge value={r.percentage} total={r.total_classes} /></td>
            </tr>
          ))}
          {variant === 'history' && rows.map((r, i) => (
            <tr key={i}>
              <td className="td">{fmtDate(r.date)}</td>
              <td className="td">{r.subject}</td>
              <td className="td"><StatusBadge status={r.status} /></td>
              <td className="td">{r.time || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
