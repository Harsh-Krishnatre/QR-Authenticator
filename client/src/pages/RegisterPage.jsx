import { useReducer } from "react";
import { useNavigate } from "react-router-dom";
import RegisterStepEmail from "../components/registration/RegisterStepEmail";
import RegisterStepMethod from "../components/registration/RegisterStepMethod";
import RegisterStepPattern from "../components/registration/RegisterStepPattern";
import "./RegisterPage.css";
import LandingPage from "./LandingPage";

const STEPS = {
  EMAIL: "email",
  METHOD: "method",
  PATTERN: "pattern",
};

const initialState = {
  currentStep: STEPS.EMAIL,
  email: "",
  method: "",
  hashedSecret: "",
};

const registerReducer = (state, action) => {
  switch (action.type) {
    case "NEXT_STEP":
      return {
        ...state,
        ...action.payload,
      };
    case "PREVIOUS_STEP":
      return {
        ...state,
        currentStep: action.payload,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
};

const RegisterPage = () => {
  const [state, dispatch] = useReducer(registerReducer, initialState);
  const navigate = useNavigate();

  const handleEmailNext = (data) => {
    dispatch({
      type: "NEXT_STEP",
      payload: {
        email: data.email,
        currentStep: STEPS.METHOD,
      },
    });
  };

  const handleMethodNext = (data) => {
    dispatch({
      type: "NEXT_STEP",
      payload: {
        hashedSecret: data.hashedSecret,
        method: data.method,
        currentStep: STEPS.PATTERN,
      },
    });
  };

  const handleComplete = () => {
    navigate("/login");
  };

  const handleBack = (previousStep) => {
    dispatch({
      type: "PREVIOUS_STEP",
      payload: previousStep,
    });
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case STEPS.EMAIL:
        return <RegisterStepEmail onNext={handleEmailNext} />;
      case STEPS.METHOD:
        return (
          <RegisterStepMethod
            email={state.email}
            onNext={handleMethodNext}
            onBack={() => handleBack(STEPS.EMAIL)}
          />
        );
      case STEPS.PATTERN:
        return (
          <RegisterStepPattern
            email={state.email}
            hashedSecret={state.hashedSecret}
            onComplete={handleComplete}
            onBack={() => handleBack(STEPS.METHOD)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <div className="step-indicator">
            <div
              className={`step ${state.currentStep === STEPS.EMAIL ? "active" : ""} ${state.currentStep !== STEPS.EMAIL ? "completed" : ""}`}
            >
              1
            </div>
            <div className="step-line"></div>
            <div
              className={`step ${state.currentStep === STEPS.METHOD ? "active" : ""} ${state.currentStep === STEPS.PATTERN ? "completed" : ""}`}
            >
              2
            </div>
            <div className="step-line"></div>
            <div
              className={`step ${state.currentStep === STEPS.PATTERN ? "active" : ""}`}
            >
              3
            </div>
          </div>
        </div>

        <div className="register-content">{renderStep()}</div>
        <div
          className="back-navigation"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "10px",
          }}
        >
          <div className="signin-link" style={{ margin: "5px" }}>
            Don't have an account? <a href="/login">Sign In</a>
          </div>
          <button
            onClick={() => {
              if (state.currentStep === STEPS.EMAIL) {
                navigate("/");
              } else if (state.currentStep === STEPS.METHOD) {
                handleBack(STEPS.EMAIL);
              } else if (state.currentStep === STEPS.PATTERN) {
                handleBack(STEPS.METHOD);
              }
            }}
            style={{
              width: "200px",
              padding: "10px 20px",
              margin: "10px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
