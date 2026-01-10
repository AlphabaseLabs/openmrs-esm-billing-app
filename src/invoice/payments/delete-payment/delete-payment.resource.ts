import { type Payment } from '../../../types';

export const createDeletePaymentPayload = (bill, payment: Payment, reason: string, currentUserUuid?: string) => {
  const formatPayment = (currentPayment) => {
    const isVoidedPayment = currentPayment.uuid === payment.uuid;
    const paymentPayload: any = {
      amount: currentPayment.amount,
      amountTendered: currentPayment.amountTendered,
      attributes: [],
      instanceType: currentPayment.instanceType.uuid,
      voided: isVoidedPayment ? true : currentPayment.voided,
      resourceVersion: currentPayment.resourceVersion,
    };

    if (isVoidedPayment) {
      paymentPayload.voidReason = reason;
      paymentPayload.dateChanged = new Date().toISOString();
      if (currentUserUuid) {
        paymentPayload.voidedBy = { uuid: currentUserUuid };
      }
    } else if (currentPayment.dateCreated) {
      paymentPayload.dateCreated = currentPayment.dateCreated;
    }

    return paymentPayload;
  };

  const formatLineItem = (props) => ({
    uuid: props.uuid,
    item: props.item,
    quantity: props.quantity,
    price: props.price,
    priceName: props.priceName,
    priceUuid: props.priceUuid,
    lineItemOrder: props.lineItemOrder,
    paymentStatus: props.paymentStatus,
  });

  // Note: We don't include 'status' field to avoid triggering rounding logic
  // when the status is a calculated value that differs from the backend status.
  // The backend will preserve the existing status.
  const deletePaymentPayload = {
    cashPoint: bill.cashPointUuid,
    cashier: bill.cashier.uuid,
    lineItems: bill.lineItems.map((li) => formatLineItem(li)),
    payments: bill.payments.map((payment) => formatPayment(payment)),
    patient: bill.patientUuid,
  };

  return deletePaymentPayload;
};
