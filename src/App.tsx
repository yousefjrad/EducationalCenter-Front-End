import { Routes, Route, Navigate, useLocation } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { I18nProvider } from '@/lib/i18n'
import { AppStoreProvider } from '@/store/AppStore'
import { AuthProvider, useAuth } from '@/lib/auth'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Courses from '@/pages/Courses'
import Sections from '@/pages/Sections'
import Schedule from '@/pages/Schedule'
import Students from '@/pages/Students'
import Trainers from '@/pages/Trainers'
import Payments from '@/pages/Payments'
import AttendancePage from '@/pages/Attendance'
import Certificates from '@/pages/Certificates'
import Expenses from '@/pages/Expenses'
import Reports from '@/pages/Reports'
import Users from '@/pages/Users'
import Audit from '@/pages/Audit'
import SettingsPage from '@/pages/Settings'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppStoreProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/sections" element={<Sections />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/students" element={<Students />} />
              <Route path="/trainers" element={<Trainers />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/certificates" element={<Certificates />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/users" element={<Users />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-center" richColors closeButton />
        </AppStoreProvider>
      </AuthProvider>
    </I18nProvider>
  )
}