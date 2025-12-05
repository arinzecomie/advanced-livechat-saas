# Super Admin Dashboard Guide

## Overview

The Super Admin Dashboard provides complete platform management and control capabilities for system administrators. It includes advanced features for user management, site control, subscription management, system communication, and content compliance.

## Features

### 1. User & Tenant Management 👥

**View All Users**
- Master table showing ID, Name, Email, Registration Date, Plan Type (Free/Pro/Enterprise/Lifetime), and Status
- Advanced search and filtering capabilities
- Export user data functionality

**User Actions:**
- **Ban/Suspend User**: Instantly revoke access with optional duration and reason
- **Impersonate User (God Mode)**: "Login as this User" button to see exactly what the user sees
- **Manual Password Reset**: Trigger password reset email or set temporary password
- **Edit User Details**: Update email address, name, plan, or role

### 2. Site & Domain Control 🌐

**View All Sites**
- Complete list of all websites using your widget
- Shows domain, site ID, owner, status, verification state, and message count
- Advanced filtering by status, verification, and search

**Site Actions:**
- **Block/Blacklist Domain**: "Kill Switch" for problematic domains
- **Verify Domain Ownership**: Manual verification when automated DNS verification fails
- **Limit Widget Connections**: Throttle concurrent connections for specific sites

### 3. Subscription & Revenue Management 💰

**Subscription Management**
- View all subscription statuses (Active, Past Due, Canceled, Trial)
- Filter by user, status, and date range

**Revenue Actions:**
- **Grant Lifetime Access**: Upgrade users to "Pro" forever without payment
- **Extend Free Trial**: Manually add days to trial periods
- **Force Downgrade/Cancel**: Manually cancel subscriptions and revert to Free tier

**Revenue Analytics:**
- Monthly Recurring Revenue (MRR) tracking
- Churn rate analysis
- Revenue trends and subscription metrics

### 4. System & Communication 📢

**Global Announcements**
- Create system-wide announcements with customizable duration
- Target specific user groups (all users, admins only, etc.)

**Push Notifications**
- Send system messages to all active chat widgets
- Priority levels and message types
- ⚠️ Use with extreme caution - affects all customers

**Maintenance Mode**
- Toggle system-wide maintenance mode
- Custom maintenance messages
- Scheduled maintenance with automatic expiration

### 5. Content & Compliance 🛡️

**Storage Management**
- View global storage usage by file type and user tier
- Monitor growth trends

**Data Management**
- **Purge Old Data**: Delete chat logs older than X days
- Target specific user tiers (Free users, All users)
- Dry-run mode to preview deletions

**Content Moderation**
- Review reported chats and messages
- Take action on reported content
- Track moderation history

## Dashboard Interface

### Main Data Grid

The main dashboard displays a comprehensive table with:

| User | Email | Sites | Plan | Status | Actions |
|------|-------|-------|------|--------|---------|
| John Doe | john@gmail.com | 3 | Pro ✅ | Active | [Login As] [Edit] [Ban] |
| Jane Smith | jane@yahoo.com | 1 | Free | Banned | [Unban] [Delete] |
| Mike Ross | mike@law.com | 12 | Enterprise | Past Due | [Extend Trial] [Contact] |

### Quick Stats Cards

- **Total Users**: Current user count
- **Active Sites**: Number of active websites
- **Monthly Recurring Revenue**: Current MRR
- **Storage Usage**: Global storage consumption

### Tabbed Interface

1. **Users & Tenants**: User management and actions
2. **Sites & Domains**: Site control and domain management
3. **Subscriptions & Revenue**: Revenue tracking and subscription management
4. **System & Communication**: System-wide announcements and maintenance
5. **Reported Content**: Content moderation and compliance

## API Endpoints

### User Management
- `GET /api/super-admin/users` - Get all users with pagination
- `PUT /api/super-admin/users/:id/ban` - Ban user
- `PUT /api/super-admin/users/:id/unban` - Unban user
- `POST /api/super-admin/users/:id/impersonate` - Start impersonation
- `POST /api/super-admin/users/:id/reset-password` - Reset password
- `PUT /api/super-admin/users/:id/update` - Update user details

### Site Management
- `GET /api/super-admin/sites` - Get all sites with pagination
- `PUT /api/super-admin/sites/:id/block` - Block domain
- `PUT /api/super-admin/sites/:id/unblock` - Unblock domain
- `PUT /api/super-admin/sites/:id/verify` - Verify domain
- `PUT /api/super-admin/sites/:id/limit-connections` - Set connection limit

### Subscription Management
- `GET /api/super-admin/subscriptions` - Get subscription status
- `POST /api/super-admin/users/:id/grant-lifetime` - Grant lifetime access
- `POST /api/super-admin/users/:id/extend-trial` - Extend trial
- `POST /api/super-admin/users/:id/force-downgrade` - Force downgrade
- `GET /api/super-admin/revenue-metrics` - Get revenue analytics

### System Communication
- `POST /api/super-admin/announcements` - Create global announcement
- `POST /api/super-admin/push-notifications` - Send push notification
- `POST /api/super-admin/maintenance-mode` - Toggle maintenance mode

### Content Compliance
- `GET /api/super-admin/storage-usage` - Get storage usage
- `POST /api/super-admin/purge-data` - Purge old data
- `GET /api/super-admin/reported-chats` - Get reported chats

## Security Considerations

### Authentication & Authorization
- All super admin endpoints require admin role
- JWT token-based authentication
- Session management for impersonation

### Action Logging
- All administrative actions are logged
- Track who performed what action and when
- Maintain audit trail for compliance

### Rate Limiting
- API endpoints are rate-limited
- Prevent abuse of system-wide functions
- Protect against unauthorized access

## Best Practices

### User Management
1. **Always document reasons** for bans, password resets, and plan changes
2. **Use impersonation carefully** - only for legitimate support purposes
3. **Verify user identity** before making significant changes
4. **Communicate changes** to affected users when appropriate

### Site Management
1. **Investigate thoroughly** before blocking domains
2. **Document block reasons** for future reference
3. **Monitor blocked sites** for appeals or resolution
4. **Use connection limits** as a temporary measure, not permanent solution

### Subscription Management
1. **Get approval** before granting lifetime access
2. **Document business reasons** for trial extensions
3. **Communicate with users** before force downgrades
4. **Monitor revenue impact** of subscription changes

### System Communication
1. **Use announcements sparingly** - avoid notification fatigue
2. **Test notifications** before system-wide deployment
3. **Schedule maintenance** during low-usage periods
4. **Provide clear timelines** for any system changes

### Data Management
1. **Always use dry-run** before purging data
2. **Backup important data** before deletion
3. **Follow data retention policies**
4. **Document purge operations** for compliance

## Testing

Run the comprehensive test suite:

```bash
node test_super_admin.js
```

This will test all API endpoints and functionality to ensure everything is working correctly.

## Troubleshooting

### Common Issues

1. **"Admin access required" error**
   - Ensure you're logged in as an admin user
   - Check your user role in the database

2. **"User not found" error**
   - Verify the user ID exists
   - Check if the user was deleted

3. **"Site not found" error**
   - Verify the site ID exists
   - Check if the site was deleted

4. **Database migration errors**
   - Run `npm run migrate` to apply latest migrations
   - Check database connection settings

### Getting Help

1. Check the browser console for frontend errors
2. Review the backend logs for API errors
3. Verify database migrations are up to date
4. Ensure all dependencies are installed

## Accessing the Dashboard

1. Log in as an admin user
2. Navigate to `/super-admin` or use the "Super Admin" link in the navigation
3. The dashboard will load with default user and site data
4. Use the tabs to navigate between different management sections

## Next Steps

The Super Admin Dashboard provides a solid foundation for platform management. Consider these enhancements:

1. **Advanced Analytics**: Add more detailed revenue and usage analytics
2. **Automated Actions**: Set up automated responses to certain triggers
3. **Integration APIs**: Connect with external services (email, Slack, etc.)
4. **Mobile App**: Create a mobile version for on-the-go management
5. **Advanced Search**: Implement more sophisticated search and filtering
6. **Export Features**: Add data export capabilities for reporting
7. **Real-time Updates**: Implement WebSocket for real-time dashboard updates

---

**Note**: This dashboard provides powerful administrative capabilities. Use with caution and always follow your organization's policies and procedures for user data management.