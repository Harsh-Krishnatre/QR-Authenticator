import { useState, useEffect } from 'react';
import TabSwitcher from '../shared/TabSwitcher';
import Button from '../shared/Button';
import ErrorBanner from '../shared/ErrorBanner';
import LoadingSpinner from '../shared/LoadingSpinner';
import SecurityQuestions from './SecurityQuestions';
import PicturePattern from './PicturePattern';

const TABS = [
  { id: 'security_questions', label: 'Security Questions' },
  { id: 'picture_pattern', label: 'Picture Pattern' },
];

const baseUrl = import.meta?.env?.VITE_BASE_URL ?? 'http://localhost:8000/api/v1';

const RegisterStepMethod = ({ email, onNext, onBack }) => {
  const [activeTab, setActiveTab] = useState('security_questions');
  const [securityData, setSecurityData] = useState(null);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchQuestions = async () => {
      setQuestionsLoading(true);
      try {
        const res = await fetch(`${baseUrl}/config/security-questions`);
        const json = await res.json();
        if (res.ok && mounted) {
          setAvailableQuestions(json.data?.securityQuestions);
        }
      } catch {
        setAvailableQuestions([]);
      } finally {
        if (mounted) setQuestionsLoading(false);
      }
    };

    fetchQuestions();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async () => {
    if (!securityData) {
      setError('Please complete your security method');
      return;
    }

    // If security questions selected, ensure at least 3
    if (activeTab === 'security_questions') {
      if (!Array.isArray(securityData) || securityData.length < 3) {
        setError('Please select and answer at least 3 security questions');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const key = activeTab === 'security_questions' ? 'securityQuestions' : 'picturePattern';
      const response = await fetch(`${baseUrl}/auth/register/security`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          authMethod: activeTab,
          [key]: securityData,
        }),
      });

      const data = await response.json();
      console.log("Data: ", data);

      if (!response.ok) {
        setError(data.message || 'Failed to save security method');
        return;
      }

      onNext({
        hashedSecret: data.data.hashedSecretCode,
        method: activeTab,
      });
    } catch {
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
        {activeTab === 'security_questions' ? (
          questionsLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 14, color: '#333' }}>Security Questions</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: selectedCount >= 3 ? '#2f855a' : '#d69e2e' }}>Selected: {selectedCount}</div>
                  {selectedCount < 3 && (
                    <div style={{ fontSize: 12, color: '#666' }}>Provide {3 - selectedCount} more valid answers</div>
                  )}
                </div>
              </div>
              <SecurityQuestions availableQuestions={availableQuestions} onChange={setSecurityData} onCountChange={setSelectedCount} />
            </>
          )
        ) : (
          // <PicturePattern onChange={setSecurityData} />
          <div style={{ textAlign: 'center' }}>
            <Button>Comming Soon</Button>
          </div>
        )}
      </div>

      <div className="step-actions">
        <Button variant="secondary" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={loading || questionsLoading || !securityData}>
          {loading ? <LoadingSpinner size="small" /> : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

export default RegisterStepMethod;
