const LEVELS = {
  error: 0, warn: 1, info: 2, debug: 3,
};
const currentLevel = process.env.LOG_LEVEL && LEVELS[process.env.LOG_LEVEL] !== undefined
  ? LEVELS[process.env.LOG_LEVEL]
  : (process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug);

const safe = (fn, ...args) => {
  try { fn(...args); } catch (_) { /* swallow logging errors */ }
};

module.exports = {
  error: (...args) => { if (currentLevel >= LEVELS.error) safe(console.error, ...args); },
  warn: (...args) => { if (currentLevel >= LEVELS.warn) safe(console.warn, ...args); },
  info: (...args) => { if (currentLevel >= LEVELS.info) safe(console.info, ...args); },
  debug: (...args) => { if (currentLevel >= LEVELS.debug) safe(console.log, ...args); },
};
