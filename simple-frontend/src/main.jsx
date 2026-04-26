import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthFlowProvider } from './context/AuthFlowContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthFlowProvider>
        <App />
      </AuthFlowProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
