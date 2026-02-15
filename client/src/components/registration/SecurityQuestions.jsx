import { useState, useEffect } from 'react';
import './SecurityQuestions.css';

const SecurityQuestions = ({ onChange, availableQuestions, onCountChange }) => {

  const [items, setItems] = useState([
    { question: '', answer: '', confirmAnswer: '', error: '' },
  ]);

  // compute selected questions set
  const selectedSet = new Set(items.map((it) => it.question).filter(Boolean));

  useEffect(() => {
    // Validate items: each must have question, answer, confirmAnswer and answers must match
    const validItems = items.filter((it) => it.question && it.answer && it.confirmAnswer && it.answer === it.confirmAnswer);
    // ensure at least 3 valid entries before notifying parent
    if (validItems.length >= 3) {
      onChange(validItems.map((it) => ({ question: it.question, answer: it.answer })));
    } else {
      onChange(null);
    }
    if (typeof onCountChange === 'function') onCountChange(validItems.length);
  }, [items, onChange, onCountChange]);

  const updateItem = (index, changes) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...changes } : it)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { question: '', answer: '', confirmAnswer: '', error: '' }]);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const availableForIndex = (index) => {
    return availableQuestions.filter((q) => {
      // keep the current selection for this index
      if (items[index] && items[index].question === q) return true;
      return !selectedSet.has(q);
    });
  };

  return (
    <div className="security-questions-multi">
      {items.map((it, idx) => (
        <div className="qa-row" key={idx}>
          <div className="qa-top">
            <div className="form-group question-group">
              <label>Question {idx + 1}</label>
              <select
                value={it.question}
                onChange={(e) => updateItem(idx, { question: e.target.value })}
                className="question-select"
              >
                <option value="">Choose a security question...</option>
                {availableForIndex(idx).map((q, i) => (
                  <option key={i} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div className="form-actions top-actions">
              <button
                type="button"
                className="remove-btn"
                onClick={() => removeItem(idx)}
                disabled={items.length <= 1}
                aria-label={`Remove question ${idx + 1}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="qa-bottom">
            <div className="form-group small-group">
              <label>Answer</label>
              <input
                type="password"
                value={it.answer}
                onChange={(e) => updateItem(idx, { answer: e.target.value })}
                placeholder="Enter your answer"
                className="answer-input"
                disabled={!it.question}
              />
            </div>

            <div className="form-group small-group">
              <label>Confirm</label>
              <input
                type="password"
                value={it.confirmAnswer}
                onChange={(e) => updateItem(idx, { confirmAnswer: e.target.value })}
                placeholder="Confirm your answer"
                className="answer-input"
                disabled={!it.question || !it.answer}
              />
              {it.answer && it.confirmAnswer && it.answer !== it.confirmAnswer && (
                <span className="field-error">Answers do not match</span>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="multi-actions">
        <button
          type="button"
          onClick={addItem}
          disabled={items.length >= availableQuestions.length}
          className="btn-primary small"
          aria-label="Add question"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ marginLeft: 8 }}>Add</span>
        </button>
        <p className="hint">Select at least 3 different questions and provide matching answers.</p>
      </div>
    </div>
  );
};

export default SecurityQuestions;
