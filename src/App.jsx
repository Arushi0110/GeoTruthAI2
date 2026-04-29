import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { isAuthenticated } from './utils/auth';

import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import ProtectedRoute from './components/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Landing = lazy(() => import('./pages/Landing'));
const Verify = lazy(() => import('./pages/Verify'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-600 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  const authenticated = isAuthenticated();
  return (
    <div className="min-h-screen bg-gray-50">
      {authenticated && <Navbar />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={authenticated ? <Navigate to="/home" replace /> : <Login />} />
          <Route path="/signup" element={authenticated ? <Navigate to="/home" replace /> : <Signup />} />
          <Route path="/home" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
          <Route path="/verify" element={<ProtectedRoute><Verify /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to={authenticated ? '/home' : '/login'} replace />} />
          <Route path="*" element={<Navigate to={authenticated ? '/home' : '/login'} replace />} />
        </Routes>
      </Suspense>
      {authenticated && <Chatbot />}
    </div>
  );
}

export default App;
