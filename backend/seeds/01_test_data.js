import bcrypt from 'bcryptjs';

export async function seed(knex) {
  // Clean up existing data
  await knex('messages').del();
  await knex('visitors').del();
  await knex('sites').del();
  await knex('users').del();

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('user123', 10);

  // Insert users
  const users = await knex('users').insert([
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password_hash: adminPasswordHash,
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Test User',
      email: 'user@example.com',
      password_hash: userPasswordHash,
      role: 'user',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]).returning('id');

  // Insert sites
  const sites = await knex('sites').insert([
    {
      user_id: users[0].id,
      site_id: 'demo-site-1',
      domain: 'demo1.example.com',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      user_id: users[1].id,
      site_id: 'demo-site-2',
      domain: 'demo2.example.com',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]).returning('id');

  // Insert visitors
  const visitors = await knex('visitors').insert([
    {
      site_id: sites[0].id,
      visitor_id: 'visitor-001',
      name: 'John Doe',
      email: 'john@example.com',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      current_page: 'https://demo1.example.com/contact',
      geolocation: JSON.stringify({ country: 'US', city: 'New York' }),
      status: 'online',
      last_seen: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      site_id: sites[0].id,
      visitor_id: 'visitor-002',
      name: 'Jane Smith',
      email: 'jane@example.com',
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      current_page: 'https://demo1.example.com/products',
      geolocation: JSON.stringify({ country: 'UK', city: 'London' }),
      status: 'offline',
      last_seen: new Date(Date.now() - 300000), // 5 minutes ago
      created_at: new Date(),
      updated_at: new Date()
    }
  ]).returning('id');

  // Insert messages
  await knex('messages').insert([
    {
      site_id: sites[0].id,
      visitor_id: visitors[0].id,
      user_id: users[0].id,
      sender_type: 'visitor',
      content: 'Hello! I need help with your product.',
      status: 'read',
      created_at: new Date(Date.now() - 600000), // 10 minutes ago
      updated_at: new Date()
    },
    {
      site_id: sites[0].id,
      visitor_id: visitors[0].id,
      user_id: users[0].id,
      sender_type: 'user',
      content: 'Hi John! I\'d be happy to help. What would you like to know?',
      status: 'delivered',
      created_at: new Date(Date.now() - 590000), // 9:50 minutes ago
      updated_at: new Date()
    },
    {
      site_id: sites[0].id,
      visitor_id: visitors[0].id,
      sender_type: 'visitor',
      content: 'Can you tell me about the pricing for small businesses?',
      status: 'read',
      created_at: new Date(Date.now() - 580000), // 9:40 minutes ago
      updated_at: new Date()
    }
  ]);

  console.log('✅ PostgreSQL test data seeded successfully!');
}