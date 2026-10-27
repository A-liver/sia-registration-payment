import { Router } from 'express';
import { newAccessToken } from '../ids.js';

export function oauthRouter({ state, tokenTtlSeconds }) {
  const router = Router();

  // Accepts any non-empty client id and secret. A real PayPal app checks them.
  router.post('/token', (req, res) => {
    const header = req.get('Authorization') ?? '';
    const decoded = header.startsWith('Basic ')
      ? Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8')
      : '';
    const [clientId, ...rest] = decoded.split(':');
    if (!clientId || rest.join(':') === '') {
      res
        .status(401)
        .json({ error: 'invalid_client', error_description: 'Client Authentication failed' });
      return;
    }
    if (req.body?.grant_type !== 'client_credentials') {
      res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'grant_type must be client_credentials',
      });
      return;
    }
    const token = newAccessToken();
    state.tokens.set(token, state.now().getTime() + tokenTtlSeconds * 1000);
    res.json({ access_token: token, token_type: 'Bearer', expires_in: tokenTtlSeconds });
  });

  return router;
}
