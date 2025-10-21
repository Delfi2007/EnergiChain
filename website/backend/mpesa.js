// M-Pesa integration stub (payments & refunds)
export function sendPayment(msisdn, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: 'success', msisdn, amount, tx: `MPESA-${Date.now().toString(36)}` });
    }, 500);
  });
}

export function sendRefund(msisdn, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: 'refunded', msisdn, amount, tx: `MPESA-RF-${Date.now().toString(36)}` });
    }, 500);
  });
}
