import { AppError } from './errors.js';
import { ERROR_CODE } from '../../contracts/statuses.js';

const ID_PATTERN = /^[A-Za-z0-9-]{1,32}$/;
const REFERENCE_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function invalid(message) {
  return new AppError(400, ERROR_CODE.VALIDATION, message);
}

export function validId(value, field) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw invalid(`${field} must be 1 to 32 letters, digits or dashes.`);
  }
  return value;
}

export function validReference(value, field) {
  if (typeof value !== 'string' || !REFERENCE_PATTERN.test(value)) {
    throw invalid(`${field} must be 1 to 64 letters, digits, dashes or underscores.`);
  }
  return value;
}

export function validBody(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw invalid('Request body must be a JSON object.');
  }
  return body;
}
