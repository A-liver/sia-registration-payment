import express from 'express';
import { INVALID_REQUEST_MESSAGE, PayPalError, errorBody, notFound } from './errors.js';
import { newDebugId } from './ids.js';
import { createState } from './state.js';
import { createOrdersService } from './services/orders-service.js';
import { requireToken } from './middleware/auth.js';
import { providerMode } from './middleware/provider-mode.js';
import { idempotent } from './middleware/idempotent.js';
import { oauthRouter } from './routes/oauth.js';
import { ordersRouter } from './routes/orders.js';
import { adminRouter } from './routes/admin.js';
import { checkoutRouter } from './routes/checkout.js';

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createApp({
  state = createState(),
  baseUrl,
  logger = console,
  sleep = defaultSleep,
  tokenTtlSeconds = 32400,
} = {}) {
  const ordersService = createOrdersService({ state });
  // Links in responses point back at this stub, using the configured URL or the request's host.
  const baseUrlFor = (req) => baseUrl ?? `${req.protocol}://${req.get('host')}`;
  const deps = { state, ordersService, baseUrlFor };

  const app = express();
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.log(
        `${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${Date.now() - start}ms`,
      );
    });
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', ...state.getMode() });
  });

  app.use('/v1/oauth2', oauthRouter({ state, tokenTtlSeconds }));
  app.use('/admin', adminRouter(deps));
  app.use('/checkoutnow', checkoutRouter(deps));
  app.use(
    '/v2/checkout/orders',
    requireToken(state),
    providerMode(state, sleep),
    idempotent(state),
    ordersRouter(deps),
  );

  app.use((_req, _res, next) => next(notFound()));

  app.use((error, _req, res, _next) => {
    const debugId = newDebugId();
    if (error instanceof PayPalError) {
      res.status(error.status).json(errorBody(error, debugId));
      return;
    }
    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
      const malformed = new PayPalError(400, 'INVALID_REQUEST', INVALID_REQUEST_MESSAGE, [
        { issue: 'MALFORMED_REQUEST_JSON', description: 'The request JSON is not well formed.' },
      ]);
      res.status(400).json(errorBody(malformed, debugId));
      return;
    }
    logger.error(`Unexpected error: ${error.message}`);
    const internal = new PayPalError(
      500,
      'INTERNAL_SERVER_ERROR',
      'An internal server error occurred.',
    );
    res.status(500).json(errorBody(internal, debugId));
  });

  return app;
}
