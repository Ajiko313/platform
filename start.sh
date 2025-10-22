#!/bin/bash

echo "🍔 Starting Food Ordering & Delivery Platform..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Start backend
echo "📡 Starting Backend Server..."
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start backend in background
npm start &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID) on http://localhost:3000"
echo ""

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Check if backend is running
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Backend health check passed"
else
    echo "⚠️ Backend might not be ready yet, continuing anyway..."
fi

echo ""
echo "📊 Starting Admin Dashboard..."
cd ../admin_dashboard

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dashboard dependencies..."
    npm install
fi

# Start dashboard in background
npm start &
DASHBOARD_PID=$!
echo "✅ Dashboard started (PID: $DASHBOARD_PID)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Platform started successfully!"
echo ""
echo "🔗 Backend API:        http://localhost:3000"
echo "🔗 Admin Dashboard:    http://localhost:3001"
echo "🔗 API Health Check:   http://localhost:3000/health"
echo ""
echo "👤 Admin Login:"
echo "   Email:    admin@restaurant.com"
echo "   Password: admin123"
echo ""
echo "📱 Telegram Mini Apps:"
echo "   Customer App:  /telegram_apps/customer_app/index.html"
echo "   Delivery App:  /telegram_apps/delivery_app/index.html"
echo ""
echo "🧪 Run tests:"
echo "   cd backend && npm test"
echo ""
echo "🛑 To stop all services:"
echo "   kill $BACKEND_PID $DASHBOARD_PID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Keep script running
wait
