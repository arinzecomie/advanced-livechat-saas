import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const parseDatabaseUrl = (databaseUrl) => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
  }
  
  const url = new URL(databaseUrl);
  return {
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: url.port || 5432,
    database: url.pathname.slice(1),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
};

async function testPostgreSQL() {
  console.log('🐘 Testing PostgreSQL connection...');
  
  let pool;
  
  try {
    // Test connection
    pool = new Pool(parseDatabaseUrl(process.env.DATABASE_URL));
    
    const client = await pool.connect();
    console.log('✅ PostgreSQL connection successful!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ PostgreSQL query successful:', result.rows[0]);
    
    // Test table creation
    await client.query('DROP TABLE IF EXISTS test_users');
    await client.query(`
      CREATE TABLE test_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ PostgreSQL table creation successful');
    
    // Test data insertion
    const passwordHash = await bcrypt.hash('test123', 10);
    const insertResult = await client.query(
      'INSERT INTO test_users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      ['Test User', 'test@example.com', passwordHash]
    );
    console.log('✅ PostgreSQL data insertion successful, ID:', insertResult.rows[0].id);
    
    // Test data retrieval
    const selectResult = await client.query('SELECT * FROM test_users WHERE email = $1', ['test@example.com']);
    console.log('✅ PostgreSQL data retrieval successful:', selectResult.rows[0]);
    
    // Test password verification
    const isValidPassword = await bcrypt.compare('test123', selectResult.rows[0].password_hash);
    console.log('✅ PostgreSQL password verification successful:', isValidPassword);
    
    // Cleanup
    await client.query('DROP TABLE test_users');
    
    client.release();
    console.log('✅ PostgreSQL test completed successfully!');
    
  } catch (error) {
    console.error('❌ PostgreSQL test failed:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run test
testPostgreSQL();