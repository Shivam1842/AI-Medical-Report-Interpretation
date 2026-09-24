import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AiExplanation from './pages/AiExplanation';
import Processing from './pages/Processing';
import ReportHistory from './pages/ReportHistory';
import ResultDashboard from './pages/ResultDashboard';
import UploadReport from './pages/UploadReport';

// Auth Imports
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './context/AuthContext'; 

// Forces logged-out users to the login page
const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

// Forces logged-in users away from auth pages straight to the app
const PublicRoute = ({ children }) => {
  const { token } = useAuth();
  return !token ? children : <Navigate to="/upload" replace />;
};

// We create an inner component so we can safely use the auth context inside the provider
function AppRoutes() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-shell">
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected App Routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadReport /></ProtectedRoute>} />
          <Route path="/processing" element={<ProtectedRoute><Processing /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><ResultDashboard /></ProtectedRoute>} />
          <Route path="/result" element={<Navigate to="/results" replace />} />
          <Route path="/history" element={<ProtectedRoute><ReportHistory /></ProtectedRoute>} />
          <Route path="/ai-explanation" element={<ProtectedRoute><AiExplanation /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
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