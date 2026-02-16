import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TabSwitcher from '../components/shared/TabSwitcher';
import PatternGrid from '../components/shared/PatternGrid';
import Button from '../components/shared/Button';
import ErrorBanner from '../components/shared/ErrorBanner';
import SuccessBanner from '../components/shared/SuccessBanner';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import SecurityQuestions from '../components/registration/SecurityQuestions';
import PicturePattern from '../components/registration/PicturePattern';
import './ResetConfirmPage.css';

const TABS = [
  { id: 'security_questions', label: 'Security Questions' },
  { id: 'picture_pattern', label: 'Picture Pattern' },
];

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

  // take first 8 unique combos
  return all.slice(0, 8);
};

const ResetConfirmPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [validating, setValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState('security_questions');
  const [securityData, setSecurityData] = useState(null);
  const [gridData, setGridData] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState([]);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`${baseUrl}/auth/reset/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resetToken: token }),
        });

        if (response.ok) {
          setIsValidToken(true);
          setGridData(generatePatternGrid());
        } else {
          setError('Invalid or expired reset link');
        }
      } catch {
        setError('Failed to verify reset link');
      } finally {
        setValidating(false);
      }
    };

    verifyToken();
  }, [token]);

  useEffect(() => {
    let mounted = true;
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`${baseUrl}/config/security-questions`);
        const json = await res.json();
        if (res.ok && mounted) {
          setAvailableQuestions(json.data?.securityQuestions);
        }
      } catch {
        setAvailableQuestions([]);
      }
    };

    fetchQuestions();
    return () => { mounted = false; };
  }, []);

  const handleSecurityMethodSubmit = async () => {
    if (!securityData) {
      setError('Please complete your security method');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const key = activeTab === 'security_questions' ? 'securityQuestions' : 'picturePattern';
      const response = await fetch(`${baseUrl}/auth/reset/security`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken: token,
          authMethod: activeTab,
          [key]: securityData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to update security method');
        return;
      }

      setStep(2);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePatternSubmit = async () => {
    if (selectedPattern.length < 4) {
      setError('Please select at least 4 cells for your pattern');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseUrl}/auth/reset/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken: token,
          numberColorPattern: selectedPattern,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Reset failed');
        return;
      }

      setSuccess('Security method updated successfully! Redirecting...');
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="reset-confirm-page">
        <div className="reset-container">
          <div className="reset-content">
            <LoadingSpinner size="large" message="Verifying reset link..." />
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="reset-confirm-page">
        <div className="reset-container">
          <div className="reset-content">
            <ErrorBanner message={error} />
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Button onClick={() => navigate('/reset')} fullWidth>
                Request New Reset Link
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-confirm-page">
      <div className="reset-container">
        <div className="reset-content">
          {step === 1 ? (
            <>
              <h2 className="reset-title">Update Security Method</h2>
              <p className="reset-description">Choose your new security method</p>

              <ErrorBanner message={error} onClose={() => setError('')} />

              <TabSwitcher tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

              <div className="method-content">
                {activeTab === 'security_questions' ? (
                  <SecurityQuestions onChange={setSecurityData} availableQuestions={availableQuestions} />
                ) : (
                  // <PicturePattern onChange={setSecurityData} />
                  <div style={{ textAlign: 'center' }}>
                    <Button>Comming Soon</Button>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSecurityMethodSubmit}
                fullWidth
                disabled={loading || !securityData}
              >
                {loading ? <LoadingSpinner size="small" /> : 'Continue'}
              </Button>
            </>
          ) : (
            <>
              <h2 className="reset-title">Confirm Your Pattern</h2>
              <p className="reset-description">
                Select at least 4 cells to create your authentication pattern
              </p>

              <ErrorBanner message={error} onClose={() => setError('')} />
              <SuccessBanner message={success} />

              <PatternGrid
                gridData={gridData}
                onPatternSelect={setSelectedPattern}
                selectedPattern={selectedPattern}
              />

              <div className="step-actions">
                <Button variant="secondary" onClick={() => setStep(1)} disabled={loading}>
                  Back
                </Button>
                <Button
                  onClick={handlePatternSubmit}
                  disabled={loading || selectedPattern.length < 3}
                >
                  {loading ? <LoadingSpinner size="small" /> : 'Complete Reset'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetConfirmPage;
