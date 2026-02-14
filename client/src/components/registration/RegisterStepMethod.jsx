import { useState } from 'react';
import TabSwitcher from '../shared/TabSwitcher';
import Button from '../shared/Button';
import ErrorBanner from '../shared/ErrorBanner';
import LoadingSpinner from '../shared/LoadingSpinner';
import SecurityQuestions from './SecurityQuestions';
import PicturePattern from './PicturePattern';

const TABS = [
  { id: 'questions', label: 'Security Questions' },
  { id: 'pattern', label: 'Picture Pattern' },
];

const RegisterStepMethod = ({ email, onNext, onBack }) => {
  const [activeTab, setActiveTab] = useState('questions');
  const [securityData, setSecurityData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!securityData) {
      setError('Please complete your security method');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/register/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          method: activeTab,
          data: securityData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to save security method');
        return;
      }

      onNext({
        hashedSecret: data.hashedSecret,
        method: activeTab,
      });
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-step">
      <h2 className="step-title">Choose Security Method</h2>
      <p className="step-description">Select how you want to secure your account</p>

      <ErrorBanner message={error} onClose={() => setError('')} />

      <TabSwitcher tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="method-content">
        {activeTab === 'questions' ? (
          <SecurityQuestions onChange={setSecurityData} />
        ) : (
          <PicturePattern onChange={setSecurityData} />
        )}
      </div>

      <div className="step-actions">
        <Button variant="secondary" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !securityData}>
          {loading ? <LoadingSpinner size="small" /> : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

export default RegisterStepMethod;
