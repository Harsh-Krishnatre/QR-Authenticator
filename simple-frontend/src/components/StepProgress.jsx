const steps = [
  { id: 1, label: 'Email' },
  { id: 2, label: 'Scan QR' },
  { id: 3, label: 'Pattern' },
];

export default function StepProgress({ currentStep }) {
  return (
    <div className="steps steps-horizontal" aria-label="Login progress">
      {steps.map((step, index) => (
        <div key={step.id} className="step-group">
          <div
            className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'done' : ''}`}
          >
            <div className="step-dot">{step.id}</div>
            <span>{step.label}</span>
          </div>
          {index < steps.length - 1 ? <div className="step-line" /> : null}
        </div>
      ))}
    </div>
  );
}
