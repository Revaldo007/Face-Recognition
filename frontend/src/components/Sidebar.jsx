import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  BookOpen,
  BookMarked,
  ClipboardList,
  BarChart3,
  ScanFace,
  Camera,
  FileText,
  User,
  GraduationCap,
  CalendarCheck,
} from 'lucide-react'

const LINKS = {
  admin: [
    { to: '/admin',              label: 'Dashboard',   Icon: LayoutDashboard, end: true },
    { to: '/admin/students',     label: 'Students',    Icon: Users },
    { to: '/admin/faculty',      label: 'Faculty',     Icon: UserCog },
    { to: '/admin/departments',  label: 'Departments', Icon: Building2 },
    { to: '/admin/courses',      label: 'Courses',     Icon: BookOpen },
    { to: '/admin/subjects',     label: 'Subjects',    Icon: BookMarked },
    { to: '/admin/attendance',   label: 'Attendance',  Icon: ClipboardList },
    { to: '/admin/reports',      label: 'Reports',     Icon: BarChart3 },
  ],
  faculty: [
    { to: '/faculty',         label: 'Dashboard',          Icon: LayoutDashboard, end: true },
    { to: '/faculty/enroll',  label: 'Face Enrollment',    Icon: ScanFace },
    { to: '/faculty/session', label: 'Take Attendance',    Icon: Camera },
    { to: '/faculty/records', label: 'Attendance Records', Icon: ClipboardList },
    { to: '/faculty/reports', label: 'Reports',            Icon: BarChart3 },
  ],
  student: [
    { to: '/student',            label: 'Dashboard',    Icon: LayoutDashboard, end: true },
    { to: '/student/attendance', label: 'My Attendance', Icon: CalendarCheck },
    { to: '/student/profile',    label: 'Profile',      Icon: User },
  ],
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-slate-900 p-4 text-slate-200 transition-transform duration-200 md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-6 flex items-center gap-3 px-2 py-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-400 ring-1 ring-indigo-500/30">
            <GraduationCap size={20} strokeWidth={2} />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white block leading-tight">FaceAttend</span>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Attendance System</span>
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {LINKS[user.role].map(({ to, label, Icon, end }) => (
            <NavLink
              key={to} to={to} end={end} onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.8} className="shrink-0 transition-transform group-hover:scale-110" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
