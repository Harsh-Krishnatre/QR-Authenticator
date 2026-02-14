import './Banner.css';

const ErrorBanner = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="banner banner-error">
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="banner-close">
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
