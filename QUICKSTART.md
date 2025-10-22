# 🚀 Quick Start Guide

Get your Food Ordering & Delivery Platform running in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- Basic terminal/command line knowledge

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install admin dashboard dependencies
cd ../admin_dashboard
npm install

# Return to root
cd ..
```

### 2. Start the Platform

**Option A: Automatic (Recommended)**
```bash
chmod +x start.sh
./start.sh
```

**Option B: Manual**

Terminal 1 (Backend):
```bash
cd backend
npm start
```

Terminal 2 (Admin Dashboard):
```bash
cd admin_dashboard
npm start
```

### 3. Access the Platform

- 🔗 **Backend API:** http://localhost:3000
- 🔗 **Admin Dashboard:** http://localhost:3001
- 🔗 **Health Check:** http://localhost:3000/health

### 4. Login to Admin Dashboard

Open http://localhost:3001 and login:
- **Email:** admin@restaurant.com
- **Password:** admin123

## What You'll See

### Backend Console
```
✅ Database connection established
✅ Database models synchronized
✅ Default admin user created
✅ Sample menu items created
🚀 Server running on port 3000
```

### Admin Dashboard
- Real-time dashboard with statistics
- Menu management interface
- Order tracking
- Delivery management

## Quick Test

### 1. Test the Backend API

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.com","password":"admin123"}'

# Get menu
curl http://localhost:3000/api/menu
```

### 2. Test Admin Dashboard

1. Open http://localhost:3001
2. Login with credentials above
3. Navigate to "Menu" → See 5 sample items
4. Navigate to "Dashboard" → See statistics
5. Navigate to "Orders" → Empty (ready for new orders)

### 3. Create a Test Order

```bash
# Register a customer
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "test123",
    "firstName": "Test",
    "lastName": "Customer",
    "phone": "+1234567890"
  }'

# Login as customer (save the token)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"test123"}' | jq -r '.token')

# Create an order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [{"menuItemId": 1, "quantity": 2}],
    "deliveryAddress": "123 Test Street",
    "customerPhone": "+1234567890"
  }'
```

Now check the Admin Dashboard → Orders to see your test order!

## Telegram Mini Apps (Optional)

### Customer App
1. Open `/telegram_apps/customer_app/index.html` in browser
2. Browse menu, add to cart, checkout

### Delivery App
1. Open `/telegram_apps/delivery_app/index.html` in browser
2. View available deliveries

**Note:** For full Telegram integration, you need to:
1. Create a bot via @BotFather
2. Configure webhook
3. Host the apps online
4. See `/telegram_apps/README.md` for details

## Run Tests

```bash
cd backend
npm test
```

Expected output:
```
Test Suites: 5 passed, 5 total
Tests:       52 passed, 52 total
Snapshots:   0 total
Time:        ~10s
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use different port
PORT=3001 npm start
```

### Database Issues
```bash
# Delete and recreate database
rm backend/database.sqlite
cd backend && npm start
# Database will be recreated automatically
```

### Module Not Found
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### React App Won't Start
```bash
cd admin_dashboard
rm -rf node_modules package-lock.json
npm install
npm start
```

## Next Steps

### Customize Your Restaurant

1. **Update Restaurant Info**
   - Edit `backend/.env`
   - Change `RESTAURANT_NAME`, `RESTAURANT_ADDRESS`, `RESTAURANT_PHONE`

2. **Add Your Menu**
   - Login to admin dashboard
   - Go to "Menu"
   - Delete sample items
   - Add your real menu

3. **Configure Payments**
   - Add your payment gateway API key in `backend/.env`
   - Update payment webhook URL

4. **Setup Telegram Bot**
   - Create bot with @BotFather
   - Add token to `backend/.env`
   - Configure webhook
   - Deploy mini apps

### Explore Features

**Admin Dashboard:**
- 📊 Dashboard - View real-time statistics
- 🍽️ Menu - Manage menu items
- 📦 Orders - Process orders
- 🚚 Deliveries - Track deliveries
- ⚙️ Settings - Configure restaurant

**Backend API:**
- See `backend/README.md` for full API documentation
- Use Postman/Thunder Client to test endpoints
- All endpoints documented with examples

**Telegram Apps:**
- Customer app for ordering
- Delivery app for drivers
- Real-time updates via WebSocket

## Production Deployment

When ready for production:
1. Read `DEPLOYMENT_GUIDE.md`
2. Switch to PostgreSQL
3. Set strong JWT_SECRET
4. Enable HTTPS
5. Configure proper CORS
6. Set up monitoring

## Resources

- 📖 **Main README:** `/README.md`
- ✅ **Validation Report:** `/VALIDATION_REPORT.md`
- 🚀 **Deployment Guide:** `/DEPLOYMENT_GUIDE.md`
- 📊 **Project Summary:** `/SUMMARY.md`
- 📁 **Project Structure:** `/PROJECT_STRUCTURE.md`

## Support

Having issues? Check:
1. Node.js version: `node --version` (should be 16+)
2. Dependencies installed: `npm install` in both folders
3. Ports available: 3000 and 3001
4. Environment variables: Check `.env` files

## Success Checklist

- [ ] Backend starts without errors
- [ ] Admin dashboard loads in browser
- [ ] Can login to admin dashboard
- [ ] Can see sample menu items
- [ ] Can create test order via API
- [ ] Order appears in admin dashboard
- [ ] Tests pass (`npm test`)

Once all checked, you're ready to customize and deploy! 🎉

---

**Estimated Setup Time:** 5-10 minutes
**Difficulty:** Easy
**Status:** ✅ Production Ready
