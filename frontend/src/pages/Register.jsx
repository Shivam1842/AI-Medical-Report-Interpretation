import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  fullName: '',
  email: '',
  otp: '',
  password: '',
  confirmPassword: '',
};

export default function Register() {
  const navigate = useNavigate();
  const { sendOtp, verifyOtp, register } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleStepOneSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await sendOtp(form.fullName, form.email);
      setStep(2);
    } catch (err) {
      const message = err?.message || 'Unable to send OTP.';
      setError(message);
      alert(message);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await verifyOtp(form.email, form.otp);
      setStep(3);
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    }
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await register({
        name: form.fullName,
        email: form.email,
        password: form.password,
      });
      navigate('/');
    } catch (err) {
      const message = err?.message || 'Registration failed.';
      setError(message);
      alert(message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <span className="auth-badge">Create account</span>
          <h1>{step === 1 ? 'Join ReportMitra' : step === 2 ? 'Verify your email' : 'Set your password'}</h1>
          <p>
            {step === 1
              ? 'Create your profile to get started.'
              : step === 2
                ? 'Enter the 6-digit OTP sent to your email.'
                : 'Choose a secure password to finish registration.'}
          </p>
        </div>

        {step === 1 && (
          <form className="auth-form" onSubmit={handleStepOneSubmit}>
            <label className="auth-field">
              <span>Full Name</span>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </label>

            <label className="auth-field">
              <span>Email Address</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="btn btn--primary auth-submit">
              Send OTP
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <label className="auth-field">
              <span>Enter OTP</span>
              <input
                type="text"
                name="otp"
                value={form.otp}
                onChange={handleChange}
                placeholder="123456"
                maxLength={6}
                required
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="btn btn--primary auth-submit">
              Verify OTP
            </button>

            <button
              type="button"
              className="auth-link-button"
              onClick={async () => {
                try {
                  setError('');
                  await sendOtp(form.fullName, form.email);
                } catch (err) {
                  const message = err?.message || 'Unable to resend OTP.';
                  setError(message);
                  alert(message);
                }
              }}
            >
              Resend OTP
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="auth-form" onSubmit={handleCreateAccount}>
            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </label>

            <label className="auth-field">
              <span>Confirm Password</span>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="btn btn--primary auth-submit">
              Create Account
            </button>
          </form>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
