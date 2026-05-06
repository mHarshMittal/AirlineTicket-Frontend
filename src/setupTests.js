// src/setupTests.js
import '@testing-library/jest-dom';

// React 18 + jsdom: tell React this IS the act() environment so it
// properly batches state updates triggered inside userEvent interactions.
// This eliminates the "not wrapped in act()" warnings.
global.IS_REACT_ACT_ENVIRONMENT = true;

// Suppress act() warnings in tests
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Warning: An update to')) {
    return;
  }
  originalError.call(console, ...args);
};
