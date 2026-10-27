import { INVALID_REQUEST_MESSAGE, PayPalError } from './errors.js';

const CURRENCY = /^[A-Z]{3}$/;
const VALUE = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

function issue(field, problem, description) {
  return { field, location: 'body', issue: problem, description };
}

// Accepts the one request shape this project uses: intent CAPTURE and a single purchase unit.
export function validateCreateOrder(body) {
  const problems = [];
  const input = body !== null && typeof body === 'object' && !Array.isArray(body) ? body : {};

  if (input.intent !== 'CAPTURE') {
    problems.push(issue('/intent', 'INVALID_PARAMETER_VALUE', 'intent must be CAPTURE.'));
  }

  const units = input.purchase_units;
  if (!Array.isArray(units) || units.length !== 1) {
    problems.push(
      issue(
        '/purchase_units',
        'INVALID_ARRAY_MAX_ITEMS',
        'Exactly one purchase unit is supported.',
      ),
    );
  }
  const unit = Array.isArray(units) && units.length === 1 ? units[0] : {};
  const amount = unit?.amount ?? {};

  if (typeof amount.currency_code !== 'string' || !CURRENCY.test(amount.currency_code)) {
    problems.push(
      issue(
        '/purchase_units/0/amount/currency_code',
        'INVALID_PARAMETER_SYNTAX',
        'currency_code must be three uppercase letters.',
      ),
    );
  }
  if (
    typeof amount.value !== 'string' ||
    !VALUE.test(amount.value) ||
    Number.parseFloat(amount.value) <= 0
  ) {
    problems.push(
      issue(
        '/purchase_units/0/amount/value',
        'INVALID_PARAMETER_SYNTAX',
        'value must be a positive decimal string with at most two decimals, for example "1500.00".',
      ),
    );
  }
  if (unit?.reference_id !== undefined && typeof unit.reference_id !== 'string') {
    problems.push(
      issue(
        '/purchase_units/0/reference_id',
        'INVALID_PARAMETER_SYNTAX',
        'reference_id must be text.',
      ),
    );
  }

  if (problems.length > 0) {
    throw new PayPalError(400, 'INVALID_REQUEST', INVALID_REQUEST_MESSAGE, problems);
  }
  return {
    referenceId: unit.reference_id ?? 'default',
    amount: { currency_code: amount.currency_code, value: amount.value },
  };
}
