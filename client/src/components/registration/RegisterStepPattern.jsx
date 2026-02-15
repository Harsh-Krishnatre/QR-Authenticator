import { useState, useEffect } from 'react';
import PatternGrid from '../shared/PatternGrid';
import Button from '../shared/Button';
import ErrorBanner from '../shared/ErrorBanner';
import SuccessBanner from '../shared/SuccessBanner';
import LoadingSpinner from '../shared/LoadingSpinner';

const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#F5FF33', '#33FFF5'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const baseUrl = import.meta?.env?.VITE_BASE_URL ?? 'http://localhost:8000/api/v1';

const generatePatternGrid = () => {
  // build all possible unique number-color combinations
  const all = [];
  for (const n of NUMBERS) {
    for (const c of COLORS) {
      all.push({ number: n, color: c });
    }
  }

  // shuffle (Fisher-Yates)
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  // take first 15 unique combos
  return all.slice(0, 15);
};

const RegisterStepPattern = ({ email, hashedSecret, onComplete, onBack }) => {
  const [gridData, setGridData] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setGridData(generatePatternGrid());
  }, []);

  const handleSubmit = async () => {
    if (selectedPattern.length < 5) {
      setError('Please select at least 5 cells for your pattern');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseUrl}/auth/register/submit-pattern`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          hashedSecretCode: hashedSecret,
          numberColorPattern: selectedPattern,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed');
        return;
      }

      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => {
        onComplete(data);
      }, 1000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-step">
      <h2 className="step-title">Confirm Your Pattern</h2>
      <p className="step-description">
        Select at least 5 cells to create your authentication pattern
      </p>

      <ErrorBanner message={error} onClose={() => setError('')} />
      <SuccessBanner message={success} />

      <PatternGrid
        gridData={gridData}
        onPatternSelect={setSelectedPattern}
        selectedPattern={selectedPattern}
      />

      <div className="step-actions">
        <Button variant="secondary" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={loading || selectedPattern.length < 3}>
          {loading ? <LoadingSpinner size="small" /> : 'Complete Registration'}
        </Button>
      </div>
    </div>
  );
};

export default RegisterStepPattern;
