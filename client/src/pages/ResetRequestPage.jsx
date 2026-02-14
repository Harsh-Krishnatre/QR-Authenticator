import { useState } from 'react';
import EmailInput from '../components/shared/EmailInput';
import Button from '../components/shared/Button';
import ErrorBanner from '../components/shared/ErrorBanner';
import SuccessBanner from '../components/shared/SuccessBanner';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import './ResetRequestPage.css';

const ResetRequestPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to send reset email');
        return;
      }

      setSuccess('Reset email sent! Please check your inbox for instructions.');
      setEmail('');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-request-page">
      <div className="reset-container">
        <div className="reset-content">
          <h2 className="reset-title">Reset Security Method</h2>
          <p className="reset-description">
            Enter your email and we'll send you instructions to reset your security method
          </p>

          <ErrorBanner message={error} onClose={() => setError('')} />
          <SuccessBanner message={success} onClose={() => setSuccess('')} />

          <form onSubmit={handleSubmit}>
            <EmailInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? <LoadingSpinner size="small" /> : 'Send Reset Email'}
            </Button>
          </form>

          <div className="reset-footer">
            <a href="/login" className="back-link">
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetRequestPage;
