# Food Ordering & Delivery Platform - Backend

RESTful API backend for the Single-Restaurant Food Ordering & Delivery Platform.

## Features

- ✅ User authentication (Email, Password, Telegram)
- ✅ Role-based access control (Admin, Customer, Delivery)
- ✅ Menu management (CRUD operations)
- ✅ Order processing with status tracking
- ✅ Delivery assignment and tracking
- ✅ Payment processing with webhook support
- ✅ Real-time updates via Socket.IO
- ✅ Telegram bot integration
- ✅ Comprehensive test coverage

## Tech Stack

- Node.js + Express
- SQLite (easily swappable with PostgreSQL/MySQL)
- Sequelize ORM
- JWT Authentication
- Socket.IO for real-time updates
- bcryptjs for password hashing
- express-validator for input validation

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key environment variables:
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret for JWT tokens
- `DATABASE_URL` - Database connection string
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `PAYMENT_API_KEY` - Payment gateway API key

## Running

```bash
# Development
npm run dev

# Production
npm start

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/telegram` - Telegram authentication
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get single item
- `POST /api/menu` - Create item (admin only)
- `PUT /api/menu/:id` - Update item (admin only)
- `DELETE /api/menu/:id` - Delete item (admin only)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update status (admin only)
- `POST /api/orders/:id/cancel` - Cancel order

### Deliveries
- `GET /api/deliveries/available` - Get available deliveries (driver only)
- `GET /api/deliveries/my` - Get driver's deliveries
- `GET /api/deliveries/:id` - Get delivery details
- `POST /api/deliveries/:id/accept` - Accept delivery (driver only)
- `PATCH /api/deliveries/:id/status` - Update delivery status

### Payments
- `POST /api/payments` - Create payment
- `POST /api/payments/webhook` - Payment webhook handler
- `GET /api/payments/status/:externalId` - Get payment status
- `POST /api/payments/:id/refund` - Refund payment (admin only)

### Telegram
- `POST /api/telegram/webhook` - Telegram bot webhook

## Database Schema

### Users
- id, telegramId, email, password, firstName, lastName
- phone, role, address, isActive, rating, totalDeliveries

### MenuItems
- id, name, description, price, category
- imageUrl, isAvailable, preparationTime, ingredients

### Orders
- id, customerId, status, totalAmount, deliveryFee
- deliveryAddress, deliveryInstructions, customerPhone
- estimatedDeliveryTime, actualDeliveryTime
- paymentId, paymentStatus

### OrderItems
- id, orderId, menuItemId, quantity, price, specialInstructions

### Deliveries
- id, orderId, driverId, status
- pickupTime, deliveryTime, currentLocation, notes

### Payments
- id, orderId, amount, currency, method
- status, externalId, metadata

## Status Flow

### Order Status
pending → paid → preparing → ready → out_for_delivery → delivered

### Delivery Status
pending → assigned → picked_up → in_transit → delivered

### Payment Status
pending → processing → completed / failed / refunded

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover:
- Authentication & Authorization
- Menu CRUD operations
- Order creation & lifecycle
- Delivery assignment & tracking
- Payment processing & webhooks
- Status transitions validation
- Role-based access control

## Production Deployment

1. Use PostgreSQL instead of SQLite
2. Set strong JWT_SECRET
3. Configure proper CORS origins
4. Enable HTTPS
5. Set up proper logging
6. Configure database backups
7. Set up monitoring and alerts

## License

MIT
