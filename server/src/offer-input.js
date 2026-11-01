// Checks an offer sent from the admin panel. Returns { errors } or { offer } ready for the database.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { textError } from './validate.js';

export const TYPES = ['Flat', 'Penthouse', 'House'];
const clientDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'client');
// images/apartment1.jpg, images/people/p1.jpg ... (no "..", no other folders)
const IMAGE_PATH = /^images\/[A-Za-z0-9_\-/]+\.(jpe?g|png|webp|avif|svg)$/;

function wholeNumber(value, label, min, max, { required = true } = {}) {
  if (!required && (value === undefined || value === null || value === '')) return { value: null };
  const n = Number(value);
  if (value === '' || value === null || !Number.isInteger(n) || n < min || n > max) {
    return { error: `${label} must be a whole number from ${min} to ${max}.` };
  }
  return { value: n };
}

export function readOffer(body = {}) {
  const errors = {};
  const offer = {};

  for (const [key, label, max, required] of [
    ['title', 'a title', 200, true],
    ['city', 'a city', 100, true],
    ['floor', 'a floor', 50, false],
    ['description', 'a description', 5000, false]
  ]) {
    const error = textError(body[key], label, { required, max });
    if (error) errors[key] = error;
    offer[key] = typeof body[key] === 'string' && body[key].trim() ? body[key].trim() : null;
  }

  const year = new Date().getFullYear();
  for (const [key, label, min, max, required] of [
    ['price', 'Price', 1, 100_000_000, true],
    ['area', 'Area', 1, 10_000, true],
    ['rooms', 'Rooms', 1, 50, true],
    ['beds', 'Bedrooms', 0, 50, true],
    ['baths', 'Bathrooms', 0, 50, true],
    ['year', 'Year built', 1800, year + 5, false]
  ]) {
    const { value, error } = wholeNumber(body[key], label, min, max, { required });
    if (error) errors[key] = error;
    offer[key] = value;
  }

  if (!TYPES.includes(body.type)) errors.type = 'Please choose a property type.';
  offer.type = body.type;
  offer.terrace = body.terrace === true ? 1 : 0;

  const images = Array.isArray(body.images) ? body.images.map((s) => String(s).trim()).filter(Boolean) : [];
  const badImage = images.find((p) => !IMAGE_PATH.test(p) || !existsSync(join(clientDir, p)));
  if (!images.length || images.length > 10) errors.images = 'Add from 1 to 10 photos.';
  else if (badImage) errors.images = `Photo not found: ${badImage}`;
  offer.images = images;

  return Object.keys(errors).length ? { errors } : { offer };
}
