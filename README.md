# 🍔 Multi-Restaurant Food Ordering & Delivery Platform

A complete, production-ready food ordering and delivery system with advanced features including multi-restaurant support, loyalty program, GPS tracking, and comprehensive analytics. Includes admin dashboard, customer Telegram mini app, and delivery driver Telegram mini app.

## 🌟 Features

### Customer Features
- 📱 Browse menu with categories from multiple restaurants
- 🛒 Shopping cart functionality
- 💳 Multiple payment options (Card, Telegram Stars, Cash)
- 🎫 **Promo codes and discounts**
- 🎁 **Loyalty points program with tiers**
- 📦 Real-time order tracking with **GPS driver location**
- ⭐ **Review and rate orders, food, and drivers**
- 🔔 Multi-channel notifications (Email, SMS, Push)
- 📍 Delivery address management
- 📜 Order history
- 📅 **Schedule orders for future delivery**

### Admin Features
- 📊 **Advanced analytics dashboard** (revenue, trends, customer insights)
- 🏪 **Multi-restaurant management**
- 🍽️ Menu management (CRUD) with ratings
- 📦 Order management with status updates
- 🎫 **Promo code creation and management**
- 🎁 **Loyalty program management**
- ⭐ **Review moderation and responses**
- 🚚 Delivery tracking with **GPS visualization**
- 💰 Payment management
- 📧 **Email notification system**
- 📱 **SMS notification system**
- ⚙️ Settings and configuration
- 🔄 Live updates via WebSocket
- 📈 **Revenue reports and customer analytics**

### Delivery Driver Features
- 📋 View available delivery jobs
- ✅ Accept deliveries
- 📍 **Real-time GPS location tracking**
- 🗺️ **Location history and ETA updates**
- 📍 Update delivery status
- ⭐ Rating and statistics
- 💵 Earnings tracking
- 📊 **Performance analytics**

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
- **Restaurants** - Multi-restaurant support ✨
- **MenuItems** - Restaurant menu with categories and ratings
- **Orders** - Customer orders with promo codes and loyalty points
- **OrderItems** - Individual items in orders
- **Deliveries** - Delivery assignments with GPS tracking
- **Payments** - Payment records and transactions
- **Reviews** - Customer reviews and ratings ✨
- **PromoCodes** - Discount codes and promotions ✨
- **PromoCodeUsages** - Promo code usage tracking
- **LoyaltyProgram** - Customer loyalty accounts ✨
- **LoyaltyTransactions** - Points transaction history
- **Notifications** - Multi-channel notification system ✨

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

## ✅ Advanced Features (ALL IMPLEMENTED!)

- [x] **Customer reviews and ratings** - Full review system with admin responses
- [x] **Promo codes and discounts** - Percentage, fixed amount, free delivery
- [x] **Multi-restaurant support** - Complete restaurant management
- [x] **Advanced analytics** - Dashboard stats, revenue reports, customer insights
- [x] **Email notifications** - SMTP integration with HTML templates
- [x] **SMS notifications** - Twilio integration (configurable)
- [x] **Push notifications** - Firebase FCM support (configurable)
- [x] **Loyalty program** - Points system with 4 tiers (Bronze to Platinum)
- [x] **Order scheduling** - Schedule future deliveries with auto-processing
- [x] **Driver location tracking (GPS)** - Real-time GPS with Socket.IO updates

## 📚 Documentation

- [**NEW_FEATURES.md**](NEW_FEATURES.md) - Comprehensive guide to all new features
- [**API_DOCUMENTATION.md**](API_DOCUMENTATION.md) - Complete API reference
- [**IMPLEMENTATION_SUMMARY.md**](IMPLEMENTATION_SUMMARY.md) - Technical implementation details
- [**DEPLOYMENT_GUIDE.md**](DEPLOYMENT_GUIDE.md) - Production deployment instructions

## 🎁 Loyalty Program

### Tier System
- **Bronze** (Default) - 1x points multiplier
- **Silver** (1,000+ points) - 1.25x points multiplier  
- **Gold** (5,000+ points) - 1.5x points multiplier
- **Platinum** (10,000+ points) - 2x points multiplier

### Points System
- Earn **10 points per dollar** spent (multiplied by tier)
- Redeem **100 points = $1.00** discount
- Points expire after 1 year

## 🎫 Promo Code Types

1. **Percentage Discount** - e.g., 20% off
2. **Fixed Amount** - e.g., $10 off
3. **Free Delivery** - Waive delivery fee

### Features
- Minimum order requirements
- Maximum discount caps
- Usage limits (global and per customer)
- Date range validity
- Restaurant-specific codes
- Customer-specific codes

## 📊 Analytics Available

### Dashboard Stats
- Total orders, revenue, average order value
- Customer count, active drivers
- Order status breakdown
- 30-day revenue trends
- Review statistics

### Customer Analytics
- Lifetime value, spending patterns
- Favorite menu items
- Order frequency

### Driver Analytics
- Delivery count, average delivery time
- Total earnings
- Performance ratings

### Revenue Reports
- Daily, weekly, monthly, yearly reports
- Restaurant-specific filtering

## 🔔 Notification Channels

All notifications are logged and support:
- **Email** - HTML templates via SMTP
- **SMS** - Twilio integration
- **Push** - Firebase Cloud Messaging
- **Telegram** - Bot messages
- **In-App** - Real-time Socket.IO

## 📍 GPS Tracking Features

- Real-time driver location updates
- Location history (last 100 points)
- Distance and ETA calculations
- Live tracking for customers
- Map integration ready (Google Maps/Mapbox)

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

**Status: ✅ Production Ready with Advanced Features**

All flows validated, tests passing, system fully integrated, and all 10 advanced features implemented!

## 🆕 What's New in This Version

### 🎯 33 New API Endpoints
- Reviews (6 endpoints)
- Promo Codes (7 endpoints)
- Restaurants (6 endpoints)
- Loyalty Program (4 endpoints)
- Analytics (4 endpoints)
- Notifications (3 endpoints)
- GPS Tracking (3 endpoints)

### 🗄️ 7 New Database Tables
- Reviews, PromoCodes, PromoCodeUsages
- Restaurants, LoyaltyPrograms, LoyaltyTransactions
- Notifications

### 🛠️ New Services
- Enhanced notification service (Email, SMS, Push)
- Scheduler service (cron jobs for automated tasks)
- Loyalty points management
- GPS location tracking

### 📦 New Dependencies
- nodemailer (Email notifications)
- node-cron (Task scheduling)

---

**Ready to deploy!** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for production setup.
