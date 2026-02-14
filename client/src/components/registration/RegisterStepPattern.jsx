import { useState, useEffect } from 'react';
import PatternGrid from '../shared/PatternGrid';
import Button from '../shared/Button';
import ErrorBanner from '../shared/ErrorBanner';
import SuccessBanner from '../shared/SuccessBanner';
import LoadingSpinner from '../shared/LoadingSpinner';

const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#F5FF33', '#33FFF5'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const generatePatternGrid = () => {
  const grid = [];
  for (let i = 0; i < 12; i++) {
    grid.push({
      number: NUMBERS[Math.floor(Math.random() * NUMBERS.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  }
  return grid;
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
    if (selectedPattern.length < 3) {
      setError('Please select at least 3 cells for your pattern');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/register/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          hashedSecret,
          pattern: selectedPattern,
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
      }, 1500);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-step">
      <h2 className="step-title">Confirm Your Pattern</h2>
      <p className="step-description">
        Select at least 3 cells to create your authentication pattern
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
