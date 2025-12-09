-- Railway Database Initialization Script
-- Creates missing tables and default data

-- Check if users table exists
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Check if sites table exists  
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

-- Check if visitors table exists
CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER,
  visitor_id TEXT NOT NULL,
  fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_info TEXT,
  last_pages TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Check if payments table exists
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES 
('Admin User', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert demo user (password: user123)  
INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES 
('Demo User', 'demo@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');

-- Insert default sites for admin
INSERT OR IGNORE INTO sites (user_id, site_id, domain, status) VALUES 
(1, 'demo-site-id', 'demo-site.com', 'active'),
(1, 'suspended-site-id', 'suspended-site.com', 'suspended');

-- Insert demo site for demo user
INSERT OR IGNORE INTO sites (user_id, site_id, domain, status) VALUES 
(2, 'demo-user-site', 'demo-user-site.com', 'trial');

-- Verify data
SELECT 'Users count: ' || COUNT(*) as result FROM users;
SELECT 'Sites count: ' || COUNT(*) as result FROM sites;