import './Banner.css';

const SuccessBanner = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="banner banner-success">
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="banner-close">
          ×
        </button>
      )}
    </div>
  );
};

export default SuccessBanner;
