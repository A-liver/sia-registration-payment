import express from 'express';
import { AppError, errorBody } from './errors.js';
import { ERROR_CODE } from '../../contracts/statuses.js';
import { adminRouter } from './routes/admin.js';
import { studentsRouter } from './routes/students.js';
import { enrollmentsRouter } from './routes/enrollments.js';
import { createStudentsService } from './services/students-service.js';
import { createEnrollmentsService } from './services/enrollments-service.js';

// Database connection problems mean the legacy system is effectively down.
const CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ECONNRESET',
  'PROTOCOL_CONNECTION_LOST',
  'ER_CON_COUNT_ERROR',
]);

// Everything the app needs is passed in, so tests can use fake repositories and no database.
export function createApp({
  studentsRepository,
  enrollmentsRepository,
  availability,
  logger = console,
}) {
  const app = express();
  app.use(express.json({ limit: '10kb' }));

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
    res.json({ status: 'ok', available: availability.isAvailable() });
  });

  // Admin routes stay reachable while "down", so the switch can always be turned back on.
  app.use('/admin', adminRouter(availability));

  app.use((_req, _res, next) => {
    if (!availability.isAvailable()) {
      next(
        new AppError(
          503,
          ERROR_CODE.LEGACY_UNAVAILABLE,
          'The legacy student records system is unavailable.',
        ),
      );
      return;
    }
    next();
  });

  app.use('/students', studentsRouter(createStudentsService({ studentsRepository })));
  app.use(
    '/enrollments',
    enrollmentsRouter(createEnrollmentsService({ studentsRepository, enrollmentsRepository })),
  );

  app.use((_req, res) => {
    res.status(404).json(errorBody(ERROR_CODE.NOT_FOUND, 'Route not found.'));
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof AppError) {
      res.status(error.status).json(errorBody(error.code, error.message));
      return;
    }
    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
      res.status(400).json(errorBody(ERROR_CODE.VALIDATION, 'Request body must be valid JSON.'));
      return;
    }
    if (CONNECTION_ERROR_CODES.has(error.code)) {
      logger.error(`Database unavailable: ${error.code}`);
      res
        .status(503)
        .json(
          errorBody(
            ERROR_CODE.LEGACY_UNAVAILABLE,
            'The legacy student records system is unavailable.',
          ),
        );
      return;
    }
    logger.error(`Unexpected error: ${error.message}`);
    res.status(500).json(errorBody(ERROR_CODE.INTERNAL, 'Unexpected error.'));
  });

  return app;
}
