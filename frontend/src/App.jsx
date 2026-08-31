import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AiExplanation from './pages/AiExplanation';
import Processing from './pages/Processing';
import ReportHistory from './pages/ReportHistory';
import ResultDashboard from './pages/ResultDashboard';
import UploadReport from './pages/UploadReport';

function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navbar />
        <main className="page-shell">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<UploadReport />} />
            <Route path="/processing" element={<Processing />} />
            <Route path="/results" element={<ResultDashboard />} />
            <Route path="/result" element={<Navigate to="/results" replace />} />
            <Route path="/history" element={<ReportHistory />} />
            <Route path="/ai-explanation" element={<AiExplanation />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;