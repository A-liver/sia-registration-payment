// Shared status values and error codes.
// Owned by the lead. Do not edit without an approved issue.

export const PAYMENT_STATUS = Object.freeze({
  CREATED: 'created',
  COMPLETED: 'completed',
  PENDING: 'pending',
  DECLINED: 'declined',
  FAILED: 'failed',
});

export const ENROLLMENT_STATUS = Object.freeze({
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_CONFIRMED_UPDATE_PENDING: 'payment_confirmed_update_pending',
  ENROLLED: 'enrolled',
  NEEDS_REVIEW: 'needs_review',
});

export const RECOVERY_STATUS = Object.freeze({
  PENDING: 'pending',
  DONE: 'done',
  NEEDS_REVIEW: 'needs_review',
});

export const ERROR_CODE = Object.freeze({
  VALIDATION: 'validation_error',
  NOT_FOUND: 'not_found',
  INVALID_STUDENT: 'invalid_student',
  COURSE_FULL: 'course_full',
  PREREQUISITE_NOT_MET: 'prerequisite_not_met',
  LEGACY_UNAVAILABLE: 'legacy_unavailable',
  PAYMENT_DECLINED: 'payment_declined',
  PAYMENT_TIMEOUT: 'payment_timeout',
});
