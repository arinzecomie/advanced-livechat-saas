/**
 * PM2 Ecosystem Configuration
 * Production process management for Node.js applications
 */
module.exports = {
  apps: [
    {
      name: 'advanced-livechat-backend',
      script: 'server.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        watch: true,
        ignore_watch: ['node_modules', 'dev.sqlite3', '*.log']
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true
    },
    {
      name: 'advanced-livechat-frontend',
      script: 'node_modules/vite/bin/vite.js',
      cwd: './frontend',
      args: 'build && vite preview --port 5173',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        VITE_API_URL: 'http://localhost:3000/api'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      max_memory_restart: '300M'
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/advanced-livechat-saas.git',
      path: '/var/www/advanced-livechat-saas',
      'pre-deploy-local': '',
      'post-deploy': 'cd backend && npm install && npm run migrate && cd ../frontend && npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}