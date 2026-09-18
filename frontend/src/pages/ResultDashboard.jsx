import { Eye } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

const getStatusVariant = (status) => {
  if (!status) return 'normal';
  const s = status.toLowerCase();
  
  if (s === 'high' || s === 'low' || s === 'abnormal') return 'high';
  if (s === 'borderline') return 'borderline';
  
  return 'normal'; 
};

export default function ResultDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // FIXED: Try getting data from router state first, fall back to localStorage if missing
  const reportData = location.state?.reportData || JSON.parse(localStorage.getItem('currentReport'));

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
        <button 
          type="button" 
          className="btn" 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          onClick={() => navigate('/ai-explanation', { state: { reportData } })}
        >
          View AI Explanation
        </button>
      </div>

      <div className="summary-panel">
        <div className="summary-header" style={{ marginBottom: '1.2rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>
              {reportData.report_info.name} · {reportData.report_info.date}
            </h3>
          </div>
        </div>

        <div className="summary-metrics">
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
              {reportData.parameters.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.result}</td>
                  <td>{row.unit?.trim() || '-'}</td>
                  <td>{row.range?.trim() || '-'}</td>
                  <td>
                    <StatusBadge 
                      label={row.status} 
                      variant={getStatusVariant(row.status)} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="summary-actions">
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