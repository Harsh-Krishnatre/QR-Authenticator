import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/shared/Button';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo-icon">🔐</div>
              <h1 className="logo-text">SecureAuth</h1>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="welcome-section">
            <h2 className="welcome-title">Welcome back!</h2>
            <p className="welcome-subtitle">You have successfully authenticated</p>
          </div>

          <div className="dashboard-cards">
            <div className="info-card">
              <div className="card-icon">👤</div>
              <h3 className="card-title">User Information</h3>
              <div className="card-content">
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{user?.email || 'user@example.com'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">User ID:</span>
                  <span className="info-value">{user?.id || 'xxxx-xxxx-xxxx'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className="info-value status-active">Active</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="card-icon">🔒</div>
              <h3 className="card-title">Security Status</h3>
              <div className="card-content">
                <div className="security-item">
                  <span className="security-check">✓</span>
                  <span>Two-factor authentication enabled</span>
                </div>
                <div className="security-item">
                  <span className="security-check">✓</span>
                  <span>Pattern authentication configured</span>
                </div>
                <div className="security-item">
                  <span className="security-check">✓</span>
                  <span>Session verified</span>
                </div>
              </div>
            </div>

            <div className="info-card">
              <div className="card-icon">📊</div>
              <h3 className="card-title">Session Information</h3>
              <div className="card-content">
                <div className="info-row">
                  <span className="info-label">Last Login:</span>
                  <span className="info-value">
                    {new Date().toLocaleString()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Session Type:</span>
                  <span className="info-value">QR Code Authentication</span>
                </div>
              </div>
            </div>
          </div>

          <div className="action-section">
            <h3 className="section-title">Quick Actions</h3>
            <div className="action-buttons">
              <button className="action-card">
                <span className="action-icon">🔄</span>
                <span className="action-text">Update Security Method</span>
              </button>
              <button className="action-card">
                <span className="action-icon">📱</span>
                <span className="action-text">Manage Devices</span>
              </button>
              <button className="action-card">
                <span className="action-icon">📜</span>
                <span className="action-text">View Activity Log</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
