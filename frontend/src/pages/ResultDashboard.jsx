import { Eye } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
// We no longer need the mock data!

const statusMap = {
  Normal: 'normal',
  High: 'high',
  Low: 'low',
  Borderline: 'borderline' 
};

export default function ResultDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 1. Grab the live data passed from UploadReport.jsx
  const reportData = location.state?.reportData;

  // 2. Fallback UI: If there's no data (e.g., page refresh), prompt them to upload
  if (!reportData) {
    return (
      <div className="page">
        <div className="summary-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>No Report Data Found</h2>
          <p style={{ marginBottom: '2rem' }}>Please upload a medical report to view the analysis.</p>
          <button className="btn btn--primary" onClick={() => navigate('/upload')}>
            Upload Report
          </button>
        </div>
      </div>
    );
  }

  // 3. Convert our backend summary object into the array format your CSS classes expect
  const summaryStats = [
    { label: 'Total Parameters', value: reportData.summary.total, type: 'total' },
    { label: 'Normal', value: reportData.summary.normal, type: 'normal' },
    { label: 'Abnormal', value: reportData.summary.abnormal, type: 'abnormal' },
    { label: 'Borderline', value: reportData.summary.borderline, type: 'borderline' },
  ];

  return (
    <div className="page">
      <div className="summary-header">
        <h2>Report Summary</h2>
        <Button to="/ai-explanation" variant="ghost">
          View AI Explanation
        </Button>
      </div>

      <div className="summary-panel">
        <div className="summary-header" style={{ marginBottom: '1.2rem' }}>
          <div>
            {/* 4. Dynamic Header */}
            <h3 style={{ margin: 0 }}>
              {reportData.report_info.name} · {reportData.report_info.date}
            </h3>
          </div>
        </div>

        <div className="summary-metrics">
          {/* 5. Dynamic Metrics Cards */}
          {summaryStats.map((item) => (
            <div key={item.label} className={`result-metric result-metric--${item.type}`}>
              <div className="result-metric__label">{item.label}</div>
              <div className="result-metric__value">{item.value}</div>
              <div className="result-metric__sub">Updated today</div>
            </div>
          ))}
        </div>
      </div>

      <section className="table-card">
        <div className="section-header" style={{ marginTop: 0 }}>
          <h2>Parameter Overview</h2>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Result</th>
                <th>Unit</th>
                <th>Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {/* 6. Dynamic Table Rows mapping over the backend parameters */}
              {reportData.parameters.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.result}</td>
                  <td>{row.unit}</td>
                  <td>{row.range}</td>
                  <td>
                    <StatusBadge label={row.status} variant={statusMap[row.status] || 'normal'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="summary-actions">
          {/* Pass the data forward to the AI Explanation page! */}
          <button 
            type="button" 
            className="btn btn--secondary" 
            onClick={() => navigate('/ai-explanation', { state: { reportData } })}
          >
            <Eye size={18} />
            View AI Explanation
          </button>
        </div>
      </section>
    </div>
  );
}