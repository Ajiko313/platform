# Telegram Mini Apps

Telegram Web Apps for customers and delivery personnel.

## Apps

### Customer App (`/customer_app`)
Features:
- Browse menu with categories
- Add items to cart
- Place orders
- Track order status in real-time
- View order history

### Delivery App (`/delivery_app`)
Features:
- View available deliveries
- Accept delivery jobs
- Update delivery status
- Track earnings and stats

## Setup

1. Create Telegram bots:
   - Customer bot: Talk to [@BotFather](https://t.me/botfather)
   - Delivery bot: Create separate bot for delivery personnel

2. Configure webhook in backend:
   ```bash
   curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram/webhook"
   ```

3. Set bot menu button to open Web App:
   ```bash
   curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setChatMenuButton" \
     -H "Content-Type: application/json" \
     -d '{"menu_button": {"type": "web_app", "text": "Order Food", "web_app": {"url": "https://yourdomain.com/customer_app"}}}'
   ```

## Hosting

These are static HTML/CSS/JS apps that can be hosted on:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

## Configuration

Update `API_URL` in `app.js` files to point to your backend:

```javascript
const API_URL = 'https://your-backend-api.com/api';
```

## Testing Locally

You can use `ngrok` or similar tools to expose your local server:

```bash
ngrok http 3000
# Update API_URL to ngrok URL
```

## Security

- Apps use Telegram Web App authentication
- All API calls include JWT tokens
- User data is validated on backend
