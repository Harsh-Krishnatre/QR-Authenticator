import { useNavigate } from 'react-router-dom';
import { useAuthFlow } from '../context/AuthFlowContext';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { state, logout } = useAuthFlow();

  const namePart = state.email.split('@')[0] || 'User';
  const passkeyName = [state.userData?.passkey?.issuer, state.userData?.passkey?.label]
    .filter(Boolean)
    .join(' / ') || state.clientId;

  async function handleCopy() {
    await navigator.clipboard.writeText(state.token || '');
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="screen login-flow">
      <header className="flow-header">
        <div>
          <div className="brand">SecureAuth</div>
          <p className="brand-sub">Authenticated session details</p>
        </div>
      </header>

      <section className="card profile-card">
        <div className="profile-header">
          <div className="avatar">{namePart[0].toUpperCase()}</div>
          <div>
            <div className="profile-name">{namePart}</div>
            <div className="profile-badge">Authenticated</div>
          </div>
          <button className="logout-btn" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="profile-grid">
          <div className="profile-field"><div className="pf-label">Email</div><div className="pf-value">{state.userData?.user?.email || state.email}</div></div>
          <div className="profile-field"><div className="pf-label">Auth Method</div><div className="pf-value">{(state.userData?.user?.authMethod || 'security_questions').replace('_', ' ')}</div></div>
          <div className="profile-field"><div className="pf-label">Passkey</div><div className="pf-value">{passkeyName}</div></div>
          <div className="profile-field"><div className="pf-label">Account Created</div><div className="pf-value">{state.userData?.user?.createdAt ? new Date(state.userData.user.createdAt).toLocaleDateString() : '—'}</div></div>
          <div className="profile-field"><div className="pf-label">Login Time</div><div className="pf-value">{new Date().toLocaleString()}</div></div>
          <div className="profile-field"><div className="pf-label">Session Expires</div><div className="pf-value">{state.expiresAt ? new Date(state.expiresAt).toLocaleString() : '7 days'}</div></div>
        </div>

        <div className="token-block">
          <div className="pf-label">Session Token</div>
          <div className="token-row">
            <input className="token-input" type="text" readOnly value={state.token || ''} />
            <button className="btn btn-sm btn-outline" type="button" onClick={handleCopy}>
              Copy
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
