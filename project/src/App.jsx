import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserLogin from './pages/auth/UserLogin';
import UserRegister from './pages/auth/UserRegister';
import AdminLogin from './pages/auth/AdminLogin';
import AdminRegister from './pages/auth/AdminRegister';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminApplications from './pages/admin/AdminApplications';
import AdminProfile from './pages/admin/AdminProfile';

import UserJobs from './pages/user/UserJobs';
import JobDetails from './pages/user/JobDetails';
import UserProfile from './pages/user/UserProfile';
import ATSScore from './pages/user/ATSScore';
import Messages from './pages/Messages';
import SavedJobs from './pages/user/SavedJobs';
import ContactUs from './pages/user/ContactUs';

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* Legacy auth paths -> point to user versions */}
      <Route path="/login" element={!user ? <UserLogin /> : <Navigate to={profile?.role === 'admin' ? '/admin/dashboard' : '/'} />} />
      <Route path="/register" element={!user ? <UserRegister /> : <Navigate to={profile?.role === 'admin' ? '/admin/dashboard' : '/'} />} />

      {/* New explicit auth paths */}
      <Route path="/user/login" element={!user ? <UserLogin /> : <Navigate to={profile?.role === 'admin' ? '/admin/dashboard' : '/'} />} />
      <Route path="/user/register" element={!user ? <UserRegister /> : <Navigate to={profile?.role === 'admin' ? '/admin/dashboard' : '/'} />} />
      <Route path="/admin/login" element={!user ? <AdminLogin /> : <Navigate to={profile?.role === 'admin' ? '/admin/dashboard' : '/'} />} />
      <Route path="/admin/register" element={!user ? <AdminRegister /> : <Navigate to={profile?.role === 'admin' ? '/admin/dashboard' : '/'} />} />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/applications"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/jobs"
        element={
          <ProtectedRoute requiredRole="user">
            <UserJobs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/saved"
        element={
          <ProtectedRoute requiredRole="user">
            <SavedJobs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/jobs/:jobId"
        element={
          <ProtectedRoute requiredRole="user">
            <JobDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/profile"
        element={
          <ProtectedRoute requiredRole="user">
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/ats"
        element={
          <ProtectedRoute requiredRole="user">
            <ATSScore />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/contact"
        element={
          <ProtectedRoute requiredRole="user">
            <ContactUs />
          </ProtectedRoute>
        }
      />


      {/* Old per-role message routes removed; unified Messages page is used instead */}

      {/* Shared messages routes for both roles */}
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages/:code"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
