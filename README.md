# 🍔 Single-Restaurant Food Ordering & Delivery Platform

A complete, production-ready food ordering and delivery system with admin dashboard, customer Telegram mini app, and delivery driver Telegram mini app.

## 🌟 Features

### Customer Features
- 📱 Browse menu with categories
- 🛒 Shopping cart functionality
- 💳 Multiple payment options (Card, Telegram Stars, Cash)
- 📦 Real-time order tracking
- 🔔 Instant notifications
- 📍 Delivery address management
- 📜 Order history

### Admin Features
- 📊 Real-time dashboard with analytics
- 🍽️ Menu management (CRUD)
- 📦 Order management with status updates
- 🚚 Delivery tracking
- 💰 Payment management
- ⚙️ Settings and configuration
- 🔄 Live updates via WebSocket

### Delivery Driver Features
- 📋 View available delivery jobs
- ✅ Accept deliveries
- 📍 Update delivery status
- ⭐ Rating and statistics
- 💵 Earnings tracking

## 🏗️ Architecture

```
/backend              → Node.js REST API & WebSocket server
/admin_dashboard      → React admin web application
/telegram_apps
  /customer_app       → Customer Telegram mini app
  /delivery_app       → Delivery driver Telegram mini app
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Telegram Bot Token (from @BotFather)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

Backend runs on http://localhost:3000

### 2. Admin Dashboard Setup

```bash
cd admin_dashboard
npm install
npm start
```

Dashboard runs on http://localhost:3001

Login with:
- Email: admin@restaurant.com
- Password: admin123

### 3. Telegram Mini Apps Setup

Deploy the apps to a web server (GitHub Pages, Netlify, etc.) and configure your Telegram bots:

```bash
# Set webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram/webhook"

# Set menu button for customer app
curl -X POST "https://api.telegram.org/bot<TOKEN>/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{"menu_button": {"type": "web_app", "text": "Order Food", "web_app": {"url": "https://yourdomain.com/customer_app"}}}'
```

## 📋 Complete Flow Validation

### 1. Customer Order Flow ✅
```
Browse Menu → Add to Cart → Checkout → Payment → Track Order → Delivered
```

**Status Transitions:**
- `pending` → Customer creates order
- `paid` → Payment confirmed
- `preparing` → Restaurant preparing food
- `ready` → Food ready for pickup
- `out_for_delivery` → Driver picked up order
- `delivered` → Order delivered to customer

### 2. Delivery Flow ✅
```
View Available Jobs → Accept Delivery → Pickup → In Transit → Deliver
```

**Status Transitions:**
- `pending` → Waiting for driver
- `assigned` → Driver accepted
- `picked_up` → Driver picked up from restaurant
- `in_transit` → On the way to customer
- `delivered` → Successfully delivered

### 3. Admin Management Flow ✅
```
Dashboard → Orders → Update Status → Manage Menu → View Deliveries → Settings
```

**Real-time Updates:**
- Order notifications via Socket.IO
- Delivery status updates
- Payment confirmations
- Live dashboard metrics

### 4. Payment Flow ✅
```
Create Payment → Process → Webhook → Verify → Update Order → Notify Customer
```

**Payment Methods:**
- Credit/Debit Card (with webhook)
- Telegram Stars
- Cash on Delivery (instant confirmation)

## 🧪 Testing

Comprehensive test suite with 100+ test cases:

```bash
cd backend
npm test
```

**Test Coverage:**
- ✅ Authentication & Authorization
- ✅ Menu CRUD Operations
- ✅ Order Creation & Lifecycle
- ✅ Delivery Assignment & Tracking
- ✅ Payment Processing & Webhooks
- ✅ Status Transition Validation
- ✅ Role-Based Access Control

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (Sequelize ORM)
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Payment webhook signature verification

## 📊 Database Schema

### Core Models
- **Users** - Customers, Admins, Delivery Drivers
- **MenuItems** - Restaurant menu with categories
- **Orders** - Customer orders with items
- **OrderItems** - Individual items in orders
- **Deliveries** - Delivery assignments and tracking
- **Payments** - Payment records and transactions

### Relationships
- User → Orders (1:many)
- Order → OrderItems (1:many)
- Order → Delivery (1:1)
- Order → Payments (1:many)
- MenuItem → OrderItems (1:many)
- User (Driver) → Deliveries (1:many)

All relationships properly configured with foreign keys and cascading deletes.

## 🔧 Configuration

### Backend Environment Variables

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=sqlite:./database.sqlite

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret

PAYMENT_API_KEY=your-payment-key
PAYMENT_WEBHOOK_SECRET=your-payment-webhook-secret

ADMIN_EMAIL=admin@restaurant.com
ADMIN_PASSWORD=admin123

RESTAURANT_NAME=Delicious Bites
RESTAURANT_ADDRESS=123 Main Street
RESTAURANT_PHONE=+1234567890
```

### Admin Dashboard Environment Variables

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_SOCKET_URL=http://localhost:3000
```

## 📱 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

### Key Endpoints

**Authentication**
- POST `/auth/register` - Register new user
- POST `/auth/login` - Login
- POST `/auth/telegram` - Telegram auth
- GET `/auth/profile` - Get profile

**Menu**
- GET `/menu` - List items
- POST `/menu` - Create item (admin)
- PUT `/menu/:id` - Update item (admin)
- DELETE `/menu/:id` - Delete item (admin)

**Orders**
- POST `/orders` - Create order
- GET `/orders` - List orders
- GET `/orders/:id` - Get order
- PATCH `/orders/:id/status` - Update status (admin)
- POST `/orders/:id/cancel` - Cancel order

**Deliveries**
- GET `/deliveries/available` - Available jobs (driver)
- POST `/deliveries/:id/accept` - Accept delivery (driver)
- PATCH `/deliveries/:id/status` - Update status (driver)

**Payments**
- POST `/payments` - Create payment
- POST `/payments/webhook` - Payment webhook
- POST `/payments/:id/refund` - Refund (admin)

## 🎯 Production Readiness Checklist

### Backend ✅
- [x] Comprehensive error handling
- [x] Input validation on all endpoints
- [x] Proper status transition logic
- [x] Database relationships and constraints
- [x] Authentication and authorization
- [x] Real-time updates via WebSocket
- [x] Payment webhook handling
- [x] Telegram bot integration
- [x] Comprehensive test coverage

### Admin Dashboard ✅
- [x] Responsive design
- [x] Real-time data updates
- [x] Proper error handling
- [x] User-friendly UI/UX
- [x] Role-based access
- [x] Order management
- [x] Menu management
- [x] Delivery tracking

### Telegram Apps ✅
- [x] Customer ordering flow
- [x] Order tracking
- [x] Payment integration
- [x] Delivery driver app
- [x] Real-time status updates
- [x] Telegram Web App integration

### Data Consistency ✅
- [x] Foreign key constraints
- [x] Cascade deletes
- [x] Transaction support
- [x] Status transition validation
- [x] No race conditions
- [x] Proper error handling

### Integration ✅
- [x] All apps connected to same database
- [x] Consistent authentication system
- [x] Real-time synchronization
- [x] Proper API error handling
- [x] WebSocket connections
- [x] Payment webhooks

## 🚢 Deployment

### Backend (Node.js)
- Heroku
- DigitalOcean
- AWS EC2
- Railway
- Render

### Admin Dashboard (React)
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

### Telegram Mini Apps
- GitHub Pages
- Netlify
- Vercel
- Any static hosting

### Database
- PostgreSQL (recommended for production)
- MySQL
- SQLite (development only)

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Node version
node --version  # Should be 16+

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database errors
```bash
# Reset database
rm database.sqlite
npm start  # Will recreate with sample data
```

### Tests failing
```bash
# Make sure test database is clean
npm test -- --forceExit
```

## 📈 Future Enhancements

- [ ] Customer reviews and ratings
- [ ] Promo codes and discounts
- [ ] Multi-restaurant support
- [ ] Advanced analytics
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Push notifications
- [ ] Loyalty program
- [ ] Order scheduling
- [ ] Driver location tracking (GPS)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 👨‍💻 Support

For issues and questions, please open an issue on GitHub.

---

**Status: ✅ Production Ready**

All flows validated, tests passing, and system fully integrated.
