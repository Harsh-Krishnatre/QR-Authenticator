import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import PatternEditor from '../components/PatternEditor';
import { useAuthFlow } from '../context/AuthFlowContext';
import { apiFetch } from '../lib/api';

export default function PatternPage() {
  const navigate = useNavigate();
  const { state, setPattern, saveSession, backToScan } = useAuthFlow();
  const [pattern, updatePattern] = useState(state.pattern);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handlePatternChange(nextPattern) {
    updatePattern(nextPattern);
    setPattern(nextPattern);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    for (let index = 0; index < pattern.length; index += 1) {
      const pair = pattern[index];
      if (Number.isNaN(Number(pair.number)) || Number(pair.number) < 0 || Number(pair.number) > 9) {
        setError(`Pair ${index + 1}: number must be 0-9.`);
        return;
      }
      if (!pair.color) {
        setError(`Pair ${index + 1}: choose a color.`);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await apiFetch('/auth/login/passkey', {
        method: 'POST',
        body: {
          email: state.email,
          clientId: state.clientId,
          numberColorPattern: pattern.map((pair) => ({
            number: Number(pair.number),
            color: pair.color,
          })),
        },
      });

      saveSession({
        token: response.data.token,
        expiresAt: response.data.expiresAt,
        userData: response.data,
      });
      navigate('/profile');
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    backToScan();
    navigate('/scan');
  }

  const passkeyName = [state.issuer, state.label].filter(Boolean).join(' / ') || state.clientId;

  return (
    <PageLayout
      currentStep={3}
      eyebrow="Step 3"
      title="Complete the number-color pattern."
      description="This final page is only available after a valid QR scan. The login request is sent only when every pair in the pattern is valid."
      noteTitle="Scanned passkey"
      noteBody={passkeyName}
    >
      <div className="page-meta">
        <span className="page-kicker">Pattern Verification</span>
        <h2>Enter your number-color pattern</h2>
        <p className="hint">Use the pattern created for the scanned passkey. Invalid values stop the user here until the current step is correct.</p>
      </div>

      <div className="passkey-summary">Passkey: {passkeyName}</div>

      <form className="form-stack" onSubmit={handleSubmit}>
        <PatternEditor pattern={pattern} onChange={handlePatternChange} />

        {error ? <div className="error">{error}</div> : null}

        <div className="page-actions split-actions">
          <button className="btn btn-secondary" type="button" onClick={handleBack}>
            Back to scanner
          </button>
          <button className="btn" type="submit" disabled={loading}>
            <span>{loading ? 'Verifying...' : 'Verify and sign in'}</span>
          </button>
        </div>
      </form>
    </PageLayout>
  );
}
