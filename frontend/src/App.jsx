import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Import all 6 page components from your pages directory
import Home from './pages/Home';
import AiExplanation from './pages/AiExplanation';
import Processing from './pages/Processing';
import ReportHistory from './pages/ReportHistory';
import ResultDashboard from './pages/ResultDashboard';
import UploadReport from './pages/UploadReport';

function App() {
  return (
    <Router>
      {/* Optional: Simple navigation bar to test switching between pages */}
      <nav style={{ padding: '1rem', background: '#f0f0f0', display: 'flex', gap: '1rem' }}>
        <Link to="/">Home</Link>
        <Link to="/upload">Upload Report</Link>
        <Link to="/processing">Processing</Link>
        <Link to="/result">Result Dashboard</Link>
        <Link to="/history">Report History</Link>
        <Link to="/ai-explanation">AI Explanation</Link>
      </nav>

      {/* Define page routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<UploadReport />} />
        <Route path="/processing" element={<Processing />} />
        <Route path="/result" element={<ResultDashboard />} />
        <Route path="/history" element={<ReportHistory />} />
        <Route path="/ai-explanation" element={<AiExplanation />} />
      </Routes>
    </Router>
  );
}

export default App;