/**
 * Event Bus System
 * Centralized event management for loose coupling between components
 */

class EventBus {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
    this.middlewares = [];
    this.history = [];
    this.maxHistory = 100;
    this.paused = false;
  }

  /**
   * Subscribe to event
   */
  on(event, callback, priority = 0) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listeners = this.events.get(event);
    listeners.push({ callback, priority });
    listeners.sort((a, b) => b.priority - a.priority);

    return () => this.off(event, callback);
  }

  /**
   * Subscribe once
   */
  once(event, callback, priority = 0) {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, []);
    }

    const listeners = this.onceEvents.get(event);
    listeners.push({ callback, priority });
    listeners.sort((a, b) => b.priority - a.priority);

    return () => {
      const index = listeners.findIndex(l => l.callback === callback);
      if (index !== -1) listeners.splice(index, 1);
    };
  }

  /**
   * Unsubscribe from event
   */
  off(event, callback) {
    if (this.events.has(event)) {
      const listeners = this.events.get(event);
      const index = listeners.findIndex(l => l.callback === callback);
      if (index !== -1) listeners.splice(index, 1);
    }

    if (this.onceEvents.has(event)) {
      const listeners = this.onceEvents.get(event);
      const index = listeners.findIndex(l => l.callback === callback);
      if (index !== -1) listeners.splice(index, 1);
    }
  }

  /**
   * Emit event
   */
  async emit(event, data = null) {
    if (this.paused) return;

    // Apply middlewares
    let processedData = data;
    for (const middleware of this.middlewares) {
      const result = await middleware(event, processedData);
      if (result === false) return; // Cancel event
      if (result !== undefined) processedData = result;
    }

    // Store in history
    this.addToHistory(event, processedData);

    // Emit to regular listeners
    if (this.events.has(event)) {
      const listeners = this.events.get(event);
      for (const listener of listeners) {
        try {
          await listener.callback(processedData);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      }
    }

    // Emit to once listeners
    if (this.onceEvents.has(event)) {
      const listeners = this.onceEvents.get(event);
      for (const listener of listeners) {
        try {
          await listener.callback(processedData);
        } catch (error) {
          console.error(`Error in once event listener for ${event}:`, error);
        }
      }
      this.onceEvents.delete(event);
    }
  }

  /**
   * Add middleware
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Remove middleware
   */
  removeMiddleware(middleware) {
    const index = this.middlewares.indexOf(middleware);
    if (index !== -1) this.middlewares.splice(index, 1);
  }

  /**
   * Add to history
   */
  addToHistory(event, data) {
    this.history.push({
      event,
      data,
      timestamp: Date.now()
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Get event history
   */
  getHistory(event = null) {
    if (event) {
      return this.history.filter(h => h.event === event);
    }
    return [...this.history];
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Pause event bus
   */
  pause() {
    this.paused = true;
  }

  /**
   * Resume event bus
   */
  resume() {
    this.paused = false;
  }

  /**
   * Remove all listeners
   */
  clear() {
    this.events.clear();
    this.onceEvents.clear();
  }

  /**
   * Get listener count
   */
  listenerCount(event) {
    const regular = this.events.has(event) ? this.events.get(event).length : 0;
    const once = this.onceEvents.has(event) ? this.onceEvents.get(event).length : 0;
    return regular + once;
  }

  /**
   * Get all events
   */
  eventNames() {
    return [...new Set([...this.events.keys(), ...this.onceEvents.keys()])];
  }
}

/**
 * State Management System
 */
class StateManager {
  constructor(initialState = {}) {
    this.state = initialState;
    this.subscribers = new Map();
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
    this.middlewares = [];
    this.computedValues = new Map();
  }

  /**
   * Get state
   */
  getState(path = null) {
    if (!path) return { ...this.state };

    const keys = path.split('.');
    let value = this.state;

    for (const key of keys) {
      if (value === null || value === undefined) return undefined;
      value = value[key];
    }

    return value;
  }

  /**
   * Set state
   */
  setState(path, value) {
    // Apply middlewares
    let processedValue = value;
    for (const middleware of this.middlewares) {
      const result = middleware(path, processedValue, this.state);
      if (result === false) return; // Cancel update
      if (result !== undefined) processedValue = result;
    }

    // Save current state to history
    this.saveToHistory();

    // Update state
    if (typeof path === 'object') {
      this.state = { ...this.state, ...path };
      this.notifySubscribers();
    } else {
      const keys = path.split('.');
      const lastKey = keys.pop();
      let target = this.state;

      for (const key of keys) {
        if (!target[key]) target[key] = {};
        target = target[key];
      }

      target[lastKey] = processedValue;
      this.notifySubscribers(path);
    }

    // Update computed values
    this.updateComputedValues();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(path, callback) {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, []);
    }

    this.subscribers.get(path).push(callback);

    return () => this.unsubscribe(path, callback);
  }

  /**
   * Unsubscribe
   */
  unsubscribe(path, callback) {
    if (this.subscribers.has(path)) {
      const callbacks = this.subscribers.get(path);
      const index = callbacks.indexOf(callback);
      if (index !== -1) callbacks.splice(index, 1);
    }
  }

  /**
   * Notify subscribers
   */
  notifySubscribers(changedPath = null) {
    if (changedPath) {
      // Notify specific path subscribers
      if (this.subscribers.has(changedPath)) {
        const value = this.getState(changedPath);
        this.subscribers.get(changedPath).forEach(callback => {
          callback(value, this.state);
        });
      }
    }

    // Notify global subscribers
    if (this.subscribers.has('*')) {
      this.subscribers.get('*').forEach(callback => {
        callback(this.state);
      });
    }
  }

  /**
   * Add middleware
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Save to history
   */
  saveToHistory() {
    // Remove future history if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(JSON.parse(JSON.stringify(this.state)));
    this.historyIndex++;

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * Undo
   */
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.state = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.notifySubscribers();
      this.updateComputedValues();
      return true;
    }
    return false;
  }

  /**
   * Redo
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.state = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.notifySubscribers();
      this.updateComputedValues();
      return true;
    }
    return false;
  }

  /**
   * Can undo
   */
  canUndo() {
    return this.historyIndex > 0;
  }

  /**
   * Can redo
   */
  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Reset state
   */
  reset(newState = {}) {
    this.state = newState;
    this.history = [];
    this.historyIndex = -1;
    this.notifySubscribers();
    this.updateComputedValues();
  }

  /**
   * Define computed value
   */
  computed(name, getter) {
    this.computedValues.set(name, getter);
  }

  /**
   * Get computed value
   */
  getComputed(name) {
    if (this.computedValues.has(name)) {
      return this.computedValues.get(name)(this.state);
    }
    return undefined;
  }

  /**
   * Update all computed values
   */
  updateComputedValues() {
    for (const [name, getter] of this.computedValues) {
      try {
        const value = getter(this.state);
        this.notifySubscribers(`computed:${name}`);
      } catch (error) {
        console.error(`Error computing ${name}:`, error);
      }
    }
  }

  /**
   * Batch updates
   */
  batch(updates) {
    const oldState = JSON.parse(JSON.stringify(this.state));

    for (const [path, value] of Object.entries(updates)) {
      const keys = path.split('.');
      const lastKey = keys.pop();
      let target = this.state;

      for (const key of keys) {
        if (!target[key]) target[key] = {};
        target = target[key];
      }

      target[lastKey] = value;
    }

    this.saveToHistory();
    this.notifySubscribers();
    this.updateComputedValues();
  }

  /**
   * Watch for changes
   */
  watch(path, callback, immediate = false) {
    const unsubscribe = this.subscribe(path, callback);

    if (immediate) {
      callback(this.getState(path), this.state);
    }

    return unsubscribe;
  }
}

/**
 * Action Queue System
 */
class ActionQueue {
  constructor(options = {}) {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = options.maxConcurrent || 1;
    this.activeCount = 0;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.onSuccess = options.onSuccess || null;
    this.onError = options.onError || null;
    this.onComplete = options.onComplete || null;
  }

  /**
   * Add action to queue
   */
  add(action, priority = 0) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        action,
        priority,
        resolve,
        reject,
        attempts: 0
      });

      this.queue.sort((a, b) => b.priority - a.priority);

      if (!this.processing) {
        this.process();
      }
    });
  }

  /**
   * Process queue
   */
  async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const item = this.queue.shift();
      this.activeCount++;

      this.executeAction(item);
    }

    this.processing = false;
  }

  /**
   * Execute action
   */
  async executeAction(item) {
    try {
      const result = await item.action();
      
      if (this.onSuccess) {
        this.onSuccess(result);
      }
      
      item.resolve(result);
    } catch (error) {
      item.attempts++;

      if (item.attempts < this.retryAttempts) {
        // Retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        this.queue.unshift(item);
      } else {
        if (this.onError) {
          this.onError(error);
        }
        item.reject(error);
      }
    } finally {
      this.activeCount--;

      if (this.queue.length === 0 && this.activeCount === 0) {
        if (this.onComplete) {
          this.onComplete();
        }
      } else {
        this.process();
      }
    }
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue = [];
  }

  /**
   * Get queue size
   */
  size() {
    return this.queue.length;
  }

  /**
   * Pause processing
   */
  pause() {
    this.processing = false;
  }

  /**
   * Resume processing
   */
  resume() {
    this.process();
  }
}

/**
 * Observer Pattern Implementation
 */
class Observable {
  constructor() {
    this.observers = [];
  }

  /**
   * Add observer
   */
  subscribe(observer) {
    this.observers.push(observer);
    return () => this.unsubscribe(observer);
  }

  /**
   * Remove observer
   */
  unsubscribe(observer) {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Notify all observers
   */
  notify(data) {
    this.observers.forEach(observer => {
      if (typeof observer === 'function') {
        observer(data);
      } else if (observer.update) {
        observer.update(data);
      }
    });
  }

  /**
   * Clear all observers
   */
  clear() {
    this.observers = [];
  }

  /**
   * Get observer count
   */
  count() {
    return this.observers.length;
  }
}

/**
 * Pub/Sub Pattern Implementation
 */
class PubSub {
  constructor() {
    this.topics = new Map();
  }

  /**
   * Publish message
   */
  publish(topic, data) {
    if (!this.topics.has(topic)) return;

    const subscribers = this.topics.get(topic);
    subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in subscriber for ${topic}:`, error);
      }
    });
  }

  /**
   * Subscribe to topic
   */
  subscribe(topic, callback) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, []);
    }

    this.topics.get(topic).push(callback);

    return () => this.unsubscribe(topic, callback);
  }

  /**
   * Unsubscribe from topic
   */
  unsubscribe(topic, callback) {
    if (!this.topics.has(topic)) return;

    const subscribers = this.topics.get(topic);
    const index = subscribers.indexOf(callback);
    
    if (index !== -1) {
      subscribers.splice(index, 1);
    }

    if (subscribers.length === 0) {
      this.topics.delete(topic);
    }
  }

  /**
   * Clear topic
   */
  clearTopic(topic) {
    this.topics.delete(topic);
  }

  /**
   * Clear all topics
   */
  clearAll() {
    this.topics.clear();
  }

  /**
   * Get subscriber count
   */
  subscriberCount(topic) {
    return this.topics.has(topic) ? this.topics.get(topic).length : 0;
  }

  /**
   * Get all topics
   */
  getTopics() {
    return Array.from(this.topics.keys());
  }
}

// Create global instances
const eventBus = new EventBus();
const stateManager = new StateManager();
const pubSub = new PubSub();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EventBus,
    StateManager,
    ActionQueue,
    Observable,
    PubSub,
    eventBus,
    stateManager,
    pubSub
  };
}
