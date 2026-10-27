// All stub data lives in memory and is lost on restart. POST /admin/reset clears it on demand.
export const MODES = Object.freeze(['success', 'declined', 'pending', 'slow', 'failure']);
export const DEFAULT_DELAY_MS = 8000;

export function createState({ now = () => new Date() } = {}) {
  const orders = new Map();
  const tokens = new Map(); // access token -> expiry time in ms
  const replays = new Map(); // idempotency key -> saved response body
  let mode = 'success';
  let delayMs = DEFAULT_DELAY_MS;

  return {
    now,
    orders,
    tokens,
    replays,
    getMode: () => ({ mode, delayMs }),
    setMode(nextMode, nextDelayMs = delayMs) {
      mode = nextMode;
      delayMs = nextDelayMs;
    },
    reset() {
      orders.clear();
      tokens.clear();
      replays.clear();
      mode = 'success';
      delayMs = DEFAULT_DELAY_MS;
    },
  };
}
