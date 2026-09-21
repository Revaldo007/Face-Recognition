import { useAuth } from '../context/AuthContext'

export default function Navbar({ onMenu }) {
  const { user, logout } = useAuth()
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <button className="btn-secondary md:hidden !px-2.5" onClick={onMenu} aria-label="Menu">☰</button>
        <h1 className="text-lg font-semibold text-slate-800">Face Attendance System</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{user.name}</p>
          <p className="text-xs capitalize text-slate-500">{user.role}</p>
        </div>
        <button className="btn-secondary" onClick={logout}>Logout</button>
      </div>
    </header>
  )
}
