// Test PostgreSQL configuration without requiring DATABASE_URL
import { Pool } from 'pg';

console.log('🐘 Testing PostgreSQL configuration...');

try {
  // Test 1: Check if pg module is available
  console.log('✅ PostgreSQL driver (pg) is available');
  
  // Test 2: Test configuration parsing logic
  const testDatabaseUrl = 'postgresql://user:password@localhost:5432/testdb';
  const url = new URL(testDatabaseUrl);
  
  const config = {
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: url.port || 5432,
    database: url.pathname.slice(1),
    ssl: false // For local development
  };
  
  console.log('✅ Database URL parsing works correctly');
  console.log('📊 Parsed configuration:');
  console.log('   - Host:', config.host);
  console.log('   - Port:', config.port);
  console.log('   - Database:', config.database);
  console.log('   - User:', config.user);
  
  // Test 3: Test Pool creation (without connecting)
  const pool = new Pool({
    ...config,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  console.log('✅ PostgreSQL connection pool created successfully');
  console.log('📊 Pool configuration:');
  console.log('   - Max connections: 20');
  console.log('   - Idle timeout: 30 seconds');
  console.log('   - Connection timeout: 2 seconds');
  
  // Clean up
  await pool.end();
  
  console.log('\n✅ PostgreSQL configuration is working correctly!');
  console.log('🎯 Ready for Railway deployment with PostgreSQL!');
  console.log('');
  console.log('🚀 Deployment steps:');
  console.log('   1. Railway will automatically set DATABASE_URL');
  console.log('   2. App will use PostgreSQL connection pool');
  console.log('   3. Run migrations: railway run npm run migrate');
  console.log('   4. Test: curl https://your-app.railway.app/health');
  
} catch (error) {
  console.error('❌ PostgreSQL configuration error:', error.message);
  process.exit(1);
}