import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import WorkspaceLayout from './pages/workspace/WorkspaceLayout';
import OverviewPage from './pages/workspace/OverviewPage';
import TasksPage from './pages/workspace/TasksPage';
import NotesPage from './pages/workspace/NotesPage';
import DocumentsPage from './pages/workspace/DocumentsPage';
import ResearchPage from './pages/workspace/ResearchPage';
import MeetingsPage from './pages/workspace/MeetingsPage';
import TeamPage from './pages/workspace/TeamPage';
import ActivityPage from './pages/workspace/ActivityPage';
import CalendarPage from './pages/workspace/CalendarPage';
import AdminPage from './pages/AdminPage';
import type { ReactNode } from 'react';

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" />
        <p className="text-sm text-slate-500">Loading ProjectHive…</p>
      </div>
    </div>
  );
}

function Protected({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected roles={['admin']}>
            <AdminPage />
          </Protected>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <Protected>
            <WorkspaceLayout />
          </Protected>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="research" element={<ResearchPage />} />
        <Route path="meetings" element={<MeetingsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="calendar" element={<CalendarPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
