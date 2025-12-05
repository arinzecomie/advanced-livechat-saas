/**
 * Migration: Add fields for Super Admin functionality
 * User management, site control, and enhanced tracking
 */
export async function up(knex) {
  // Add user management fields
  await knex.schema.alterTable('users', (table) => {
    table.enum('status', ['active', 'banned', 'pending']).defaultTo('active');
    table.enum('plan', ['free', 'pro', 'enterprise', 'lifetime']).defaultTo('free');
    table.text('banned_reason');
    table.dateTime('banned_until');
    table.integer('banned_by').unsigned().references('id').inTable('users');
    table.dateTime('banned_at');
    table.integer('password_reset_by').unsigned().references('id').inTable('users');
    table.dateTime('password_reset_at');
    table.integer('lifetime_granted_by').unsigned().references('id').inTable('users');
    table.dateTime('lifetime_granted_at');
    table.integer('downgraded_by').unsigned().references('id').inTable('users');
    table.dateTime('downgraded_at');
    table.text('downgrade_reason');
  });

  // Add site management fields
  await knex.schema.alterTable('sites', (table) => {
    table.boolean('domain_verified').defaultTo(false);
    table.dateTime('domain_verified_at');
    table.integer('domain_verified_by').unsigned().references('id').inTable('users');
    table.text('blocked_reason');
    table.dateTime('blocked_until');
    table.integer('blocked_by').unsigned().references('id').inTable('users');
    table.dateTime('blocked_at');
    table.integer('connection_limit');
    table.dateTime('connection_limit_until');
    table.integer('connection_limit_set_by').unsigned().references('id').inTable('users');
    table.dateTime('connection_limit_set_at');
  });

  // Add payment management fields
  await knex.schema.alterTable('payments', (table) => {
    table.enum('type', ['subscription', 'trial', 'lifetime_grant', 'trial_extension', 'recurring']).defaultTo('subscription');
    table.integer('user_id').unsigned().references('id').inTable('users');
    table.integer('trial_extended_by').unsigned().references('id').inTable('users');
    table.dateTime('trial_extended_at');
    table.integer('granted_by').unsigned().references('id').inTable('users');
    table.integer('canceled_by').unsigned().references('id').inTable('users');
    table.dateTime('canceled_at');
  });
}

export async function down(knex) {
  // Remove user management fields
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('status');
    table.dropColumn('plan');
    table.dropColumn('banned_reason');
    table.dropColumn('banned_until');
    table.dropColumn('banned_by');
    table.dropColumn('banned_at');
    table.dropColumn('password_reset_by');
    table.dropColumn('password_reset_at');
    table.dropColumn('lifetime_granted_by');
    table.dropColumn('lifetime_granted_at');
    table.dropColumn('downgraded_by');
    table.dropColumn('downgraded_at');
    table.dropColumn('downgrade_reason');
  });

  // Remove site management fields
  await knex.schema.alterTable('sites', (table) => {
    table.dropColumn('domain_verified');
    table.dropColumn('domain_verified_at');
    table.dropColumn('domain_verified_by');
    table.dropColumn('blocked_reason');
    table.dropColumn('blocked_until');
    table.dropColumn('blocked_by');
    table.dropColumn('blocked_at');
    table.dropColumn('connection_limit');
    table.dropColumn('connection_limit_until');
    table.dropColumn('connection_limit_set_by');
    table.dropColumn('connection_limit_set_at');
  });

  // Remove payment management fields
  await knex.schema.alterTable('payments', (table) => {
    table.dropColumn('type');
    table.dropColumn('user_id');
    table.dropColumn('trial_extended_by');
    table.dropColumn('trial_extended_at');
    table.dropColumn('granted_by');
    table.dropColumn('canceled_by');
    table.dropColumn('canceled_at');
  });
}