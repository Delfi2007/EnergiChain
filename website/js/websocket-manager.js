/**
 * WebSocket Real-Time Communication Utilities
 * Handle real-time updates, notifications, and live data streaming
 */

class WebSocketManager {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnecting = false;
    this.heartbeatInterval = null;
    this.messageQueue = [];
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.emit('connected');
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnecting = false;
          this.stopHeartbeat();
          this.emit('disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.stopHeartbeat();
    }
  }

  /**
   * Send message to server
   */
  send(type, data) {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      this.messageQueue.push(message);
      if (!this.isConnecting) {
        this.connect();
      }
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      this.emit(message.type, message.data);
      this.emit('message', message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Subscribe to message type
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Unsubscribe from message type
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(err => {
        console.error('Reconnection failed:', err);
      });
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Flush queued messages
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(message);
      }
    }
  }

  /**
   * Get connection state
   */
  getState() {
    if (!this.socket) return 'CLOSED';
    
    const states = {
      [WebSocket.CONNECTING]: 'CONNECTING',
      [WebSocket.OPEN]: 'OPEN',
      [WebSocket.CLOSING]: 'CLOSING',
      [WebSocket.CLOSED]: 'CLOSED'
    };
    
    return states[this.socket.readyState] || 'UNKNOWN';
  }
}

/**
 * Real-Time Notification Manager
 */
class RealtimeNotificationManager {
  constructor(wsManager) {
    this.wsManager = wsManager;
    this.notifications = [];
    this.maxNotifications = 50;
    this.setupListeners();
  }

  /**
   * Setup WebSocket listeners
   */
  setupListeners() {
    this.wsManager.on('notification', (data) => {
      this.handleNotification(data);
    });

    this.wsManager.on('order_update', (data) => {
      this.showNotification({
        title: 'Order Update',
        message: `Order #${data.orderId} status: ${data.status}`,
        type: 'info',
        data: data
      });
    });

    this.wsManager.on('delivery_update', (data) => {
      this.showNotification({
        title: 'Delivery Update',
        message: `Your delivery is ${data.status}. ETA: ${data.eta}`,
        type: 'success',
        data: data
      });
    });

    this.wsManager.on('price_alert', (data) => {
      this.showNotification({
        title: 'Price Alert',
        message: `LPG price updated: KSh ${data.price}`,
        type: 'warning',
        data: data
      });
    });
  }

  /**
   * Handle incoming notification
   */
  handleNotification(notification) {
    this.notifications.unshift({
      ...notification,
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      read: false
    });

    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    this.showNotification(notification);
    this.updateBadge();
  }

  /**
   * Show notification
   */
  showNotification(notification) {
    // Browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/logo.png',
        badge: '/assets/badge.png',
        tag: notification.id
      });
    }

    // In-app notification
    this.showInAppNotification(notification);

    // Emit event
    if (typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('energichain:notification', {
        detail: notification
      }));
    }
  }

  /**
   * Show in-app notification
   */
  showInAppNotification(notification) {
    const container = document.getElementById('notification-container') || this.createNotificationContainer();
    
    const notifElement = document.createElement('div');
    notifElement.className = `notification notification-${notification.type || 'info'}`;
    notifElement.innerHTML = `
      <div class="notification-icon">${this.getIcon(notification.type)}</div>
      <div class="notification-content">
        <div class="notification-title">${notification.title}</div>
        <div class="notification-message">${notification.message}</div>
      </div>
      <button class="notification-close">&times;</button>
    `;

    const closeBtn = notifElement.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notifElement.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notifElement.remove(), 300);
    });

    container.appendChild(notifElement);

    setTimeout(() => {
      notifElement.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notifElement.remove(), 300);
    }, 5000);
  }

  /**
   * Create notification container
   */
  createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    `;
    document.body.appendChild(container);
    return container;
  }

  /**
   * Get icon for notification type
   */
  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  /**
   * Request notification permission
   */
  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }

  /**
   * Get unread count
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Mark as read
   */
  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.updateBadge();
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.updateBadge();
  }

  /**
   * Update notification badge
   */
  updateBadge() {
    const count = this.getUnreadCount();
    const badge = document.getElementById('notification-badge');
    
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'block' : 'none';
    }

    // Update title
    if (count > 0) {
      document.title = `(${count}) EnergiChain`;
    } else {
      document.title = 'EnergiChain';
    }
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications = [];
    this.updateBadge();
  }
}

/**
 * Live Data Stream Manager
 */
class LiveDataStreamManager {
  constructor(wsManager) {
    this.wsManager = wsManager;
    this.streams = new Map();
    this.setupListeners();
  }

  /**
   * Setup WebSocket listeners
   */
  setupListeners() {
    this.wsManager.on('stream_data', (data) => {
      this.handleStreamData(data);
    });
  }

  /**
   * Subscribe to data stream
   */
  subscribe(streamName, callback) {
    if (!this.streams.has(streamName)) {
      this.streams.set(streamName, []);
      this.wsManager.send('subscribe', { stream: streamName });
    }

    this.streams.get(streamName).push(callback);
  }

  /**
   * Unsubscribe from data stream
   */
  unsubscribe(streamName, callback) {
    if (!this.streams.has(streamName)) return;

    const callbacks = this.streams.get(streamName);
    const index = callbacks.indexOf(callback);
    
    if (index > -1) {
      callbacks.splice(index, 1);
    }

    if (callbacks.length === 0) {
      this.streams.delete(streamName);
      this.wsManager.send('unsubscribe', { stream: streamName });
    }
  }

  /**
   * Handle stream data
   */
  handleStreamData(data) {
    const { stream, payload } = data;
    
    if (this.streams.has(stream)) {
      const callbacks = this.streams.get(stream);
      callbacks.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Stream callback error:', error);
        }
      });
    }
  }

  /**
   * Get active streams
   */
  getActiveStreams() {
    return Array.from(this.streams.keys());
  }
}

/**
 * Chat Manager for Real-Time Messaging
 */
class ChatManager {
  constructor(wsManager) {
    this.wsManager = wsManager;
    this.messages = [];
    this.rooms = new Map();
    this.currentRoom = null;
    this.setupListeners();
  }

  /**
   * Setup WebSocket listeners
   */
  setupListeners() {
    this.wsManager.on('chat_message', (data) => {
      this.handleMessage(data);
    });

    this.wsManager.on('user_joined', (data) => {
      this.handleUserJoined(data);
    });

    this.wsManager.on('user_left', (data) => {
      this.handleUserLeft(data);
    });

    this.wsManager.on('typing', (data) => {
      this.handleTyping(data);
    });
  }

  /**
   * Join chat room
   */
  joinRoom(roomId, userId, userName) {
    this.currentRoom = roomId;
    this.wsManager.send('join_room', {
      roomId,
      userId,
      userName
    });
  }

  /**
   * Leave chat room
   */
  leaveRoom(roomId) {
    this.wsManager.send('leave_room', { roomId });
    if (this.currentRoom === roomId) {
      this.currentRoom = null;
    }
  }

  /**
   * Send message
   */
  sendMessage(text, userId, userName) {
    if (!this.currentRoom) return;

    const message = {
      roomId: this.currentRoom,
      userId,
      userName,
      text,
      timestamp: Date.now()
    };

    this.wsManager.send('chat_message', message);
    return message;
  }

  /**
   * Handle incoming message
   */
  handleMessage(message) {
    this.messages.push(message);
    
    if (typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('energichain:chat_message', {
        detail: message
      }));
    }
  }

  /**
   * Handle user joined
   */
  handleUserJoined(data) {
    if (typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('energichain:user_joined', {
        detail: data
      }));
    }
  }

  /**
   * Handle user left
   */
  handleUserLeft(data) {
    if (typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('energichain:user_left', {
        detail: data
      }));
    }
  }

  /**
   * Send typing indicator
   */
  sendTyping(userId) {
    if (!this.currentRoom) return;

    this.wsManager.send('typing', {
      roomId: this.currentRoom,
      userId
    });
  }

  /**
   * Handle typing indicator
   */
  handleTyping(data) {
    if (typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('energichain:typing', {
        detail: data
      }));
    }
  }

  /**
   * Get room messages
   */
  getRoomMessages(roomId) {
    return this.messages.filter(m => m.roomId === roomId);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WebSocketManager,
    RealtimeNotificationManager,
    LiveDataStreamManager,
    ChatManager
  };
}
