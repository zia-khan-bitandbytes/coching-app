# Coaching Platform

A modern coaching platform built with Next.js, TypeScript, and PostgreSQL.

## Features

- 🔐 **Authentication System** - Secure login/signup with password hashing
- 👥 **Role-Based Access Control** - Three user roles: Customer, Client, and Super Admin
- 📊 **Role-Based Dashboards** - Different dashboards for each user role
- 🎯 **Milestone Tracking** - Progress tracking for coaching programs
- 👨‍💼 **Admin Panel** - Admin interface for managing users and programs
- 💳 **Payment Management** - Track payments and revenue
- 🎨 **Modern UI** - Beautiful interface built with Tailwind CSS and Radix UI

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: PostgreSQL
- **Authentication**: bcryptjs for password hashing
- **State Management**: React hooks

## Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker run --name coaching-db \
  -e POSTGRES_DB=coaching_platform \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL on your system
2. Create a database named `coaching_platform`
3. Update the database connection in `lib/db.ts` if needed

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coaching_platform
DB_USER=postgres
DB_PASSWORD=password

# Next.js Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Initialize Database

```bash
npm run db:setup
```

This will create all necessary tables and insert sample data.

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

### Tables

- **users** - User accounts and authentication with role-based access
- **coaching_programs** - Available coaching programs
- **user_programs** - User enrollment in programs
- **milestones** - Program milestones and objectives
- **user_milestones** - User progress tracking
- **payments** - Payment transactions and revenue tracking

### Sample Data

The database initialization includes:
- 3 default coaching programs
- 12 milestones for the Business Growth Program
- Sample admin user (if needed)

## User Roles

The platform supports three user roles with different access levels:

### Customer
- Access to coaching programs and progress tracking
- View enrolled programs and milestones
- Manage personal payment history
- Default role for new users

### Client
- Can manage coaching programs
- View customer progress and data
- Track revenue and payments
- Access to client-specific features

### Super Admin
- Full system administration
- User management and role assignment
- System analytics and reporting
- Complete platform control

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration with role selection
- `POST /api/auth/logout` - User logout

### Role-Based Access
- `/admin/*` - Super admin only
- `/client/*` - Client and super admin
- `/customer/*` - All authenticated users
- `/dashboard` - All authenticated users

### Programs (Future)
- `GET /api/programs` - List all programs
- `GET /api/programs/:id` - Get program details
- `POST /api/programs/:id/enroll` - Enroll in program

## Project Structure

```
├── app/
│   ├── api/auth/          # Authentication APIs
│   ├── auth/              # Auth pages
│   ├── dashboard/         # User dashboard
│   └── admin/             # Admin panel
├── components/
│   ├── ui/                # Reusable UI components
│   ├── login-form.tsx     # Login component
│   └── signup-form.tsx    # Signup component
├── lib/
│   ├── db.ts              # Database connection
│   ├── schema.sql         # Database schema
│   └── init-db.ts         # Database initialization
└── data/                  # Data storage (legacy)
```

## Development

### Adding New Features

1. Create database migrations in `lib/schema.sql`
2. Add API routes in `app/api/`
3. Create React components in `components/`
4. Update pages in `app/`

### Database Migrations

To add new tables or modify existing ones:

1. Update `lib/schema.sql`
2. Run `npm run db:setup` to apply changes
3. Test the changes

## Deployment

### Environment Variables

Make sure to set the following environment variables in production:

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `NEXTAUTH_SECRET` - Secret for authentication

### Database

1. Set up a PostgreSQL database
2. Run the initialization script: `npm run db:setup`
3. Ensure the database connection is secure

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 