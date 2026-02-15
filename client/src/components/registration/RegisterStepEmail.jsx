import { useState } from 'react';
import EmailInput from '../shared/EmailInput';
import Button from '../shared/Button';
import ErrorBanner from '../shared/ErrorBanner';
import LoadingSpinner from '../shared/LoadingSpinner';

const baseUrl = import.meta?.env?.VITE_BASE_URL ?? 'http://localhost:8000/api/v1';

const RegisterStepEmail = ({ onNext }) => {
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
      const response = await fetch(`${baseUrl}/auth/register/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      console.log("eeee: ", data);

      if (!response.ok) {
        setError(data.error || 'User already exists');
        return;
      }

      onNext({ email });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-step">
      <h2 className="step-title">Create Your Account</h2>
      <p className="step-description">Enter your email to get started</p>

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

export default RegisterStepEmail;
