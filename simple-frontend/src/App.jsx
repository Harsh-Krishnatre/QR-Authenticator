import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireEmail, RequirePasskey, RequireSession } from './components/FlowGuard';
import EmailPage from './pages/EmailPage';
import PatternPage from './pages/PatternPage';
import ProfilePage from './pages/ProfilePage';
import ScanPage from './pages/ScanPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EmailPage />} />
      <Route
        path="/scan"
        element={(
          <RequireEmail>
            <ScanPage />
          </RequireEmail>
        )}
      />
      <Route
        path="/pattern"
        element={(
          <RequirePasskey>
            <PatternPage />
          </RequirePasskey>
        )}
      />
      <Route
        path="/profile"
        element={(
          <RequireSession>
            <ProfilePage />
          </RequireSession>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
