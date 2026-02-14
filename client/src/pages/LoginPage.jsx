import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginEmailStep from '../components/login/LoginEmailStep';
import LoginQRStep from '../components/login/LoginQRStep';
import './LoginPage.css';

const STEPS = {
  EMAIL: 'email',
  QR: 'qr',
};

const LoginPage = () => {
  const [currentStep, setCurrentStep] = useState(STEPS.EMAIL);
  const [loginData, setLoginData] = useState({
    email: '',
    hashedSecret: '',
    sessionId: '',
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleEmailNext = (data) => {
    setLoginData(data);
    setCurrentStep(STEPS.QR);
  };

  const handleLoginSuccess = (data) => {
    login(data.user, data.token);
    navigate('/dashboard');
  };

  const handleBack = () => {
    setCurrentStep(STEPS.EMAIL);
    setLoginData({ email: '', hashedSecret: '', sessionId: '' });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-content">
          {currentStep === STEPS.EMAIL ? (
            <LoginEmailStep onNext={handleEmailNext} />
          ) : (
            <LoginQRStep
              email={loginData.email}
              hashedSecret={loginData.hashedSecret}
              sessionId={loginData.sessionId}
              onSuccess={handleLoginSuccess}
              onBack={handleBack}
            />
          )}

          <div className="login-footer">
            <a href="/reset" className="forgot-link">
              Forgot your security method?
            </a>
            <div className="signup-link">
              Don't have an account? <a href="/register">Sign up</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
