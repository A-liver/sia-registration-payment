import { Router } from 'express';
import { approvalPage, approvedPage, cancelledPage, missingPage } from '../views.js';

const TOKEN = /^[A-Z0-9]{5,32}$/;

// A tiny stand-in for PayPal's approval page, so the whole flow can run without internet.
export function checkoutRouter({ state, ordersService, baseUrlFor }) {
  const router = Router();

  function findOrder(token) {
    return typeof token === 'string' && TOKEN.test(token) ? state.orders.get(token) : undefined;
  }

  router.get('/', (req, res) => {
    const order = findOrder(req.query.token);
    if (!order) {
      res.status(404).type('html').send(missingPage());
      return;
    }
    res.type('html').send(approvalPage({ id: order.id, amount: order.amount }));
  });

  router.post('/approve', (req, res) => {
    const order = findOrder(req.body?.token);
    if (!order) {
      res.status(404).type('html').send(missingPage());
      return;
    }
    ordersService.approve(order.id, baseUrlFor(req));
    res.type('html').send(approvedPage());
  });

  router.post('/cancel', (req, res) => {
    if (!findOrder(req.body?.token)) {
      res.status(404).type('html').send(missingPage());
      return;
    }
    res.type('html').send(cancelledPage());
  });

  return router;
}
