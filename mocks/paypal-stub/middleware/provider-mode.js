import { PayPalError } from '../errors.js';

// Applies the stub's current mode to order requests.
// failure: the provider answers 503. slow: the provider waits, then carries on as normal,
// even if the caller has already given up. That is how a real payment can succeed after a timeout.
export function providerMode(state, sleep) {
  return async (_req, _res, next) => {
    const { mode, delayMs } = state.getMode();
    if (mode === 'failure') {
      next(new PayPalError(503, 'SERVICE_UNAVAILABLE', 'Service Unavailable.'));
      return;
    }
    if (mode === 'slow') await sleep(delayMs);
    next();
  };
}
