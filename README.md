/**
 * Advanced Live Chat SaaS - Main README
 * Complete multi-tenant live chat solution
 */

# 🚀 Advanced Live Chat SaaS

A production-ready, multi-tenant live chat SaaS platform built with Node.js, React, and Socket.IO. Features real-time messaging, visitor analytics, subscription management, and an embeddable widget for any website.

## ✨ Features

- **⚡ Real-time Messaging**: Instant message delivery with Socket.IO
- **🔒 Multi-tenant Security**: Isolated chat environments with JWT authentication
- **📊 Visitor Analytics**: Track visitor activity and engagement metrics
- **💳 Subscription Management**: Trial, active, and suspended site states
- **🎨 Embeddable Widget**: Easy integration with any website
- **📱 Responsive Design**: Works on desktop, tablet, and mobile
- **🔧 Admin Dashboard**: System-wide management and monitoring
- **🚀 Easy Deployment**: Railway-ready with PM2 configuration

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **Socket.IO** for real-time communication
- **SQLite** with Knex.js (easily extensible to PostgreSQL/MySQL)
- **MongoDB** for message storage (with fallback to in-memory)
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** with Yup validation
- **Bootstrap 5** for styling
- **Socket.IO Client** for real-time updates

### Infrastructure
- **PM2** for process management
- **Nginx** for reverse proxy (sample config included)
- **Railway** deployment ready

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- MongoDB (optional, falls back to in-memory storage)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd advanced-livechat-saas
   ```

2. **Setup backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run migrate
   npm run seed
   ```

3. **Setup frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000
   - Demo: http://localhost:3000/demo.html

## 🔐 Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
DATABASE_URL=sqlite://./dev.sqlite3
MONGO_URI=mongodb://localhost:27017/advanced-livechat
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

## 👤 Default Credentials

After running the seed script, you can login with:

- **Admin**: admin@example.com / admin123
- **Demo User**: demo@example.com / user123

Demo sites created:
- **Active Site**: `demo-site-id` (working chat)
- **Suspended Site**: `suspended-site-id` (blocked chat)

## 🔧 Widget Integration

Add the widget to any website:

```html
<!-- Add this to your HTML -->
<script src="https://your-server.com/widget.js"></script>
<script>
  window.LiveChatConfig = {
    siteId: 'your-site-id-here',
    serverUrl: 'https://your-server.com'
  };
</script>
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Widget
- `POST /api/widget/visit` - Register visitor
- `GET /api/widget/status/:siteId` - Check site status
- `GET /api/widget/config/:siteId` - Get site configuration

### Dashboard
- `GET /api/dashboard` - Get user dashboard (protected)
- `GET /api/dashboard/sites/:siteId/analytics` - Site analytics (protected)
- `GET /api/dashboard/sites/:siteId/visitors` - Site visitors (protected)

### Admin
- `GET /api/admin/stats` - System statistics (admin only)
- `GET /api/admin/users` - List all users (admin only)
- `GET /api/admin/sites` - List all sites (admin only)

## 🚀 Deployment

### Railway Deployment
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Manual Deployment with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start both frontend and backend
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Nginx Configuration
Use the provided `nginx.conf` as a starting point for your reverse proxy setup.

## 🧪 Testing

Run the smoke test to verify basic functionality:
```bash
cd backend
npm run dev &
sleep 5
cd ..
bash scripts/smoke_test.sh
```

## 📁 Project Structure

```
advanced-livechat-saas/
├── backend/                  # Node.js API server
│   ├── config/              # Database configurations
│   ├── controllers/         # Route controllers
│   ├── middlewares/         # Express middlewares
│   ├── migrations/          # Database migrations
│   ├── models/              # Data models
│   ├── public/              # Static files (widget.js, demo.html)
│   ├── routes/              # API routes
│   ├── seeds/               # Database seeds
│   ├── services/            # Business logic
│   └── utils/               # Utility functions
├── frontend/                # React dashboard
│   ├── src/
│   │   ├── api/             # API clients
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   └── validation/      # Form validation schemas
├── scripts/                 # Utility scripts
├── ecosystem.config.js      # PM2 configuration
├── nginx.conf              # Nginx configuration
└── README.md               # This file
```

## 🔍 Monitoring & Logs

### PM2 Logs
```bash
# View logs
pm2 logs

# View specific app logs
pm2 logs advanced-livechat-backend
pm2 logs advanced-livechat-frontend

# Monitor resources
pm2 monit
```

### Application Health
Check the health endpoint: `GET /health`

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation with Yup
- SQL injection prevention with Knex
- XSS protection
- Rate limiting (implement as needed)

## 🎯 Roadmap

- [ ] File upload support
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] Webhook integrations
- [ ] Multi-language support
- [ ] Advanced widget customization
- [ ] Team collaboration features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

**Built with ❤️ by the Advanced Live Chat Team**