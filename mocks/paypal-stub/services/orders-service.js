import { PayPalError, notFound, unprocessable } from '../errors.js';
import { newCaptureId, newOrderId } from '../ids.js';
import { validateCreateOrder } from '../validation.js';

export function createOrdersService({ state }) {
  function findOrder(orderId) {
    const order = state.orders.get(orderId);
    if (!order) throw notFound();
    return order;
  }

  function present(order, baseUrl) {
    const unit = { reference_id: order.referenceId, amount: order.amount };
    if (order.captures.length > 0) {
      unit.payments = {
        captures: order.captures.map((capture) => ({
          id: capture.id,
          status: capture.status,
          amount: capture.amount,
          final_capture: true,
          create_time: capture.createTime,
          ...(capture.reason ? { status_details: { reason: capture.reason } } : {}),
        })),
      };
    }
    const links = [
      { href: `${baseUrl}/v2/checkout/orders/${order.id}`, rel: 'self', method: 'GET' },
    ];
    if (order.status === 'CREATED' || order.status === 'APPROVED') {
      links.push(
        { href: `${baseUrl}/checkoutnow?token=${order.id}`, rel: 'approve', method: 'GET' },
        {
          href: `${baseUrl}/v2/checkout/orders/${order.id}/capture`,
          rel: 'capture',
          method: 'POST',
        },
      );
    }
    return {
      id: order.id,
      intent: 'CAPTURE',
      status: order.status,
      purchase_units: [unit],
      create_time: order.createTime,
      links,
    };
  }

  return {
    present,

    create(body, baseUrl) {
      const { referenceId, amount } = validateCreateOrder(body);
      const order = {
        id: newOrderId(),
        status: 'CREATED',
        referenceId,
        amount,
        createTime: state.now().toISOString(),
        captures: [],
      };
      state.orders.set(order.id, order);
      return present(order, baseUrl);
    },

    get(orderId, baseUrl) {
      return present(findOrder(orderId), baseUrl);
    },

    // Mirrors PayPal: an order can be captured once, and only after the buyer approved it.
    capture(orderId, baseUrl) {
      const order = findOrder(orderId);
      if (order.captures.length > 0) {
        throw unprocessable(
          'ORDER_ALREADY_CAPTURED',
          "Order already captured. If 'intent=CAPTURE' only one capture per order is allowed.",
        );
      }
      if (order.status !== 'APPROVED') {
        throw unprocessable(
          'ORDER_NOT_APPROVED',
          "Payer has not yet approved the Order for payment. Please redirect the payer to the url in the 'rel':'approve' HATEOAS link.",
        );
      }
      const { mode } = state.getMode();
      if (mode === 'declined') {
        throw unprocessable(
          'INSTRUMENT_DECLINED',
          "The instrument presented was either declined by the processor or bank, or it can't be used for this payment.",
        );
      }
      const pending = mode === 'pending';
      order.captures.push({
        id: newCaptureId(),
        status: pending ? 'PENDING' : 'COMPLETED',
        reason: pending ? 'PENDING_REVIEW' : undefined,
        amount: order.amount,
        createTime: state.now().toISOString(),
      });
      order.status = 'COMPLETED';
      return present(order, baseUrl);
    },

    // Stub only: stands in for the buyer approving the payment on PayPal's page.
    approve(orderId, baseUrl) {
      const order = findOrder(orderId);
      if (order.status === 'COMPLETED') {
        throw new PayPalError(409, 'ADMIN_ERROR', 'This order is already completed.');
      }
      order.status = 'APPROVED';
      return present(order, baseUrl);
    },

    // Stub only: settles a PENDING capture later, as PayPal would after a review.
    resolve(orderId, outcome, baseUrl) {
      const order = findOrder(orderId);
      const capture = order.captures.find((item) => item.status === 'PENDING');
      if (!capture) {
        throw new PayPalError(409, 'ADMIN_ERROR', 'This order has no pending capture.');
      }
      capture.status = outcome === 'completed' ? 'COMPLETED' : 'DECLINED';
      capture.reason = undefined;
      return present(order, baseUrl);
    },

    list(baseUrl) {
      return [...state.orders.values()].map((order) => present(order, baseUrl));
    },
  };
}
