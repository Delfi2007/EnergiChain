/**
 * Testing Framework
 * Lightweight testing utilities for unit and integration tests
 */

class TestRunner {
  constructor(options = {}) {
    this.tests = [];
    this.suites = [];
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };
    this.reporter = options.reporter || new ConsoleReporter();
    this.timeout = options.timeout || 5000;
    this.bail = options.bail || false;
  }

  /**
   * Define test suite
   */
  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      beforeEach: null,
      afterEach: null,
      beforeAll: null,
      afterAll: null
    };

    this.suites.push(suite);
    
    const currentSuite = suite;
    const previousTests = this.tests;
    this.tests = suite.tests;

    fn({
      beforeEach: (fn) => { currentSuite.beforeEach = fn; },
      afterEach: (fn) => { currentSuite.afterEach = fn; },
      beforeAll: (fn) => { currentSuite.beforeAll = fn; },
      afterAll: (fn) => { currentSuite.afterAll = fn; }
    });

    this.tests = previousTests;
  }

  /**
   * Define test
   */
  it(name, fn, options = {}) {
    this.tests.push({
      name,
      fn,
      skip: options.skip || false,
      only: options.only || false
    });
  }

  /**
   * Skip test
   */
  skip(name, fn) {
    this.it(name, fn, { skip: true });
  }

  /**
   * Only test
   */
  only(name, fn) {
    this.it(name, fn, { only: true });
  }

  /**
   * Run all tests
   */
  async run() {
    const startTime = performance.now();
    this.reporter.onStart(this.suites);

    for (const suite of this.suites) {
      await this.runSuite(suite);
      if (this.bail && this.results.failed > 0) break;
    }

    this.results.duration = performance.now() - startTime;
    this.reporter.onComplete(this.results);

    return this.results;
  }

  /**
   * Run test suite
   */
  async runSuite(suite) {
    this.reporter.onSuiteStart(suite);

    if (suite.beforeAll) {
      await suite.beforeAll();
    }

    for (const test of suite.tests) {
      if (test.skip) {
        this.results.skipped++;
        this.reporter.onTestSkip(test);
        continue;
      }

      await this.runTest(test, suite);
      
      if (this.bail && this.results.failed > 0) break;
    }

    if (suite.afterAll) {
      await suite.afterAll();
    }

    this.reporter.onSuiteComplete(suite);
  }

  /**
   * Run single test
   */
  async runTest(test, suite) {
    this.results.total++;
    const startTime = performance.now();

    try {
      if (suite.beforeEach) {
        await suite.beforeEach();
      }

      await this.runWithTimeout(test.fn, this.timeout);

      if (suite.afterEach) {
        await suite.afterEach();
      }

      const duration = performance.now() - startTime;
      this.results.passed++;
      this.reporter.onTestPass(test, duration);
    } catch (error) {
      const duration = performance.now() - startTime;
      this.results.failed++;
      this.reporter.onTestFail(test, error, duration);
    }
  }

  /**
   * Run with timeout
   */
  runWithTimeout(fn, timeout) {
    return Promise.race([
      fn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout)
      )
    ]);
  }
}

/**
 * Assertion Library
 */
class Expect {
  constructor(actual) {
    this.actual = actual;
    this.isNot = false;
  }

  /**
   * Not modifier
   */
  get not() {
    this.isNot = true;
    return this;
  }

  /**
   * Check equality
   */
  toBe(expected) {
    const pass = Object.is(this.actual, expected);
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not ' : ''}to be ${expected}`);
    }
  }

  /**
   * Check deep equality
   */
  toEqual(expected) {
    const pass = this.deepEqual(this.actual, expected);
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} ${this.isNot ? 'not ' : ''}to equal ${JSON.stringify(expected)}`);
    }
  }

  /**
   * Check truthiness
   */
  toBeTruthy() {
    if (this.isNot ? this.actual : !this.actual) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not ' : ''}to be truthy`);
    }
  }

  /**
   * Check falsiness
   */
  toBeFalsy() {
    if (this.isNot ? !this.actual : this.actual) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not ' : ''}to be falsy`);
    }
  }

  /**
   * Check null
   */
  toBeNull() {
    const pass = this.actual === null;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not ' : ''}to be null`);
    }
  }

  /**
   * Check undefined
   */
  toBeUndefined() {
    const pass = this.actual === undefined;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not ' : ''}to be undefined`);
    }
  }

  /**
   * Check type
   */
  toBeTypeOf(type) {
    const pass = typeof this.actual === type;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not ' : ''}to be type ${type}`);
    }
  }

  /**
   * Check instance
   */
  toBeInstanceOf(constructor) {
    const pass = this.actual instanceof constructor;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not ' : ''}to be instance of ${constructor.name}`);
    }
  }

  /**
   * Check greater than
   */
  toBeGreaterThan(expected) {
    const pass = this.actual > expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not ' : ''}to be greater than ${expected}`);
    }
  }

  /**
   * Check less than
   */
  toBeLessThan(expected) {
    const pass = this.actual < expected;
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not ' : ''}to be less than ${expected}`);
    }
  }

  /**
   * Check contains
   */
  toContain(item) {
    const pass = Array.isArray(this.actual) 
      ? this.actual.includes(item)
      : this.actual.indexOf(item) !== -1;
    
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not ' : ''}to contain ${item}`);
    }
  }

  /**
   * Check match regex
   */
  toMatch(regex) {
    const pass = regex.test(this.actual);
    if (this.isNot ? pass : !pass) {
      throw new Error(`Expected ${this.actual} ${this.isNot ? 'not ' : ''}to match ${regex}`);
    }
  }

  /**
   * Check throws
   */
  toThrow(error) {
    let thrown = false;
    let thrownError = null;

    try {
      this.actual();
    } catch (e) {
      thrown = true;
      thrownError = e;
    }

    if (this.isNot ? thrown : !thrown) {
      throw new Error(`Expected function ${this.isNot ? 'not ' : ''}to throw`);
    }

    if (error && thrown) {
      if (typeof error === 'string' && !thrownError.message.includes(error)) {
        throw new Error(`Expected error message to include "${error}", got "${thrownError.message}"`);
      }
      if (error instanceof RegExp && !error.test(thrownError.message)) {
        throw new Error(`Expected error message to match ${error}, got "${thrownError.message}"`);
      }
    }
  }

  /**
   * Deep equality check
   */
  deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this.deepEqual(a[key], b[key])) return false;
    }

    return true;
  }
}

/**
 * Mock Function
 */
class Mock {
  constructor(implementation) {
    this.implementation = implementation;
    this.calls = [];
    this.results = [];
  }

  /**
   * Call mock
   */
  call(...args) {
    this.calls.push(args);

    try {
      const result = this.implementation ? this.implementation(...args) : undefined;
      this.results.push({ type: 'return', value: result });
      return result;
    } catch (error) {
      this.results.push({ type: 'throw', value: error });
      throw error;
    }
  }

  /**
   * Mock implementation
   */
  mockImplementation(fn) {
    this.implementation = fn;
    return this;
  }

  /**
   * Mock return value
   */
  mockReturnValue(value) {
    this.implementation = () => value;
    return this;
  }

  /**
   * Mock resolved value
   */
  mockResolvedValue(value) {
    this.implementation = () => Promise.resolve(value);
    return this;
  }

  /**
   * Mock rejected value
   */
  mockRejectedValue(value) {
    this.implementation = () => Promise.reject(value);
    return this;
  }

  /**
   * Reset mock
   */
  mockReset() {
    this.calls = [];
    this.results = [];
    return this;
  }

  /**
   * Clear mock
   */
  mockClear() {
    this.calls = [];
    this.results = [];
    this.implementation = null;
    return this;
  }

  /**
   * Check if called
   */
  toHaveBeenCalled() {
    return this.calls.length > 0;
  }

  /**
   * Check call count
   */
  toHaveBeenCalledTimes(expected) {
    return this.calls.length === expected;
  }

  /**
   * Check called with
   */
  toHaveBeenCalledWith(...args) {
    return this.calls.some(call => 
      call.length === args.length && 
      call.every((arg, i) => arg === args[i])
    );
  }
}

/**
 * Console Reporter
 */
class ConsoleReporter {
  onStart(suites) {
    console.log(`\nRunning ${suites.length} test suites...\n`);
  }

  onSuiteStart(suite) {
    console.log(`\n${suite.name}`);
  }

  onTestPass(test, duration) {
    console.log(`  ✓ ${test.name} (${duration.toFixed(2)}ms)`);
  }

  onTestFail(test, error, duration) {
    console.log(`  ✗ ${test.name} (${duration.toFixed(2)}ms)`);
    console.log(`    ${error.message}`);
    if (error.stack) {
      console.log(`    ${error.stack.split('\n').slice(1).join('\n    ')}`);
    }
  }

  onTestSkip(test) {
    console.log(`  ○ ${test.name} (skipped)`);
  }

  onSuiteComplete(suite) {
    // Suite complete
  }

  onComplete(results) {
    console.log(`\nTest Results:`);
    console.log(`  Total: ${results.total}`);
    console.log(`  Passed: ${results.passed}`);
    console.log(`  Failed: ${results.failed}`);
    console.log(`  Skipped: ${results.skipped}`);
    console.log(`  Duration: ${results.duration.toFixed(2)}ms`);
    
    if (results.failed > 0) {
      console.log(`\n❌ Tests failed`);
    } else {
      console.log(`\n✅ All tests passed`);
    }
  }
}

/**
 * Helper functions
 */
function expect(actual) {
  return new Expect(actual);
}

function mock(implementation) {
  const mockFn = new Mock(implementation);
  const fn = (...args) => mockFn.call(...args);
  Object.assign(fn, mockFn);
  return fn;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TestRunner,
    Expect,
    Mock,
    ConsoleReporter,
    expect,
    mock
  };
}
