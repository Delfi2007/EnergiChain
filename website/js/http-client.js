/**
 * HTTP Client and API Request Manager
 * Advanced HTTP client with interceptors, retry logic, caching
 */

class HTTPClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 30000;
    this.headers = options.headers || {};
    this.interceptors = {
      request: [],
      response: []
    };
    this.retryConfig = {
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 1000,
      retryCondition: options.retryCondition || this.defaultRetryCondition
    };
    this.cache = new Map();
    this.cacheEnabled = options.cache || false;
    this.cacheTTL = options.cacheTTL || 300000; // 5 minutes
  }

  /**
   * GET request
   */
  async get(url, config = {}) {
    return this.request({ ...config, method: 'GET', url });
  }

  /**
   * POST request
   */
  async post(url, data, config = {}) {
    return this.request({ ...config, method: 'POST', url, data });
  }

  /**
   * PUT request
   */
  async put(url, data, config = {}) {
    return this.request({ ...config, method: 'PUT', url, data });
  }

  /**
   * PATCH request
   */
  async patch(url, data, config = {}) {
    return this.request({ ...config, method: 'PATCH', url, data });
  }

  /**
   * DELETE request
   */
  async delete(url, config = {}) {
    return this.request({ ...config, method: 'DELETE', url });
  }

  /**
   * Core request method
   */
  async request(config) {
    // Apply request interceptors
    let processedConfig = config;
    for (const interceptor of this.interceptors.request) {
      processedConfig = await interceptor(processedConfig);
    }

    // Check cache
    if (this.cacheEnabled && config.method === 'GET') {
      const cached = this.getFromCache(config.url);
      if (cached) return cached;
    }

    // Merge config
    const finalConfig = this.mergeConfig(processedConfig);

    // Execute request with retry
    let lastError;
    for (let attempt = 0; attempt <= this.retryConfig.retries; attempt++) {
      try {
        const response = await this.executeRequest(finalConfig);
        
        // Apply response interceptors
        let processedResponse = response;
        for (const interceptor of this.interceptors.response) {
          processedResponse = await interceptor(processedResponse);
        }

        // Cache successful GET requests
        if (this.cacheEnabled && config.method === 'GET') {
          this.saveToCache(config.url, processedResponse);
        }

        return processedResponse;
      } catch (error) {
        lastError = error;
        
        // Check if should retry
        if (attempt < this.retryConfig.retries && this.retryConfig.retryCondition(error)) {
          await this.delay(this.retryConfig.retryDelay * Math.pow(2, attempt));
          continue;
        }
        
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Execute fetch request
   */
  async executeRequest(config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        signal: controller.signal,
        ...config.fetchOptions
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new HTTPError(response.status, response.statusText, response);
      }

      const data = await this.parseResponse(response, config.responseType);

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
        config
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new HTTPError(0, 'Request timeout', null);
      }
      
      throw error;
    }
  }

  /**
   * Parse response based on type
   */
  async parseResponse(response, responseType = 'json') {
    switch (responseType) {
      case 'json':
        return await response.json();
      case 'text':
        return await response.text();
      case 'blob':
        return await response.blob();
      case 'arraybuffer':
        return await response.arrayBuffer();
      default:
        return await response.json();
    }
  }

  /**
   * Parse headers
   */
  parseHeaders(headers) {
    const parsed = {};
    for (const [key, value] of headers.entries()) {
      parsed[key] = value;
    }
    return parsed;
  }

  /**
   * Merge configuration
   */
  mergeConfig(config) {
    const url = config.url.startsWith('http') 
      ? config.url 
      : `${this.baseURL}${config.url}`;

    const headers = {
      'Content-Type': 'application/json',
      ...this.headers,
      ...config.headers
    };

    let body = config.data;
    if (body && headers['Content-Type'] === 'application/json') {
      body = JSON.stringify(body);
    }

    return {
      ...config,
      url,
      headers,
      body,
      timeout: config.timeout || this.timeout
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Default retry condition
   */
  defaultRetryCondition(error) {
    return error instanceof HTTPError && 
           [408, 429, 500, 502, 503, 504].includes(error.status);
  }

  /**
   * Get from cache
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Save to cache
   */
  saveToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * HTTP Error
 */
class HTTPError extends Error {
  constructor(status, message, response) {
    super(message);
    this.name = 'HTTPError';
    this.status = status;
    this.response = response;
  }
}

/**
 * GraphQL Client
 */
class GraphQLClient {
  constructor(endpoint, options = {}) {
    this.endpoint = endpoint;
    this.headers = options.headers || {};
    this.httpClient = new HTTPClient({
      baseURL: endpoint,
      headers: this.headers
    });
  }

  /**
   * Execute query
   */
  async query(query, variables = {}) {
    return this.request(query, variables);
  }

  /**
   * Execute mutation
   */
  async mutate(mutation, variables = {}) {
    return this.request(mutation, variables);
  }

  /**
   * Execute request
   */
  async request(query, variables = {}) {
    const response = await this.httpClient.post('', {
      query,
      variables
    });

    if (response.data.errors) {
      throw new GraphQLError(response.data.errors);
    }

    return response.data.data;
  }

  /**
   * Set header
   */
  setHeader(key, value) {
    this.headers[key] = value;
    this.httpClient.headers[key] = value;
  }
}

/**
 * GraphQL Error
 */
class GraphQLError extends Error {
  constructor(errors) {
    super('GraphQL Error');
    this.name = 'GraphQLError';
    this.errors = errors;
  }
}

/**
 * REST API Client
 */
class RESTClient {
  constructor(baseURL, options = {}) {
    this.httpClient = new HTTPClient({
      baseURL,
      ...options
    });
    this.resources = new Map();
  }

  /**
   * Define resource
   */
  resource(name, config = {}) {
    const resource = {
      list: (params) => this.httpClient.get(`/${name}`, { params }),
      get: (id) => this.httpClient.get(`/${name}/${id}`),
      create: (data) => this.httpClient.post(`/${name}`, data),
      update: (id, data) => this.httpClient.put(`/${name}/${id}`, data),
      delete: (id) => this.httpClient.delete(`/${name}/${id}`),
      ...config.custom
    };

    this.resources.set(name, resource);
    return resource;
  }

  /**
   * Get resource
   */
  getResource(name) {
    return this.resources.get(name);
  }
}

/**
 * WebSocket Client
 */
class WSClient {
  constructor(url, options = {}) {
    this.url = url;
    this.protocols = options.protocols;
    this.reconnect = options.reconnect !== false;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.maxReconnectDelay = options.maxReconnectDelay || 30000;
    this.reconnectAttempts = 0;
    this.ws = null;
    this.listeners = new Map();
    this.messageQueue = [];
    this.connected = false;
  }

  /**
   * Connect to WebSocket
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, this.protocols);

        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this.flushQueue();
          this.emit('open');
          resolve();
        };

        this.ws.onclose = (event) => {
          this.connected = false;
          this.emit('close', event);
          
          if (this.reconnect) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit('message', data);
          } catch {
            this.emit('message', event.data);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send message
   */
  send(data) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);

    if (this.connected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  /**
   * Flush message queue
   */
  flushQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(message);
    }
  }

  /**
   * Schedule reconnect
   */
  scheduleReconnect() {
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.reconnectAttempts++;

    setTimeout(() => {
      this.connect().catch(() => {});
    }, delay);
  }

  /**
   * Close connection
   */
  close() {
    this.reconnect = false;
    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HTTPClient,
    HTTPError,
    GraphQLClient,
    GraphQLError,
    RESTClient,
    WSClient
  };
}
