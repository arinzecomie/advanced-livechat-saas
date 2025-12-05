/**
 * Migration: Create visitors and messages tables
 * Visitors are tracked per site, messages stored in MongoDB but referenced here
 */
export async function up(knex) {
  // Visitors table
  await knex.schema.createTable('visitors', (table) => {
    table.increments('id').primary();
    table.integer('site_id').unsigned().references('id').inTable('sites').onDelete('CASCADE');
    table.string('fingerprint').notNullable(); // Browser fingerprint
    table.string('ip_address');
    table.json('meta'); // Browser info, referrer, etc.
    table.dateTime('last_seen');
    table.timestamps(true, true);
    
    // Composite index for efficient lookups
    table.unique(['site_id', 'fingerprint']);
  });

  // Messages reference table (actual messages in MongoDB)
  await knex.schema.createTable('messages', (table) => {
    table.increments('id').primary();
    table.integer('site_id').unsigned().references('id').inTable('sites').onDelete('CASCADE');
    table.string('session_id').notNullable();
    table.enum('sender', ['visitor', 'admin']).notNullable();
    table.text('text').notNullable();
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index(['site_id', 'session_id']);
    table.index('created_at');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('visitors');
}