/**
 * Migration: Create users, sites, and payments tables
 * Multi-tenant structure with users owning multiple sites
 */
export async function up(knex) {
  // Users table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.enum('role', ['user', 'admin']).defaultTo('user');
    table.timestamps(true, true);
  });

  // Sites table
  await knex.schema.createTable('sites', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.string('site_id').notNullable().unique(); // UUID for widget
    table.string('domain').notNullable();
    table.enum('status', ['trial', 'active', 'suspended']).defaultTo('trial');
    table.timestamps(true, true);
  });

  // Payments table
  await knex.schema.createTable('payments', (table) => {
    table.increments('id').primary();
    table.integer('site_id').unsigned().references('id').inTable('sites').onDelete('CASCADE');
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('USD');
    table.enum('status', ['pending', 'completed', 'failed']).defaultTo('pending');
    table.dateTime('expires_at');
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('sites');
  await knex.schema.dropTableIfExists('users');
}