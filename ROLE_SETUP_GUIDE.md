# Diego Coaching App - Role-Based Access Setup Guide

## Overview

The Diego Coaching App implements a hierarchical role-based access control system with three distinct user roles. This guide covers how the role system works and provides step-by-step instructions for creating users with different access levels.

## Table of Contents

1. [Role System Overview](#role-system-overview)
2. [Role Permissions](#role-permissions)
3. [Database Schema](#database-schema)
4. [Creating Users](#creating-users)
5. [Authentication & Authorization](#authentication--authorization)
6. [Route Protection](#route-protection)
7. [Testing Different Roles](#testing-different-roles)
8. [Development Workflow](#development-workflow)

## Role System Overview

### Role Hierarchy (Access Levels)

The system uses a hierarchical approach where higher roles inherit permissions from lower roles:

```
Level 3: super_admin (Highest Access)
Level 2: coach (Medium Access)
Level 1: customer (Basic Access)
```

### Role Types

| Role | Code | Description | Access Level |
|------|------|-------------|--------------|
| **Customer** | `customer` | Basic coaching program access | 1 |
| **Coach** | `coach` | Program management capabilities | 2 |
| **Super Admin** | `super_admin` | Full system administration | 3 |

## Role Permissions

### Customer (`customer`)
- ✅ Access personal dashboard
- ✅ View enrolled coaching programs
- ✅ Track milestone progress
- ✅ View personal payment history
- ❌ Cannot create/edit programs
- ❌ Cannot access admin features
- ❌ Cannot manage other users

### Coach (`coach`)
- ✅ All customer permissions
- ✅ Create and manage coaching programs
- ✅ View customer enrollment data
- ✅ Edit program milestones
- ✅ Access coach dashboard
- ❌ Cannot manage users
- ❌ Cannot access admin panel

### Super Admin (`super_admin`)
- ✅ All coach permissions
- ✅ Full user management
- ✅ Access admin panel
- ✅ Manage payments system-wide
- ✅ View all system analytics
- ✅ Configure system settings

## Database Schema

### Users Table Structure

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('coach', 'customer', 'super_admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Key Features
- **Default Role**: New users default to `customer` role
- **Role Validation**: Database constraint ensures only valid roles
- **Unique Email**: Each email can only be used once
- **Password Security**: Passwords are hashed using bcrypt

## Creating Users

### Method 1: Using Test Users Script (Recommended for Development)

The project includes a pre-configured script to create test users with all three roles.

#### Step 1: Run the Test Users Script

```bash
# Navigate to project directory
cd d:\diego-coaching-app

# Create test users
npm run db:test-users
```

#### Default Test Users Created

| Role | Email | Password | Name |
|------|-------|----------|------|
| Customer | `customer@test.com` | `password123` | Test Customer |
| Coach | `coach@test.com` | `password123` | Test Coach |
| Super Admin | `admin@test.com` | `password123` | Test Super Admin |

### Method 2: Public Signup (Coach Only)

The public signup form only allows coaches to register:

#### Signup Restrictions
- ✅ **Coaches**: Can sign up directly via `/auth` page
- ❌ **Customers**: Must be invited/created by admin
- ❌ **Super Admins**: Must be created manually

#### Coach Signup Process
1. Visit `/auth` page
2. Fill out signup form
3. Role automatically set to `coach`
4. Account created and auto-login

### Method 3: Direct Database Creation

For production or custom scenarios, create users directly in the database.

#### Step 1: Hash Password

```javascript
// Example: Hash a password
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash('your-password', 12);
```

#### Step 2: Insert User

```sql
-- Create a customer
INSERT INTO users (name, email, password, role) 
VALUES ('John Doe', 'john@example.com', '$2a$12$hashed_password_here', 'customer');

-- Create a coach
INSERT INTO users (name, email, password, role) 
VALUES ('Jane Smith', 'jane@example.com', '$2a$12$hashed_password_here', 'coach');

-- Create a super admin
INSERT INTO users (name, email, password, role) 
VALUES ('Admin User', 'admin@example.com', '$2a$12$hashed_password_here', 'super_admin');
```

### Method 4: Custom Script Creation

Create your own user creation script:

```typescript
// scripts/create-user.ts
import bcrypt from 'bcryptjs'
import pool from '../lib/db'

async function createUser(name: string, email: string, password: string, role: 'customer' | 'coach' | 'super_admin') {
  try {
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, hashedPassword, role]
    )
    
    console.log(`Created ${role} user: ${email}`)
    return result.rows[0]
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

// Usage
createUser('New Coach', 'newcoach@example.com', 'securepassword', 'coach')
```

## Authentication & Authorization

### Login Process

1. User submits credentials via `/api/auth/login`
2. System verifies email/password
3. User object stored in HTTP-only cookie
4. Cookie includes role information for authorization

### Authorization Flow

```typescript
// Role hierarchy check
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  customer: 1,
  coach: 2,
  super_admin: 3
}

// Check if user has required access level
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}
```

## Route Protection

### Middleware Protection

The app uses Next.js middleware to protect routes based on user roles:

```typescript
// middleware.ts - Route access control
function checkRouteAccess(pathname: string, userRole: UserRole): boolean {
  // Super admin has access to everything
  if (userRole === 'super_admin') return true
  
  // Admin routes - only super_admin
  if (pathname.startsWith('/admin')) return false
  
  // Coach routes - coach and super_admin
  if (pathname.startsWith('/coach')) return userRole === 'coach'
  
  // Customer routes - all authenticated users
  if (pathname.startsWith('/customer')) return true
  
  return true
}
```

### Protected Routes by Role

| Route Pattern | Customer | Coach | Super Admin |
|---------------|----------|-------|-------------|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/customer/*` | ✅ | ✅ | ✅ |
| `/coach/*` | ❌ | ✅ | ✅ |
| `/admin/*` | ❌ | ❌ | ✅ |
| `/api/customer/*` | ✅ | ✅ | ✅ |
| `/api/coach/*` | ❌ | ✅ | ✅ |
| `/api/admin/*` | ❌ | ❌ | ✅ |

## Testing Different Roles

### Development Testing Process

1. **Setup Database**
   ```bash
   npm run db:setup
   npm run db:test-users
   ```

2. **Test Customer Access**
   - Login: `customer@test.com` / `password123`
   - Should access: Dashboard, customer routes
   - Should be blocked: Admin, coach routes

3. **Test Coach Access**
   - Login: `coach@test.com` / `password123`
   - Should access: Dashboard, customer routes, coach routes
   - Should be blocked: Admin routes

4. **Test Super Admin Access**
   - Login: `admin@test.com` / `password123`
   - Should access: All routes and features

### Role-Specific Features to Test

#### Customer Features
- [ ] View enrolled programs
- [ ] Track milestone progress
- [ ] Access customer dashboard
- [ ] View payment history

#### Coach Features
- [ ] Create coaching programs
- [ ] Edit program milestones
- [ ] View customer enrollments
- [ ] Access coach dashboard
- [ ] Manage program content

#### Super Admin Features
- [ ] Access admin panel (`/admin`)
- [ ] Manage users (`/admin/members`)
- [ ] Manage payments (`/admin/payments`)
- [ ] Edit roadmaps (`/admin/roadmap-editor`)
- [ ] View all system data

## Development Workflow

### Quick Start for Role Testing

1. **Initial Setup**
   ```bash
   # Install dependencies
   npm install
   
   # Setup database
   npm run db:setup
   
   # Create test users
   npm run db:test-users
   
   # Start development server
   npm run dev
   ```

2. **Access Different Dashboards**
   - Visit `http://localhost:3000/auth`
   - Login with different test accounts
   - Observe different dashboard layouts and available features

3. **Verify Route Protection**
   - Try accessing `/admin` with customer account (should redirect)
   - Try accessing `/coach` with customer account (should redirect)
   - Verify super admin can access all routes

### Common Development Tasks

#### Add New Role
1. Update database constraint in `schema.sql`
2. Add role to TypeScript type in `lib/auth.ts`
3. Update role hierarchy in `ROLE_HIERARCHY`
4. Add route protection rules in `middleware.ts`
5. Create role-specific dashboard components

#### Add Protected Route
1. Add route pattern to `middleware.ts`
2. Define access rules in `checkRouteAccess`
3. Test with different user roles

#### Modify Permissions
1. Update `canAccessResource` function in `lib/auth.ts`
2. Modify middleware route protection
3. Update component-level permission checks

## Database Management Scripts

The project includes several useful database scripts:

| Script | Command | Description |
|--------|---------|-------------|
| Initialize DB | `npm run db:init` | Create database tables |
| Setup DB | `npm run db:setup` | Full database setup |
| Create Test Users | `npm run db:test-users` | Create all role test users |
| Migrate Reset Tokens | `npm run db:migrate` | Update password reset system |
| Migrate Roles | `npm run db:migrate-roles` | Update role system |

## Security Best Practices

### Password Security
- Passwords hashed with bcrypt (12 salt rounds)
- No plaintext passwords stored
- Secure password reset flow

### Session Management
- HTTP-only cookies prevent XSS
- Secure flag in production
- 7-day expiration
- SameSite protection

### Authorization Checks
- Server-side validation for all API routes
- Middleware protection for page routes
- Database-level role constraints
- No client-side role assumptions

## Troubleshooting

### Common Issues

#### "Only coaches can sign up directly"
- **Cause**: Trying to create customer/admin via signup form
- **Solution**: Use test users script or direct database creation

#### Route Access Denied
- **Cause**: User role doesn't have permission for route
- **Solution**: Check middleware rules and user role

#### Database Connection Issues
- **Cause**: Database not initialized or connection problems
- **Solution**: Run `npm run db:init` and check database configuration

### Debug Tips

1. **Check User Role**: Look at browser cookies for user data
2. **Verify Database**: Query users table to confirm role assignment
3. **Test Middleware**: Add console logs to middleware for debugging
4. **Role Hierarchy**: Ensure role comparison uses hierarchy levels

## Next Steps

After setting up roles, consider implementing:

- [ ] Role-based UI components
- [ ] Advanced permission systems
- [ ] Audit logging
- [ ] Role management interface
- [ ] Bulk user operations
- [ ] Role-based email notifications

## Support

For additional help:
- Check the project's README.md
- Review component implementations in `/components`
- Examine API routes in `/app/api`
- Test with the provided test users

---

*Last updated: August 6, 2025*
