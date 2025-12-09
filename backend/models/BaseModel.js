/**
 * Base Model class with common CRUD operations
 * All models extend this class for consistent database operations
 */
import { getDatabase } from '../config/database-provider.js';

export default class BaseModel {
  constructor(tableName) {
    this.table = tableName;
  }
  
  // Get database instance
  get db() {
    return getDatabase();
  }

  // Create
  async create(data) {
    const [id] = await this.db(this.table).insert(data);
    return this.findById(id);
  }

  // Read
  async findById(id) {
    return this.db(this.table).where({ id }).first();
  }

  async findAll(conditions = {}) {
    return this.db(this.table).where(conditions);
  }

  async findOne(conditions = {}) {
    return this.db(this.table).where(conditions).first();
  }

  // Update
  async update(id, data) {
    await this.db(this.table).where({ id }).update(data);
    return this.findById(id);
  }

  // Delete
  async delete(id) {
    return this.db(this.table).where({ id }).del();
  }

  // Count
  async count(conditions = {}) {
    const result = await this.db(this.table).where(conditions).count('* as count').first();
    return parseInt(result.count);
  }

  // Raw query access (use sparingly)
  getQuery() {
    return this.db(this.table);
  }
}