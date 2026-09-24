import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Dynamic API base URL switching between local and live Render backend
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://127.0.0.1:8000' 
  : 'https://ai-medical-report-interpretation.onrender.com';

export default function ReportHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    // Fetch historical data from the SQLite database via FastAPI endpoint
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`History request failed with status: ${response.status}`);
        }

        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  // Pass the historical JSON data back into the existing ResultDashboard
  const handleViewReport = (reportData) => {
    navigate('/results', { state: { reportData } });
  };

  return (
    <div className="page">
      <div className="summary-header">
        <h2>Report History</h2>
      </div>

      {loading ? (
        <div className="summary-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          Loading your medical records...
        </div>
      ) : history.length === 0 ? (
        <div className="summary-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>No Reports Found</h3>
          <p style={{ marginBottom: '2rem' }}>You haven't analyzed any medical reports yet.</p>
          <button className="btn btn--primary" onClick={() => navigate('/upload')}>
            Upload First Report
          </button>
        </div>
      ) : (
        <div className="history-list">
          {history.map((record) => (
            <div key={record.id} className="summary-panel" style={{ marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>
                  {record.data?.report_info?.name || record.report_name || 'Medical Report'}
                </h3>
                <p style={{ margin: '0 0 0.5rem', opacity: 0.7 }}>
                  Report Date: {record.report_date || record.data?.report_info?.date || 'Unknown'}
                </p>
                <p style={{ margin: '0 0 1rem', opacity: 0.7 }}>
                  Abnormal Parameters: {record.data?.summary?.abnormal ?? 0}
                </p>
              </div>
              <button 
                className="btn history-report-button"
                onClick={() => handleViewReport(record.data)}
              >
                View Full Report
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}