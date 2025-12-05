/**
 * Frontend README - Detailed frontend documentation
 */

# 🎨 Advanced Live Chat SaaS - Frontend

React-based dashboard for the Advanced Live Chat SaaS platform.

## 📋 Overview

The frontend provides a modern, responsive dashboard for managing live chat sites, viewing analytics, and engaging with visitors in real-time. Built with React 18, React Query, and Bootstrap 5.

## 🏗️ Architecture

### Design Patterns
- **Component-based Architecture**: Reusable React components
- **Custom Hooks**: Logic extraction and reusability
- **API Layer**: Centralized HTTP client with interceptors
- **Form Validation**: React Hook Form with Yup schemas
- **State Management**: React Query for server state, React state for UI

### Technology Stack
- **React 18** with hooks
- **React Router** for navigation
- **React Query** for data fetching and caching
- **React Hook Form** with Yup validation
- **Bootstrap 5** for styling
- **Socket.IO Client** for real-time updates
- **Vite** for build tooling

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Directory Structure

```
frontend/
├── src/
│   ├── api/              # API clients and React Query hooks
│   │   ├── axiosClient.js
│   │   ├── authAPI.js
│   │   ├── dashboardAPI.js
│   │   └── chatAPI.js
│   ├── components/       # Reusable React components
│   │   ├── forms/        # Form components
│   │   ├── ChatPanel/    # Chat interface
│   │   ├── VisitorsList.jsx
│   │   └── Navbar.jsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useVisitors.js
│   │   └── useChat.js
│   ├── pages/            # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   └── Admin.jsx
│   ├── validation/       # Form validation schemas
│   │   ├── loginSchema.js
│   │   └── signupSchema.js
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── public/               # Static assets
└── vite.config.js        # Vite configuration
```

## 🔌 API Integration

### Axios Client Configuration
- Base URL configuration
- Request/response interceptors
- Authentication token handling
- Error handling and redirects

### React Query Setup
- Global configuration
- Query caching strategies
- Error boundaries
- Optimistic updates

## 🧩 Components

### Authentication Components
- **LoginForm**: Email/password login with validation
- **SignupForm**: User registration with password confirmation

### Dashboard Components
- **VisitorsList**: Visitor analytics and management
- **ChatPanel**: Real-time chat interface
- **Navbar**: Navigation with authentication state

### Page Components
- **Home**: Landing page with features overview
- **Login/Signup**: Authentication pages
- **Dashboard**: Main user dashboard
- **Admin**: Administrative panel

## 🎨 Styling

### Bootstrap 5 Integration
- Custom theme colors
- Responsive breakpoints
- Utility classes
- Component customization

### Custom Styles
- CSS variables for theming
- Component-specific styles
- Animation and transitions
- Dark mode support (planned)

## 🔒 Authentication

### JWT Token Management
- Automatic token attachment
- Token expiration handling
- Refresh token logic
- Logout functionality

### Protected Routes
- Route guards based on authentication
- Role-based access control
- Redirect handling

## 📱 Responsive Design

### Breakpoints
- Mobile: < 576px
- Tablet: 576px - 768px
- Desktop: > 768px

### Mobile Optimizations
- Touch-friendly interfaces
- Swipe gestures (planned)
- Optimized chat interface
- Progressive Web App (planned)

## 🚀 Performance

### Code Splitting
- Route-based code splitting
- Component lazy loading
- Dynamic imports

### Optimization Strategies
- Image optimization
- Bundle size monitoring
- Tree shaking
- Production builds with Vite

### Caching
- React Query caching
- Static asset caching
- API response caching

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Component Testing
```bash
npm run test:components
```

### E2E Testing
```bash
npm run test:e2e
```

## 🌍 Environment Configuration

### Development
```bash
VITE_API_URL=http://localhost:3000/api
```

### Production
```bash
VITE_API_URL=https://your-api-domain.com/api
```

### Environment Variables
- API base URL configuration
- Feature flags
- Analytics keys
- Error reporting

## 📈 Analytics & Monitoring

### Planned Features
- User behavior analytics
- Performance monitoring
- Error tracking
- Real user monitoring

## 🔧 Development Workflow

### Code Style
- ESLint configuration
- Prettier formatting
- Consistent naming conventions
- Component documentation

### Git Workflow
- Feature branch workflow
- Commit message conventions
- Pull request templates
- Code review process

## 🚀 Deployment

### Build Process
```bash
# Development build
npm run build

# Production build with optimizations
npm run build:prod
```

### Deployment Options
- **Static hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: CloudFlare, AWS CloudFront
- **Container**: Docker, Kubernetes

### Environment Setup
```bash
# Install dependencies
npm ci --only=production

# Build for production
npm run build

# Serve static files
npm run preview
```

## 🔍 Debugging

### Development Tools
- React DevTools
- Redux DevTools (if using Redux)
- React Query DevTools
- Browser DevTools

### Error Boundaries
- Global error boundary
- Route-level error handling
- Component error states

### Logging
- Development logging
- Error tracking
- User feedback collection

## 🤝 Contributing

### Component Guidelines
1. Use functional components with hooks
2. Follow naming conventions
3. Add PropTypes or TypeScript
4. Include component tests
5. Document component API

### State Management
1. Use React Query for server state
2. Use React state for UI state
3. Consider Context for global state
4. Avoid prop drilling

### Performance
1. Use React.memo for expensive components
2. Optimize re-renders with useMemo/useCallback
3. Implement virtual scrolling for large lists
4. Monitor bundle size

## 📚 Additional Resources

- [React Documentation](https://reactjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Bootstrap Documentation](https://getbootstrap.com/docs/5.3/)
- [Vite Documentation](https://vitejs.dev/)

---

For more information, see the main project README.