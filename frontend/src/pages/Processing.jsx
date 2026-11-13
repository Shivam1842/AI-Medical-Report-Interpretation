import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Clock, Upload } from 'lucide-react';
import { mockProcessingSteps } from '../data/mockData';

const loadingMessages = [
  'Extracting medical text...',
  'Normalizing parameters...',
  'Running AI medical analysis...',
  'Finalizing report...',
];

const API_BASE_URL = 'https://ai-medical-report-interpretation.onrender.com';

export default function Processing() {
  const navigate = useNavigate();
  const location = useLocation();
  const file = location.state?.file;

  const [progress, setProgress] = useState(10);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState(null);

  // Loading messages loop
  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((previous) => (previous + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(messageTimer);
  }, []);

  // Actual API call with 90 seconds timeout for Render cold start
  useEffect(() => {
    if (!file) {
      setError('No file found. Please upload again.');
      return;
    }

    const uploadAndAnalyze = async () => {
      try {
        // Smooth progress simulation while waiting for backend/AI
        const progressInterval = setInterval(() => {
          setProgress((prev) => (prev < 90 ? prev + 5 : prev));
        }, 1200);

        const formData = new FormData();
        formData.append('file', file);

        // AbortController with 90 seconds timeout for Render spin-up delay
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        const response = await fetch(`${API_BASE_URL}/api/analyze`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        clearInterval(progressInterval);

        if (!response.ok) {
          let errorMessage = 'Failed to analyze report.';
          try {
            const errData = await response.json();
            errorMessage = errData.detail || errorMessage;
          } catch {
            // fallback if response is not json
          }
          throw new Error(errorMessage);
        }

        const reportData = await response.json();
        
        setProgress(100);

        // Save to localStorage and redirect to results
        localStorage.setItem('currentReport', JSON.stringify(reportData));
        
        setTimeout(() => {
          navigate('/results', { state: { reportData } });
        }, 400);

      } catch (err) {
        console.error('Analysis error:', err);
        if (err.name === 'AbortError') {
          setError('Server took too long to respond (Cold start timeout). Please click Try Again.');
        } else {
          setError(err.message || 'Failed to connect to backend server.');
        }
      }
    };

    uploadAndAnalyze();
  }, [file, navigate]);

  const progressStyle = {
    '--progress-angle': `${(progress / 100) * 360}deg`,
  };

  if (error) {
    return (
      <div className="page process-card-wrap">
        <section className="processing-card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>Analysis Failed</h2>
          <p style={{ margin: '1rem 0', color: '#cbd5e1' }}>{error}</p>
          <button className="btn btn--primary" onClick={() => navigate('/upload')} style={{ marginTop: '1rem' }}>
            Try Again
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page process-card-wrap">
      <section className="processing-card">
        <h1>Processing Your Report</h1>
        <p className="processing-card__subtitle">Please wait while we analyze your report...</p>

        <div className="progress-steps" aria-label="Processing steps">
          {mockProcessingSteps.map((step, index) => {
            const isCompleted = index < 1 || progress >= 100;
            const isActive = step.id === 'processing' && progress < 100;
            const isPending = !isCompleted && !isActive;

            return (
              <div
                key={step.id}
                className={[
                  'progress-step',
                  isCompleted ? 'progress-step--completed' : '',
                  isActive ? 'progress-step--active' : '',
                  isPending ? 'progress-step--pending' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="progress-step__icon">
                  {isCompleted ? <Check size={14} /> : isActive ? <Upload size={14} /> : <Clock size={14} />}
                </span>
                <span className="progress-step__text">
                  <span className="progress-step__label">{step.label}</span>
                  <span className="progress-step__status">
                    {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Pending'}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="progress-ring" style={progressStyle} aria-label={`Processing progress ${progress}%`}>
          <span className="progress-ring__value">{progress}%</span>
        </div>

        <p aria-live="polite">{loadingMessages[messageIndex]}</p>

        <div className="info-box">
          <h3>Note</h3>
          <p>This may take a few moments depending on the size of your report.</p>
        </div>
      </section>
    </div>
  );
}