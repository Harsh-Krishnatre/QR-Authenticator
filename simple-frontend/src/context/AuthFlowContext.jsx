import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const defaultPattern = () => Array.from({ length: 4 }, () => ({ number: 0, color: 'red' }));

const STORAGE_KEY = 'secureauth.simple-flow';

const AuthFlowContext = createContext(null);

function loadInitialState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        email: '',
        emailVerified: false,
        clientId: '',
        issuer: '',
        label: '',
        pattern: defaultPattern(),
        token: '',
        expiresAt: '',
        userData: null,
      };
    }

    const parsed = JSON.parse(raw);
    return {
      email: parsed.email || '',
      emailVerified: Boolean(parsed.emailVerified),
      clientId: parsed.clientId || '',
      issuer: parsed.issuer || '',
      label: parsed.label || '',
      pattern: Array.isArray(parsed.pattern) && parsed.pattern.length >= 4 ? parsed.pattern : defaultPattern(),
      token: parsed.token || '',
      expiresAt: parsed.expiresAt || '',
      userData: parsed.userData || null,
    };
  } catch {
    return {
      email: '',
      emailVerified: false,
      clientId: '',
      issuer: '',
      label: '',
      pattern: defaultPattern(),
      token: '',
      expiresAt: '',
      userData: null,
    };
  }
}

export function AuthFlowProvider({ children }) {
  const [state, setState] = useState(loadInitialState);

  const persist = useCallback((nextState) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    return nextState;
  }, []);

  const verifyEmail = useCallback((email) => {
    setState((current) => persist({
      ...current,
      email,
      emailVerified: true,
      clientId: '',
      issuer: '',
      label: '',
      token: '',
      expiresAt: '',
      userData: null,
    }));
  }, [persist]);

  const savePasskey = useCallback((passkey) => {
    setState((current) => persist({
      ...current,
      clientId: passkey.clientId,
      issuer: passkey.issuer || '',
      label: passkey.label || '',
    }));
  }, [persist]);

  const setPattern = useCallback((pattern) => {
    setState((current) => persist({
      ...current,
      pattern,
    }));
  }, [persist]);

  const saveSession = useCallback((session) => {
    setState((current) => persist({
      ...current,
      token: session.token,
      expiresAt: session.expiresAt,
      userData: session.userData,
    }));
  }, [persist]);

  const resetToEmail = useCallback(() => {
    setState((current) => persist({
      ...current,
      emailVerified: false,
      email: '',
      clientId: '',
      issuer: '',
      label: '',
      pattern: defaultPattern(),
      token: '',
      expiresAt: '',
      userData: null,
    }));
  }, [persist]);

  const backToScan = useCallback(() => {
    setState((current) => persist({
      ...current,
      token: '',
      expiresAt: '',
      userData: null,
    }));
  }, [persist]);

  const logout = useCallback(() => {
    const reset = {
      email: '',
      emailVerified: false,
      clientId: '',
      issuer: '',
      label: '',
      pattern: defaultPattern(),
      token: '',
      expiresAt: '',
      userData: null,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
    setState(reset);
  }, []);

  const value = useMemo(() => ({
    state,
    verifyEmail,
    savePasskey,
    setPattern,
    saveSession,
    resetToEmail,
    backToScan,
    logout,
  }), [state, verifyEmail, savePasskey, setPattern, saveSession, resetToEmail, backToScan, logout]);

  return <AuthFlowContext.Provider value={value}>{children}</AuthFlowContext.Provider>;
}

export function useAuthFlow() {
  const context = useContext(AuthFlowContext);
  if (!context) {
    throw new Error('useAuthFlow must be used inside AuthFlowProvider');
  }
  return context;
}

export function getDefaultPattern() {
  return defaultPattern();
}
