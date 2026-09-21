import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LINKS = {
  admin: [
    ['/admin', 'Dashboard', '📊', true],
    ['/admin/students', 'Students', '🎓'],
    ['/admin/faculty', 'Faculty', '👨‍🏫'],
    ['/admin/departments', 'Departments', '🏢'],
    ['/admin/courses', 'Courses', '📚'],
    ['/admin/subjects', 'Subjects', '📖'],
    ['/admin/attendance', 'Attendance', '🗂️'],
    ['/admin/reports', 'Reports', '📈'],
  ],
  faculty: [
    ['/faculty', 'Dashboard', '📊', true],
    ['/faculty/enroll', 'Face Enrollment', '🧑‍💻'],
    ['/faculty/session', 'Take Attendance', '📷'],
    ['/faculty/records', 'Attendance Records', '🗂️'],
    ['/faculty/reports', 'Reports', '📈'],
  ],
  student: [
    ['/student', 'Dashboard', '📊', true],
    ['/student/attendance', 'My Attendance', '🗓️'],
    ['/student/profile', 'Profile', '👤'],
  ],
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-30 w-60 transform bg-slate-900 p-4 text-slate-200 transition md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-6 flex items-center gap-2 px-2 pt-1">
          <span className="text-2xl">🧑‍🎓</span>
          <span className="text-lg font-bold text-white">FaceAttend</span>
        </div>
        <nav className="space-y-1">
          {LINKS[user.role].map(([to, label, icon, end]) => (
            <NavLink
              key={to} to={to} end={end} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
            >
              <span>{icon}</span>{label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
