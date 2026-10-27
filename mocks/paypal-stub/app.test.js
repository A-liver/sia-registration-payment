import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';
import { createState } from './state.js';

const silentLogger = { log() {}, error() {} };
const orderBody = {
  intent: 'CAPTURE',
  purchase_units: [{ reference_id: 'REG-1', amount: { currency_code: 'USD', value: '25.00' } }],
};

let server;
let baseUrl;
let token;

before(async () => {
  const app = createApp({ state: createState(), logger: silentLogger });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

beforeEach(async () => {
  await call('/admin/reset', { method: 'POST' });
  token = await getToken();
});

async function call(path, { method = 'GET', body, headers = {}, auth = true, signal } = {}) {
  const options = { method, headers: { ...headers }, signal };
  if (auth && token && path.startsWith('/v2/')) options.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // HTML pages are not JSON
  }
  return { status: response.status, json, text };
}

async function getToken() {
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from('client:secret').toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  return (await response.json()).access_token;
}

async function createOrder(requestId) {
  const headers = requestId ? { 'PayPal-Request-Id': requestId } : {};
  return call('/v2/checkout/orders', { method: 'POST', body: orderBody, headers });
}

async function approve(orderId) {
  return call(`/admin/orders/${orderId}/approve`, { method: 'POST' });
}

async function capturesOf(orderId) {
  const { json } = await call(`/v2/checkout/orders/${orderId}`);
  return json.purchase_units[0].payments?.captures ?? [];
}

test('oauth: valid client credentials return a bearer token', async () => {
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from('client:secret').toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const json = await response.json();
  assert.equal(response.status, 200);
  assert.equal(json.token_type, 'Bearer');
  assert.ok(json.access_token.length > 20);
  assert.equal(typeof json.expires_in, 'number');
});

test('oauth: missing credentials return 401 invalid_client', async () => {
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, 'invalid_client');
});

test('order routes need a valid token, and expired tokens are refused', async () => {
  const noToken = await call('/v2/checkout/orders', {
    method: 'POST',
    body: orderBody,
    auth: false,
  });
  assert.equal(noToken.status, 401);
  assert.equal(noToken.json.name, 'AUTHENTICATION_FAILURE');

  const expire = await call('/admin/expire-tokens', { method: 'POST' });
  assert.equal(expire.json.expired, 1);
  const stale = await createOrder();
  assert.equal(stale.status, 401);

  token = await getToken();
  assert.equal((await createOrder()).status, 201);
});

test('create order returns CREATED with an approve link and the amount', async () => {
  const { status, json } = await createOrder();
  assert.equal(status, 201);
  assert.equal(json.status, 'CREATED');
  assert.match(json.id, /^[A-Z0-9]{17}$/);
  assert.deepEqual(json.purchase_units[0].amount, { currency_code: 'USD', value: '25.00' });
  const approveLink = json.links.find((link) => link.rel === 'approve');
  assert.ok(approveLink.href.includes(`/checkoutnow?token=${json.id}`));
});

test('create order rejects bad input with INVALID_REQUEST and field details', async () => {
  const { status, json } = await call('/v2/checkout/orders', {
    method: 'POST',
    body: {
      intent: 'AUTHORIZE',
      purchase_units: [{ amount: { currency_code: 'usd', value: '-5' } }],
    },
  });
  assert.equal(status, 400);
  assert.equal(json.name, 'INVALID_REQUEST');
  const issues = json.details.map((detail) => detail.field);
  assert.deepEqual(issues, [
    '/intent',
    '/purchase_units/0/amount/currency_code',
    '/purchase_units/0/amount/value',
  ]);
});

test('create order rejects malformed JSON', async () => {
  const { status, json } = await call('/v2/checkout/orders', { method: 'POST', body: '{ nope' });
  assert.equal(status, 400);
  assert.equal(json.details[0].issue, 'MALFORMED_REQUEST_JSON');
});

test('the same PayPal-Request-Id returns the same order and creates only one', async () => {
  const first = await createOrder('REQ-CREATE-1');
  const again = await createOrder('REQ-CREATE-1');
  const other = await createOrder('REQ-CREATE-2');
  assert.equal(first.status, 201);
  assert.equal(again.status, 200);
  assert.equal(again.json.id, first.json.id);
  assert.notEqual(other.json.id, first.json.id);
  const list = await call('/admin/orders');
  assert.equal(list.json.orders.length, 2);
});

test('get order returns the order, and an unknown id returns RESOURCE_NOT_FOUND', async () => {
  const created = await createOrder();
  const found = await call(`/v2/checkout/orders/${created.json.id}`);
  assert.equal(found.status, 200);
  assert.equal(found.json.id, created.json.id);

  const missing = await call('/v2/checkout/orders/DOESNOTEXIST123');
  assert.equal(missing.status, 404);
  assert.equal(missing.json.name, 'RESOURCE_NOT_FOUND');
});

test('capture before the buyer approves fails with ORDER_NOT_APPROVED', async () => {
  const created = await createOrder();
  const { status, json } = await call(`/v2/checkout/orders/${created.json.id}/capture`, {
    method: 'POST',
  });
  assert.equal(status, 422);
  assert.equal(json.name, 'UNPROCESSABLE_ENTITY');
  assert.equal(json.details[0].issue, 'ORDER_NOT_APPROVED');
});

test('success: approve, capture once, and a second capture is refused (no double charge)', async () => {
  const created = await createOrder();
  const id = created.json.id;
  await approve(id);

  const captured = await call(`/v2/checkout/orders/${id}/capture`, {
    method: 'POST',
    headers: { 'PayPal-Request-Id': 'REQ-CAP-1' },
  });
  assert.equal(captured.status, 201);
  assert.equal(captured.json.status, 'COMPLETED');
  const capture = captured.json.purchase_units[0].payments.captures[0];
  assert.equal(capture.status, 'COMPLETED');
  assert.match(capture.id, /^[A-Z0-9]{17}$/);
  assert.deepEqual(capture.amount, { currency_code: 'USD', value: '25.00' });

  // Same request id again: the saved response comes back, nothing new happens.
  const replay = await call(`/v2/checkout/orders/${id}/capture`, {
    method: 'POST',
    headers: { 'PayPal-Request-Id': 'REQ-CAP-1' },
  });
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.json, captured.json);

  // A different request id is a new attempt: PayPal refuses a second capture.
  const second = await call(`/v2/checkout/orders/${id}/capture`, {
    method: 'POST',
    headers: { 'PayPal-Request-Id': 'REQ-CAP-2' },
  });
  assert.equal(second.status, 422);
  assert.equal(second.json.details[0].issue, 'ORDER_ALREADY_CAPTURED');

  const captures = await capturesOf(id);
  assert.equal(captures.length, 1);
  assert.equal(captures[0].id, capture.id);
});

test('declined mode: capture fails with INSTRUMENT_DECLINED and nothing is captured', async () => {
  const created = await createOrder();
  const id = created.json.id;
  await approve(id);
  await call('/admin/mode', { method: 'POST', body: { mode: 'declined' } });

  const { status, json } = await call(`/v2/checkout/orders/${id}/capture`, { method: 'POST' });
  assert.equal(status, 422);
  assert.equal(json.details[0].issue, 'INSTRUMENT_DECLINED');
  assert.equal((await capturesOf(id)).length, 0);

  // The buyer can try again with a working payment method.
  await call('/admin/mode', { method: 'POST', body: { mode: 'success' } });
  const retry = await call(`/v2/checkout/orders/${id}/capture`, { method: 'POST' });
  assert.equal(retry.status, 201);
});

test('pending mode: capture is PENDING_REVIEW until it is resolved', async () => {
  const created = await createOrder();
  const id = created.json.id;
  await approve(id);
  await call('/admin/mode', { method: 'POST', body: { mode: 'pending' } });

  const captured = await call(`/v2/checkout/orders/${id}/capture`, { method: 'POST' });
  assert.equal(captured.status, 201);
  assert.equal(captured.json.status, 'COMPLETED');
  const [pending] = captured.json.purchase_units[0].payments.captures;
  assert.equal(pending.status, 'PENDING');
  assert.equal(pending.status_details.reason, 'PENDING_REVIEW');

  await call(`/admin/orders/${id}/resolve`, { method: 'POST', body: { outcome: 'completed' } });
  const [settled] = await capturesOf(id);
  assert.equal(settled.status, 'COMPLETED');
  assert.equal(settled.status_details, undefined);
});

test('failure mode: order routes return 503, token and admin routes still work', async () => {
  await call('/admin/mode', { method: 'POST', body: { mode: 'failure' } });

  const created = await createOrder();
  assert.equal(created.status, 503);
  assert.equal(created.json.name, 'SERVICE_UNAVAILABLE');

  assert.ok(await getToken());
  const mode = await call('/admin/mode');
  assert.equal(mode.json.mode, 'failure');
});

test('slow mode: a caller that times out can still find the payment went through', async () => {
  const created = await createOrder();
  const id = created.json.id;
  await approve(id);
  await call('/admin/mode', { method: 'POST', body: { mode: 'slow', delayMs: 150 } });

  // The caller gives up after 30 ms, but the provider carries on and captures the payment.
  await assert.rejects(
    call(`/v2/checkout/orders/${id}/capture`, {
      method: 'POST',
      headers: { 'PayPal-Request-Id': 'REQ-SLOW-1' },
      signal: AbortSignal.timeout(30),
    }),
  );
  await new Promise((resolve) => setTimeout(resolve, 300));
  await call('/admin/mode', { method: 'POST', body: { mode: 'success' } });

  // Safe recovery: look the order up instead of paying again.
  const captures = await capturesOf(id);
  assert.equal(captures.length, 1);
  assert.equal(captures[0].status, 'COMPLETED');

  // Retrying the same capture with the same request id returns the saved result.
  const retry = await call(`/v2/checkout/orders/${id}/capture`, {
    method: 'POST',
    headers: { 'PayPal-Request-Id': 'REQ-SLOW-1' },
  });
  assert.equal(retry.status, 200);
  assert.equal((await capturesOf(id)).length, 1);
});

test('admin mode rejects unknown modes and bad delays', async () => {
  const badMode = await call('/admin/mode', { method: 'POST', body: { mode: 'explode' } });
  assert.equal(badMode.status, 400);
  const badDelay = await call('/admin/mode', {
    method: 'POST',
    body: { mode: 'slow', delayMs: -5 },
  });
  assert.equal(badDelay.status, 400);
});

test('approval page: approve marks the order APPROVED, cancel leaves it CREATED', async () => {
  const created = await createOrder();
  const id = created.json.id;

  const page = await call(`/checkoutnow?token=${id}`);
  assert.equal(page.status, 200);
  assert.ok(page.text.includes('not PayPal'));
  assert.ok(page.text.includes('USD 25.00'));

  await fetch(`${baseUrl}/checkoutnow/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `token=${id}`,
  });
  assert.equal((await call(`/v2/checkout/orders/${id}`)).json.status, 'CREATED');

  const approved = await fetch(`${baseUrl}/checkoutnow/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `token=${id}`,
  });
  assert.equal(approved.status, 200);
  assert.equal((await call(`/v2/checkout/orders/${id}`)).json.status, 'APPROVED');

  assert.equal((await call('/checkoutnow?token=<script>')).status, 404);
});

test('unknown routes return RESOURCE_NOT_FOUND', async () => {
  const { status, json } = await call('/nothing-here');
  assert.equal(status, 404);
  assert.equal(json.name, 'RESOURCE_NOT_FOUND');
});
