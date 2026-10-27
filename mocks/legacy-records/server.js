import { createApp } from './app.js';
import { createAvailability } from './availability.js';
import { createPool } from './db.js';
import { createStudentsRepository } from './repositories/students-repository.js';
import { createEnrollmentsRepository } from './repositories/enrollments-repository.js';

const port = Number(process.env.LEGACY_PORT ?? 4001);
const pool = createPool();

const app = createApp({
  studentsRepository: createStudentsRepository(pool),
  enrollmentsRepository: createEnrollmentsRepository(pool),
  availability: createAvailability(true),
});

app.listen(port, () => {
  console.log(`Legacy records mock listening on http://localhost:${port}`);
});
