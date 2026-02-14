import { useNavigate } from 'react-router-dom';
import Button from '../components/shared/Button';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-content">
          <div className="logo">
            <div className="logo-icon">🔐</div>
            <h1 className="logo-text">SecureAuth</h1>
          </div>

          <p className="landing-description">
            Advanced authentication system with pattern-based security and QR code verification.
          </p>

          <div className="landing-features">
            <div className="feature">
              <span className="feature-icon">🔒</span>
              <span className="feature-text">Multi-factor Security</span>
            </div>
            <div className="feature">
              <span className="feature-icon">📱</span>
              <span className="feature-text">QR Code Login</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🎨</span>
              <span className="feature-text">Pattern Authentication</span>
            </div>
          </div>

          <div className="landing-actions">
            <Button onClick={() => navigate('/register')} fullWidth>
              Create Account
            </Button>
            <Button onClick={() => navigate('/login')} variant="secondary" fullWidth>
              Sign In
            </Button>
          </div>

          <p className="landing-note">
            Note: Authenticator app required for QR verification
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
