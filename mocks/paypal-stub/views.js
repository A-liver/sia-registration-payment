const STYLE = `
  body { font-family: system-ui, "Segoe UI", Arial, sans-serif; background: #eef2f9; color: #1b2033; margin: 0; padding: 24px; }
  main { max-width: 440px; margin: 40px auto; background: #fff; border: 1px solid #d5dbe8; border-radius: 8px; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 8px; color: #1f1a7a; }
  p { line-height: 1.5; margin: 8px 0; }
  .note { background: #e3ecfb; color: #1d4a9c; padding: 8px 12px; border-radius: 6px; }
  button { min-height: 44px; padding: 0 16px; border-radius: 6px; border: 1px solid #1f1a7a; font-size: 16px; cursor: pointer; }
  .primary { background: #1f1a7a; color: #fff; }
  .secondary { background: #fff; color: #1f1a7a; }
  button:focus-visible { outline: 3px solid #2559b8; outline-offset: 2px; }
  form { display: inline-block; margin: 8px 8px 0 0; }
`;

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${STYLE}</style>
</head>
<body>
<main>
<h1>${title}</h1>
<p class="note">Local payment stub. This is not PayPal and no real money moves.</p>
${body}
</main>
</body>
</html>`;
}

// token and amount values come from ids and validated amounts only, never from free text.
export function approvalPage({ id, amount }) {
  return page(
    'Approve this payment',
    `<p>Amount: ${amount.currency_code} ${amount.value}</p>
<form method="post" action="/checkoutnow/approve"><input type="hidden" name="token" value="${id}"><button class="primary" type="submit">Approve payment</button></form>
<form method="post" action="/checkoutnow/cancel"><input type="hidden" name="token" value="${id}"><button class="secondary" type="submit">Cancel</button></form>`,
  );
}

export function approvedPage() {
  return page('Payment approved', '<p>You can close this page and return to the portal.</p>');
}

export function cancelledPage() {
  return page(
    'Payment cancelled',
    '<p>No payment was made. You can close this page and return to the portal.</p>',
  );
}

export function missingPage() {
  return page('Order not found', '<p>This order does not exist in the stub.</p>');
}
