/**
 * Base Model class with common CRUD operations
 * All models extend this class for consistent database operations
 */
import db from '../config/db.js';

export default class BaseModel {
  constructor(tableName) {
    this.table = tableName;
  }

  // Create
  async create(data) {
    const [id] = await db(this.table).insert(data);
    return this.findById(id);
  }

  // Read
  async findById(id) {
    return db(this.table).where({ id }).first();
  }

  async findAll(conditions = {}) {
    return db(this.table).where(conditions);
  }

  async findOne(conditions = {}) {
    return db(this.table).where(conditions).first();
  }

  // Update
  async update(id, data) {
    await db(this.table).where({ id }).update(data);
    return this.findById(id);
  }

  // Delete
  async delete(id) {
    return db(this.table).where({ id }).del();
  }

  // Count
  async count(conditions = {}) {
    const result = await db(this.table).where(conditions).count('* as count').first();
    return parseInt(result.count);
  }

  // Raw query access (use sparingly)
  getQuery() {
    return db(this.table);
  }
}