import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';
import { createAvailability } from './availability.js';
import {
  createFakeEnrollmentsRepository,
  createFakeStudentsRepository,
} from './test-support/fakes.js';

const silentLogger = { log() {}, error() {} };
const valid = { studentId: 'DEMO-1001', courseId: 'CS101', paymentReference: 'PAY-ABC123' };

let server;
let baseUrl;
let availability;
let enrollmentsRepository;

before(async () => {
  availability = createAvailability(true);
  enrollmentsRepository = createFakeEnrollmentsRepository();
  const app = createApp({
    studentsRepository: createFakeStudentsRepository(),
    enrollmentsRepository,
    availability,
    logger: silentLogger,
  });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

beforeEach(() => {
  availability.set(true);
});

async function call(path, { method = 'GET', body, rawBody } = {}) {
  const options = { method, headers: {} };
  if (body !== undefined || rawBody !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = rawBody ?? JSON.stringify(body);
  }
  const response = await fetch(`${baseUrl}${path}`, options);
  return { status: response.status, json: await response.json() };
}

test('GET /students/:id returns a known student', async () => {
  const { status, json } = await call('/students/DEMO-1001');
  assert.equal(status, 200);
  assert.deepEqual(json, {
    studentId: 'DEMO-1001',
    fullName: 'Demo Student One',
    status: 'active',
  });
});

test('GET /students/:id returns not_found for an unknown student', async () => {
  const { status, json } = await call('/students/DEMO-0000');
  assert.equal(status, 404);
  assert.equal(json.error.code, 'not_found');
});

test('GET /students/:id rejects a malformed id', async () => {
  const { status, json } = await call('/students/bad%20id!');
  assert.equal(status, 400);
  assert.equal(json.error.code, 'validation_error');
});

test('POST /enrollments creates an enrollment (201)', async () => {
  const { status, json } = await call('/enrollments', {
    method: 'POST',
    body: { ...valid, paymentReference: 'PAY-FIRST' },
  });
  assert.equal(status, 201);
  assert.match(json.enrollmentId, /^ENR-\d{6}$/);
  assert.equal(json.status, 'enrolled');
});

test('POST /enrollments is idempotent: same body returns the same result (200)', async () => {
  const body = { ...valid, paymentReference: 'PAY-IDEMPOTENT' };
  const first = await call('/enrollments', { method: 'POST', body });
  const second = await call('/enrollments', { method: 'POST', body });
  const rowsForReference = enrollmentsRepository.rows.filter(
    (row) => row.paymentReference === 'PAY-IDEMPOTENT',
  );
  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  assert.deepEqual(second.json, first.json);
  assert.equal(rowsForReference.length, 1);
});

test('POST /enrollments returns not_found for an unknown student', async () => {
  const { status, json } = await call('/enrollments', {
    method: 'POST',
    body: { ...valid, studentId: 'DEMO-0000' },
  });
  assert.equal(status, 404);
  assert.equal(json.error.code, 'not_found');
});

test('POST /enrollments returns invalid_student for an inactive student', async () => {
  const { status, json } = await call('/enrollments', {
    method: 'POST',
    body: { ...valid, studentId: 'DEMO-9000' },
  });
  assert.equal(status, 422);
  assert.equal(json.error.code, 'invalid_student');
});

test('POST /enrollments rejects missing fields and bad JSON', async () => {
  const missing = await call('/enrollments', {
    method: 'POST',
    body: { studentId: 'DEMO-1001', courseId: 'CS101' },
  });
  assert.equal(missing.status, 400);
  assert.equal(missing.json.error.code, 'validation_error');

  const notAnObject = await call('/enrollments', { method: 'POST', body: [] });
  assert.equal(notAnObject.status, 400);

  const badJson = await call('/enrollments', { method: 'POST', rawBody: '{ not json' });
  assert.equal(badJson.status, 400);
  assert.equal(badJson.json.error.code, 'validation_error');
});

test('while unavailable, student and enrollment routes return 503 legacy_unavailable', async () => {
  const off = await call('/admin/availability', { method: 'POST', body: { available: false } });
  assert.equal(off.status, 200);
  assert.deepEqual(off.json, { available: false });

  const student = await call('/students/DEMO-1001');
  assert.equal(student.status, 503);
  assert.equal(student.json.error.code, 'legacy_unavailable');

  const enrollment = await call('/enrollments', { method: 'POST', body: valid });
  assert.equal(enrollment.status, 503);
  assert.equal(enrollment.json.error.code, 'legacy_unavailable');
});

test('health and admin stay reachable while unavailable, and turning it on restores service', async () => {
  availability.set(false);

  const health = await call('/health');
  assert.equal(health.status, 200);
  assert.deepEqual(health.json, { status: 'ok', available: false });

  const on = await call('/admin/availability', { method: 'POST', body: { available: true } });
  assert.deepEqual(on.json, { available: true });

  const student = await call('/students/DEMO-1001');
  assert.equal(student.status, 200);
});

test('POST /admin/availability rejects a non-boolean value', async () => {
  const { status, json } = await call('/admin/availability', {
    method: 'POST',
    body: { available: 'no' },
  });
  assert.equal(status, 400);
  assert.equal(json.error.code, 'validation_error');
});

test('unknown routes return the standard not_found shape', async () => {
  const { status, json } = await call('/nothing-here');
  assert.equal(status, 404);
  assert.equal(json.error.code, 'not_found');
});

test('a database connection failure is reported as 503 legacy_unavailable, not a 500', async () => {
  const brokenApp = createApp({
    studentsRepository: {
      async findById() {
        const error = new Error('connect ECONNREFUSED 127.0.0.1:3306');
        error.code = 'ECONNREFUSED';
        throw error;
      },
    },
    enrollmentsRepository: createFakeEnrollmentsRepository(),
    availability: createAvailability(true),
    logger: silentLogger,
  });
  const brokenServer = await new Promise((resolve) => {
    const started = brokenApp.listen(0, () => resolve(started));
  });
  try {
    const response = await fetch(
      `http://127.0.0.1:${brokenServer.address().port}/students/DEMO-1001`,
    );
    const json = await response.json();
    assert.equal(response.status, 503);
    assert.equal(json.error.code, 'legacy_unavailable');
  } finally {
    await new Promise((resolve) => brokenServer.close(resolve));
  }
});
