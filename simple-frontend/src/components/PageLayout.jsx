import StepProgress from './StepProgress';

export default function PageLayout({ currentStep, eyebrow, title, description, noteTitle, noteBody, children }) {
  return (
    <div className="login-flow">
      <header className="flow-header">
        <div>
          <div className="brand">SecureAuth</div>
          <p className="brand-sub">Secure sign-in with your Auth App passkey</p>
        </div>
        <StepProgress currentStep={currentStep} />
      </header>

      <section className="step-screen">
        <aside className="hero-panel">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p className="aside-copy">{description}</p>
          </div>
          <div className="hero-note">
            <strong>{noteTitle}</strong>
            <p>{noteBody}</p>
          </div>
        </aside>

        <section className="step-card">{children}</section>
      </section>
    </div>
  );
}
