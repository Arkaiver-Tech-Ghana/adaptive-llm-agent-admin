import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { ConfigPage } from '@/pages/ConfigPage'
import { MenuItemsPage } from '@/pages/MenuItemsPage'
import { RoomsPage } from '@/pages/RoomsPage'
import { StaffPage } from '@/pages/StaffPage'
import { AuditLogPage } from '@/pages/AuditLogPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route element={<ProtectedRoute allow={['owner']} />}>
              <Route path="/config" element={<ConfigPage />} />
              <Route path="/staff" element={<StaffPage />} />
            </Route>
            <Route path="/menu-items" element={<MenuItemsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
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
