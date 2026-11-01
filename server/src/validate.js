// Checks shared by the routes. Each returns an error text, or '' when the value is fine.

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function textError(value, label, { required = true, max = 200 } = {}) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (required && !text) return `Please enter ${label}.`;
  if (text.length > max) return `${label[0].toUpperCase()}${label.slice(1)} is too long (max ${max} characters).`;
  return '';
}

export const emailError = (value) =>
  isEmail(typeof value === 'string' ? value.trim() : '') ? '' : 'Please enter a valid email.';

// Collects { field: message } and drops the empty ones
export function collect(checks) {
  return Object.fromEntries(Object.entries(checks).filter(([, msg]) => msg));
}
