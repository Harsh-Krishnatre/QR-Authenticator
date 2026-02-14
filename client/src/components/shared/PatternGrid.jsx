import { useState } from 'react';
import './PatternGrid.css';

const PatternGrid = ({ gridData, onPatternSelect, selectedPattern = [] }) => {
  const [selected, setSelected] = useState(selectedPattern);

  const handleCellClick = (cell) => {
    const cellKey = `${cell.number}-${cell.color}`;
    let newSelected;

    if (selected.some(s => s.number === cell.number && s.color === cell.color)) {
      newSelected = selected.filter(s => !(s.number === cell.number && s.color === cell.color));
    } else {
      newSelected = [...selected, cell];
    }

    setSelected(newSelected);
    if (onPatternSelect) {
      onPatternSelect(newSelected);
    }
  };

  const isSelected = (cell) => {
    return selected.some(s => s.number === cell.number && s.color === cell.color);
  };

  return (
    <div className="pattern-grid-container">
      <div className="pattern-grid">
        {gridData.map((cell, index) => (
          <div
            key={index}
            className={`pattern-cell ${isSelected(cell) ? 'selected' : ''}`}
            style={{ backgroundColor: cell.color }}
            onClick={() => handleCellClick(cell)}
          >
            <span className="pattern-number">{cell.number}</span>
            {isSelected(cell) && <div className="selection-indicator">✓</div>}
          </div>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="pattern-preview">
          <p className="preview-label">Selected Pattern ({selected.length}):</p>
          <div className="preview-items">
            {selected.map((cell, index) => (
              <div key={index} className="preview-item">
                <span
                  className="preview-color"
                  style={{ backgroundColor: cell.color }}
                ></span>
                <span className="preview-text">{cell.number}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternGrid;
