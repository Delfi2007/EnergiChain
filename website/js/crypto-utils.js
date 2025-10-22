/**
 * Encryption and Security Utilities
 * Client-side encryption, hashing, and security functions
 */

class CryptoUtils {
  /**
   * Generate random string
   */
  static generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
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
   * SHA-256 hash
   */
  static async sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * SHA-512 hash
   */
  static async sha512(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * HMAC-SHA256
   */
  static async hmacSha256(message, secret) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate encryption key
   */
  static async generateKey() {
    return await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Export key to string
   */
  static async exportKey(key) {
    const exported = await crypto.subtle.exportKey('raw', key);
    const exportedKeyBuffer = new Uint8Array(exported);
    return btoa(String.fromCharCode.apply(null, exportedKeyBuffer));
  }

  /**
   * Import key from string
   */
  static async importKey(keyString) {
    const keyBuffer = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
    return await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      'AES-GCM',
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data with AES-GCM
   */
  static async encrypt(data, key) {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encoder.encode(data)
    );

    const encryptedArray = new Uint8Array(encrypted);
    const result = new Uint8Array(iv.length + encryptedArray.length);
    result.set(iv);
    result.set(encryptedArray, iv.length);

    return btoa(String.fromCharCode.apply(null, result));
  }

  /**
   * Decrypt data with AES-GCM
   */
  static async decrypt(encryptedData, key) {
    const encryptedArray = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = encryptedArray.slice(0, 12);
    const data = encryptedArray.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Generate RSA key pair
   */
  static async generateRSAKeyPair() {
    return await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * RSA encrypt
   */
  static async rsaEncrypt(data, publicKey) {
    const encoder = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      publicKey,
      encoder.encode(data)
    );

    const encryptedArray = new Uint8Array(encrypted);
    return btoa(String.fromCharCode.apply(null, encryptedArray));
  }

  /**
   * RSA decrypt
   */
  static async rsaDecrypt(encryptedData, privateKey) {
    const encryptedArray = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP'
      },
      privateKey,
      encryptedArray
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
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
   * Generate JWT token
   */
  static async createJWT(payload, secret) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = await this.hmacSha256(`${encodedHeader}.${encodedPayload}`, secret);
    const encodedSignature = this.base64UrlEncode(signature);

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  }

  /**
   * Verify JWT token
   */
  static async verifyJWT(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const signature = await this.hmacSha256(`${encodedHeader}.${encodedPayload}`, secret);
    const expectedSignature = this.base64UrlEncode(signature);

    if (expectedSignature !== encodedSignature) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('Token expired');
    }

    return payload;
  }

  /**
   * Hash password with PBKDF2
   */
  static async hashPassword(password, salt = null) {
    if (!salt) {
      salt = this.generateRandomString(16);
    }

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return {
      hash: hashHex,
      salt: salt
    };
  }

  /**
   * Verify password
   */
  static async verifyPassword(password, hash, salt) {
    const result = await this.hashPassword(password, salt);
    return result.hash === hash;
  }

  /**
   * Generate TOTP code
   */
  static async generateTOTP(secret, timeStep = 30) {
    const time = Math.floor(Date.now() / 1000 / timeStep);
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, time, false);

    const hmac = await this.hmacSha256(
      String.fromCharCode.apply(null, new Uint8Array(timeBuffer)),
      secret
    );

    const offset = parseInt(hmac.slice(-1), 16);
    const code = parseInt(hmac.substr(offset * 2, 8), 16) & 0x7fffffff;
    
    return String(code % 1000000).padStart(6, '0');
  }

  /**
   * Verify TOTP code
   */
  static async verifyTOTP(code, secret, window = 1) {
    for (let i = -window; i <= window; i++) {
      const time = Math.floor(Date.now() / 1000 / 30) + i;
      const timeBuffer = new ArrayBuffer(8);
      const timeView = new DataView(timeBuffer);
      timeView.setUint32(4, time, false);

      const hmac = await this.hmacSha256(
        String.fromCharCode.apply(null, new Uint8Array(timeBuffer)),
        secret
      );

      const offset = parseInt(hmac.slice(-1), 16);
      const generatedCode = String(
        (parseInt(hmac.substr(offset * 2, 8), 16) & 0x7fffffff) % 1000000
      ).padStart(6, '0');

      if (generatedCode === code) {
        return true;
      }
    }

    return false;
  }

  /**
   * XOR cipher
   */
  static xorCipher(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  /**
   * Caesar cipher encrypt
   */
  static caesarEncrypt(text, shift) {
    return text.replace(/[a-z]/gi, char => {
      const start = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - start + shift) % 26) + start);
    });
  }

  /**
   * Caesar cipher decrypt
   */
  static caesarDecrypt(text, shift) {
    return this.caesarEncrypt(text, 26 - shift);
  }

  /**
   * ROT13 cipher
   */
  static rot13(text) {
    return this.caesarEncrypt(text, 13);
  }

  /**
   * Sanitize HTML
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
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return text.replace(/[&<>"'/]/g, char => map[char]);
  }

  /**
   * Unescape HTML entities
   */
  static unescapeHTML(text) {
    const map = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x2F;': '/'
    };
    return text.replace(/&amp;|&lt;|&gt;|&quot;|&#x27;|&#x2F;/g, entity => map[entity]);
  }

  /**
   * Generate secure random number
   */
  static secureRandom(min, max) {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValue = Math.pow(256, bytesNeeded);
    const randomBytes = new Uint8Array(bytesNeeded);
    
    let randomValue;
    do {
      crypto.getRandomValues(randomBytes);
      randomValue = 0;
      for (let i = 0; i < bytesNeeded; i++) {
        randomValue = randomValue * 256 + randomBytes[i];
      }
    } while (randomValue >= maxValue - (maxValue % range));
    
    return min + (randomValue % range);
  }

  /**
   * Generate cryptographic nonce
   */
  static generateNonce(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Constant-time string comparison
   */
  static constantTimeEqual(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }
}

/**
 * Session Security Manager
 */
class SessionSecurity {
  constructor() {
    this.sessionKey = null;
    this.sessionId = null;
    this.csrfToken = null;
  }

  /**
   * Initialize secure session
   */
  async initSession() {
    this.sessionKey = await CryptoUtils.generateKey();
    this.sessionId = CryptoUtils.generateUUID();
    this.csrfToken = CryptoUtils.generateRandomString(32);
    
    return {
      sessionId: this.sessionId,
      csrfToken: this.csrfToken
    };
  }

  /**
   * Encrypt session data
   */
  async encryptSessionData(data) {
    if (!this.sessionKey) {
      await this.initSession();
    }
    
    return await CryptoUtils.encrypt(JSON.stringify(data), this.sessionKey);
  }

  /**
   * Decrypt session data
   */
  async decryptSessionData(encryptedData) {
    if (!this.sessionKey) {
      throw new Error('Session not initialized');
    }
    
    const decrypted = await CryptoUtils.decrypt(encryptedData, this.sessionKey);
    return JSON.parse(decrypted);
  }

  /**
   * Validate CSRF token
   */
  validateCSRF(token) {
    return CryptoUtils.constantTimeEqual(token, this.csrfToken);
  }

  /**
   * Rotate session key
   */
  async rotateSessionKey() {
    this.sessionKey = await CryptoUtils.generateKey();
    this.sessionId = CryptoUtils.generateUUID();
  }

  /**
   * Destroy session
   */
  destroySession() {
    this.sessionKey = null;
    this.sessionId = null;
    this.csrfToken = null;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CryptoUtils,
    SessionSecurity
  };
}
