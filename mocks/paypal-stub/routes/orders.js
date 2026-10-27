import { Router } from 'express';
import { respond } from '../middleware/idempotent.js';

export function ordersRouter({ state, ordersService, baseUrlFor }) {
  const router = Router();

  router.post('/', (req, res) => {
    respond(state, res, 201, ordersService.create(req.body, baseUrlFor(req)));
  });

  router.get('/:orderId', (req, res) => {
    res.json(ordersService.get(req.params.orderId, baseUrlFor(req)));
  });

  router.post('/:orderId/capture', (req, res) => {
    respond(state, res, 201, ordersService.capture(req.params.orderId, baseUrlFor(req)));
  });

  return router;
}
