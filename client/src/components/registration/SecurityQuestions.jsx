import { useState, useEffect } from 'react';
import './SecurityQuestions.css';

const AVAILABLE_QUESTIONS = [
  "What was your first pet's name?",
  'What city were you born in?',
  "What is your mother's maiden name?",
  'What was the name of your first school?',
  'What is your favorite color?',
];

const SecurityQuestions = ({ onChange }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [confirmAnswer, setConfirmAnswer] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (question && answer && confirmAnswer && answer === confirmAnswer) {
      onChange({ question, answer });
    } else {
      onChange(null);
    }
  }, [question, answer, confirmAnswer, onChange]);

  const handleAnswerChange = (value) => {
    setAnswer(value);
    if (confirmAnswer && value !== confirmAnswer) {
      setErrors({ ...errors, match: 'Answers do not match' });
    } else {
      const newErrors = { ...errors };
      delete newErrors.match;
      setErrors(newErrors);
    }
  };

  const handleConfirmChange = (value) => {
    setConfirmAnswer(value);
    if (answer && value !== answer) {
      setErrors({ ...errors, match: 'Answers do not match' });
    } else {
      const newErrors = { ...errors };
      delete newErrors.match;
      setErrors(newErrors);
    }
  };

  return (
    <div className="security-questions">
      <div className="form-group">
        <label>Select a Question</label>
        <select
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="question-select"
        >
          <option value="">Choose a security question...</option>
          {AVAILABLE_QUESTIONS.map((q, index) => (
            <option key={index} value={q}>
              {q}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Your Answer</label>
        <input
          type="password"
          value={answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder="Enter your answer"
          className="answer-input"
          disabled={!question}
        />
      </div>

      <div className="form-group">
        <label>Confirm Answer</label>
        <input
          type="password"
          value={confirmAnswer}
          onChange={(e) => handleConfirmChange(e.target.value)}
          placeholder="Confirm your answer"
          className="answer-input"
          disabled={!question || !answer}
        />
        {errors.match && <span className="field-error">{errors.match}</span>}
      </div>
    </div>
  );
};

export default SecurityQuestions;
