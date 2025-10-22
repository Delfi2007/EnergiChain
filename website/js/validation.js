/**
 * Data Validation and Schema System
 * Comprehensive validation framework with custom rules and schemas
 */

class Validator {
  constructor() {
    this.rules = new Map();
    this.customValidators = new Map();
    this.messages = {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      url: 'Please enter a valid URL',
      min: 'Value must be at least {{min}}',
      max: 'Value must be at most {{max}}',
      minLength: 'Must be at least {{min}} characters',
      maxLength: 'Must be at most {{max}} characters',
      pattern: 'Invalid format',
      numeric: 'Must be a number',
      alpha: 'Must contain only letters',
      alphanumeric: 'Must contain only letters and numbers',
      integer: 'Must be an integer',
      positive: 'Must be a positive number',
      negative: 'Must be a negative number',
      between: 'Must be between {{min}} and {{max}}',
      in: 'Must be one of: {{values}}',
      notIn: 'Cannot be one of: {{values}}',
      match: 'Fields do not match',
      date: 'Must be a valid date',
      before: 'Must be before {{date}}',
      after: 'Must be after {{date}}',
      phone: 'Please enter a valid phone number',
      creditCard: 'Please enter a valid credit card number',
      ipAddress: 'Please enter a valid IP address',
      json: 'Must be valid JSON',
      unique: 'This value already exists'
    };
  }

  /**
   * Validate data against schema
   */
  validate(data, schema) {
    const errors = {};
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = this.getNestedValue(data, field);
      const fieldErrors = this.validateField(value, rules, field, data);
      
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate single field
   */
  validateField(value, rules, field, data) {
    const errors = [];
    const ruleArray = Array.isArray(rules) ? rules : [rules];
    
    for (const rule of ruleArray) {
      if (typeof rule === 'string') {
        const [ruleName, ...params] = rule.split(':');
        const error = this.applyRule(value, ruleName, params, field, data);
        if (error) errors.push(error);
      } else if (typeof rule === 'function') {
        const error = rule(value, data);
        if (error) errors.push(error);
      } else if (typeof rule === 'object') {
        const error = this.applyRuleObject(value, rule, field, data);
        if (error) errors.push(error);
      }
    }
    
    return errors;
  }

  /**
   * Apply validation rule
   */
  applyRule(value, ruleName, params, field, data) {
    // Check if custom validator exists
    if (this.customValidators.has(ruleName)) {
      const validator = this.customValidators.get(ruleName);
      const result = validator(value, params, data);
      return result === true ? null : result;
    }

    // Built-in validators
    const validators = {
      required: () => {
        if (value === null || value === undefined || value === '') {
          return this.messages.required;
        }
      },
      email: () => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(value)) {
          return this.messages.email;
        }
      },
      url: () => {
        try {
          new URL(value);
        } catch {
          return this.messages.url;
        }
      },
      min: () => {
        const min = parseFloat(params[0]);
        if (parseFloat(value) < min) {
          return this.messages.min.replace('{{min}}', min);
        }
      },
      max: () => {
        const max = parseFloat(params[0]);
        if (parseFloat(value) > max) {
          return this.messages.max.replace('{{max}}', max);
        }
      },
      minLength: () => {
        const min = parseInt(params[0]);
        if (String(value).length < min) {
          return this.messages.minLength.replace('{{min}}', min);
        }
      },
      maxLength: () => {
        const max = parseInt(params[0]);
        if (String(value).length > max) {
          return this.messages.maxLength.replace('{{max}}', max);
        }
      },
      pattern: () => {
        const regex = new RegExp(params[0]);
        if (!regex.test(value)) {
          return this.messages.pattern;
        }
      },
      numeric: () => {
        if (isNaN(value)) {
          return this.messages.numeric;
        }
      },
      alpha: () => {
        if (!/^[a-zA-Z]+$/.test(value)) {
          return this.messages.alpha;
        }
      },
      alphanumeric: () => {
        if (!/^[a-zA-Z0-9]+$/.test(value)) {
          return this.messages.alphanumeric;
        }
      },
      integer: () => {
        if (!Number.isInteger(Number(value))) {
          return this.messages.integer;
        }
      },
      positive: () => {
        if (Number(value) <= 0) {
          return this.messages.positive;
        }
      },
      negative: () => {
        if (Number(value) >= 0) {
          return this.messages.negative;
        }
      },
      between: () => {
        const min = parseFloat(params[0]);
        const max = parseFloat(params[1]);
        const val = parseFloat(value);
        if (val < min || val > max) {
          return this.messages.between.replace('{{min}}', min).replace('{{max}}', max);
        }
      },
      in: () => {
        const values = params[0].split(',');
        if (!values.includes(String(value))) {
          return this.messages.in.replace('{{values}}', values.join(', '));
        }
      },
      notIn: () => {
        const values = params[0].split(',');
        if (values.includes(String(value))) {
          return this.messages.notIn.replace('{{values}}', values.join(', '));
        }
      },
      match: () => {
        const otherField = params[0];
        const otherValue = this.getNestedValue(data, otherField);
        if (value !== otherValue) {
          return this.messages.match;
        }
      },
      date: () => {
        if (isNaN(Date.parse(value))) {
          return this.messages.date;
        }
      },
      before: () => {
        const beforeDate = new Date(params[0]);
        const valueDate = new Date(value);
        if (valueDate >= beforeDate) {
          return this.messages.before.replace('{{date}}', params[0]);
        }
      },
      after: () => {
        const afterDate = new Date(params[0]);
        const valueDate = new Date(value);
        if (valueDate <= afterDate) {
          return this.messages.after.replace('{{date}}', params[0]);
        }
      },
      phone: () => {
        const regex = /^[\d\s\-\+\(\)]+$/;
        if (!regex.test(value) || value.replace(/\D/g, '').length < 10) {
          return this.messages.phone;
        }
      },
      creditCard: () => {
        if (!this.isValidCreditCard(value)) {
          return this.messages.creditCard;
        }
      },
      ipAddress: () => {
        const regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!regex.test(value)) {
          return this.messages.ipAddress;
        }
        const parts = value.split('.');
        if (parts.some(part => parseInt(part) > 255)) {
          return this.messages.ipAddress;
        }
      },
      json: () => {
        try {
          JSON.parse(value);
        } catch {
          return this.messages.json;
        }
      }
    };

    const validator = validators[ruleName];
    return validator ? validator() : null;
  }

  /**
   * Apply rule object
   */
  applyRuleObject(value, rule, field, data) {
    const { type, message, ...params } = rule;
    const error = this.applyRule(value, type, Object.values(params), field, data);
    return error ? (message || error) : null;
  }

  /**
   * Add custom validator
   */
  addValidator(name, validator) {
    this.customValidators.set(name, validator);
  }

  /**
   * Set custom message
   */
  setMessage(rule, message) {
    this.messages[rule] = message;
  }

  /**
   * Get nested value
   */
  getNestedValue(obj, path) {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined) return undefined;
      value = value[key];
    }
    
    return value;
  }

  /**
   * Validate credit card using Luhn algorithm
   */
  isValidCreditCard(number) {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }
}

/**
 * Schema Builder
 */
class SchemaBuilder {
  constructor() {
    this.schema = {};
  }

  /**
   * Add field to schema
   */
  field(name) {
    this.currentField = name;
    this.schema[name] = [];
    return this;
  }

  /**
   * Required rule
   */
  required(message) {
    this.schema[this.currentField].push(message ? { type: 'required', message } : 'required');
    return this;
  }

  /**
   * Email rule
   */
  email(message) {
    this.schema[this.currentField].push(message ? { type: 'email', message } : 'email');
    return this;
  }

  /**
   * Min rule
   */
  min(value, message) {
    this.schema[this.currentField].push(message ? { type: 'min', value, message } : `min:${value}`);
    return this;
  }

  /**
   * Max rule
   */
  max(value, message) {
    this.schema[this.currentField].push(message ? { type: 'max', value, message } : `max:${value}`);
    return this;
  }

  /**
   * Min length rule
   */
  minLength(value, message) {
    this.schema[this.currentField].push(message ? { type: 'minLength', value, message } : `minLength:${value}`);
    return this;
  }

  /**
   * Max length rule
   */
  maxLength(value, message) {
    this.schema[this.currentField].push(message ? { type: 'maxLength', value, message } : `maxLength:${value}`);
    return this;
  }

  /**
   * Pattern rule
   */
  pattern(regex, message) {
    this.schema[this.currentField].push(message ? { type: 'pattern', regex, message } : `pattern:${regex}`);
    return this;
  }

  /**
   * Custom rule
   */
  custom(validator) {
    this.schema[this.currentField].push(validator);
    return this;
  }

  /**
   * Build schema
   */
  build() {
    return this.schema;
  }
}

/**
 * Form Validator
 */
class FormValidator {
  constructor(form, schema, options = {}) {
    this.form = form;
    this.schema = schema;
    this.validator = new Validator();
    this.errors = {};
    this.options = {
      validateOnBlur: options.validateOnBlur !== false,
      validateOnInput: options.validateOnInput || false,
      showErrors: options.showErrors !== false,
      errorClass: options.errorClass || 'error',
      errorTemplate: options.errorTemplate || this.defaultErrorTemplate
    };
    
    this.init();
  }

  /**
   * Initialize form validation
   */
  init() {
    if (this.options.validateOnBlur) {
      this.form.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('blur', () => this.validateField(field.name));
      });
    }

    if (this.options.validateOnInput) {
      this.form.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('input', () => this.validateField(field.name));
      });
    }

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  /**
   * Validate single field
   */
  validateField(fieldName) {
    const field = this.form.elements[fieldName];
    if (!field || !this.schema[fieldName]) return;

    const value = field.value;
    const data = this.getFormData();
    const errors = this.validator.validateField(value, this.schema[fieldName], fieldName, data);

    if (errors.length > 0) {
      this.errors[fieldName] = errors;
      if (this.options.showErrors) {
        this.showFieldError(field, errors[0]);
      }
    } else {
      delete this.errors[fieldName];
      if (this.options.showErrors) {
        this.clearFieldError(field);
      }
    }

    return errors.length === 0;
  }

  /**
   * Validate entire form
   */
  validate() {
    const data = this.getFormData();
    const result = this.validator.validate(data, this.schema);
    this.errors = result.errors;

    if (this.options.showErrors) {
      this.clearAllErrors();
      for (const [field, errors] of Object.entries(this.errors)) {
        const fieldElement = this.form.elements[field];
        if (fieldElement) {
          this.showFieldError(fieldElement, errors[0]);
        }
      }
    }

    return result.valid;
  }

  /**
   * Handle form submit
   */
  handleSubmit(e) {
    e.preventDefault();
    
    if (this.validate()) {
      if (this.options.onSuccess) {
        this.options.onSuccess(this.getFormData());
      }
    } else {
      if (this.options.onError) {
        this.options.onError(this.errors);
      }
    }
  }

  /**
   * Get form data
   */
  getFormData() {
    const data = {};
    const formData = new FormData(this.form);
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return data;
  }

  /**
   * Show field error
   */
  showFieldError(field, error) {
    field.classList.add(this.options.errorClass);
    
    let errorElement = field.parentElement.querySelector('.validation-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'validation-error';
      field.parentElement.appendChild(errorElement);
    }
    
    errorElement.innerHTML = this.options.errorTemplate(error);
  }

  /**
   * Clear field error
   */
  clearFieldError(field) {
    field.classList.remove(this.options.errorClass);
    const errorElement = field.parentElement.querySelector('.validation-error');
    if (errorElement) {
      errorElement.remove();
    }
  }

  /**
   * Clear all errors
   */
  clearAllErrors() {
    this.form.querySelectorAll(`.${this.options.errorClass}`).forEach(field => {
      field.classList.remove(this.options.errorClass);
    });
    this.form.querySelectorAll('.validation-error').forEach(error => {
      error.remove();
    });
  }

  /**
   * Default error template
   */
  defaultErrorTemplate(error) {
    return `<span class="error-message">${error}</span>`;
  }
}

/**
 * Data Sanitizer
 */
class Sanitizer {
  /**
   * Sanitize string
   */
  static sanitizeString(str) {
    return String(str).trim();
  }

  /**
   * Sanitize email
   */
  static sanitizeEmail(email) {
    return String(email).toLowerCase().trim();
  }

  /**
   * Sanitize URL
   */
  static sanitizeURL(url) {
    try {
      const parsed = new URL(url);
      return parsed.href;
    } catch {
      return '';
    }
  }

  /**
   * Sanitize HTML
   */
  static sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Sanitize number
   */
  static sanitizeNumber(value) {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Sanitize integer
   */
  static sanitizeInteger(value) {
    const num = parseInt(value);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Sanitize phone
   */
  static sanitizePhone(phone) {
    return String(phone).replace(/\D/g, '');
  }

  /**
   * Sanitize credit card
   */
  static sanitizeCreditCard(card) {
    return String(card).replace(/\D/g, '');
  }

  /**
   * Remove XSS
   */
  static removeXSS(str) {
    return String(str)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Validator,
    SchemaBuilder,
    FormValidator,
    Sanitizer
  };
}
