import { Router } from 'express';
import { AppError } from '../errors.js';
import { validBody } from '../validation.js';
import { ERROR_CODE } from '../../../contracts/statuses.js';

// Test switch for the mock only. The real legacy system would not have these routes.
export function adminRouter(availability) {
  const router = Router();

  router.get('/availability', (_req, res) => {
    res.json({ available: availability.isAvailable() });
  });

  router.post('/availability', (req, res) => {
    const { available } = validBody(req.body);
    if (typeof available !== 'boolean') {
      throw new AppError(400, ERROR_CODE.VALIDATION, 'available must be true or false.');
    }
    availability.set(available);
    res.json({ available });
  });

  return router;
}
