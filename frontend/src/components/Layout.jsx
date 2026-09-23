import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

// Sidebar + Navbar around every logged-in page
export default function Layout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        <Navbar onMenu={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 flex flex-col min-h-0"><Outlet /></main>
      </div>
    </div>
  )
}
