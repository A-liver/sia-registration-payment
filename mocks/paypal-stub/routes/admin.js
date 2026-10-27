import { Router } from 'express';
import { PayPalError } from '../errors.js';
import { MODES } from '../state.js';

function bad(message) {
  return new PayPalError(400, 'ADMIN_ERROR', message);
}

// Test controls. These do not exist on the real PayPal.
export function adminRouter({ state, ordersService, baseUrlFor }) {
  const router = Router();

  router.get('/mode', (_req, res) => {
    res.json(state.getMode());
  });

  router.post('/mode', (req, res) => {
    const { mode, delayMs } = req.body ?? {};
    if (!MODES.includes(mode)) throw bad(`mode must be one of: ${MODES.join(', ')}.`);
    if (delayMs !== undefined && (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > 60000)) {
      throw bad('delayMs must be a whole number from 0 to 60000.');
    }
    state.setMode(mode, delayMs);
    res.json(state.getMode());
  });

  router.post('/reset', (_req, res) => {
    state.reset();
    res.json({ reset: true });
  });

  router.post('/expire-tokens', (_req, res) => {
    const expired = state.tokens.size;
    state.tokens.clear();
    res.json({ expired });
  });

  router.get('/orders', (req, res) => {
    res.json({ orders: ordersService.list(baseUrlFor(req)) });
  });

  router.post('/orders/:orderId/approve', (req, res) => {
    res.json(ordersService.approve(req.params.orderId, baseUrlFor(req)));
  });

  router.post('/orders/:orderId/resolve', (req, res) => {
    const outcome = req.body?.outcome;
    if (outcome !== 'completed' && outcome !== 'declined') {
      throw bad('outcome must be completed or declined.');
    }
    res.json(ordersService.resolve(req.params.orderId, outcome, baseUrlFor(req)));
  });

  return router;
}
