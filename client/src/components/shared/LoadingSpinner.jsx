import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', message }) => {
  return (
    <div className="spinner-container">
      <div className={`spinner spinner-${size}`}></div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
