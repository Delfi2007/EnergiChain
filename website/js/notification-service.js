/**
 * Comprehensive Notification Service
 * Browser notifications, toast messages, email templates, SMS integration
 */

class NotificationService {
  constructor() {
    this.notifications = [];
    this.subscribers = new Map();
    this.notificationQueue = [];
    this.isProcessing = false;
    this.permission = 'default';

    this.checkPermission();
  }

  /**
   * Check notification permission
   */
  async checkPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    this.permission = Notification.permission;
    return this.permission === 'granted';
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  /**
   * Show browser notification
   */
  async showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('Notification permission denied');
        return null;
      }
    }

    const notification = new Notification(title, {
      body: options.body || '',
      icon: options.icon || '/images/logo.png',
      badge: options.badge || '/images/badge.png',
      tag: options.tag || 'default',
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      data: options.data || {},
      ...options
    });

    // Store notification
    this.notifications.push({
      id: Date.now().toString(),
      title,
      options,
      timestamp: new Date(),
      read: false
    });

    // Event listeners
    notification.onclick = (e) => {
      if (options.onClick) options.onClick(e);
      this.markAsRead(notification.tag);
    };

    notification.onclose = (e) => {
      if (options.onClose) options.onClose(e);
    };

    notification.onerror = (e) => {
      console.error('Notification error:', e);
      if (options.onError) options.onError(e);
    };

    return notification;
  }

  /**
   * Show toast notification (in-app)
   */
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${this.getToastIcon(type)}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Add styles if not already present
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          min-width: 300px;
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          animation: slideIn 0.3s ease-out;
        }
        .toast-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .toast-info { border-left: 4px solid #3498db; }
        .toast-success { border-left: 4px solid #2ecc71; }
        .toast-warning { border-left: 4px solid #f39c12; }
        .toast-error { border-left: 4px solid #e74c3c; }
        .toast-close {
          margin-left: auto;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #999;
        }
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  }

  /**
   * Get toast icon
   */
  getToastIcon(type) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || icons.info;
  }

  /**
   * Subscribe to notifications
   */
  subscribe(channel, callback) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, []);
    }
    this.subscribers.get(channel).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(channel);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Publish notification to subscribers
   */
  publish(channel, data) {
    if (!this.subscribers.has(channel)) return;

    const callbacks = this.subscribers.get(channel);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in notification subscriber:', error);
      }
    });
  }

  /**
   * Queue notification for batch processing
   */
  queueNotification(notification) {
    this.notificationQueue.push({
      ...notification,
      queuedAt: Date.now()
    });

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process notification queue
   */
  async processQueue() {
    if (this.notificationQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const notification = this.notificationQueue.shift();

    try {
      await this.sendNotification(notification);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    // Process next after delay
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Send notification based on type
   */
  async sendNotification(notification) {
    const { type, ...data } = notification;

    switch (type) {
      case 'browser':
        return await this.showNotification(data.title, data.options);
      case 'toast':
        return this.showToast(data.message, data.level, data.duration);
      case 'email':
        return await this.sendEmail(data);
      case 'sms':
        return await this.sendSMS(data);
      default:
        console.warn('Unknown notification type:', type);
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.publish('notification-read', notification);
    }
  }

  /**
   * Get unread count
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications = [];
    this.publish('notifications-cleared', {});
  }

  /**
   * Send email notification (mock implementation)
   */
  async sendEmail(data) {
    const { to, subject, body, template } = data;

    // In real implementation, this would call an API
    console.log('Sending email:', { to, subject, body, template });

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          messageId: Date.now().toString(),
          to,
          subject
        });
      }, 1000);
    });
  }

  /**
   * Send SMS notification (mock implementation)
   */
  async sendSMS(data) {
    const { to, message } = data;

    // In real implementation, this would call SMS API (Twilio, etc.)
    console.log('Sending SMS:', { to, message });

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          messageId: Date.now().toString(),
          to,
          message
        });
      }, 1000);
    });
  }
}

/**
 * Email Template Builder
 */
class EmailTemplateBuilder {
  constructor() {
    this.templates = new Map();
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default templates
   */
  initializeDefaultTemplates() {
    // Order confirmation template
    this.addTemplate('order-confirmation', {
      subject: 'Order Confirmation - #{orderId}',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Order Confirmation</h2>
          <p>Thank you for your order!</p>
          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0;">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> #{orderId}</p>
            <p><strong>Date:</strong> #{orderDate}</p>
            <p><strong>Total:</strong> #{total}</p>
          </div>
          <p>Your order will be processed shortly.</p>
        </div>
      `
    });

    // Delivery notification template
    this.addTemplate('delivery-notification', {
      subject: 'Your order is on the way!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #27ae60;">Delivery Update</h2>
          <p>Your order #{orderId} is out for delivery!</p>
          <div style="background: #e8f5e9; padding: 20px; margin: 20px 0;">
            <p><strong>Estimated Delivery:</strong> #{estimatedDelivery}</p>
            <p><strong>Tracking Number:</strong> #{trackingNumber}</p>
          </div>
          <p>Track your order in real-time on our website.</p>
        </div>
      `
    });

    // Payment received template
    this.addTemplate('payment-received', {
      subject: 'Payment Received - Thank You!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3498db;">Payment Confirmation</h2>
          <p>We have received your payment.</p>
          <div style="background: #e3f2fd; padding: 20px; margin: 20px 0;">
            <p><strong>Amount:</strong> #{amount}</p>
            <p><strong>Payment Method:</strong> #{paymentMethod}</p>
            <p><strong>Transaction ID:</strong> #{transactionId}</p>
          </div>
          <p>Thank you for your business!</p>
        </div>
      `
    });

    // Account verification template
    this.addTemplate('account-verification', {
      subject: 'Verify Your Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #9b59b6;">Verify Your Account</h2>
          <p>Welcome to EnergiChain! Please verify your email address.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="#{verificationLink}" style="background: #9b59b6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p>Or use this code: <strong>#{verificationCode}</strong></p>
          <p style="color: #7f8c8d; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
      `
    });

    // Password reset template
    this.addTemplate('password-reset', {
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">Password Reset Request</h2>
          <p>We received a request to reset your password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="#{resetLink}" style="background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If you didn't request this, please ignore this email.</p>
          <p style="color: #7f8c8d; font-size: 12px;">This link expires in 1 hour.</p>
        </div>
      `
    });

    // Weekly summary template
    this.addTemplate('weekly-summary', {
      subject: 'Your Weekly Summary',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Weekly Summary</h2>
          <p>Here's what happened this week:</p>
          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0;">
            <h3>Statistics</h3>
            <p>📦 Orders: #{orderCount}</p>
            <p>💰 Revenue: #{revenue}</p>
            <p>⚡ Energy Traded: #{energyTraded} kWh</p>
            <p>🌱 Carbon Offset: #{carbonOffset} kg CO2</p>
          </div>
          <p>Keep up the great work!</p>
        </div>
      `
    });
  }

  /**
   * Add custom template
   */
  addTemplate(name, template) {
    this.templates.set(name, template);
  }

  /**
   * Get template
   */
  getTemplate(name) {
    return this.templates.get(name);
  }

  /**
   * Render template with data
   */
  render(templateName, data) {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    let { subject, html } = template;

    // Replace placeholders
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`#{${key}}`, 'g');
      subject = subject.replace(placeholder, value);
      html = html.replace(placeholder, value);
    }

    return { subject, html };
  }

  /**
   * List all templates
   */
  listTemplates() {
    return Array.from(this.templates.keys());
  }
}

/**
 * Push Notification Manager (for mobile apps)
 */
class PushNotificationManager {
  constructor() {
    this.subscription = null;
    this.publicKey = null;
  }

  /**
   * Initialize push notifications
   */
  async initialize(publicKey) {
    this.publicKey = publicKey;

    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }

    if (!('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered:', registration);

    return registration;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe() {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.publicKey)
    });

    this.subscription = subscription;
    console.log('Push subscription:', subscription);

    return subscription;
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    if (!this.subscription) {
      return false;
    }

    const result = await this.subscription.unsubscribe();
    this.subscription = null;
    return result;
  }

  /**
   * Get current subscription
   */
  async getSubscription() {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  }

  /**
   * Convert base64 to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Send push notification (server-side would actually send)
   */
  async sendPush(data) {
    // This would be implemented on the server side
    console.log('Sending push notification:', data);
    
    return {
      success: true,
      messageId: Date.now().toString(),
      data
    };
  }
}

/**
 * In-App Notification Center
 */
class NotificationCenter {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 100;
    this.unreadCount = 0;
  }

  /**
   * Add notification
   */
  add(notification) {
    const newNotification = {
      id: Date.now().toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      timestamp: new Date(),
      read: false,
      data: notification.data || {}
    };

    this.notifications.unshift(newNotification);
    this.unreadCount++;

    // Limit notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    return newNotification;
  }

  /**
   * Get all notifications
   */
  getAll() {
    return this.notifications;
  }

  /**
   * Get unread notifications
   */
  getUnread() {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Mark as read
   */
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.unreadCount--;
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
  }

  /**
   * Delete notification
   */
  delete(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      const notification = this.notifications[index];
      if (!notification.read) {
        this.unreadCount--;
      }
      this.notifications.splice(index, 1);
    }
  }

  /**
   * Clear all
   */
  clearAll() {
    this.notifications = [];
    this.unreadCount = 0;
  }

  /**
   * Get unread count
   */
  getUnreadCount() {
    return this.unreadCount;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NotificationService,
    EmailTemplateBuilder,
    PushNotificationManager,
    NotificationCenter
  };
}
