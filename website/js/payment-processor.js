/**
 * Payment Processing Utilities
 * M-Pesa, card payments, and cryptocurrency integrations
 */

class PaymentProcessor {
  constructor() {
    this.transactions = new Map();
    this.providers = new Map();
  }

  /**
   * Initialize M-Pesa STK Push
   */
  async initiateMPesaPayment(phoneNumber, amount, accountReference, description) {
    const transaction = {
      id: this.generateTransactionId(),
      type: 'mpesa',
      phoneNumber: this.formatPhoneNumber(phoneNumber),
      amount: parseFloat(amount),
      accountReference,
      description,
      status: 'pending',
      timestamp: Date.now()
    };

    this.transactions.set(transaction.id, transaction);

    try {
      // Simulate API call to M-Pesa
      const response = await this.callMPesaAPI({
        BusinessShortCode: '174379',
        Password: this.generateMPesaPassword(),
        Timestamp: this.getMPesaTimestamp(),
        TransactionType: 'CustomerPayBillOnline',
        Amount: transaction.amount,
        PartyA: transaction.phoneNumber,
        PartyB: '174379',
        PhoneNumber: transaction.phoneNumber,
        CallBackURL: 'https://yourdomain.com/mpesa/callback',
        AccountReference: transaction.accountReference,
        TransactionDesc: transaction.description
      });

      transaction.checkoutRequestId = response.CheckoutRequestID;
      transaction.merchantRequestId = response.MerchantRequestID;
      transaction.status = 'processing';

      return {
        success: true,
        transactionId: transaction.id,
        checkoutRequestId: response.CheckoutRequestID,
        message: 'Payment prompt sent to phone'
      };
    } catch (error) {
      transaction.status = 'failed';
      transaction.error = error.message;
      
      return {
        success: false,
        transactionId: transaction.id,
        error: error.message
      };
    }
  }

  /**
   * Query M-Pesa transaction status
   */
  async queryMPesaStatus(checkoutRequestId) {
    try {
      const response = await this.callMPesaQueryAPI({
        BusinessShortCode: '174379',
        Password: this.generateMPesaPassword(),
        Timestamp: this.getMPesaTimestamp(),
        CheckoutRequestID: checkoutRequestId
      });

      return {
        resultCode: response.ResultCode,
        resultDesc: response.ResultDesc,
        status: response.ResultCode === '0' ? 'completed' : 'failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process card payment
   */
  async processCardPayment(cardDetails, amount, currency = 'KES') {
    const transaction = {
      id: this.generateTransactionId(),
      type: 'card',
      amount: parseFloat(amount),
      currency,
      cardLast4: cardDetails.number.slice(-4),
      status: 'pending',
      timestamp: Date.now()
    };

    this.transactions.set(transaction.id, transaction);

    // Validate card
    if (!this.validateCard(cardDetails)) {
      transaction.status = 'failed';
      transaction.error = 'Invalid card details';
      return {
        success: false,
        transactionId: transaction.id,
        error: 'Invalid card details'
      };
    }

    try {
      // Simulate payment gateway call
      const response = await this.callPaymentGateway({
        cardNumber: cardDetails.number,
        expiryMonth: cardDetails.expiryMonth,
        expiryYear: cardDetails.expiryYear,
        cvv: cardDetails.cvv,
        amount: transaction.amount,
        currency: transaction.currency
      });

      if (response.success) {
        transaction.status = 'completed';
        transaction.gatewayReference = response.reference;
        
        return {
          success: true,
          transactionId: transaction.id,
          reference: response.reference,
          message: 'Payment successful'
        };
      } else {
        transaction.status = 'failed';
        transaction.error = response.error;
        
        return {
          success: false,
          transactionId: transaction.id,
          error: response.error
        };
      }
    } catch (error) {
      transaction.status = 'failed';
      transaction.error = error.message;
      
      return {
        success: false,
        transactionId: transaction.id,
        error: error.message
      };
    }
  }

  /**
   * Process cryptocurrency payment
   */
  async processCryptoPayment(walletAddress, amount, currency = 'ETH') {
    const transaction = {
      id: this.generateTransactionId(),
      type: 'crypto',
      currency,
      amount: parseFloat(amount),
      walletAddress,
      status: 'pending',
      timestamp: Date.now()
    };

    this.transactions.set(transaction.id, transaction);

    try {
      // Generate payment request
      const paymentAddress = this.generateCryptoAddress(currency);
      const qrCode = await this.generateQRCode(paymentAddress, amount, currency);

      transaction.paymentAddress = paymentAddress;
      transaction.qrCode = qrCode;
      transaction.status = 'awaiting_payment';

      // Start monitoring blockchain
      this.monitorCryptoPayment(transaction);

      return {
        success: true,
        transactionId: transaction.id,
        paymentAddress,
        qrCode,
        amount,
        currency,
        message: 'Send crypto to the provided address'
      };
    } catch (error) {
      transaction.status = 'failed';
      transaction.error = error.message;
      
      return {
        success: false,
        transactionId: transaction.id,
        error: error.message
      };
    }
  }

  /**
   * Validate credit card using Luhn algorithm
   */
  validateCard(cardDetails) {
    const { number, expiryMonth, expiryYear, cvv } = cardDetails;

    // Validate card number using Luhn algorithm
    if (!this.luhnCheck(number)) return false;

    // Validate expiry
    const now = new Date();
    const expiry = new Date(parseInt(expiryYear), parseInt(expiryMonth) - 1);
    if (expiry < now) return false;

    // Validate CVV
    if (!/^\d{3,4}$/.test(cvv)) return false;

    return true;
  }

  /**
   * Luhn algorithm for card validation
   */
  luhnCheck(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Get card type from number
   */
  getCardType(cardNumber) {
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/,
      dinersclub: /^3(?:0[0-5]|[68])/,
      jcb: /^35/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber)) {
        return type;
      }
    }

    return 'unknown';
  }

  /**
   * Format phone number for M-Pesa
   */
  formatPhoneNumber(phone) {
    // Remove spaces and special characters
    let cleaned = phone.replace(/\D/g, '');

    // Convert to 254 format
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
      // Already in correct format
    } else {
      cleaned = '254' + cleaned;
    }

    return cleaned;
  }

  /**
   * Generate M-Pesa password
   */
  generateMPesaPassword() {
    const shortcode = '174379';
    const passkey = 'YOUR_PASSKEY_HERE';
    const timestamp = this.getMPesaTimestamp();
    const password = btoa(shortcode + passkey + timestamp);
    return password;
  }

  /**
   * Get M-Pesa timestamp
   */
  getMPesaTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Generate transaction ID
   */
  generateTransactionId() {
    return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  }

  /**
   * Generate crypto address (placeholder)
   */
  generateCryptoAddress(currency) {
    const prefixes = {
      BTC: '1',
      ETH: '0x',
      USDT: '0x'
    };
    
    const prefix = prefixes[currency] || '0x';
    const random = Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    return prefix + random;
  }

  /**
   * Generate QR code for crypto payment
   */
  async generateQRCode(address, amount, currency) {
    const qrData = `${currency.toLowerCase()}:${address}?amount=${amount}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
  }

  /**
   * Monitor crypto payment
   */
  monitorCryptoPayment(transaction) {
    // Simulate blockchain monitoring
    const interval = setInterval(async () => {
      try {
        // Check blockchain for payment
        const paid = await this.checkCryptoPayment(
          transaction.paymentAddress,
          transaction.amount,
          transaction.currency
        );

        if (paid) {
          transaction.status = 'completed';
          transaction.completedAt = Date.now();
          clearInterval(interval);
          
          // Emit event
          if (typeof CustomEvent !== 'undefined') {
            window.dispatchEvent(new CustomEvent('payment:completed', {
              detail: transaction
            }));
          }
        }
      } catch (error) {
        console.error('Crypto monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds

    // Stop monitoring after 1 hour
    setTimeout(() => clearInterval(interval), 3600000);
  }

  /**
   * Check crypto payment status
   */
  async checkCryptoPayment(address, amount, currency) {
    // Placeholder - would call blockchain API
    return Math.random() > 0.95; // Simulate 5% success rate per check
  }

  /**
   * Simulate M-Pesa API call
   */
  async callMPesaAPI(data) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate response
    return {
      MerchantRequestID: 'MPESA-' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      CheckoutRequestID: 'ws_CO_' + Date.now() + Math.random().toString(36).substring(2, 9),
      ResponseCode: '0',
      ResponseDescription: 'Success. Request accepted for processing',
      CustomerMessage: 'Success. Request accepted for processing'
    };
  }

  /**
   * Simulate M-Pesa query API
   */
  async callMPesaQueryAPI(data) {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      ResultCode: '0',
      ResultDesc: 'The service request is processed successfully.'
    };
  }

  /**
   * Simulate payment gateway call
   */
  async callPaymentGateway(data) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate success/failure
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      return {
        success: true,
        reference: 'PG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9).toUpperCase()
      };
    } else {
      return {
        success: false,
        error: 'Payment declined by issuing bank'
      };
    }
  }

  /**
   * Get transaction
   */
  getTransaction(transactionId) {
    return this.transactions.get(transactionId);
  }

  /**
   * Get all transactions
   */
  getAllTransactions() {
    return Array.from(this.transactions.values());
  }

  /**
   * Calculate transaction fee
   */
  calculateFee(amount, paymentMethod) {
    const feeRates = {
      mpesa: 0.01, // 1%
      card: 0.025, // 2.5%
      crypto: 0.005 // 0.5%
    };

    const rate = feeRates[paymentMethod] || 0.02;
    return amount * rate;
  }

  /**
   * Refund transaction
   */
  async refundTransaction(transactionId, amount = null) {
    const transaction = this.getTransaction(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'completed') {
      throw new Error('Only completed transactions can be refunded');
    }

    const refundAmount = amount || transaction.amount;

    if (refundAmount > transaction.amount) {
      throw new Error('Refund amount exceeds transaction amount');
    }

    const refund = {
      id: this.generateTransactionId(),
      type: 'refund',
      originalTransactionId: transactionId,
      amount: refundAmount,
      status: 'processing',
      timestamp: Date.now()
    };

    this.transactions.set(refund.id, refund);

    try {
      // Process refund based on payment method
      await this.processRefund(transaction, refundAmount);

      refund.status = 'completed';
      transaction.refunded = true;
      transaction.refundAmount = refundAmount;

      return {
        success: true,
        refundId: refund.id,
        message: 'Refund processed successfully'
      };
    } catch (error) {
      refund.status = 'failed';
      refund.error = error.message;

      return {
        success: false,
        refundId: refund.id,
        error: error.message
      };
    }
  }

  /**
   * Process refund
   */
  async processRefund(transaction, amount) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { success: true };
  }

  /**
   * Generate payment receipt
   */
  generateReceipt(transactionId) {
    const transaction = this.getTransaction(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return {
      receiptNumber: 'RCP-' + transaction.id,
      transactionId: transaction.id,
      date: new Date(transaction.timestamp).toISOString(),
      amount: transaction.amount,
      currency: transaction.currency || 'KES',
      paymentMethod: transaction.type,
      status: transaction.status,
      merchant: 'EnergiChain Ltd.',
      description: transaction.description
    };
  }
}

/**
 * Payment Subscription Manager
 */
class SubscriptionManager {
  constructor(paymentProcessor) {
    this.paymentProcessor = paymentProcessor;
    this.subscriptions = new Map();
  }

  /**
   * Create subscription
   */
  createSubscription(customerId, plan, paymentMethod) {
    const subscription = {
      id: 'SUB-' + Date.now(),
      customerId,
      plan,
      paymentMethod,
      status: 'active',
      createdAt: Date.now(),
      renewalDate: this.calculateRenewalDate(plan.billingPeriod),
      cancelledAt: null
    };

    this.subscriptions.set(subscription.id, subscription);
    this.scheduleRenewal(subscription);

    return subscription;
  }

  /**
   * Calculate renewal date
   */
  calculateRenewalDate(period) {
    const now = new Date();
    const periods = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      yearly: 365
    };

    const days = periods[period] || 30;
    return now.getTime() + (days * 24 * 60 * 60 * 1000);
  }

  /**
   * Schedule subscription renewal
   */
  scheduleRenewal(subscription) {
    const delay = subscription.renewalDate - Date.now();
    
    setTimeout(async () => {
      if (subscription.status === 'active') {
        await this.processRenewal(subscription);
      }
    }, delay);
  }

  /**
   * Process subscription renewal
   */
  async processRenewal(subscription) {
    try {
      const result = await this.paymentProcessor.processCardPayment(
        subscription.paymentMethod,
        subscription.plan.price,
        subscription.plan.currency
      );

      if (result.success) {
        subscription.renewalDate = this.calculateRenewalDate(subscription.plan.billingPeriod);
        subscription.lastPayment = result.transactionId;
        this.scheduleRenewal(subscription);
      } else {
        subscription.status = 'payment_failed';
        subscription.failureReason = result.error;
      }
    } catch (error) {
      subscription.status = 'payment_failed';
      subscription.failureReason = error.message;
    }
  }

  /**
   * Cancel subscription
   */
  cancelSubscription(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (subscription) {
      subscription.status = 'cancelled';
      subscription.cancelledAt = Date.now();
      return true;
    }
    
    return false;
  }

  /**
   * Get subscription
   */
  getSubscription(subscriptionId) {
    return this.subscriptions.get(subscriptionId);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PaymentProcessor,
    SubscriptionManager
  };
}
