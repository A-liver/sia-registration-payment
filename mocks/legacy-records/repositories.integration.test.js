// Runs against a real MySQL or MariaDB. Skipped unless RUN_DB_TESTS=1 (use: npm run test:db).
// Uses its own database, sia_legacy_test, which is reset every run.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';
import { createAvailability } from './availability.js';
import { createPool } from './db.js';
import { setupDatabase } from './db-setup.js';
import { createStudentsRepository } from './repositories/students-repository.js';
import { createEnrollmentsRepository } from './repositories/enrollments-repository.js';

const skip = process.env.RUN_DB_TESTS !== '1' ? 'set RUN_DB_TESTS=1 (npm run test:db)' : false;
const env = { ...process.env, LEGACY_DB_NAME: 'sia_legacy_test' };

let pool;
let studentsRepository;
let enrollmentsRepository;
let server;
let baseUrl;

before(async () => {
  if (skip) return;
  await setupDatabase({ reset: true, env });
  pool = createPool(env);
  studentsRepository = createStudentsRepository(pool);
  enrollmentsRepository = createEnrollmentsRepository(pool);
  const app = createApp({
    studentsRepository,
    enrollmentsRepository,
    availability: createAvailability(true),
    logger: { log() {}, error() {} },
  });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (skip) return;
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('seed data: finds a demo student and returns null for an unknown one', { skip }, async () => {
  const student = await studentsRepository.findById('DEMO-1001');
  assert.deepEqual(student, {
    studentId: 'DEMO-1001',
    fullName: 'Demo Student One',
    status: 'active',
  });
  assert.equal(await studentsRepository.findById('NOPE-0000'), null);
});

test(
  'insert then the same insert again fails with ER_DUP_ENTRY, findExisting returns the first',
  { skip },
  async () => {
    const update = { studentId: 'DEMO-1002', courseId: 'CS101', paymentReference: 'PAY-DB-1' };
    const first = await enrollmentsRepository.insert(update);
    await assert.rejects(() => enrollmentsRepository.insert(update), { code: 'ER_DUP_ENTRY' });
    assert.deepEqual(await enrollmentsRepository.findExisting(update), first);
  },
);

test(
  'the foreign key rejects an enrollment for a student that does not exist',
  { skip },
  async () => {
    await assert.rejects(
      () =>
        enrollmentsRepository.insert({
          studentId: 'NOPE-0000',
          courseId: 'CS101',
          paymentReference: 'PAY-DB-2',
        }),
      { code: 'ER_NO_REFERENCED_ROW_2' },
    );
  },
);

test('20 simultaneous identical requests create exactly one row', { skip }, async () => {
  const body = JSON.stringify({
    studentId: 'DEMO-1003',
    courseId: 'CS102',
    paymentReference: 'PAY-RACE',
  });
  const responses = await Promise.all(
    Array.from({ length: 20 }, () =>
      fetch(`${baseUrl}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }).then(async (response) => ({ status: response.status, json: await response.json() })),
    ),
  );

  const created = responses.filter((response) => response.status === 201);
  const repeated = responses.filter((response) => response.status === 200);
  assert.equal(created.length, 1);
  assert.equal(repeated.length, 19);
  assert.equal(new Set(responses.map((response) => response.json.enrollmentId)).size, 1);

  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM enrollments WHERE payment_reference = ?',
    ['PAY-RACE'],
  );
  assert.equal(Number(rows[0].total), 1);
});
