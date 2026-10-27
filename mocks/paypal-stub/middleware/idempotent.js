// PayPal-Request-Id on a POST: the first successful response is saved, and sending the same
// request id again returns that saved response (status 200) instead of doing the work twice.
export function idempotent(state) {
  return (req, res, next) => {
    const requestId = req.get('PayPal-Request-Id');
    if (req.method !== 'POST' || !requestId) {
      next();
      return;
    }
    const key = `${req.originalUrl.split('?')[0]} ${requestId}`;
    const saved = state.replays.get(key);
    if (saved) {
      res.status(200).json(saved);
      return;
    }
    res.locals.replayKey = key;
    next();
  };
}

export function respond(state, res, status, body) {
  if (res.locals.replayKey) state.replays.set(res.locals.replayKey, body);
  res.status(status).json(body);
}
