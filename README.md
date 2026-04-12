# Coco Backend

Backend API for the Coco coconut delivery application.

## Architecture

This backend follows a modular, role-based architecture with strict separation of concerns:

- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain all business logic
- **Middlewares**: Handle authentication, authorization, and validation
- **Models**: Define data schemas
- **Routes**: Define API endpoints

## Folder Structure

```
coco-backend/
├─ src/
│  ├─ config/           # Configuration files
│  ├─ models/           # Shared data models
│  ├─ modules/          # Feature modules (auth, customer, manager, etc.)
│  ├─ middlewares/      # Express middlewares
│  ├─ utils/            # Utility functions
│  ├─ app.js            # Express app setup
│  ├─ server.js         # Entry point
│  └─ routes.js         # Route aggregator
├─ .env                 # Environment variables
├─ package.json
└─ README.md
```

## Roles

The system supports four roles:
- **CUSTOMER**: End users who order products
- **MANAGER**: Manage products and orders
- **DELIVERY**: Delivery personnel
- **ADMIN**: System administrators

## Order Lifecycle

Orders follow this state machine:
```
PENDING → CONFIRMED → PACKED → DISPATCHED → DELIVERED
   ↓
CANCELLED
```

All order state changes must go through `order.transitions.js`.

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with required variables:
   ```
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/coco-db
   JWT_SECRET=your-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   ```

4. Start MongoDB

5. Run the application:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication (Public)
- `POST /api/auth/login` - User login
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/refresh-token` - Refresh access token

### Customer (Requires CUSTOMER role)
- `GET /api/customer/profile` - Get customer profile
- `PUT /api/customer/profile` - Update profile
- `GET /api/customer/orders` - Get customer orders
- `GET /api/customer/subscriptions` - Get subscriptions

### Manager (Requires MANAGER role)
- `GET /api/manager/dashboard` - Get dashboard
- `GET /api/manager/products` - Manage products
- `GET /api/manager/orders` - Manage orders

### Delivery (Requires DELIVERY role)
- `GET /api/delivery/orders` - Get assigned orders
- `PATCH /api/delivery/orders/:orderId/status` - Update order status
- `POST /api/delivery/location` - Update location

### Admin (Requires ADMIN role)
- `GET /api/admin/users` - Manage users
- `GET /api/admin/audit-logs` - View audit logs
- `GET /api/admin/settings` - System settings
- `GET /api/admin/analytics` - Get analytics

## Middleware Chain

All protected routes follow this chain:
```
Request → auth.middleware → role.middleware → controller → service
```

1. **auth.middleware**: Verifies JWT token, extracts user info
2. **role.middleware**: Checks if user has required role
3. **controller**: Handles request/response
4. **service**: Executes business logic

## Development Guidelines

### Hard Rules

1. **No business logic in controllers** - Controllers only handle req/res
2. **All business logic in services** - Services contain the actual logic
3. **Order state changes via transitions** - Never set `order.status` directly
4. **Use constants** - Roles and states from `config/constants.js`
5. **Error handling** - Use custom error classes from `utils/errors.js`

### Adding New Features

1. Create controller, service, and routes in appropriate module
2. Wire routes through `src/routes.js`
3. Apply auth and role middlewares as needed
4. Keep controllers thin, services fat

## Status

**Current Status**: Skeleton generated ✅

This is a clean, compile-ready skeleton. Business logic is not yet implemented - all service methods contain TODOs for future implementation.

## Next Steps

1. Define full database schemas in model files
2. Implement authentication logic (JWT, OTP)
3. Implement business logic in service files
4. Add input validation schemas
5. Implement order state transitions
6. Add unit and integration tests

## License

MIT
