import { Navigate } from 'react-router-dom';
import { useAuthFlow } from '../context/AuthFlowContext';

export function RequireEmail({ children }) {
  const { state } = useAuthFlow();
  if (!state.emailVerified) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function RequirePasskey({ children }) {
  const { state } = useAuthFlow();
  if (!state.emailVerified) {
    return <Navigate to="/" replace />;
  }
  if (!state.clientId) {
    return <Navigate to="/scan" replace />;
  }
  return children;
}

export function RequireSession({ children }) {
  const { state } = useAuthFlow();
  if (!state.emailVerified) {
    return <Navigate to="/" replace />;
  }
  if (!state.clientId) {
    return <Navigate to="/scan" replace />;
  }
  if (!state.token) {
    return <Navigate to="/pattern" replace />;
  }
  return children;
}
