import { useState, useEffect } from 'react';
import './CountdownTimer.css';

const CountdownTimer = ({ duration, onExpire, onTick }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (onTick) onTick(newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire, onTick]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = (timeLeft / duration) * 100;

  return (
    <div className="countdown-timer">
      <div className="timer-display">
        <span className="timer-text">{formatTime(timeLeft)}</span>
      </div>
      <div className="timer-bar">
        <div
          className="timer-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: percentage > 30 ? '#4caf50' : '#f44336',
          }}
        ></div>
      </div>
    </div>
  );
};

export default CountdownTimer;
