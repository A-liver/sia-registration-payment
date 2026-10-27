import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAYMENT_STATUS, ENROLLMENT_STATUS, RECOVERY_STATUS, ERROR_CODE } from './statuses.js';

const groups = { PAYMENT_STATUS, ENROLLMENT_STATUS, RECOVERY_STATUS, ERROR_CODE };

for (const [name, group] of Object.entries(groups)) {
  test(`${name} is frozen`, () => {
    assert.ok(Object.isFrozen(group));
  });

  test(`${name} values are unique snake_case strings`, () => {
    const values = Object.values(group);
    assert.equal(new Set(values).size, values.length);
    for (const value of values) {
      assert.match(value, /^[a-z]+(_[a-z]+)*$/);
    }
  });
}
