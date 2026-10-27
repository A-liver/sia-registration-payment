import { PayPalError } from '../errors.js';

// Requires "Authorization: Bearer <token>" with a token this stub issued and has not expired.
export function requireToken(state) {
  return (req, _res, next) => {
    const header = req.get('Authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
    const expiresAt = state.tokens.get(token);
    if (!expiresAt || expiresAt <= state.now().getTime()) {
      next(
        new PayPalError(
          401,
          'AUTHENTICATION_FAILURE',
          'Authentication failed due to invalid authentication credentials or a missing Authorization header.',
        ),
      );
      return;
    }
    next();
  };
}
