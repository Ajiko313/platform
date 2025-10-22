# Food Delivery Platform - API Documentation

Complete API reference for all endpoints.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "customer"
}
```

### Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": { "id": 1, "email": "user@example.com", "role": "customer" }
}
```

### Get Current User
```http
GET /api/auth/me
```
*Requires authentication*

---

## Restaurant Endpoints

### Get All Restaurants
```http
GET /api/restaurants?isActive=true&cuisineType=Italian&minRating=4
```

**Query Parameters:**
- `isActive` - Filter by active status
- `cuisineType` - Filter by cuisine type
- `minRating` - Minimum rating filter

### Get Restaurant by ID
```http
GET /api/restaurants/:id
```

### Create Restaurant (Admin)
```http
POST /api/restaurants
```

**Body:**
```json
{
  "name": "Pizza Palace",
  "description": "Best pizza in town",
  "address": "123 Main St",
  "phone": "+1234567890",
  "email": "info@pizzapalace.com",
  "cuisineType": "Italian",
  "deliveryRadius": 10.0,
  "minimumOrder": 15.00,
  "deliveryFee": 5.00,
  "estimatedDeliveryTime": 30,
  "openingTime": "10:00",
  "closingTime": "22:00"
}
```

### Get Restaurant Statistics (Admin)
```http
GET /api/restaurants/:id/stats
```

### Update Restaurant (Admin)
```http
PATCH /api/restaurants/:id
```

### Deactivate Restaurant (Admin)
```http
DELETE /api/restaurants/:id
```

---

## Menu Endpoints

### Get Menu Items
```http
GET /api/menu?category=Pizza&isAvailable=true&restaurantId=1
```

### Get Menu Item by ID
```http
GET /api/menu/:id
```

### Create Menu Item (Admin)
```http
POST /api/menu
```

**Body:**
```json
{
  "restaurantId": 1,
  "name": "Margherita Pizza",
  "description": "Classic pizza with tomato and mozzarella",
  "price": 14.99,
  "category": "Pizza",
  "preparationTime": 20,
  "ingredients": "Tomato, Mozzarella, Basil",
  "isAvailable": true
}
```

### Update Menu Item (Admin)
```http
PATCH /api/menu/:id
```

### Delete Menu Item (Admin)
```http
DELETE /api/menu/:id
```

---

## Order Endpoints

### Create Order
```http
POST /api/orders
```

**Body:**
```json
{
  "restaurantId": 1,
  "items": [
    {
      "menuItemId": 1,
      "quantity": 2,
      "specialInstructions": "Extra cheese"
    }
  ],
  "deliveryAddress": "456 Oak Ave",
  "deliveryInstructions": "Ring doorbell",
  "customerPhone": "+1234567890",
  "promoCode": "SAVE20",
  "loyaltyPointsToUse": 500,
  "scheduledDeliveryTime": "2025-10-22T18:00:00Z"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": 123,
    "customerId": 1,
    "totalAmount": 35.99,
    "discountAmount": 7.20,
    "loyaltyPointsUsed": 500,
    "loyaltyPointsEarned": 0,
    "status": "pending",
    "estimatedDeliveryTime": "2025-10-22T18:30:00Z"
  }
}
```

### Get Orders
```http
GET /api/orders?status=pending
```

### Get Order by ID
```http
GET /api/orders/:id
```

### Update Order Status (Admin)
```http
PATCH /api/orders/:id/status
```

**Body:**
```json
{
  "status": "preparing"
}
```

### Cancel Order
```http
POST /api/orders/:id/cancel
```

---

## Delivery Endpoints

### Get Available Deliveries (Driver)
```http
GET /api/deliveries/available
```

### Get My Deliveries (Driver)
```http
GET /api/deliveries/my?status=assigned
```

### Get Delivery by ID
```http
GET /api/deliveries/:id
```

### Accept Delivery (Driver)
```http
POST /api/deliveries/:id/accept
```

### Update Delivery Status (Driver)
```http
PATCH /api/deliveries/:id/status
```

**Body:**
```json
{
  "status": "picked_up",
  "notes": "Package secured"
}
```

### Update Driver Location (GPS)
```http
POST /api/deliveries/:id/location
```

**Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### Get Delivery Tracking
```http
GET /api/deliveries/:id/tracking
```

**Response:**
```json
{
  "delivery": {
    "id": 1,
    "status": "in_transit",
    "currentLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timestamp": "2025-10-22T17:30:00Z"
    },
    "locationHistory": [...],
    "estimatedArrival": "2025-10-22T18:00:00Z",
    "distance": 5.2
  }
}
```

### Update ETA (Driver)
```http
POST /api/deliveries/:id/eta
```

**Body:**
```json
{
  "estimatedMinutes": 15,
  "distance": 5.2
}
```

---

## Review Endpoints

### Create Review
```http
POST /api/reviews
```

**Body:**
```json
{
  "orderId": 123,
  "rating": 5,
  "foodRating": 5,
  "deliveryRating": 4,
  "comment": "Great food, quick delivery!",
  "menuItemId": 1
}
```

### Get Reviews
```http
GET /api/reviews?menuItemId=1&minRating=4
```

**Query Parameters:**
- `menuItemId` - Filter by menu item
- `restaurantId` - Filter by restaurant
- `driverId` - Filter by driver
- `minRating` - Minimum rating

### Update Review
```http
PATCH /api/reviews/:id
```

**Body:**
```json
{
  "rating": 4,
  "comment": "Updated review",
  "isPublic": true
}
```

### Add Admin Response (Admin)
```http
POST /api/reviews/:id/response
```

**Body:**
```json
{
  "adminResponse": "Thank you for your feedback!"
}
```

### Delete Review
```http
DELETE /api/reviews/:id
```

---

## Promo Code Endpoints

### Create Promo Code (Admin)
```http
POST /api/promo-codes
```

**Body:**
```json
{
  "code": "SAVE20",
  "description": "20% off all orders",
  "discountType": "percentage",
  "discountValue": 20,
  "minOrderAmount": 25,
  "maxDiscountAmount": 10,
  "maxUsageCount": 100,
  "maxUsagePerCustomer": 1,
  "validFrom": "2025-01-01T00:00:00Z",
  "validUntil": "2025-12-31T23:59:59Z"
}
```

**Discount Types:**
- `percentage` - Percentage discount
- `fixed_amount` - Fixed dollar amount
- `free_delivery` - Free delivery

### Validate Promo Code
```http
POST /api/promo-codes/validate
```

**Body:**
```json
{
  "code": "SAVE20",
  "orderAmount": 50.00,
  "restaurantId": 1
}
```

**Response:**
```json
{
  "valid": true,
  "promoCode": {
    "id": 1,
    "code": "SAVE20",
    "discountType": "percentage",
    "discountValue": 20,
    "discountAmount": "10.00",
    "freeDelivery": false
  }
}
```

### Get All Promo Codes (Admin)
```http
GET /api/promo-codes?isActive=true
```

### Get Active Promo Codes
```http
GET /api/promo-codes/active
```

### Get Promo Code Usage (Admin)
```http
GET /api/promo-codes/:id/usage
```

### Update Promo Code (Admin)
```http
PATCH /api/promo-codes/:id
```

### Deactivate Promo Code (Admin)
```http
DELETE /api/promo-codes/:id
```

---

## Loyalty Program Endpoints

### Get Loyalty Program
```http
GET /api/loyalty
```

**Response:**
```json
{
  "loyaltyProgram": {
    "id": 1,
    "customerId": 1,
    "points": 1250,
    "totalPointsEarned": 5000,
    "totalPointsRedeemed": 3750,
    "tier": "silver",
    "transactions": [...]
  }
}
```

**Tiers:**
- Bronze: 0-999 points earned
- Silver: 1,000-4,999 points earned
- Gold: 5,000-9,999 points earned
- Platinum: 10,000+ points earned

### Get Loyalty Transactions
```http
GET /api/loyalty/transactions
```

### Redeem Points
```http
POST /api/loyalty/redeem
```

**Body:**
```json
{
  "points": 500,
  "orderId": 123
}
```

**Note:** 100 points = $1.00 discount

### Add Bonus Points (Admin)
```http
POST /api/loyalty/bonus
```

**Body:**
```json
{
  "customerId": 1,
  "points": 100,
  "description": "Birthday bonus!"
}
```

---

## Analytics Endpoints (Admin Only)

### Get Dashboard Statistics
```http
GET /api/analytics/dashboard?startDate=2025-01-01&endDate=2025-12-31&restaurantId=1
```

**Response:**
```json
{
  "stats": {
    "totalOrders": 1250,
    "totalRevenue": 45000.00,
    "averageOrderValue": "36.00",
    "totalCustomers": 450,
    "activeDrivers": 25,
    "repeatCustomers": 180,
    "avgDeliveryTime": "32.5",
    "ordersByStatus": [...],
    "topSellingItems": [...],
    "revenueByDay": [...],
    "reviewStats": {...}
  }
}
```

### Get Customer Analytics
```http
GET /api/analytics/customer/:customerId
```

### Get Driver Analytics
```http
GET /api/analytics/driver/:driverId
```

### Get Revenue Report
```http
GET /api/analytics/revenue?period=month&restaurantId=1
```

**Period Options:** `day`, `week`, `month`, `year`

---

## Notification Endpoints

### Get Notifications
```http
GET /api/notifications
```

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "email",
      "title": "Order Update",
      "message": "Your order is ready for pickup!",
      "status": "sent",
      "sentAt": "2025-10-22T17:00:00Z",
      "readAt": null
    }
  ]
}
```

### Mark Notification as Read
```http
PATCH /api/notifications/:id/read
```

### Mark All Notifications as Read
```http
POST /api/notifications/mark-all-read
```

---

## Payment Endpoints

### Create Payment
```http
POST /api/payments
```

**Body:**
```json
{
  "orderId": 123,
  "amount": 35.99,
  "method": "card"
}
```

**Payment Methods:** `card`, `telegram_stars`, `cash`

### Get Payments
```http
GET /api/payments?orderId=123
```

### Refund Payment (Admin)
```http
POST /api/payments/:id/refund
```

---

## Socket.IO Events

### Client → Server

- `join` - Join user-specific room
- `delivery:update_location` - Driver sends location update

### Server → Client

- `order:update` - Order status changed
- `order:notification` - Order notification for customer
- `delivery:update` - Delivery status changed
- `delivery:location_update` - Driver location updated
- `driver:location` - Location update for customer
- `delivery:eta_update` - ETA updated
- `payment:update` - Payment status changed

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Consider implementing rate limiting in production:
- Auth endpoints: 5 requests/minute
- General endpoints: 100 requests/minute
- GPS updates: 1 request/second

---

## Pagination

For endpoints returning lists, add pagination:

```http
GET /api/orders?page=1&limit=20
```

**Not yet implemented but recommended for production**

---

## Webhooks (Future Enhancement)

For third-party integrations:
- Order created
- Order delivered
- Payment completed
- Review submitted

---

## Testing

Use tools like Postman or curl to test the API:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fooddelivery.com","password":"admin123"}'

# Get restaurants
curl http://localhost:3000/api/restaurants

# Create order (with auth token)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"items":[{"menuItemId":1,"quantity":2}],"deliveryAddress":"123 Main St","customerPhone":"+1234567890"}'
```

---

## API Versioning (Recommended)

For future versions, consider:
- `/api/v1/orders`
- `/api/v2/orders`

This ensures backward compatibility when making breaking changes.

---

**For more information, see NEW_FEATURES.md**
