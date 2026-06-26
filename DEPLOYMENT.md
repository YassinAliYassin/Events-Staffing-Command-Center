# FPCC Backend VPS Deployment Guide

## Server Information
- **VPS IP**: 102.208.231.11
- **Hostname**: zacp111.webway.host
- **Repository**: https://github.com/YassinAliYassin/Fresh-People-Command-Center
- **Backend Port**: 3001
- **Process Manager**: PM2

## Quick Deployment (One-Step)

### Step 1: SSH into your VPS
```bash
ssh root@102.208.231.11
# or
ssh your-username@102.208.231.11
```

### Step 2: Download and run the deployment script
```bash
# Download the deployment script
curl -O https://raw.githubusercontent.com/YassinAliYassin/Fresh-People-Command-Center/main/deploy-fpcc.sh

# Make it executable
chmod +x deploy-fpcc.sh

# Run the deployment (this will prompt for environment variables)
bash deploy-fpcc.sh
```

That's it! The script will:
1. Install Node.js, npm, PM2, and PostgreSQL client
2. Clone the repository to `/var/www/fpcc-backend`
3. Install all dependencies
4. Prompt you to create the `.env` file with your credentials
5. Configure firewall (if ufw is active)
6. Start the application with PM2

## Post-Deployment Verification

After deployment completes, verify everything is working:

```bash
# Download the verification script
curl -O https://raw.githubusercontent.com/YassinAliYassin/Fresh-People-Command-Center/main/verify-deployment.sh

# Make it executable
chmod +x verify-deployment.sh

# Run verification
bash verify-deployment.sh
```

The verification script tests:
- ✅ `/api/health` - Health check endpoint
- ✅ `/api/events` - Events endpoints (GET, POST)
- ✅ `/api/staff` - Staff endpoints (GET, POST)
- ✅ `/api/clients` - Clients endpoints (GET, POST)
- ✅ `/api/calendar.ics` - iCalendar feed
- ✅ `/api/payroll` - Payroll data
- ✅ `/api/dispatch-staff` - WhatsApp dispatch (requires token)
- ✅ `/webhook` - WhatsApp webhook endpoints
- ✅ PM2 process status
- ✅ Database connectivity

## Environment Variables Required

When running `deploy-fpcc.sh`, you'll be prompted for:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
WHATSAPP_ACCESS_TOKEN=your_whatsapp_business_api_token
ICLOUD_CALENDAR_URL=https://calendar.icloud.com/... (optional)
CRON_SECRET=your_secret_for_cron_jobs
```

The following are pre-configured:
```bash
NODE_ENV=production
PORT=3001
WHATSAPP_PHONE_NUMBER_ID=1190600000792870
WHATSAPP_WABA_ID=2036327954427976
```

## Manual Deployment (Step-by-Step)

If you prefer to deploy manually or the script fails:

### 1. Install Dependencies
```bash
# Update system
sudo apt-get update

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL client
sudo apt-get install -y postgresql-client

# Install git
sudo apt-get install -y git
```

### 2. Clone Repository
```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
git clone https://github.com/YassinAliYassin/Fresh-People-Command-Center.git /var/www/fpcc-backend
cd /var/www/fpcc-backend
```

### 3. Install Dependencies
```bash
npm install --production
```

### 4. Create .env File
```bash
nano .env
```

Add the following:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=your_postgresql_connection_string
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=1190600000792870
WHATSAPP_WABA_ID=2036327954427976
ICLOUD_CALENDAR_URL=your_icloud_calendar_url
CRON_SECRET=your_cron_secret
```

### 5. Configure Firewall
```bash
sudo ufw allow 3001/tcp
sudo ufw reload
```

### 6. Start with PM2
```bash
pm2 start server.js --name fpcc-backend
pm2 save
pm2 startup
```

## Managing the Application

### View Logs
```bash
pm2 logs fpcc-backend
pm2 logs fpcc-backend --lines 100  # Last 100 lines
```

### Restart Application
```bash
pm2 restart fpcc-backend
```

### Stop Application
```bash
pm2 stop fpcc-backend
```

### Delete Application
```bash
pm2 delete fpcc-backend
```

### Monitor in Real-Time
```bash
pm2 monit
```

### View Status
```bash
pm2 status
pm2 show fpcc-backend
```

## Updating the Application

To pull the latest changes and restart:

```bash
cd /var/www/fpcc-backend
git pull origin main
npm install --production
pm2 restart fpcc-backend
```

Or simply re-run the deployment script:
```bash
bash deploy-fpcc.sh
```

The script is idempotent (safe to run multiple times).

## Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs fpcc-backend

# Check if port is in use
sudo lsof -i :3001

# Check .env file
cat /var/www/fpcc-backend/.env
```

### Database Connection Issues
```bash
# Test PostgreSQL connection (if using PostgreSQL)
psql $DATABASE_URL -c "SELECT 1"

# Check if using SQLite (default)
ls -la /var/www/fpcc-backend/*.db
```

### WhatsApp Integration Not Working
```bash
# Verify token in .env
grep WHATSAPP_ACCESS_TOKEN /var/www/fpcc-backend/.env

# Test endpoint manually
curl -X POST http://localhost:3001/api/dispatch-staff \
  -H "Content-Type: application/json" \
  -d '{"staffId":1,"eventId":"test"}'
```

### Firewall Issues
```bash
# Check UFW status
sudo ufw status

# Allow port 3001
sudo ufw allow 3001/tcp
sudo ufw reload
```

## API Endpoints

Once deployed, the following endpoints are available:

- `http://102.208.231.11:3001/api/health` - Health check
- `http://102.208.231.11:3001/api/events` - Events management
- `http://102.208.231.11:3001/api/staff` - Staff management
- `http://102.208.231.11:3001/api/clients` - Clients management
- `http://102.208.231.11:3001/api/calendar.ics` - iCalendar feed
- `http://102.208.231.11:3001/api/payroll` - Payroll data
- `http://102.208.231.11:3001/api/dispatch-staff` - Send WhatsApp messages
- `http://102.208.231.11:3001/webhook` - WhatsApp webhook

## Security Recommendations

1. **Use HTTPS**: Configure Nginx as a reverse proxy with SSL/TLS
2. **Firewall**: Only open necessary ports (3001 for testing, 80/443 for production)
3. **Environment Variables**: Never commit `.env` file to git
4. **PM2 User**: Run PM2 as a non-root user
5. **Updates**: Keep system and dependencies updated

## Support

For issues or questions:
1. Check the logs: `pm2 logs fpcc-backend`
2. Run verification: `bash verify-deployment.sh`
3. Review this guide
4. Check GitHub repository issues: https://github.com/YassinAliYassin/Fresh-People-Command-Center/issues

---

**Deployment completed successfully!** 🎉

Your FPCC backend should now be running at: `http://102.208.231.11:3001`
