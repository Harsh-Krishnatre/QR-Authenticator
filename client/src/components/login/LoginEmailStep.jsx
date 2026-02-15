import { useState } from 'react';
import EmailInput from '../shared/EmailInput';
import Button from '../shared/Button';
import ErrorBanner from '../shared/ErrorBanner';
import LoadingSpinner from '../shared/LoadingSpinner';

const baseUrl = import.meta?.env?.VITE_BASE_URL ?? 'http://localhost:8000/api/v1';

const LoginEmailStep = ({ onNext }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${baseUrl}/auth/login/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'User not found');
        return;
      }

      onNext({
        email,
        hashedSecret: data.data.hashedSecretCode,
        sessionId: data.data.sessionId,
      });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-step">
      <h2 className="step-title">Welcome Back</h2>
      <p className="step-description">Enter your email to continue</p>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <form onSubmit={handleSubmit}>
        <EmailInput
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? <LoadingSpinner size="small" /> : 'Continue'}
        </Button>
      </form>
    </div>
  );
};

export default LoginEmailStep;
