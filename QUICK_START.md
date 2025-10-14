# 🚀 Quick Start Guide - Nyamula Logistics Backend

Get your backend up and running in 5 minutes!

## Prerequisites

- Node.js v18+ installed
- PostgreSQL v14+ installed and running
- npm or yarn package manager

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Setup Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and update your database credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/nyamula_logistics?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
PORT=3000
NODE_ENV=development
```

## Step 3: Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Seed test data (optional but recommended)
npx ts-node prisma/seed.ts
```

## Step 4: Start the Server

```bash
npm run start:dev
```

You should see:
```
🚀 Nyamula Logistics Backend running on http://localhost:3000
```

## Step 5: Test the API

### Option 1: Using cURL

```bash
# Login with test account
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Copy the access_token from the response

# Get dashboard (replace YOUR_TOKEN with the actual token)
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Option 2: Using Browser

Visit http://localhost:3000 - you should see the NestJS welcome message.

### Option 3: Using Prisma Studio

```bash
npx prisma studio
```

Opens visual database editor at http://localhost:5555

## 🎉 You're Ready!

Your backend is now running with:

- ✅ 4 test user accounts
- ✅ 3 sample shipments
- ✅ 2 active quotes with bids
- ✅ Full API with 20+ endpoints

## Test Accounts

```
Cargo Owner:
📧 john@example.com
🔑 password123

Transporters:
📧 alice@transport.com / password123
📧 david@logistics.com / password123
📧 grace@fasttrack.com / password123
```

## Next Steps

1. **Explore the API** - See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. **Integrate Frontend** - See [FRONTEND_INTEGRATION_EXAMPLES.md](./FRONTEND_INTEGRATION_EXAMPLES.md)
3. **View Database** - Run `npx prisma studio`

## Common Issues

### Issue: Database connection failed
**Solution:** Make sure PostgreSQL is running and DATABASE_URL is correct

```bash
# Check if PostgreSQL is running
pg_isready

# Test connection
psql -U your_username -d postgres
```

### Issue: "Cannot find module '@prisma/client'"
**Solution:**
```bash
npm install @prisma/client
npx prisma generate
```

### Issue: Port 3000 already in use
**Solution:** Change PORT in `.env` file or kill the process using port 3000

```bash
# Find process on port 3000
lsof -ti:3000

# Kill it (Mac/Linux)
kill -9 $(lsof -ti:3000)

# Or change port in .env
PORT=3001
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login

### Dashboard
- `GET /api/dashboard` - Get dashboard data

### Shipments
- `GET /api/shipments` - List all shipments
- `GET /api/shipments/active` - Active shipments
- `POST /api/shipments` - Create shipment
- `PATCH /api/shipments/:id` - Update shipment

### Quotes
- `GET /api/quotes` - List quotes
- `POST /api/quotes` - Post a load
- `POST /api/quotes/:id/bids` - Place bid
- `POST /api/quotes/:quoteId/bids/:bidId/accept` - Accept bid

## Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference
- **[BACKEND_SETUP_GUIDE.md](./BACKEND_SETUP_GUIDE.md)** - Detailed setup guide
- **[FRONTEND_INTEGRATION_EXAMPLES.md](./FRONTEND_INTEGRATION_EXAMPLES.md)** - Frontend integration
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - What's implemented
- **[README_DASHBOARDS.md](./README_DASHBOARDS.md)** - Dashboard overview

## Development Commands

```bash
# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Seed database
npx ts-node prisma/seed.ts
```

## Need Help?

Check the documentation files or review the API endpoints in:
- Postman/Thunder Client
- Prisma Studio
- API Documentation

**Happy Coding! 🚛📦**

