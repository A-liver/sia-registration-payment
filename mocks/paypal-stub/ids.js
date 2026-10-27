import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomId(length) {
  return Array.from(randomBytes(length), (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

export const newOrderId = () => randomId(17);
export const newCaptureId = () => randomId(17);
export const newAccessToken = () => `A21AA${randomBytes(24).toString('base64url')}`;
export const newDebugId = () => randomBytes(6).toString('hex');
