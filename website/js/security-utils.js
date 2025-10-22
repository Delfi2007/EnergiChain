/**
 * Security and Encryption Utilities
 * Data encryption, hashing, JWT handling, and security features
 */

class SecurityUtils {
  /**
   * Generate random string
   */
  static generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate UUID v4
   */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Simple hash function (for non-cryptographic purposes)
   */
  static simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * SHA-256 hash (using Web Crypto API)
   */
  static async sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Base64 encode
   */
  static base64Encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  /**
   * Base64 decode
   */
  static base64Decode(str) {
    return decodeURIComponent(escape(atob(str)));
  }

  /**
   * URL-safe Base64 encode
   */
  static base64UrlEncode(str) {
    return this.base64Encode(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * URL-safe Base64 decode
   */
  static base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return this.base64Decode(str);
  }

  /**
   * Generate HMAC
   */
  static async hmacSha256(message, key) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt data using AES-GCM
   */
  static async encryptAES(data, password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key from password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Encrypt data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(data)
    );

    // Combine salt, iv, and encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return this.arrayBufferToBase64(combined);
  }

  /**
   * Decrypt data using AES-GCM
   */
  static async decryptAES(encryptedData, password) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const combined = this.base64ToArrayBuffer(encryptedData);

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    // Derive key from password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );

    return decoder.decode(decrypted);
  }

  /**
   * Array buffer to Base64
   */
  static arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Base64 to Array buffer
   */
  static base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Generate RSA key pair
   */
  static async generateRSAKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    );

    return keyPair;
  }

  /**
   * Sanitize HTML input
   */
  static sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  }

  /**
   * Escape HTML entities
   */
  static escapeHTML(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Validate email
   */
  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const score = [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    ].filter(Boolean).length;

    const strength = ['very weak', 'weak', 'fair', 'good', 'strong'][score - 1] || 'very weak';

    return {
      valid: score >= 3,
      score,
      strength,
      feedback: {
        length: password.length >= minLength,
        uppercase: hasUpperCase,
        lowercase: hasLowerCase,
        numbers: hasNumbers,
        special: hasSpecialChar
      }
    };
  }

  /**
   * Generate secure random password
   */
  static generatePassword(length = 16, includeSpecial = true) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = lowercase + uppercase + numbers;
    if (includeSpecial) chars += special;

    let password = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    // Ensure at least one of each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    if (includeSpecial) {
      password += special[Math.floor(Math.random() * special.length)];
    }

    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += chars[array[i] % chars.length];
    }

    // Shuffle
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Check for SQL injection patterns
   */
  static detectSQLInjection(input) {
    const patterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(--|\#|\/\*|\*\/)/,
      /('|('')|;|\b(OR|AND)\b.*=)/i
    ];

    return patterns.some(pattern => pattern.test(input));
  }

  /**
   * Check for XSS patterns
   */
  static detectXSS(input) {
    const patterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];

    return patterns.some(pattern => pattern.test(input));
  }

  /**
   * Rate limiter
   */
  static createRateLimiter(maxRequests, timeWindow) {
    const requests = new Map();

    return function(identifier) {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];

      // Remove old requests outside time window
      const validRequests = userRequests.filter(time => now - time < timeWindow);

      if (validRequests.length >= maxRequests) {
        const oldestRequest = Math.min(...validRequests);
        const resetTime = oldestRequest + timeWindow;
        const waitTime = resetTime - now;

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          waitTime
        };
      }

      validRequests.push(now);
      requests.set(identifier, validRequests);

      return {
        allowed: true,
        remaining: maxRequests - validRequests.length,
        resetTime: now + timeWindow,
        waitTime: 0
      };
    };
  }

  /**
   * Content Security Policy generator
   */
  static generateCSP(options = {}) {
    const defaultOptions = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'connect-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      ...options
    };

    return Object.entries(defaultOptions)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');
  }

  /**
   * CORS headers helper
   */
  static getCORSHeaders(origin = '*', methods = ['GET', 'POST', 'PUT', 'DELETE'], headers = ['Content-Type', 'Authorization']) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': methods.join(', '),
      'Access-Control-Allow-Headers': headers.join(', '),
      'Access-Control-Max-Age': '86400'
    };
  }
}

/**
 * JWT Token Manager
 */
class JWTManager {
  /**
   * Create JWT token (simplified, not cryptographically secure)
   */
  static createToken(payload, secret, expiresIn = 3600) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    };

    const encodedHeader = SecurityUtils.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = SecurityUtils.base64UrlEncode(JSON.stringify(tokenPayload));
    
    const signature = SecurityUtils.simpleHash(encodedHeader + '.' + encodedPayload + secret);
    const encodedSignature = SecurityUtils.base64UrlEncode(signature);

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token, secret) {
    try {
      const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

      // Verify signature
      const expectedSignature = SecurityUtils.simpleHash(encodedHeader + '.' + encodedPayload + secret);
      const expectedEncodedSignature = SecurityUtils.base64UrlEncode(expectedSignature);

      if (encodedSignature !== expectedEncodedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }

      // Decode payload
      const payload = JSON.parse(SecurityUtils.base64UrlDecode(encodedPayload));

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Decode JWT without verification
   */
  static decodeToken(token) {
    try {
      const [, encodedPayload] = token.split('.');
      return JSON.parse(SecurityUtils.base64UrlDecode(encodedPayload));
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token) {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  /**
   * Refresh token
   */
  static refreshToken(oldToken, secret, expiresIn = 3600) {
    const result = this.verifyToken(oldToken, secret);
    
    if (!result.valid) {
      throw new Error(result.error);
    }

    // Create new token with same payload
    const { iat, exp, ...payload } = result.payload;
    return this.createToken(payload, secret, expiresIn);
  }
}

/**
 * Session Manager
 */
class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeout = 1800000; // 30 minutes
  }

  /**
   * Create session
   */
  createSession(userId, data = {}) {
    const sessionId = SecurityUtils.generateUUID();
    const session = {
      id: sessionId,
      userId,
      data,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout
    };

    this.sessions.set(sessionId, session);
    this.scheduleCleanup(sessionId);

    return sessionId;
  }

  /**
   * Get session
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) return null;

    // Check expiration
    if (Date.now() > session.expiresAt) {
      this.destroySession(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = Date.now();
    session.expiresAt = Date.now() + this.sessionTimeout;

    return session;
  }

  /**
   * Update session
   */
  updateSession(sessionId, data) {
    const session = this.getSession(sessionId);
    
    if (session) {
      session.data = { ...session.data, ...data };
      return true;
    }

    return false;
  }

  /**
   * Destroy session
   */
  destroySession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  /**
   * Schedule cleanup
   */
  scheduleCleanup(sessionId) {
    setTimeout(() => {
      const session = this.sessions.get(sessionId);
      if (session && Date.now() > session.expiresAt) {
        this.destroySession(sessionId);
      }
    }, this.sessionTimeout);
  }

  /**
   * Clean expired sessions
   */
  cleanExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.destroySession(sessionId);
      }
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SecurityUtils,
    JWTManager,
    SessionManager
  };
}
