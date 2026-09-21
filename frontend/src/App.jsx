import { Navigate, Route, Routes } from 'react-router-dom'
import { homePathFor, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import Login from './pages/Login'

import AdminDashboard from './pages/admin/AdminDashboard'
import Students from './pages/admin/Students'
import Faculty from './pages/admin/Faculty'
import Departments from './pages/admin/Departments'
import Courses from './pages/admin/Courses'
import Subjects from './pages/admin/Subjects'

import FacultyDashboard from './pages/faculty/FacultyDashboard'
import FaceEnrollment from './pages/faculty/FaceEnrollment'
import AttendanceSession from './pages/faculty/AttendanceSession'
import AttendanceRecords from './pages/faculty/AttendanceRecords'
import Reports from './pages/Reports'

import StudentDashboard from './pages/student/StudentDashboard'
import MyAttendance from './pages/student/MyAttendance'
import Profile from './pages/student/Profile'

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          {/* ---------- Admin ---------- */}
          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<Students />} />
            <Route path="/admin/faculty" element={<Faculty />} />
            <Route path="/admin/departments" element={<Departments />} />
            <Route path="/admin/courses" element={<Courses />} />
            <Route path="/admin/subjects" element={<Subjects />} />
            <Route path="/admin/attendance" element={<AttendanceRecords />} />
            <Route path="/admin/reports" element={<Reports />} />
          </Route>

          {/* ---------- Faculty ---------- */}
          <Route element={<RoleRoute roles={['faculty']} />}>
            <Route path="/faculty" element={<FacultyDashboard />} />
            <Route path="/faculty/enroll" element={<FaceEnrollment />} />
            <Route path="/faculty/session" element={<AttendanceSession />} />
            <Route path="/faculty/records" element={<AttendanceRecords />} />
            <Route path="/faculty/reports" element={<Reports />} />
          </Route>

          {/* ---------- Student ---------- */}
          <Route element={<RoleRoute roles={['student']} />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/attendance" element={<MyAttendance />} />
            <Route path="/student/profile" element={<Profile />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
