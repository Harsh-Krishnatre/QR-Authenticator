const COLORS = [
  { name: 'red', hex: '#ef4444' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'green', hex: '#22c55e' },
  { name: 'yellow', hex: '#eab308' },
  { name: 'orange', hex: '#f97316' },
  { name: 'purple', hex: '#7c3aed' },
  { name: 'pink', hex: '#ec4899' },
  { name: 'white', hex: '#f8fafc' },
  { name: 'black', hex: '#1f2937' },
  { name: 'brown', hex: '#8b5e3c' },
];

export default function PatternEditor({ pattern, onChange }) {
  function updateNumber(index, value) {
    const next = [...pattern];
    next[index] = {
      ...next[index],
      number: Math.min(9, Math.max(0, Number.parseInt(value, 10) || 0)),
    };
    onChange(next);
  }

  function updateColor(index, value) {
    const next = [...pattern];
    next[index] = {
      ...next[index],
      color: value,
    };
    onChange(next);
  }

  function addPair() {
    if (pattern.length >= 8) {
      return;
    }
    onChange([...pattern, { number: 0, color: 'red' }]);
  }

  function removePair() {
    if (pattern.length <= 4) {
      return;
    }
    onChange(pattern.slice(0, -1));
  }

  return (
    <>
      <div className="pattern-list">
        {pattern.map((pair, index) => (
          <div className="pattern-row" key={`${index}-${pair.color}-${pair.number}`}>
            <span className="pair-num">{index + 1}</span>
            <input
              className="pair-number-input"
              type="number"
              min="0"
              max="9"
              value={pair.number}
              onChange={(event) => updateNumber(index, event.target.value)}
            />
            <select
              className="pair-color-select"
              value={pair.color}
              onChange={(event) => updateColor(index, event.target.value)}
            >
              {COLORS.map((color) => (
                <option key={color.name} value={color.name}>
                  {color.name}
                </option>
              ))}
            </select>
            <span
              className="color-swatch"
              style={{ backgroundColor: COLORS.find((item) => item.name === pair.color)?.hex || '#fff' }}
            />
          </div>
        ))}
      </div>

      <div className="pattern-controls">
        <button className="btn btn-sm btn-outline" type="button" onClick={addPair}>
          Add pair
        </button>
        <button className="btn btn-sm btn-outline" type="button" onClick={removePair}>
          Remove pair
        </button>
      </div>
    </>
  );
}
