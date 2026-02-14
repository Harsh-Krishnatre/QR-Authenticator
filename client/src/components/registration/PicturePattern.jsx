import { useState, useEffect } from 'react';
import './PicturePattern.css';

const IMAGES = [
  { id: 1, emoji: '🐶', name: 'Dog' },
  { id: 2, emoji: '🐱', name: 'Cat' },
  { id: 3, emoji: '🦁', name: 'Lion' },
  { id: 4, emoji: '🐘', name: 'Elephant' },
  { id: 5, emoji: '🦊', name: 'Fox' },
  { id: 6, emoji: '🐼', name: 'Panda' },
  { id: 7, emoji: '🦋', name: 'Butterfly' },
  { id: 8, emoji: '🌸', name: 'Flower' },
  { id: 9, emoji: '🌙', name: 'Moon' },
  { id: 10, emoji: '⭐', name: 'Star' },
  { id: 11, emoji: '🌈', name: 'Rainbow' },
  { id: 12, emoji: '🔥', name: 'Fire' },
];

const PicturePattern = ({ onChange }) => {
  const [selectedPattern, setSelectedPattern] = useState([]);

  useEffect(() => {
    if (selectedPattern.length >= 3) {
      onChange(selectedPattern);
    } else {
      onChange(null);
    }
  }, [selectedPattern, onChange]);

  const handleImageClick = (image) => {
    if (selectedPattern.find((p) => p.id === image.id)) {
      setSelectedPattern(selectedPattern.filter((p) => p.id !== image.id));
    } else {
      setSelectedPattern([...selectedPattern, image]);
    }
  };

  const isSelected = (image) => {
    return selectedPattern.find((p) => p.id === image.id);
  };

  const getSelectionOrder = (image) => {
    const index = selectedPattern.findIndex((p) => p.id === image.id);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <div className="picture-pattern">
      <p className="pattern-instruction">
        Select at least 3 images in order (you can select up to 6)
      </p>

      <div className="image-grid">
        {IMAGES.map((image) => (
          <div
            key={image.id}
            className={`image-cell ${isSelected(image) ? 'selected' : ''}`}
            onClick={() => handleImageClick(image)}
          >
            <span className="image-emoji">{image.emoji}</span>
            <span className="image-name">{image.name}</span>
            {isSelected(image) && (
              <div className="selection-badge">{getSelectionOrder(image)}</div>
            )}
          </div>
        ))}
      </div>

      {selectedPattern.length > 0 && (
        <div className="pattern-summary">
          <p className="summary-title">Your Pattern ({selectedPattern.length}):</p>
          <div className="summary-items">
            {selectedPattern.map((image, index) => (
              <div key={image.id} className="summary-item">
                <span className="summary-order">{index + 1}.</span>
                <span className="summary-emoji">{image.emoji}</span>
                <span className="summary-name">{image.name}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSelectedPattern([])}
            className="clear-button"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default PicturePattern;
