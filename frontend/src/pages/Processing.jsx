import { useEffect, useMemo, useState } from 'react';
import { Check, Clock, Upload } from 'lucide-react';
import { mockProcessingSteps } from '../data/mockData';

const loadingMessages = [
  'Extracting medical text...',
  'Normalizing parameters...',
  'Running AI medical analysis...',
  'Finalizing report...',
];

export default function Processing() {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((previous) => {
        return Math.min(previous + 7, 92);
      });
    }, 220);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((previous) => (previous + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(messageTimer);
  }, []);

  const progressStyle = useMemo(
    () => ({ '--progress-angle': `${(progress / 100) * 360}deg` }),
    [progress],
  );

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