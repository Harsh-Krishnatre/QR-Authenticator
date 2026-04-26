import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useAuthFlow } from '../context/AuthFlowContext';
import { apiFetch } from '../lib/api';

export default function EmailPage() {
  const navigate = useNavigate();
  const { state, verifyEmail } = useAuthFlow();
  const [email, setEmail] = useState(state.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/auth/check-email', {
        method: 'POST',
        body: { email: value },
      });
      verifyEmail(value);
      navigate('/scan');
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout
      currentStep={1}
      eyebrow="Step 1"
      title="Start with your registered email."
      description="This page validates the account before the scanner unlocks. The QR step stays inaccessible until the email check succeeds."
      noteTitle="Why this step matters"
      noteBody="Email verification narrows the login attempt to the correct user before any passkey is scanned."
    >
      <div className="page-meta">
        <span className="page-kicker">Email Verification</span>
        <h2>Verify your email</h2>
        <p className="hint">Enter the email registered in the authentication system. After verification, routing moves you to the QR scanner page.</p>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="emailInput">Email address</label>
          <input
            id="emailInput"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        {error ? <div className="error">{error}</div> : null}

        <div className="page-actions">
          <button className="btn" type="submit" disabled={loading}>
            <span>{loading ? 'Checking account...' : 'Continue to QR scanner'}</span>
          </button>
        </div>
      </form>
    </PageLayout>
  );
}
