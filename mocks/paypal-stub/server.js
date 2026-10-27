import { createApp } from './app.js';

const port = Number(process.env.PAYPAL_STUB_PORT ?? 4002);
const baseUrl = process.env.PAYPAL_STUB_URL ?? `http://localhost:${port}`;

const app = createApp({ baseUrl });

app.listen(port, () => {
  console.log(`PayPal-shaped payment stub listening on ${baseUrl}`);
});
