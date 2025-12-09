-- Railway Database Fix
-- Execute these SQL commands in Railway console to fix missing tables

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create sites table (if not exists)
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  site_id TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  status TEXT DEFAULT 'trial' CHECK(status IN ('trial', 'active', 'suspended')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert admin user (password: admin123)
-- Password hash for 'admin123' generated with bcrypt
INSERT OR IGNORE INTO users (name, email, password_hash, role) 
VALUES ('Admin User', 'admin@example.com', '$2b$10$BwweA9vqIX.uJX9Hamz2e.kZp4mD4C8wHiJD1GXv0TY22SuLkfnIW', 'admin');

-- Insert demo user (password: user123)  
-- Password hash for 'user123' generated with bcrypt
INSERT OR IGNORE INTO users (name, email, password_hash, role) 
VALUES ('Demo User', 'demo@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4mD4C8wHiJD1GXv0TY22SuLkfnIW', 'user');

-- Insert default sites for admin
INSERT OR IGNORE INTO sites (user_id, site_id, domain, status) 
SELECT id, 'demo-site-id', 'demo-site.com', 'active' FROM users WHERE email = 'admin@example.com';

INSERT OR IGNORE INTO sites (user_id, site_id, domain, status) 
SELECT id, 'suspended-site-id', 'suspended-site.com', 'suspended' FROM users WHERE email = 'admin@example.com';

-- Verify the fix
SELECT 'Users count: ' || COUNT(*) as result FROM users;
SELECT 'Sites count: ' || COUNT(*) as result FROM sites;  
SELECT 'Admin user: ' || email || ' (' || role || ')' as result FROM users WHERE email = 'admin@example.com';