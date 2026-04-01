import { Navigate, Route, Routes } from "react-router-dom";

import { AdminRoute } from "./components/AdminRoute";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminUserDetailPage } from "./pages/AdminUserDetailPage";
import { DashboardHomePage } from "./pages/DashboardHomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";
import { UploadPage } from "./pages/UploadPage";
import { VideosPage } from "./pages/VideosPage";
import { ProfilePage } from "./pages/ProfilePage";

function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHomePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="videos" element={<VideosPage />} />
        <Route
          path="users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        <Route
          path="users/:userId"
          element={
            <AdminRoute>
              <AdminUserDetailPage />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
