import { Route, BrowserRouter, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { AuthCallbackPage } from "@/pages/AuthCallbackPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { PatientsPage } from "@/pages/PatientsPage"
import { PatientDetailPage } from "@/pages/PatientDetailPage"
import { AppointmentsPage } from "@/pages/AppointmentsPage"
import { ToothChartPage } from "@/pages/ToothChartPage"
import { LabWorksPage } from "@/pages/LabWorksPage"
import { WaitlistPage } from "@/pages/WaitlistPage"
import { ExpensesPage } from "@/pages/ExpensesPage"
import { SuppliesPage } from "@/pages/SuppliesPage"
import { TasksPage } from "@/pages/TasksPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { InvoicePage } from "@/pages/InvoicePage"
import { StatisticsPage } from "@/pages/StatisticsPage"
import { DoctorsPage } from "@/pages/DoctorsPage"
import { ServicesPage } from "@/pages/ServicesPage"
import { DrugsPage } from "@/pages/DrugsPage"
import { ChairsPage } from "@/pages/ChairsPage"
import { MedicalCatalogsPage } from "@/pages/MedicalCatalogsPage"
import { UsersPage } from "@/pages/UsersPage"
import { RolesPage } from "@/pages/RolesPage"
import { PatientPortalAuthProvider } from "@/auth/PatientPortalAuthProvider"
import { PortalProtectedRoute } from "@/components/portal/PortalProtectedRoute"
import { PortalAuthCallbackPage } from "@/pages/portal/PortalAuthCallbackPage"
import { PortalLayout } from "@/pages/portal/PortalLayout"
import { PortalDashboardPage } from "@/pages/portal/PortalDashboardPage"
import { PortalAppointmentsPage } from "@/pages/portal/PortalAppointmentsPage"

function PatientPortalRoutes() {
  return (
    <PatientPortalAuthProvider>
      <Routes>
        <Route path="auth-callback" element={<PortalAuthCallbackPage />} />
        <Route
          index
          element={
            <PortalProtectedRoute>
              <PortalLayout>
                <PortalDashboardPage />
              </PortalLayout>
            </PortalProtectedRoute>
          }
        />
        <Route
          path="appointments"
          element={
            <PortalProtectedRoute>
              <PortalLayout>
                <PortalAppointmentsPage />
              </PortalLayout>
            </PortalProtectedRoute>
          }
        />
      </Routes>
    </PatientPortalAuthProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth-callback" element={<AuthCallbackPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
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
          path="/patients/:patientId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PatientDetailPage />
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
        <Route
          path="/lab-works"
          element={
            <ProtectedRoute>
              <AppLayout>
                <LabWorksPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/waitlist"
          element={
            <ProtectedRoute>
              <AppLayout>
                <WaitlistPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctors"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DoctorsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ServicesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/drugs"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DrugsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chairs"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ChairsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-catalogs"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MedicalCatalogsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ExpensesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/supplies"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SuppliesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <AppLayout>
                <TasksPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <ProtectedRoute>
              <AppLayout>
                <StatisticsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AppLayout>
                <UsersPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute>
              <AppLayout>
                <RolesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments/:appointmentId/invoice"
          element={
            <ProtectedRoute>
              <InvoicePage />
            </ProtectedRoute>
          }
        />
        <Route path="/portal/*" element={<PatientPortalRoutes />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
