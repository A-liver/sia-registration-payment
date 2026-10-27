// Error shapes copied from the PayPal Orders v2 API, so the real gateway client handles them
// the same way against this stub and against the sandbox.
export const UNPROCESSABLE_MESSAGE =
  'The requested action could not be performed, semantically incorrect, or failed business validation.';
export const INVALID_REQUEST_MESSAGE =
  'Request is not well-formed, syntactically incorrect, or violates schema.';

export class PayPalError extends Error {
  constructor(status, name, message, details = []) {
    super(message);
    this.status = status;
    this.errorName = name;
    this.details = details;
  }
}

export function unprocessable(issue, description) {
  return new PayPalError(422, 'UNPROCESSABLE_ENTITY', UNPROCESSABLE_MESSAGE, [
    { issue, description },
  ]);
}

export function notFound() {
  return new PayPalError(404, 'RESOURCE_NOT_FOUND', 'The specified resource does not exist.', [
    {
      issue: 'INVALID_RESOURCE_ID',
      description:
        'Specified resource ID does not exist. Please check the resource ID and try again.',
    },
  ]);
}

export function errorBody(error, debugId) {
  const body = { name: error.errorName, message: error.message, debug_id: debugId };
  if (error.details.length > 0) body.details = error.details;
  return body;
}
