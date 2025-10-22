# 🚀 Deployment Guide

Complete guide for deploying the Food Ordering & Delivery Platform to production.

## Quick Start (Local Development)

```bash
# Clone and setup
git clone <repository>
cd workspace

# Start everything
./start.sh
```

## Production Deployment

### Option 1: All-in-One Server (Simple)

**Requirements:**
- Ubuntu 20.04+ or similar Linux
- Node.js 16+
- PostgreSQL 13+
- Nginx
- Domain name with SSL certificate

**Steps:**

1. **Install Dependencies**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

2. **Setup PostgreSQL**
```bash
sudo -u postgres psql

CREATE DATABASE food_ordering;
CREATE USER food_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE food_ordering TO food_user;
\q
```

3. **Clone and Configure Backend**
```bash
cd /var/www
git clone <repository> food-platform
cd food-platform/backend

# Install dependencies
npm install --production

# Configure environment
cp .env.example .env
nano .env
```

Edit `.env`:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://food_user:secure_password_here@localhost:5432/food_ordering

JWT_SECRET=<generate-long-random-string>
TELEGRAM_BOT_TOKEN=<your-bot-token>
PAYMENT_API_KEY=<your-payment-key>
```

4. **Start Backend with PM2**
```bash
pm2 start server.js --name food-backend
pm2 save
pm2 startup
```

5. **Build and Deploy Admin Dashboard**
```bash
cd /var/www/food-platform/admin_dashboard

# Configure
cp .env.example .env.production
nano .env.production
```

Edit `.env.production`:
```env
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_SOCKET_URL=https://api.yourdomain.com
```

Build:
```bash
npm install
npm run build
```

6. **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/food-platform
```

Add configuration:
```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin Dashboard
server {
    listen 80;
    server_name admin.yourdomain.com;
    root /var/www/food-platform/admin_dashboard/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Telegram Apps
server {
    listen 80;
    server_name app.yourdomain.com;
    root /var/www/food-platform/telegram_apps;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/food-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **Setup SSL with Let's Encrypt**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com -d admin.yourdomain.com -d app.yourdomain.com
```

8. **Configure Telegram Webhooks**
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://api.yourdomain.com/api/telegram/webhook"
```

### Option 2: Cloud Platform (Recommended)

#### Backend on Heroku

```bash
# Install Heroku CLI
heroku login

# Create app
heroku create food-ordering-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Configure
heroku config:set JWT_SECRET=<secret>
heroku config:set TELEGRAM_BOT_TOKEN=<token>
heroku config:set PAYMENT_API_KEY=<key>

# Deploy
git subtree push --prefix backend heroku main
```

#### Admin Dashboard on Netlify

1. Connect GitHub repository to Netlify
2. Configure build:
   - Base directory: `admin_dashboard`
   - Build command: `npm run build`
   - Publish directory: `build`
3. Add environment variables:
   - `REACT_APP_API_URL`
   - `REACT_APP_SOCKET_URL`
4. Deploy

#### Telegram Apps on Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy customer app
cd telegram_apps/customer_app
vercel --prod

# Deploy delivery app
cd ../delivery_app
vercel --prod
```

### Option 3: AWS (Scalable)

**Architecture:**
- EC2 for backend
- RDS for PostgreSQL
- S3 + CloudFront for frontend
- Elastic Load Balancer
- Auto Scaling Group

**Steps:**

1. **RDS Setup**
   - Create PostgreSQL instance
   - Note connection string

2. **EC2 Setup**
   - Launch Ubuntu instance
   - Install Node.js, PM2
   - Clone repository
   - Configure with RDS connection

3. **S3 Setup**
   - Create bucket for admin dashboard
   - Build React app
   - Upload to S3
   - Enable static website hosting

4. **CloudFront Setup**
   - Create distribution
   - Point to S3 bucket
   - Configure custom domain

5. **Load Balancer**
   - Create ALB
   - Configure target group with EC2
   - Setup health checks

## Database Migration

### Switch from SQLite to PostgreSQL

1. **Update Sequelize Config** (`backend/config/database.js`):
```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

module.exports = sequelize;
```

2. **Install PostgreSQL Driver**:
```bash
npm install pg pg-hstore
```

3. **Run Migrations**:
```bash
# Database will auto-create tables on first run
npm start
```

## Monitoring Setup

### PM2 Monitoring

```bash
# View logs
pm2 logs food-backend

# Monitor CPU/Memory
pm2 monit

# View status
pm2 status
```

### Error Tracking (Sentry)

```bash
npm install @sentry/node

# Add to server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'your-sentry-dsn' });
```

### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

## Backup Strategy

### Database Backups

```bash
# Automated daily backup
crontab -e

# Add:
0 2 * * * pg_dump -U food_user food_ordering > /backup/db_$(date +\%Y\%m\%d).sql
```

### Application Backups

```bash
# Backup code and uploads
tar -czf backup_$(date +%Y%m%d).tar.gz /var/www/food-platform
```

## Security Checklist

- ✅ Use strong JWT_SECRET
- ✅ Enable HTTPS (SSL/TLS)
- ✅ Configure CORS properly
- ✅ Use environment variables for secrets
- ✅ Enable database SSL
- ✅ Set up firewall rules
- ✅ Regular security updates
- ✅ Use PM2 in cluster mode
- ✅ Implement rate limiting
- ✅ Enable CSP headers

## Performance Optimization

### Backend

```javascript
// Add compression
const compression = require('compression');
app.use(compression());

// Add response caching
const apicache = require('apicache');
app.use('/api/menu', apicache.middleware('5 minutes'));
```

### Database

```sql
-- Add indexes
CREATE INDEX idx_orders_customer ON orders(customerId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_deliveries_driver ON deliveries(driverId);
```

### Frontend

- Enable Gzip compression
- Implement code splitting
- Use CDN for static assets
- Enable browser caching

## Scaling Strategies

### Horizontal Scaling

```bash
# Run multiple backend instances
pm2 start server.js -i max
```

### Load Balancing

Use Nginx or cloud load balancers to distribute traffic across multiple backend instances.

### Database Scaling

- Read replicas for queries
- Connection pooling
- Query optimization
- Caching layer (Redis)

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
pm2 logs food-backend

# Check database connection
psql -U food_user -d food_ordering

# Verify environment variables
pm2 env 0
```

### High CPU Usage
```bash
# Check process
pm2 monit

# Optimize queries
# Add database indexes
# Enable caching
```

### Memory Leaks
```bash
# Monitor memory
pm2 monit

# Restart periodically
pm2 restart food-backend --cron "0 3 * * *"
```

## Rollback Procedure

```bash
# List deployments
pm2 list

# Stop current
pm2 stop food-backend

# Checkout previous version
git checkout <previous-commit>
npm install

# Restart
pm2 restart food-backend
```

## Support & Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check uptime status
- Verify backup completion

**Weekly:**
- Review performance metrics
- Update dependencies
- Test backup restoration

**Monthly:**
- Security updates
- Performance optimization
- Database maintenance

### Health Checks

```bash
# API health
curl https://api.yourdomain.com/health

# Database health
psql -U food_user -d food_ordering -c "SELECT 1;"

# Process health
pm2 status
```

## Conclusion

Your Food Ordering & Delivery Platform is now production-ready and deployed! 

For support and updates, refer to the main README.md and VALIDATION_REPORT.md.

---

**Need Help?** Open an issue on GitHub or contact support.
