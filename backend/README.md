# CRM Backend API - Organized Structure

## Project Folder Structure

```
project-root/
├── server.js                    # Main entry point
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies
│
├── config/                      # Configuration files
│   ├── database.js             # PostgreSQL connection setup
│   ├── email.js                # Email transporter configuration
│   └── multer.js               # File upload configuration
│
├── middleware/                  # Express middleware
│   └── errorHandler.js         # Global error handling middleware
│
├── controllers/                 # Business logic for each resource
│   ├── authController.js       # Authentication logic
│   ├── teamController.js       # Team members management
│   ├── leadController.js       # Lead management
│   ├── leadWorkHistoryController.js  # Lead work history
│   ├── customerController.js   # Customer management
│   ├── subscriptionController.js # Subscription & conversion logic
│   ├── taskController.js       # Task management
│   └── planController.js       # Pricing plans management
│
├── routes/                      # API route definitions
│   ├── authRoutes.js           # Authentication routes
│   ├── teamRoutes.js           # Team routes
│   ├── leadRoutes.js           # Lead routes (includes work history)
│   ├── customerRoutes.js       # Customer routes
│   ├── taskRoutes.js           # Task routes
│   └── planRoutes.js           # Plan routes
│
├── utils/                       # Helper utilities
│   ├── emailUtil.js            # Email sending functions
│   ├── validators.js           # Validation & password generation
│   └── formatters.js           # Data formatting helpers
│
├── uploads/                     # User-uploaded files (auto-created)
│
└── node_modules/               # Dependencies
```

## API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /forgot-password` - Request password reset
- `POST /reset-password/:token` - Reset password with token
- `POST /change-password` - Change password for logged-in user

### Team Members (`/api/team`)
- `GET /` - Get all team members
- `GET /:id` - Get single team member
- `POST /` - Add new team member
- `PUT /:id` - Update team member
- `DELETE /:id` - Delete team member

### Leads (`/api/leads`)
- `GET /` - Get all leads (with optional filter)
- `GET /:id` - Get single lead
- `POST /` - Create new lead
- `PUT /:id` - Update lead
- `DELETE /:id` - Delete lead
- `POST /:id/convert-to-customer` - Convert lead to customer
- `POST /work-history` - Create lead work history
- `GET /work-history/:leadId` - Get lead work history
- `POST /updates` - Create lead update
- `GET /updates/:leadId` - Get lead updates

### Customers (`/api/customers`)
- `GET /` - Get all customers
- `GET /:id` - Get single customer
- `POST /` - Create customer
- `PUT /:id` - Update customer
- `POST /:id/renew` - Renew subscription
- `PATCH /:id/reminder` - Send renewal reminder
- `GET /subscription-history/:customerId` - Get subscription history
- `GET /stats/monthly` - Get monthly customer stats

### Tasks (`/api/tasks`)
- `GET /` - Get all tasks (optional filter by assigned_to)
- `POST /` - Create task

### Plans (`/api/plans`)
- `GET /` - Get all plans with features
- `PUT /:id` - Update plan and features

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Create Database Tables
Ensure your PostgreSQL database has the following tables:
- `team_members` - User accounts
- `leads` - Sales leads
- `customers` - Converted customers
- `tasks` - Tasks
- `plans` - Subscription plans
- `plan_features` - Plan features
- `lead_work_history` - Lead interaction history
- `lead_updates` - Lead status updates
- `subscription_history` - Customer subscription changes

### 4. Start the Server
```bash
node server.js
```

The server will start on `http://localhost:5000` (or your configured PORT)

## Key Features

✅ **Organized Structure** - Separated concerns (controllers, routes, middleware, utils)
✅ **Database Connection Pooling** - PostgreSQL with connection pool
✅ **Email Notifications** - Welcome emails and password reset links
✅ **File Upload** - Profile image upload with automatic cleanup
✅ **Password Security** - bcrypt hashing for passwords
✅ **Error Handling** - Global error handler middleware
✅ **Validation** - Input validation utilities
✅ **Environment Configuration** - Secure .env setup

## Development Tips

### Adding New Features
1. Create a controller in `controllers/`
2. Create routes in `routes/`
3. Import and use in `server.js`
4. Add utilities in `utils/` if needed

### Database Queries
All database operations use parameterized queries to prevent SQL injection.

### Error Handling
Wrap async operations in try-catch and return appropriate HTTP status codes.

### File Organization
- **Controllers**: Handle business logic, validation, database queries
- **Routes**: Map HTTP methods to controller functions
- **Utils**: Reusable functions (validation, formatting, email)
- **Config**: Initialization of external services

## Environment Variables

```
DATABASE_URL       - PostgreSQL connection string
EMAIL_USER        - Gmail address for sending emails
EMAIL_PASS        - Gmail app password (not regular password)
PORT              - Server port (default: 5000)
NODE_ENV          - Environment (development/production)
```

## Notes

- Profile images are stored in `uploads/` folder
- Old profile images are deleted when updated
- Email notifications require Gmail with App Password enabled
- All passwords are hashed with bcrypt (salt rounds: 10)
- Reset tokens are valid for 15 minutes
