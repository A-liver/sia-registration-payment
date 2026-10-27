// One error type for every expected failure, so the error handler can turn it into
// the standard response shape: { "error": { "code": "...", "message": "..." } }.
export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorBody(code, message) {
  return { error: { code, message } };
}
