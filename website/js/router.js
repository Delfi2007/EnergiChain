/**
 * Router System
 * Client-side routing with history management and navigation guards
 */

class Router {
  constructor(options = {}) {
    this.routes = [];
    this.currentRoute = null;
    this.mode = options.mode || 'hash'; // 'hash' or 'history'
    this.base = options.base || '';
    this.beforeHooks = [];
    this.afterHooks = [];
    this.errorHandlers = [];
    this.scrollBehavior = options.scrollBehavior || this.defaultScrollBehavior;
    this.linkActiveClass = options.linkActiveClass || 'router-link-active';
    this.linkExactActiveClass = options.linkExactActiveClass || 'router-link-exact-active';
  }

  /**
   * Add route
   */
  addRoute(route) {
    const compiled = {
      ...route,
      regex: this.pathToRegex(route.path),
      params: this.extractParams(route.path)
    };
    this.routes.push(compiled);
    return this;
  }

  /**
   * Add multiple routes
   */
  addRoutes(routes) {
    routes.forEach(route => this.addRoute(route));
    return this;
  }

  /**
   * Initialize router
   */
  init() {
    // Set up event listeners
    if (this.mode === 'history') {
      window.addEventListener('popstate', () => this.handlePopState());
      document.addEventListener('click', (e) => this.handleLinkClick(e));
    } else {
      window.addEventListener('hashchange', () => this.handleHashChange());
    }

    // Load initial route
    this.loadCurrentRoute();

    return this;
  }

  /**
   * Navigate to path
   */
  async push(path, state = {}) {
    const fullPath = this.resolvePath(path);
    
    if (this.currentRoute && this.currentRoute.fullPath === fullPath) {
      return;
    }

    const route = this.matchRoute(fullPath);
    
    if (!route) {
      this.handleError(new Error(`Route not found: ${fullPath}`));
      return;
    }

    // Run before hooks
    const shouldNavigate = await this.runBeforeHooks(route, this.currentRoute);
    if (shouldNavigate === false) return;

    // Update history
    if (this.mode === 'history') {
      window.history.pushState(state, '', fullPath);
    } else {
      window.location.hash = fullPath;
    }

    await this.loadRoute(route, fullPath);
  }

  /**
   * Replace current route
   */
  async replace(path, state = {}) {
    const fullPath = this.resolvePath(path);
    const route = this.matchRoute(fullPath);
    
    if (!route) {
      this.handleError(new Error(`Route not found: ${fullPath}`));
      return;
    }

    // Run before hooks
    const shouldNavigate = await this.runBeforeHooks(route, this.currentRoute);
    if (shouldNavigate === false) return;

    // Update history
    if (this.mode === 'history') {
      window.history.replaceState(state, '', fullPath);
    } else {
      window.location.replace(`#${fullPath}`);
    }

    await this.loadRoute(route, fullPath);
  }

  /**
   * Go back
   */
  back() {
    window.history.back();
  }

  /**
   * Go forward
   */
  forward() {
    window.history.forward();
  }

  /**
   * Go to history position
   */
  go(n) {
    window.history.go(n);
  }

  /**
   * Load current route
   */
  async loadCurrentRoute() {
    const path = this.getCurrentPath();
    const route = this.matchRoute(path);
    
    if (route) {
      await this.loadRoute(route, path);
    } else {
      this.handleError(new Error(`Route not found: ${path}`));
    }
  }

  /**
   * Load route
   */
  async loadRoute(route, fullPath) {
    const previousRoute = this.currentRoute;

    // Extract params from path
    const params = this.extractParamsFromPath(route, fullPath);
    const query = this.parseQuery(fullPath);

    // Create route object
    this.currentRoute = {
      ...route,
      fullPath,
      params,
      query,
      meta: route.meta || {}
    };

    try {
      // Call component
      if (route.component) {
        await route.component(this.currentRoute);
      }

      // Run after hooks
      await this.runAfterHooks(this.currentRoute, previousRoute);

      // Update active links
      this.updateActiveLinks();

      // Handle scroll behavior
      this.handleScrollBehavior(this.currentRoute, previousRoute);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Match route
   */
  matchRoute(path) {
    const cleanPath = path.split('?')[0];
    
    for (const route of this.routes) {
      if (route.regex.test(cleanPath)) {
        return route;
      }
    }
    
    return null;
  }

  /**
   * Convert path to regex
   */
  pathToRegex(path) {
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, '([^\\/]+)')
      .replace(/\*/g, '.*');
    
    return new RegExp(`^${pattern}$`);
  }

  /**
   * Extract params from path pattern
   */
  extractParams(path) {
    const params = [];
    const regex = /:(\w+)/g;
    let match;
    
    while ((match = regex.exec(path)) !== null) {
      params.push(match[1]);
    }
    
    return params;
  }

  /**
   * Extract param values from actual path
   */
  extractParamsFromPath(route, path) {
    const cleanPath = path.split('?')[0];
    const match = route.regex.exec(cleanPath);
    const params = {};
    
    if (match) {
      route.params.forEach((param, index) => {
        params[param] = match[index + 1];
      });
    }
    
    return params;
  }

  /**
   * Parse query string
   */
  parseQuery(path) {
    const queryString = path.split('?')[1];
    if (!queryString) return {};
    
    const query = {};
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      query[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
    
    return query;
  }

  /**
   * Get current path
   */
  getCurrentPath() {
    if (this.mode === 'history') {
      return window.location.pathname + window.location.search;
    } else {
      return window.location.hash.slice(1) || '/';
    }
  }

  /**
   * Resolve path
   */
  resolvePath(path) {
    if (path.startsWith('/')) {
      return this.base + path;
    }
    
    const current = this.currentRoute ? this.currentRoute.fullPath : '/';
    const segments = current.split('/').filter(Boolean);
    segments.pop();
    segments.push(path);
    
    return '/' + segments.join('/');
  }

  /**
   * Before navigation guard
   */
  beforeEach(hook) {
    this.beforeHooks.push(hook);
    return this;
  }

  /**
   * After navigation guard
   */
  afterEach(hook) {
    this.afterHooks.push(hook);
    return this;
  }

  /**
   * Error handler
   */
  onError(handler) {
    this.errorHandlers.push(handler);
    return this;
  }

  /**
   * Run before hooks
   */
  async runBeforeHooks(to, from) {
    for (const hook of this.beforeHooks) {
      const result = await hook(to, from);
      if (result === false) return false;
      if (typeof result === 'string') {
        await this.push(result);
        return false;
      }
    }
    return true;
  }

  /**
   * Run after hooks
   */
  async runAfterHooks(to, from) {
    for (const hook of this.afterHooks) {
      await hook(to, from);
    }
  }

  /**
   * Handle error
   */
  handleError(error) {
    if (this.errorHandlers.length > 0) {
      this.errorHandlers.forEach(handler => handler(error));
    } else {
      console.error('Router error:', error);
    }
  }

  /**
   * Handle popstate
   */
  handlePopState() {
    this.loadCurrentRoute();
  }

  /**
   * Handle hash change
   */
  handleHashChange() {
    this.loadCurrentRoute();
  }

  /**
   * Handle link click
   */
  handleLinkClick(e) {
    const link = e.target.closest('a[data-router-link]');
    if (!link) return;
    
    e.preventDefault();
    const path = link.getAttribute('href');
    this.push(path);
  }

  /**
   * Update active links
   */
  updateActiveLinks() {
    const links = document.querySelectorAll('a[data-router-link]');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      const isActive = this.currentRoute.fullPath.startsWith(href);
      const isExactActive = this.currentRoute.fullPath === href;
      
      link.classList.toggle(this.linkActiveClass, isActive);
      link.classList.toggle(this.linkExactActiveClass, isExactActive);
    });
  }

  /**
   * Handle scroll behavior
   */
  handleScrollBehavior(to, from) {
    const behavior = this.scrollBehavior(to, from);
    
    if (behavior) {
      if (behavior.selector) {
        const element = document.querySelector(behavior.selector);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (typeof behavior.x === 'number' || typeof behavior.y === 'number') {
        window.scrollTo({
          left: behavior.x || 0,
          top: behavior.y || 0,
          behavior: 'smooth'
        });
      }
    }
  }

  /**
   * Default scroll behavior
   */
  defaultScrollBehavior(to, from) {
    if (to.hash) {
      return { selector: to.hash };
    }
    return { x: 0, y: 0 };
  }

  /**
   * Generate link
   */
  link(path) {
    return this.mode === 'history' ? path : `#${path}`;
  }

  /**
   * Check if path is active
   */
  isActive(path) {
    return this.currentRoute && this.currentRoute.fullPath.startsWith(path);
  }

  /**
   * Check if path is exactly active
   */
  isExactActive(path) {
    return this.currentRoute && this.currentRoute.fullPath === path;
  }
}

/**
 * Route Guard Helpers
 */
class RouteGuards {
  /**
   * Authentication guard
   */
  static requireAuth(to, from) {
    const isAuthenticated = localStorage.getItem('auth_token');
    
    if (!isAuthenticated) {
      return '/login';
    }
  }

  /**
   * Guest guard
   */
  static requireGuest(to, from) {
    const isAuthenticated = localStorage.getItem('auth_token');
    
    if (isAuthenticated) {
      return '/dashboard';
    }
  }

  /**
   * Role guard
   */
  static requireRole(roles) {
    return (to, from) => {
      const userRole = localStorage.getItem('user_role');
      
      if (!roles.includes(userRole)) {
        return '/unauthorized';
      }
    };
  }

  /**
   * Permission guard
   */
  static requirePermission(permission) {
    return (to, from) => {
      const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
      
      if (!permissions.includes(permission)) {
        return '/unauthorized';
      }
    };
  }
}

/**
 * Link Component Helper
 */
class RouterLink {
  /**
   * Create router link
   */
  static create(options) {
    const { to, text, className = '', activeClass = 'active' } = options;
    
    const link = document.createElement('a');
    link.href = to;
    link.textContent = text;
    link.className = className;
    link.setAttribute('data-router-link', '');
    
    return link;
  }

  /**
   * Replace links in container
   */
  static replaceLinks(container) {
    const links = container.querySelectorAll('a:not([data-router-link])');
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/')) {
        link.setAttribute('data-router-link', '');
      }
    });
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Router,
    RouteGuards,
    RouterLink
  };
}
