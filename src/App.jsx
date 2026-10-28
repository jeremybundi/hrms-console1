import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/context'
import Shell from './components/Shell'
import { Spinner } from './components/ui'
import LoginPage from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import OrganisationsPage from './pages/OrganisationsPage'
import OrganisationPage from './pages/OrganisationPage'
import UsersPage from './pages/UsersPage'
import UserPage from './pages/UserPage'
import HealthPage from './pages/HealthPage'
import ActivityPage from './pages/ActivityPage'
import AuditPage from './pages/AuditPage'

export default function App() {
  const { user, ready } = useAuth()

  if (!ready) return <Spinner />
  if (!user) return <LoginPage />

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<OverviewPage />} />
        <Route path="organisations" element={<OrganisationsPage />} />
        <Route path="organisations/:id" element={<OrganisationPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserPage />} />
        <Route path="health" element={<HealthPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
