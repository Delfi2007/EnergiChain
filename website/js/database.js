/**
 * Database Abstraction Layer
 * IndexedDB wrapper with query builder and ORM-like features
 */

class Database {
  constructor(name, version = 1) {
    this.name = name;
    this.version = version;
    this.db = null;
    this.stores = new Map();
  }

  /**
   * Define object store
   */
  define(storeName, schema) {
    this.stores.set(storeName, schema);
    return this;
  }

  /**
   * Open database
   */
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        for (const [storeName, schema] of this.stores) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, {
              keyPath: schema.keyPath || 'id',
              autoIncrement: schema.autoIncrement !== false
            });

            if (schema.indexes) {
              for (const [indexName, indexConfig] of Object.entries(schema.indexes)) {
                store.createIndex(indexName, indexConfig.keyPath || indexName, {
                  unique: indexConfig.unique || false,
                  multiEntry: indexConfig.multiEntry || false
                });
              }
            }
          }
        }
      };
    });
  }

  /**
   * Get store instance
   */
  store(storeName) {
    return new Store(this.db, storeName);
  }

  /**
   * Transaction wrapper
   */
  async transaction(storeNames, mode, callback) {
    const tx = this.db.transaction(storeNames, mode);
    const stores = Array.isArray(storeNames)
      ? storeNames.map(name => new Store(this.db, name, tx))
      : [new Store(this.db, storeNames, tx)];

    try {
      const result = await callback(...stores);
      await this.waitForTransaction(tx);
      return result;
    } catch (error) {
      tx.abort();
      throw error;
    }
  }

  /**
   * Wait for transaction to complete
   */
  waitForTransaction(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  /**
   * Close database
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Delete database
   */
  static async delete(name) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * Object Store wrapper
 */
class Store {
  constructor(db, storeName, transaction = null) {
    this.db = db;
    this.storeName = storeName;
    this.transaction = transaction;
  }

  /**
   * Get store
   */
  getStore(mode = 'readonly') {
    const tx = this.transaction || this.db.transaction(this.storeName, mode);
    return tx.objectStore(this.storeName);
  }

  /**
   * Add record
   */
  async add(data) {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Put record (add or update)
   */
  async put(data) {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get record by key
   */
  async get(key) {
    return new Promise((resolve, reject) => {
      const store = this.getStore();
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all records
   */
  async getAll(query = null, count = null) {
    return new Promise((resolve, reject) => {
      const store = this.getStore();
      const request = store.getAll(query, count);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete record
   */
  async delete(key) {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all records
   */
  async clear() {
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count records
   */
  async count(query = null) {
    return new Promise((resolve, reject) => {
      const store = this.getStore();
      const request = store.count(query);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query builder
   */
  query() {
    return new QueryBuilder(this);
  }

  /**
   * Iterate over records
   */
  async forEach(callback) {
    return new Promise((resolve, reject) => {
      const store = this.getStore();
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          callback(cursor.value, cursor.key);
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Bulk add
   */
  async bulkAdd(records) {
    const results = [];
    for (const record of records) {
      results.push(await this.add(record));
    }
    return results;
  }

  /**
   * Bulk put
   */
  async bulkPut(records) {
    const results = [];
    for (const record of records) {
      results.push(await this.put(record));
    }
    return results;
  }

  /**
   * Bulk delete
   */
  async bulkDelete(keys) {
    for (const key of keys) {
      await this.delete(key);
    }
  }
}

/**
 * Query Builder
 */
class QueryBuilder {
  constructor(store) {
    this.store = store;
    this.filters = [];
    this.sortBy = null;
    this.sortOrder = 'asc';
    this.limitCount = null;
    this.offsetCount = 0;
  }

  /**
   * Where clause
   */
  where(field, operator, value) {
    this.filters.push({ field, operator, value });
    return this;
  }

  /**
   * Order by
   */
  orderBy(field, order = 'asc') {
    this.sortBy = field;
    this.sortOrder = order;
    return this;
  }

  /**
   * Limit
   */
  limit(count) {
    this.limitCount = count;
    return this;
  }

  /**
   * Offset
   */
  offset(count) {
    this.offsetCount = count;
    return this;
  }

  /**
   * Execute query
   */
  async execute() {
    const allRecords = await this.store.getAll();
    let results = allRecords;

    // Apply filters
    for (const filter of this.filters) {
      results = results.filter(record => {
        const value = this.getNestedValue(record, filter.field);
        return this.compareValues(value, filter.operator, filter.value);
      });
    }

    // Apply sorting
    if (this.sortBy) {
      results.sort((a, b) => {
        const aVal = this.getNestedValue(a, this.sortBy);
        const bVal = this.getNestedValue(b, this.sortBy);
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return this.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // Apply offset and limit
    if (this.offsetCount > 0) {
      results = results.slice(this.offsetCount);
    }
    if (this.limitCount) {
      results = results.slice(0, this.limitCount);
    }

    return results;
  }

  /**
   * Get first result
   */
  async first() {
    this.limitCount = 1;
    const results = await this.execute();
    return results[0] || null;
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
   * Compare values
   */
  compareValues(a, operator, b) {
    switch (operator) {
      case '=':
      case '==':
        return a == b;
      case '===':
        return a === b;
      case '!=':
        return a != b;
      case '!==':
        return a !== b;
      case '>':
        return a > b;
      case '>=':
        return a >= b;
      case '<':
        return a < b;
      case '<=':
        return a <= b;
      case 'in':
        return Array.isArray(b) && b.includes(a);
      case 'notIn':
        return Array.isArray(b) && !b.includes(a);
      case 'like':
        return String(a).includes(String(b));
      case 'startsWith':
        return String(a).startsWith(String(b));
      case 'endsWith':
        return String(a).endsWith(String(b));
      default:
        return false;
    }
  }
}

/**
 * Model base class
 */
class Model {
  constructor(storeName, db) {
    this.storeName = storeName;
    this.db = db;
    this.store = db.store(storeName);
  }

  /**
   * Find by ID
   */
  async findById(id) {
    return await this.store.get(id);
  }

  /**
   * Find all
   */
  async findAll() {
    return await this.store.getAll();
  }

  /**
   * Create record
   */
  async create(data) {
    const id = await this.store.add(data);
    return { id, ...data };
  }

  /**
   * Update record
   */
  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Record not found');
    
    const updated = { ...existing, ...data };
    await this.store.put(updated);
    return updated;
  }

  /**
   * Delete record
   */
  async delete(id) {
    await this.store.delete(id);
  }

  /**
   * Query
   */
  query() {
    return this.store.query();
  }

  /**
   * Count
   */
  async count() {
    return await this.store.count();
  }
}

/**
 * Migration System
 */
class Migration {
  constructor(db) {
    this.db = db;
    this.migrations = [];
  }

  /**
   * Add migration
   */
  add(version, up, down) {
    this.migrations.push({ version, up, down });
    return this;
  }

  /**
   * Run migrations
   */
  async up(targetVersion = null) {
    const currentVersion = this.db.version;
    const target = targetVersion || Math.max(...this.migrations.map(m => m.version));

    for (const migration of this.migrations) {
      if (migration.version > currentVersion && migration.version <= target) {
        await migration.up(this.db);
      }
    }
  }

  /**
   * Rollback migrations
   */
  async down(targetVersion = 0) {
    const currentVersion = this.db.version;

    for (const migration of this.migrations.reverse()) {
      if (migration.version <= currentVersion && migration.version > targetVersion) {
        await migration.down(this.db);
      }
    }
  }
}

/**
 * Repository Pattern
 */
class Repository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Find one
   */
  async findOne(criteria) {
    const query = this.model.query();
    
    for (const [field, value] of Object.entries(criteria)) {
      query.where(field, '===', value);
    }
    
    return await query.first();
  }

  /**
   * Find many
   */
  async findMany(criteria, options = {}) {
    const query = this.model.query();
    
    for (const [field, value] of Object.entries(criteria)) {
      query.where(field, '===', value);
    }
    
    if (options.orderBy) {
      query.orderBy(options.orderBy, options.order);
    }
    
    if (options.limit) {
      query.limit(options.limit);
    }
    
    if (options.offset) {
      query.offset(options.offset);
    }
    
    return await query.execute();
  }

  /**
   * Save
   */
  async save(data) {
    if (data.id) {
      return await this.model.update(data.id, data);
    } else {
      return await this.model.create(data);
    }
  }

  /**
   * Remove
   */
  async remove(id) {
    return await this.model.delete(id);
  }

  /**
   * Exists
   */
  async exists(criteria) {
    const record = await this.findOne(criteria);
    return !!record;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Database,
    Store,
    QueryBuilder,
    Model,
    Migration,
    Repository
  };
}
