/**
 * Performance Monitoring and Optimization Utilities
 * Track performance metrics, optimize rendering, and monitor resource usage
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.marks = new Map();
  }

  /**
   * Start timing measurement
   */
  startMeasure(name) {
    performance.mark(`${name}-start`);
    this.marks.set(name, performance.now());
  }

  /**
   * End timing measurement
   */
  endMeasure(name) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const duration = performance.now() - this.marks.get(name);
    this.recordMetric(name, duration);
    
    return duration;
  }

  /**
   * Record metric
   */
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name).push({
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;
    
    const nums = values.map(v => v.value);
    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = sum / nums.length;
    const sorted = [...nums].sort((a, b) => a - b);
    
    return {
      count: nums.length,
      min: Math.min(...nums),
      max: Math.max(...nums),
      avg: avg,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const result = {};
    for (const [name, _] of this.metrics) {
      result[name] = this.getMetricStats(name);
    }
    return result;
  }

  /**
   * Monitor page load performance
   */
  getPageLoadMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return null;

    return {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      domParsing: navigation.domInteractive - navigation.responseEnd,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      load: navigation.loadEventEnd - navigation.loadEventStart,
      total: navigation.loadEventEnd - navigation.fetchStart
    };
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals() {
    return new Promise((resolve) => {
      const vitals = {
        LCP: null, // Largest Contentful Paint
        FID: null, // First Input Delay
        CLS: null  // Cumulative Layout Shift
      };

      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          vitals.FID = entry.processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });

      // CLS
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            vitals.CLS = clsValue;
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });

      // Return vitals after a delay
      setTimeout(() => resolve(vitals), 5000);
    });
  }

  /**
   * Monitor resource timing
   */
  getResourceMetrics() {
    const resources = performance.getEntriesByType('resource');
    const metrics = {
      scripts: [],
      styles: [],
      images: [],
      fonts: [],
      xhr: [],
      other: []
    };

    resources.forEach(resource => {
      const data = {
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
        cached: resource.transferSize === 0 && resource.decodedBodySize > 0
      };

      if (resource.initiatorType === 'script') {
        metrics.scripts.push(data);
      } else if (resource.initiatorType === 'css' || resource.initiatorType === 'link') {
        metrics.styles.push(data);
      } else if (resource.initiatorType === 'img') {
        metrics.images.push(data);
      } else if (resource.initiatorType === 'font') {
        metrics.fonts.push(data);
      } else if (resource.initiatorType === 'xmlhttprequest' || resource.initiatorType === 'fetch') {
        metrics.xhr.push(data);
      } else {
        metrics.other.push(data);
      }
    });

    return metrics;
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2)
      };
    }
    return null;
  }

  /**
   * Clear performance data
   */
  clearMetrics() {
    this.metrics.clear();
    this.marks.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

/**
 * Render Optimization Manager
 */
class RenderOptimizer {
  /**
   * Request animation frame with fallback
   */
  static requestAnimFrame(callback) {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           function(callback) { window.setTimeout(callback, 1000 / 60); };
  }

  /**
   * Debounce function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Lazy load images
   */
  static lazyLoadImages(selector = 'img[data-src]') {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      document.querySelectorAll(selector).forEach(img => {
        imageObserver.observe(img);
      });

      return imageObserver;
    } else {
      // Fallback for browsers without IntersectionObserver
      document.querySelectorAll(selector).forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }

  /**
   * Virtual scroll implementation
   */
  static createVirtualScroll(container, items, rowHeight, visibleRows) {
    const totalHeight = items.length * rowHeight;
    const viewport = document.createElement('div');
    viewport.style.height = `${totalHeight}px`;
    viewport.style.position = 'relative';

    const content = document.createElement('div');
    content.style.position = 'absolute';
    content.style.top = '0';
    content.style.left = '0';
    content.style.right = '0';

    viewport.appendChild(content);
    container.appendChild(viewport);

    const render = () => {
      const scrollTop = container.scrollTop;
      const startIndex = Math.floor(scrollTop / rowHeight);
      const endIndex = Math.min(startIndex + visibleRows + 1, items.length);

      content.style.transform = `translateY(${startIndex * rowHeight}px)`;
      content.innerHTML = '';

      for (let i = startIndex; i < endIndex; i++) {
        const row = document.createElement('div');
        row.style.height = `${rowHeight}px`;
        row.textContent = items[i];
        content.appendChild(row);
      }
    };

    container.addEventListener('scroll', this.throttle(render, 16));
    render();

    return { viewport, render };
  }

  /**
   * Batch DOM updates
   */
  static batchDOMUpdates(updates) {
    requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  }

  /**
   * Optimize long task
   */
  static async optimizeLongTask(task, chunkSize = 50) {
    const chunks = [];
    for (let i = 0; i < task.length; i += chunkSize) {
      chunks.push(task.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          chunk.forEach(fn => fn());
          resolve();
        });
      });
    }
  }

  /**
   * Prefetch resources
   */
  static prefetchResource(url, as = 'fetch') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = as;
    link.href = url;
    document.head.appendChild(link);
  }

  /**
   * Preload critical resources
   */
  static preloadResource(url, as) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = as;
    link.href = url;
    document.head.appendChild(link);
  }

  /**
   * Defer script loading
   */
  static loadScriptDeferred(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  /**
   * Load script asynchronously
   */
  static loadScriptAsync(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
}

/**
 * Resource Loader with Caching
 */
class ResourceCache {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
  }

  /**
   * Load and cache resource
   */
  async load(url, options = {}) {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    // Check if already loading
    if (this.pending.has(url)) {
      return this.pending.get(url);
    }

    // Load resource
    const promise = fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(data => {
        this.cache.set(url, data);
        this.pending.delete(url);
        return data;
      })
      .catch(error => {
        this.pending.delete(url);
        throw error;
      });

    this.pending.set(url, promise);
    return promise;
  }

  /**
   * Clear cache
   */
  clear(url = null) {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache size
   */
  getSize() {
    let size = 0;
    for (const value of this.cache.values()) {
      size += value.length;
    }
    return size;
  }

  /**
   * Preload resources
   */
  async preload(urls) {
    return Promise.all(urls.map(url => this.load(url)));
  }
}

/**
 * Network Monitor
 */
class NetworkMonitor {
  constructor() {
    this.requests = [];
    this.setupObserver();
  }

  /**
   * Setup performance observer
   */
  setupObserver() {
    if (typeof PerformanceObserver === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.requests.push({
            url: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
            type: entry.initiatorType,
            protocol: entry.nextHopProtocol,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
            timestamp: entry.startTime
          });
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Get network statistics
   */
  getStats() {
    const total = this.requests.length;
    const cached = this.requests.filter(r => r.cached).length;
    const totalSize = this.requests.reduce((sum, r) => sum + r.size, 0);
    const totalDuration = this.requests.reduce((sum, r) => sum + r.duration, 0);

    return {
      total,
      cached,
      cacheHitRate: (cached / total * 100).toFixed(2) + '%',
      totalSize: (totalSize / 1024).toFixed(2) + ' KB',
      avgDuration: (totalDuration / total).toFixed(2) + ' ms',
      byType: this.getByType()
    };
  }

  /**
   * Get requests by type
   */
  getByType() {
    const types = {};
    this.requests.forEach(request => {
      if (!types[request.type]) {
        types[request.type] = {
          count: 0,
          size: 0,
          duration: 0
        };
      }
      types[request.type].count++;
      types[request.type].size += request.size;
      types[request.type].duration += request.duration;
    });
    return types;
  }

  /**
   * Get slow requests
   */
  getSlowRequests(threshold = 1000) {
    return this.requests.filter(r => r.duration > threshold);
  }

  /**
   * Clear history
   */
  clear() {
    this.requests = [];
  }
}

/**
 * FPS Counter
 */
class FPSCounter {
  constructor() {
    this.fps = 0;
    this.frames = 0;
    this.lastTime = performance.now();
    this.measuring = false;
  }

  /**
   * Start measuring FPS
   */
  start() {
    this.measuring = true;
    this.measure();
  }

  /**
   * Stop measuring
   */
  stop() {
    this.measuring = false;
  }

  /**
   * Measure FPS
   */
  measure() {
    if (!this.measuring) return;

    const currentTime = performance.now();
    this.frames++;

    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
      this.frames = 0;
      this.lastTime = currentTime;
    }

    requestAnimationFrame(() => this.measure());
  }

  /**
   * Get current FPS
   */
  getFPS() {
    return this.fps;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PerformanceMonitor,
    RenderOptimizer,
    ResourceCache,
    NetworkMonitor,
    FPSCounter
  };
}
