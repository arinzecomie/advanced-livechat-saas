/**
 * Seed initial data: admin user and demo sites
 * Creates test data for immediate development use
 */
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../config/database-provider.js';

export async function seed() {
  console.log('🌱 Seeding initial data...');
  
  // Get database instance
  const db = getDatabase();
  
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const [adminUserId] = await db('users').insert({
    name: 'Admin User',
    email: 'admin@example.com',
    password_hash: adminPassword,
    role: 'admin'
  });

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);
  const [regularUserId] = await db('users').insert({
    name: 'Demo User',
    email: 'demo@example.com',
    password_hash: userPassword,
    role: 'user'
  });

  // Create demo sites
  const demoSiteId = uuidv4();
  const suspendedSiteId = uuidv4();
  
  await db('sites').insert([
    {
      user_id: regularUserId,
      site_id: demoSiteId,
      domain: 'demo-site.com',
      status: 'active'
    },
    {
      user_id: regularUserId,
      site_id: suspendedSiteId,
      domain: 'suspended-site.com',
      status: 'suspended'
    }
  ]);

  // Create a payment for the active site
  const [activeSite] = await db('sites').where({ site_id: demoSiteId });
  await db('payments').insert({
    site_id: activeSite.id,
    amount: 29.99,
    currency: 'USD',
    status: 'completed',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  });

  console.log('✅ Seeding completed!');
  console.log('👤 Admin login: admin@example.com / admin123');
  console.log('👤 Demo login: demo@example.com / user123');
  console.log('🎯 Demo site ID:', demoSiteId);
  console.log('🚫 Suspended site ID:', suspendedSiteId);
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}