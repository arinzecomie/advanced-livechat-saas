export async function up(knex) {
  // Get database type
  const client = knex.client.config.client;
  const isPostgreSQL = client === 'postgresql' || client === 'pg';
  const isSQLite = client === 'sqlite3';
  
  console.log(`🔧 Running migration for ${client} database...`);

  // Only create PostgreSQL extensions if using PostgreSQL
  if (isPostgreSQL) {
    try {
      await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✅ PostgreSQL UUID extension created');
    } catch (error) {
      console.log('⚠️  Could not create UUID extension (may already exist)');
    }
  }

  // Users table - compatible with both SQLite and PostgreSQL
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.enu('role', ['user', 'admin']).defaultTo('user'); // Use enu instead of enum for compatibility
    table.timestamps(true, true);
  });

  // Sites table
  await knex.schema.createTable('sites', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.string('site_id', 50).notNullable().unique();
    table.string('domain', 255).notNullable();
    table.enu('status', ['trial', 'active', 'suspended']).defaultTo('trial'); // Use enu for compatibility
    table.timestamps(true, true);
  });

  // Visitors table
  await knex.schema.createTable('visitors', (table) => {
    table.increments('id').primary();
    table.integer('site_id').unsigned().references('id').inTable('sites').onDelete('CASCADE');
    table.string('visitor_id', 50).notNullable();
    table.string('name', 255);
    table.string('email', 255);
    table.string('ip_address', 45);
    table.string('user_agent', 1000);
    table.string('current_page', 1000);
    
    // Use different JSON types based on database
    if (isPostgreSQL) {
      table.jsonb('geolocation');
    } else {
      table.json('geolocation');
    }
    
    table.enu('status', ['online', 'offline']).defaultTo('offline'); // Use enu for compatibility
    table.timestamp('last_seen');
    table.timestamps(true, true);
    
    table.unique(['site_id', 'visitor_id']);
  });

  // Messages table
  await knex.schema.createTable('messages', (table) => {
    table.increments('id').primary();
    table.integer('site_id').unsigned().references('id').inTable('sites').onDelete('CASCADE');
    table.integer('visitor_id').unsigned().references('id').inTable('visitors').onDelete('CASCADE');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.enu('sender_type', ['visitor', 'user']).notNullable(); // Use enu for compatibility
    table.text('content').notNullable();
    
    // Use different JSON types based on database
    if (isPostgreSQL) {
      table.jsonb('attachments');
    } else {
      table.json('attachments');
    }
    
    table.enu('status', ['sent', 'delivered', 'read']).defaultTo('sent'); // Use enu for compatibility
    table.timestamps(true, true);
  });

  // Create indexes - use different syntax for different databases
  if (isPostgreSQL) {
    // PostgreSQL indexes
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_visitors_site_id ON visitors(site_id)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_messages_site_id ON messages(site_id)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_messages_visitor_id ON messages(visitor_id)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)');
  } else {
    // SQLite indexes (simpler syntax)
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_visitors_site_id ON visitors(site_id)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_messages_site_id ON messages(site_id)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_messages_visitor_id ON messages(visitor_id)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)');
  }

  console.log(`✅ Migration completed for ${client} database`);
}

export async function down(knex) {
  console.log('🔧 Rolling back migration...');
  
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('visitors');
  await knex.schema.dropTableIfExists('sites');
  await knex.schema.dropTableIfExists('users');
  
  console.log('✅ Migration rollback completed');
}