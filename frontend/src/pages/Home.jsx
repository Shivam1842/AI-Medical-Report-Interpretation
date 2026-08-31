import {
  ArrowRight,
  BarChart3,
  CloudUpload,
  FileText,
  Lightbulb,
  Search,
} from 'lucide-react';
import Button from '../components/Button';

const steps = [
  {
    icon: CloudUpload,
    title: 'Upload',
    description: 'Upload your medical report in PDF, JPG, or PNG format.',
  },
  {
    icon: Search,
    title: 'Process',
    description: 'Our AI extracts and analyzes the key information.',
  },
  {
    icon: BarChart3,
    title: 'Analyze',
    description: 'AI models interpret the results and find patterns.',
  },
  {
    icon: Lightbulb,
    title: 'Explain',
    description: 'Get easy explanations and personalized insights.',
  },
];

export default function Home() {
  return (
    <div className="page">
      <section className="hero">
        <div className="hero__content">
          <span className="badge">
            <Lightbulb size={14} />
            AI Powered
          </span>
          <h1>Understand Your Medical Reports Better</h1>
          <p>
            Upload your medical reports and get AI-powered insights, easy explanations,
            and health recommendations.
          </p>
          <div className="hero__actions">
            <Button to="/upload">Upload Report</Button>
            <Button to="/history" variant="secondary">
              View History
            </Button>
          </div>
        </div>

        <div className="hero__visual" aria-label="Medical report illustration">
          <div className="report-visual">
            <div className="report-visual__paper">
              <div className="report-visual__badge">Verified</div>
              <div className="report-visual__lines">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="report-visual__magnifier" />
            <div className="report-visual__circle" />
          </div>
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2>How It Works</h2>
        </div>

        <div className="steps-grid">
          {steps.map(({ icon: Icon, title, description }) => (
            <article key={title} className="feature-card">
              <div className="feature-card__icon">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}