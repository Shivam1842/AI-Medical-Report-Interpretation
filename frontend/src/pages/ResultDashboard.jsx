import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { mockReportSummary } from '../data/mockData';

const statusMap = {
  Normal: 'normal',
  High: 'high',
  Low: 'low',
};

export default function ResultDashboard() {
  const navigate = useNavigate();

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
            <h3 style={{ margin: 0 }}>{mockReportSummary.title} · {mockReportSummary.dateLabel}</h3>
          </div>
        </div>

        <div className="summary-metrics">
          {mockReportSummary.summaryStats.map((item) => (
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
              {mockReportSummary.parameterRows.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.result}</td>
                  <td>{row.unit}</td>
                  <td>{row.range}</td>
                  <td>
                    <StatusBadge label={row.status} variant={statusMap[row.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="summary-actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate('/ai-explanation')}>
            <Eye size={18} />
            View Full Report
          </button>
        </div>
      </section>
    </div>
  );
}