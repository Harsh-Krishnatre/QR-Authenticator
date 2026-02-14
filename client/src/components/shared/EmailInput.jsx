import './EmailInput.css';

const EmailInput = ({ value, onChange, error, disabled = false }) => {
  return (
    <div className="email-input-container">
      <input
        type="email"
        value={value}
        onChange={onChange}
        placeholder="Enter your email"
        disabled={disabled}
        className={`email-input ${error ? 'error' : ''}`}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

export default EmailInput;
