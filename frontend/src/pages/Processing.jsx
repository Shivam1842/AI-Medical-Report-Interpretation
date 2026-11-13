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

  // Actual API call and progress handling
  useEffect(() => {
    if (!file) {
      setError('No file found. Please upload again.');
      return;
    }

    const uploadAndAnalyze = async () => {
      try {
        // Increment progress gradually while waiting
        const progressInterval = setInterval(() => {
          setProgress((prev) => (prev < 90 ? prev + 10 : prev));
        }, 1500);

        const formData = new FormData();
        formData.append('file', file);

        // Replace with your actual backend URL if hosted live, or relative path if using proxy
        const response = await fetch('https://ai-medical-report-interpretation.onrender.com/api/analyze', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Failed to analyze report.');
        }

        const reportData = await response.json();
        
        setProgress(100);

        // Save to localStorage as fallback and navigate to Result Dashboard
        localStorage.setItem('currentReport', JSON.stringify(reportData));
        
        setTimeout(() => {
          navigate('/result', { state: { reportData } });
        }, 500);

      } catch (err) {
        console.error('Analysis error:', err);
        setError(err.message);
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
          <p>{error}</p>
          <button className="btn btn--primary" onClick={() => navigate('/upload')} style={{ marginTop: '1.5rem' }}>
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