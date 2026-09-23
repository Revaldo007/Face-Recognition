import { useAuth } from '../context/AuthContext'
import { Menu, LogOut } from 'lucide-react'

export default function Navbar({ onMenu }) {
  const { user, logout } = useAuth()
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="btn-secondary md:hidden !p-2 flex items-center justify-center text-slate-700"
          onClick={onMenu}
          aria-label="Menu"
        >
          <Menu size={18} />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Face Attendance System</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-slate-800">{user.name}</p>
          <p className="text-xs capitalize text-slate-500">{user.role}</p>
        </div>
        <button
          className="btn-secondary flex items-center gap-1.5 text-sm font-medium text-slate-700"
          onClick={logout}
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}
