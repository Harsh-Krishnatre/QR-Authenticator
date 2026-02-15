import { useState, useEffect, useCallback } from 'react';
import QRCodeDisplay from '../shared/QRCodeDisplay';
import CountdownTimer from '../shared/CountdownTimer';
import Button from '../shared/Button';
import ErrorBanner from '../shared/ErrorBanner';
import './LoginQRStep.css';

const QR_DURATION = 120;
const POLL_INTERVAL = 2000;

const baseUrl = import.meta?.env?.VITE_BASE_URL ?? 'http://localhost:8000/api/v1';

const LoginQRStep = ({ email, hashedSecret, sessionId, onSuccess, onBack }) => {
  const [qrData, setQrData] = useState(null);
  const [status, setStatus] = useState('waiting');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(QR_DURATION);

  const generateQRData = useCallback(() => {
    const timestamp = Date.now();
    return {
      email,
      hashedSecret,
      sessionId,
      timestamp,
    };
  }, [email, hashedSecret, sessionId]);

  useEffect(() => {
    setQrData(generateQRData());
  }, [generateQRData]);

  useEffect(() => {
    if (status !== 'waiting') return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`${baseUrl}/auth/login/status?sessionId=${sessionId}`);
        const data = await response.json();

        if (data.data.status === 'verified') {
          setStatus('success');
          onSuccess(data);
        } else if (data.data.status === 'expired') {
          setStatus('failed');
          setError('Authentication failed. Please try again.');
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    };

    const interval = setInterval(pollStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [status, sessionId, onSuccess]);

  const handleExpire = () => {
    setStatus('expired');
    setError('QR code expired. Please generate a new one.');
    onBack();
  };
 
  return (
    <div className="login-qr-step">
      <h2 className="step-title">Scan QR Code</h2>
      <p className="step-description">Use your authenticator app to scan the code</p>

      <ErrorBanner message={error} onClose={() => setError('')} />

      {status === 'waiting' && qrData && (
        <>
          <QRCodeDisplay data={qrData} />

          <div className="qr-status">
            <div className="status-indicator waiting">
              <div className="pulse"></div>
              <span>Waiting for verification...</span>
            </div>
          </div>

          <CountdownTimer
            duration={QR_DURATION}
            onExpire={handleExpire}
            onTick={setTimeLeft}
          />
        </>
      )}

      {status === 'success' && (
        <div className="qr-status">
          <div className="status-indicator success">
            <span className="success-icon">✓</span>
            <span>Authentication successful!</span>
          </div>
        </div>
      )}

      <div className="step-actions">
        <Button variant="secondary" onClick={onBack} fullWidth>
          Back
        </Button>
      </div>
    </div>
  );
};

export default LoginQRStep;
