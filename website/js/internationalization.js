/**
 * Internationalization (i18n) System
 * Multi-language support with dynamic translation and localization
 */

class I18n {
  constructor(options = {}) {
    this.locale = options.defaultLocale || 'en';
    this.fallbackLocale = options.fallbackLocale || 'en';
    this.translations = new Map();
    this.dateFormats = new Map();
    this.numberFormats = new Map();
    this.currencyFormats = new Map();
    this.pluralRules = new Map();
    this.missingKeyHandler = options.missingKeyHandler || null;
    this.interpolationPattern = /\{\{(\w+)\}\}/g;
  }

  /**
   * Load translations
   */
  loadTranslations(locale, translations) {
    if (!this.translations.has(locale)) {
      this.translations.set(locale, {});
    }
    
    const current = this.translations.get(locale);
    this.translations.set(locale, { ...current, ...translations });
  }

  /**
   * Set locale
   */
  setLocale(locale) {
    this.locale = locale;
    this.notifyLocaleChange(locale);
  }

  /**
   * Get current locale
   */
  getLocale() {
    return this.locale;
  }

  /**
   * Translate key
   */
  t(key, params = {}, locale = null) {
    const targetLocale = locale || this.locale;
    const translations = this.translations.get(targetLocale);
    
    let translation = this.getNestedValue(translations, key);
    
    // Fallback to default locale
    if (!translation && targetLocale !== this.fallbackLocale) {
      const fallbackTranslations = this.translations.get(this.fallbackLocale);
      translation = this.getNestedValue(fallbackTranslations, key);
    }
    
    // Handle missing key
    if (!translation) {
      if (this.missingKeyHandler) {
        return this.missingKeyHandler(key, targetLocale);
      }
      return key;
    }
    
    // Interpolate parameters
    return this.interpolate(translation, params);
  }

  /**
   * Get nested value from object
   */
  getNestedValue(obj, path) {
    if (!obj) return null;
    
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined) return null;
      value = value[key];
    }
    
    return value;
  }

  /**
   * Interpolate parameters
   */
  interpolate(template, params) {
    return template.replace(this.interpolationPattern, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * Pluralize
   */
  plural(key, count, params = {}) {
    const pluralKey = this.getPluralKey(count);
    const fullKey = `${key}.${pluralKey}`;
    
    return this.t(fullKey, { ...params, count });
  }

  /**
   * Get plural key based on count
   */
  getPluralKey(count) {
    const rules = this.pluralRules.get(this.locale);
    
    if (rules) {
      return rules(count);
    }
    
    // Default English plural rules
    if (count === 0) return 'zero';
    if (count === 1) return 'one';
    return 'other';
  }

  /**
   * Set plural rules for locale
   */
  setPluralRules(locale, rules) {
    this.pluralRules.set(locale, rules);
  }

  /**
   * Format date
   */
  formatDate(date, format = 'short', locale = null) {
    const targetLocale = locale || this.locale;
    const d = new Date(date);
    
    const formats = {
      short: { year: 'numeric', month: '2-digit', day: '2-digit' },
      medium: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    };
    
    const options = formats[format] || formats.short;
    return d.toLocaleDateString(targetLocale, options);
  }

  /**
   * Format time
   */
  formatTime(date, format = 'short', locale = null) {
    const targetLocale = locale || this.locale;
    const d = new Date(date);
    
    const formats = {
      short: { hour: '2-digit', minute: '2-digit' },
      medium: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
      long: { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }
    };
    
    const options = formats[format] || formats.short;
    return d.toLocaleTimeString(targetLocale, options);
  }

  /**
   * Format number
   */
  formatNumber(number, options = {}, locale = null) {
    const targetLocale = locale || this.locale;
    return new Intl.NumberFormat(targetLocale, options).format(number);
  }

  /**
   * Format currency
   */
  formatCurrency(amount, currency = 'USD', locale = null) {
    const targetLocale = locale || this.locale;
    return new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Format percentage
   */
  formatPercentage(number, decimals = 0, locale = null) {
    const targetLocale = locale || this.locale;
    return new Intl.NumberFormat(targetLocale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  }

  /**
   * Get available locales
   */
  getAvailableLocales() {
    return Array.from(this.translations.keys());
  }

  /**
   * Check if locale exists
   */
  hasLocale(locale) {
    return this.translations.has(locale);
  }

  /**
   * Get all translations for locale
   */
  getTranslations(locale = null) {
    const targetLocale = locale || this.locale;
    return this.translations.get(targetLocale) || {};
  }

  /**
   * Notify locale change
   */
  notifyLocaleChange(locale) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
    }
  }

  /**
   * Detect browser locale
   */
  detectBrowserLocale() {
    if (typeof navigator !== 'undefined') {
      return navigator.language || navigator.userLanguage || this.fallbackLocale;
    }
    return this.fallbackLocale;
  }

  /**
   * Format relative time
   */
  formatRelativeTime(date, locale = null) {
    const targetLocale = locale || this.locale;
    const rtf = new Intl.RelativeTimeFormat(targetLocale, { numeric: 'auto' });
    
    const now = new Date();
    const target = new Date(date);
    const diffInSeconds = Math.floor((target - now) / 1000);
    
    const units = [
      { unit: 'year', seconds: 31536000 },
      { unit: 'month', seconds: 2592000 },
      { unit: 'week', seconds: 604800 },
      { unit: 'day', seconds: 86400 },
      { unit: 'hour', seconds: 3600 },
      { unit: 'minute', seconds: 60 },
      { unit: 'second', seconds: 1 }
    ];
    
    for (const { unit, seconds } of units) {
      if (Math.abs(diffInSeconds) >= seconds) {
        const value = Math.floor(diffInSeconds / seconds);
        return rtf.format(value, unit);
      }
    }
    
    return rtf.format(0, 'second');
  }

  /**
   * Format list
   */
  formatList(list, type = 'conjunction', locale = null) {
    const targetLocale = locale || this.locale;
    const formatter = new Intl.ListFormat(targetLocale, { type });
    return formatter.format(list);
  }

  /**
   * Get direction (LTR/RTL)
   */
  getDirection(locale = null) {
    const targetLocale = locale || this.locale;
    const rtlLocales = ['ar', 'he', 'fa', 'ur', 'yi'];
    return rtlLocales.some(l => targetLocale.startsWith(l)) ? 'rtl' : 'ltr';
  }

  /**
   * Clear all translations
   */
  clear() {
    this.translations.clear();
  }
}

/**
 * Translation Manager with lazy loading
 */
class TranslationManager {
  constructor(i18n) {
    this.i18n = i18n;
    this.cache = new Map();
    this.loading = new Map();
    this.loaders = new Map();
  }

  /**
   * Register translation loader
   */
  registerLoader(locale, loader) {
    this.loaders.set(locale, loader);
  }

  /**
   * Load translations for locale
   */
  async loadTranslations(locale) {
    if (this.cache.has(locale)) {
      return this.cache.get(locale);
    }

    if (this.loading.has(locale)) {
      return this.loading.get(locale);
    }

    const loader = this.loaders.get(locale);
    if (!loader) {
      throw new Error(`No loader registered for locale: ${locale}`);
    }

    const promise = loader()
      .then(translations => {
        this.i18n.loadTranslations(locale, translations);
        this.cache.set(locale, translations);
        this.loading.delete(locale);
        return translations;
      })
      .catch(error => {
        this.loading.delete(locale);
        throw error;
      });

    this.loading.set(locale, promise);
    return promise;
  }

  /**
   * Preload locales
   */
  async preloadLocales(locales) {
    const promises = locales.map(locale => this.loadTranslations(locale));
    return Promise.all(promises);
  }

  /**
   * Clear cache
   */
  clearCache(locale = null) {
    if (locale) {
      this.cache.delete(locale);
    } else {
      this.cache.clear();
    }
  }
}

/**
 * Locale Detector
 */
class LocaleDetector {
  constructor(options = {}) {
    this.strategies = options.strategies || ['navigator', 'cookie', 'localStorage'];
    this.cookieName = options.cookieName || 'locale';
    this.storageKey = options.storageKey || 'locale';
    this.fallback = options.fallback || 'en';
  }

  /**
   * Detect locale
   */
  detect() {
    for (const strategy of this.strategies) {
      const locale = this[`detect${this.capitalize(strategy)}`]();
      if (locale) return locale;
    }
    return this.fallback;
  }

  /**
   * Detect from navigator
   */
  detectNavigator() {
    if (typeof navigator !== 'undefined') {
      return navigator.language || navigator.userLanguage;
    }
    return null;
  }

  /**
   * Detect from cookie
   */
  detectCookie() {
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === this.cookieName) {
          return decodeURIComponent(value);
        }
      }
    }
    return null;
  }

  /**
   * Detect from localStorage
   */
  detectLocalstorage() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.storageKey);
    }
    return null;
  }

  /**
   * Save locale to cookie
   */
  saveToCookie(locale, days = 365) {
    if (typeof document !== 'undefined') {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      const expires = `expires=${date.toUTCString()}`;
      document.cookie = `${this.cookieName}=${encodeURIComponent(locale)};${expires};path=/`;
    }
  }

  /**
   * Save locale to localStorage
   */
  saveToLocalStorage(locale) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, locale);
    }
  }

  /**
   * Capitalize string
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Locale Formatter Utilities
 */
class LocaleFormatter {
  /**
   * Format file size
   */
  static formatFileSize(bytes, locale = 'en') {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });

    return `${formatter.format(size)} ${units[unitIndex]}`;
  }

  /**
   * Format phone number
   */
  static formatPhoneNumber(phone, country = 'US') {
    const cleaned = phone.replace(/\D/g, '');
    
    const formats = {
      US: (num) => {
        if (num.length === 10) {
          return `(${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6)}`;
        }
        return num;
      },
      UK: (num) => {
        if (num.length === 11) {
          return `${num.slice(0, 5)} ${num.slice(5, 8)} ${num.slice(8)}`;
        }
        return num;
      }
    };

    const formatter = formats[country];
    return formatter ? formatter(cleaned) : cleaned;
  }

  /**
   * Format postal code
   */
  static formatPostalCode(code, country = 'US') {
    const formats = {
      US: (c) => c.length === 9 ? `${c.slice(0, 5)}-${c.slice(5)}` : c,
      CA: (c) => c.length === 6 ? `${c.slice(0, 3)} ${c.slice(3)}` : c,
      UK: (c) => c.length >= 5 ? `${c.slice(0, -3)} ${c.slice(-3)}` : c
    };

    const formatter = formats[country];
    return formatter ? formatter(code.toUpperCase()) : code.toUpperCase();
  }

  /**
   * Format distance
   */
  static formatDistance(meters, system = 'metric', locale = 'en') {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });

    if (system === 'metric') {
      if (meters < 1000) {
        return `${formatter.format(meters)} m`;
      } else {
        return `${formatter.format(meters / 1000)} km`;
      }
    } else {
      const feet = meters * 3.28084;
      if (feet < 5280) {
        return `${formatter.format(feet)} ft`;
      } else {
        return `${formatter.format(feet / 5280)} mi`;
      }
    }
  }

  /**
   * Format temperature
   */
  static formatTemperature(celsius, unit = 'C', locale = 'en') {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    });

    if (unit === 'F') {
      const fahrenheit = (celsius * 9 / 5) + 32;
      return `${formatter.format(fahrenheit)}°F`;
    } else if (unit === 'K') {
      const kelvin = celsius + 273.15;
      return `${formatter.format(kelvin)}K`;
    } else {
      return `${formatter.format(celsius)}°C`;
    }
  }
}

// Create global instance
const i18n = new I18n();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    I18n,
    TranslationManager,
    LocaleDetector,
    LocaleFormatter,
    i18n
  };
}
