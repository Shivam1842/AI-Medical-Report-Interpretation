import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function AiExplanation() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Grab the data passed via the router from ResultDashboard
  const reportData = location.state?.reportData;

  if (!reportData) {
    return (
      <div className="page">
        <div className="summary-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>No Data Available</h2>
          <p style={{ marginBottom: '2rem' }}>Please upload a medical report to view the analysis.</p>
          <button className="btn btn--primary" onClick={() => navigate('/upload')}>
            Upload Report
          </button>
        </div>
      </div>
    );
  }

  const explanations = reportData.ai_explanations || [];

  return (
    <div className="page">
      <div className="summary-header">
        <h2>AI Analysis & Explanations</h2>
        <button className="btn btn--secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back to Results
        </button>
      </div>

      {explanations.length === 0 ? (
        <div className="summary-panel" style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>All Clear!</h3>
          <p>All parameters in this report are within normal reference ranges. No specific abnormalities require explanation.</p>
        </div>
      ) : (
        <div className="explanation-list">
          {explanations.map((item, index) => (
            <div key={index} className="summary-panel" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{item.parameter}</h3>
                <StatusBadge label={item.status} variant="high" />
              </div>
              <p style={{ lineHeight: '1.6', margin: 0 }}>{item.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}