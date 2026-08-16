import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { ConfigPage } from '@/pages/ConfigPage'
import { DatabasePage } from '@/pages/DatabasePage'
import { DatabaseTablePage } from '@/pages/DatabaseTablePage'
import { AuditLogPage } from '@/pages/AuditLogPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route element={<ProtectedRoute allow={['owner']} />}>
              <Route path="/config" element={<ConfigPage />} />
              <Route path="/database" element={<DatabasePage />} />
              <Route path="/database/:tableName" element={<DatabaseTablePage />} />
            </Route>
            <Route element={<ProtectedRoute allow={['owner', 'platform_operator']} />}>
              <Route path="/audit-log" element={<AuditLogPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
