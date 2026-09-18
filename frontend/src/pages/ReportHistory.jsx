import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ReportHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the data from the SQLite database via our FastAPI endpoint
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/history');
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

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
            <div key={record.id} className="summary-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{record.report_name}</h3>
                <p style={{ margin: 0, opacity: 0.7 }}>Report Date: {record.report_date}</p>
              </div>
              <button 
                className="btn btn--secondary"
                onClick={() => handleViewReport(record.data)}
              >
                View Analysis
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}