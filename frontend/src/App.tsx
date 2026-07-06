import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { AuthCallbackPage } from "@/pages/AuthCallbackPage"
import { PatientsPage } from "@/pages/PatientsPage"
import { AppointmentsPage } from "@/pages/AppointmentsPage"
import { ToothChartPage } from "@/pages/ToothChartPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth-callback" element={<AuthCallbackPage />} />
        <Route path="/" element={<Navigate to="/patients" replace />} />
        <Route
          path="/patients"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PatientsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AppointmentsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:patientId/tooth-chart"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ToothChartPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
