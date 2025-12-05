/**
 * Optimized Database Configuration
 * 
 * Enhanced database configuration with:
 * - Connection pooling
 * - Performance monitoring
 * - Error handling
 * - Query optimization
 */

const knex = require('knex');
const { config } = require('./app');

// Database configuration
const dbConfig = {
  client: 'sqlite3',
  connection: {
    filename: config.database.sqlite.filename
  },
  useNullAsDefault: true,
  
  // Connection pool configuration
  pool: {
    min: config.database.sqlite.pool.min,
    max: config.database.sqlite.pool.max,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
    propagateCreateError: false
  },
  
  // Query performance monitoring
  postProcessResponse: (result, queryContext) => {
    if (config.server.nodeEnv === 'development') {
      const duration = queryContext.__duration;
      if (duration > 1000) {
        console.warn(`⚠️ Slow query detected: ${duration}ms`);
        console.warn(`Query: ${queryContext.sql}`);
      }
    }
    return result;
  },
  
  // Query execution time tracking
  wrapIdentifier: (value, origImpl, queryContext) => {
    queryContext.__startTime = Date.now();
    return origImpl(value);
  },
  
  // Post-query processing
  postProcessResponse: (result, queryContext) => {
    if (queryContext.__startTime) {
      queryContext.__duration = Date.now() - queryContext.__startTime;
      
      if (config.logging.level === 'debug') {
        console.debug(`⏱️ Query executed in ${queryContext.__duration}ms`);
      }
    }
    return result;
  }
};

// Create database instance
const db = knex(dbConfig);

// Database utilities and helpers
const dbHelpers = {
  /**
   * Execute a transaction with automatic retry
   */
  async transactionAsync(callback, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await db.transaction(callback);
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        console.warn(`Transaction attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
  },
  
  /**
   * Batch insert with optimization
   */
  async batchInsert(table, data, chunkSize = 1000) {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    
    const results = [];
    for (const chunk of chunks) {
      const inserted = await db(table).insert(chunk);
      results.push(...inserted);
    }
    
    return results;
  },
  
  /**
   * Optimized count query
   */
  async countOptimized(table, conditions = {}) {
    const query = db(table).count('* as count');
    
    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.where(key, value);
      }
    });
    
    const result = await query.first();
    return result ? result.count : 0;
  },
  
  /**
   * Optimized pagination query
   */
  async paginate(table, options = {}) {
    const {
      page = 1,
      limit = 20,
      conditions = {},
      orderBy = 'created_at',
      order = 'desc',
      select = '*'
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Build base query
    let query = db(table).select(select);
    
    // Apply conditions
    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query.whereIn(key, value);
        } else if (typeof value === 'object' && value.op) {
          // Handle operators like { op: '>', value: 10 }
          query.where(key, value.op, value.value);
        } else {
          query.where(key, value);
        }
      }
    });
    
    // Get total count
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');
    
    // Get paginated results
    const results = await query
      .orderBy(orderBy, order)
      .limit(limit)
      .offset(offset);
    
    return {
      data: results,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        pages: Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    };
  },
  
  /**
   * Optimized upsert operation
   */
  async upsert(table, data, conflictColumns) {
    const insertData = Array.isArray(data) ? data : [data];
    
    // For SQLite, we need to handle upsert differently
    if (insertData.length === 1) {
      // Single record - use insert or ignore + update
      const record = insertData[0];
      const whereClause = {};
      
      conflictColumns.forEach(col => {
        whereClause[col] = record[col];
      });
      
      // Try to find existing record
      const existing = await db(table).where(whereClause).first();
      
      if (existing) {
        // Update existing record
        await db(table).where(whereClause).update(record);
        return existing.id;
      } else {
        // Insert new record
        const [id] = await db(table).insert(record);
        return id;
      }
    } else {
      // Multiple records - use transaction
      return await this.transactionAsync(async (trx) => {
        const results = [];
        
        for (const record of insertData) {
          const whereClause = {};
          conflictColumns.forEach(col => {
            whereClause[col] = record[col];
          });
          
          const existing = await trx(table).where(whereClause).first();
          
          if (existing) {
            await trx(table).where(whereClause).update(record);
            results.push(existing.id);
          } else {
            const [id] = await trx(table).insert(record);
            results.push(id);
          }
        }
        
        return results;
      });
    }
  },
  
  /**
   * Get database statistics
   */
  async getStats() {
    const tables = ['users', 'sites', 'visitors', 'messages', 'payments'];
    const stats = {};
    
    for (const table of tables) {
      try {
        const [result] = await db(table).count('* as count');
        stats[table] = parseInt(result.count);
      } catch (error) {
        stats[table] = 0;
      }
    }
    
    return stats;
  },
  
  /**
   * Health check
   */
  async healthCheck() {
    try {
      await db.raw('SELECT 1');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        error: error.message 
      };
    }
  },
  
  /**
   * Close database connection
   */
  async close() {
    if (db.client) {
      await db.client.destroy();
    }
  }
};

// Export database instance and helpers
module.exports = {
  db,
  dbHelpers,
  
  // Convenience exports
  transactionAsync: dbHelpers.transactionAsync,
  batchInsert: dbHelpers.batchInsert,
  countOptimized: dbHelpers.countOptimized,
  paginate: dbHelpers.paginate,
  upsert: dbHelpers.upsert,
  getStats: dbHelpers.getStats,
  healthCheck: dbHelpers.healthCheck,
  close: dbHelpers.close
};