/**
 * Backend README - Detailed backend documentation
 */

# 🔧 Advanced Live Chat SaaS - Backend

Node.js backend API for the Advanced Live Chat SaaS platform.

## 📋 Overview

The backend provides a RESTful API with Socket.IO real-time capabilities for a multi-tenant live chat system. It handles user authentication, site management, visitor tracking, and real-time messaging.

## 🏗️ Architecture

### Design Patterns
- **MVC Architecture**: Controllers, Models, Services separation
- **Repository Pattern**: Models handle data access
- **Service Layer**: Business logic separated from controllers
- **Middleware Pipeline**: Authentication, validation, error handling

### Database Design
- **SQLite** for relational data (users, sites, payments, visitors)
- **MongoDB** for messages (real-time performance)
- **Knex.js** for SQL query building
- **Migrations** for schema versioning

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Database Setup
```bash
# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📁 Directory Structure

```
backend/
├── config/              # Configuration files
│   ├── db.js           # SQLite connection
│   └── mongo.js        # MongoDB connection
├── controllers/        # Request handlers
│   ├── authController.js
│   ├── widgetController.js
│   ├── dashboardController.js
│   └── adminController.js
├── middlewares/        # Express middlewares
│   ├── authGuard.js    # JWT authentication
│   ├── siteGuard.js    # Site validation
│   └── errorHandler.js # Global error handling
├── models/             # Data models
│   ├── BaseModel.js    # Base CRUD operations
│   ├── UserModel.js
│   ├── SiteModel.js
│   ├── VisitorModel.js
│   ├── PaymentModel.js
│   └── MessageModel.js
├── routes/             # API routes
│   ├── auth.js
│   ├── widget.js
│   ├── dashboard.js
│   └── admin.js
├── services/           # Business logic
│   ├── AuthService.js
│   ├── WidgetService.js
│   ├── PaymentService.js
│   └── SocketService.js
├── utils/              # Utility functions
│   ├── Fingerprint.js  # Browser fingerprinting
│   ├── Logger.js       # Logging utility
│   └── TokenManager.js # JWT helpers
├── public/             # Static files
│   ├── widget.js       # Embeddable chat widget
│   └── demo.html       # Demo page
├── migrations/         # Database migrations
└── seeds/              # Database seeds
```

## 🔌 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Widget Endpoints

#### Process Visitor
```http
POST /api/widget/visit
Content-Type: application/json

{
  "siteId": "your-site-id",
  "fingerprint": "visitor-fingerprint",
  "page": "/current-page"
}
```

#### Get Site Status
```http
GET /api/widget/status/:siteId
```

### Dashboard Endpoints

#### Get Dashboard
```http
GET /api/dashboard
Authorization: Bearer <token>
```

#### Get Site Analytics
```http
GET /api/dashboard/sites/:siteId/analytics
Authorization: Bearer <token>
```

#### Get Site Visitors
```http
GET /api/dashboard/sites/:siteId/visitors?page=1&limit=20
Authorization: Bearer <token>
```

### Admin Endpoints

#### System Stats
```http
GET /api/admin/stats
Authorization: Bearer <token>
```

## 🔧 Socket.IO Events

### Client → Server
- `join_site` - Join a site room
- `send_message` - Send chat message
- `typing` - Send typing indicator
- `admin_join` - Admin joins site monitoring
- `close_session` - Close visitor session

### Server → Client
- `new_message` - New message received
- `chat_history` - Chat history for session
- `user_joined` - User joined chat
- `user_left` - User left chat
- `user_typing` - User typing indicator
- `active_sessions` - List of active sessions
- `session_closed` - Session was closed

## 🛡️ Security

### Authentication
- JWT tokens with 7-day expiration
- Password hashing with bcrypt (10 rounds)
- Token refresh capability

### Authorization
- Role-based access control (user/admin)
- Site ownership verification
- Resource-level permissions

### Data Protection
- Input validation with Yup schemas
- SQL injection prevention via Knex
- XSS protection in responses
- CORS configuration

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Sites Table
```sql
CREATE TABLE sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  site_id VARCHAR(255) UNIQUE NOT NULL,
  domain VARCHAR(255) NOT NULL,
  status ENUM('trial', 'active', 'suspended') DEFAULT 'trial',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Visitors Table
```sql
CREATE TABLE visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER REFERENCES sites(id) ON DELETE CASCADE,
  fingerprint VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  meta JSON,
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_id, fingerprint)
);
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Smoke Tests
```bash
npm run test:smoke
```

## 🚀 Deployment

### Environment Variables
```env
PORT=3000
DATABASE_URL=sqlite://./prod.sqlite3
MONGO_URI=mongodb://localhost:27017/advanced-livechat
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
```

### PM2 Configuration
```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs backend
```

## 📈 Performance

### Optimization Strategies
- Database indexing on frequently queried columns
- Connection pooling for database connections
- Socket.IO room-based message broadcasting
- Redis caching (optional, implement as needed)

### Monitoring
- Health check endpoint: `GET /health`
- PM2 monitoring and alerting
- Application performance metrics

## 🔍 Debugging

### Development Mode
```bash
NODE_ENV=development npm run dev
```

### Logging
- Request logging with Morgan
- Error logging with Winston
- Debug logs with custom Logger utility

### Common Issues
1. **Database Connection**: Check DATABASE_URL format
2. **MongoDB Connection**: Falls back to in-memory storage
3. **Socket.IO CORS**: Configured for all origins in development

## 🤝 Contributing

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Submit pull requests with clear descriptions

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Knex.js Documentation](https://knexjs.org/)
- [JWT Documentation](https://jwt.io/)

---

For more information, see the main project README.