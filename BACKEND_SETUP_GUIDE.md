# Nyamula Logistics Backend - Complete Setup Guide

This guide will help you set up the complete backend for the Nyamula Logistics platform, supporting both Cargo Owner and Transporter dashboards.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
# Using psql
createdb nyamula_logistics

# Or using PostgreSQL client
psql -U postgres
CREATE DATABASE nyamula_logistics;
\q
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your database credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/nyamula_logistics?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3000
NODE_ENV=development
```

### 4. Run Database Migrations

Generate Prisma client and create database tables:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

### 5. Seed the Database (Optional but Recommended)

Populate the database with test data:

```bash
npx ts-node prisma/seed.ts
```

This creates:
- 1 Cargo Owner account
- 3 Transporter accounts
- 3 Active shipments
- 2 Active quotes with bids

**Test Accounts:**
```
Cargo Owner:
  Email: john@example.com
  Password: password123

Transporters:
  Email: alice@transport.com
  Password: password123
  
  Email: david@logistics.com
  Password: password123
  
  Email: grace@fasttrack.com
  Password: password123
```

### 6. Start the Development Server

```bash
npm run start:dev
```

The server will run on `http://localhost:3000`

---

## 📁 Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── decorators/         # Custom decorators (CurrentUser, Roles)
│   ├── dto/               # Data transfer objects
│   ├── guards/            # Auth guards (JWT, Roles)
│   ├── strategies/        # Passport strategies
│   └── auth.service.ts    # Auth business logic
│
├── shipments/              # Shipments module
│   ├── dto/               # DTOs for shipments
│   ├── shipments.controller.ts
│   └── shipments.service.ts
│
├── quotes/                 # Quotes & Bidding module
│   ├── dto/               # DTOs for quotes and bids
│   ├── quotes.controller.ts
│   └── quotes.service.ts
│
├── dashboard/              # Dashboard module
│   ├── dashboard.controller.ts
│   └── dashboard.service.ts
│
├── prisma/                 # Prisma module
│   ├── prisma.service.ts
│   └── prisma.module.ts
│
└── main.ts                # Application entry point
```

---

## 🗄️ Database Schema

### Models

#### User
- `id`: Unique identifier
- `fullName`: User's full name
- `email`: Email address (unique)
- `password`: Hashed password
- `companyName`: Company name
- `phoneNumber`: Contact number
- `role`: CARGO_OWNER | TRANSPORTER
- Relations: shipments, quotes, bids

#### Shipment
- `id`: Unique identifier
- `cargo`: Cargo description
- `fromLocation`: Origin
- `toLocation`: Destination
- `status`: PENDING_PICKUP | AWAITING_PICKUP | IN_TRANSIT | DELIVERED | CANCELLED
- `amount`: Cost in Kwacha
- `eta`: Estimated time of arrival
- `progress`: 0-100 percentage
- `weight`: Weight in kg
- `distance`: Distance in km
- Relations: cargoOwner, transporter, quote

#### Quote
- `id`: Unique identifier
- `cargo`: Cargo description
- `fromLocation`: Origin
- `toLocation`: Destination
- `weight`: Weight in kg
- `distance`: Distance in km
- `description`: Additional details
- `status`: ACTIVE | ACCEPTED | EXPIRED | CANCELLED
- `expiresAt`: Expiration date/time
- Relations: cargoOwner, bids, shipment

#### Bid
- `id`: Unique identifier
- `amount`: Bid amount in Kwacha
- `estimatedDays`: Estimated delivery days
- `notes`: Additional notes
- `isAccepted`: Acceptance status
- Relations: quote, transporter

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Dashboard
- `GET /api/dashboard` - Get role-based dashboard
- `GET /api/dashboard/stats` - Get statistics only
- `GET /api/dashboard/cargo-owner` - Cargo owner dashboard
- `GET /api/dashboard/transporter` - Transporter dashboard

### Shipments
- `POST /api/shipments` - Create shipment
- `GET /api/shipments` - Get all shipments
- `GET /api/shipments/active` - Get active shipments
- `GET /api/shipments/:id` - Get shipment by ID
- `PATCH /api/shipments/:id` - Update shipment
- `DELETE /api/shipments/:id` - Delete shipment

### Quotes
- `POST /api/quotes` - Create quote (post load)
- `GET /api/quotes` - Get all quotes
- `GET /api/quotes/active` - Get active quotes
- `GET /api/quotes/:id` - Get quote by ID
- `DELETE /api/quotes/:id` - Cancel quote

### Bids
- `POST /api/quotes/:id/bids` - Place a bid
- `POST /api/quotes/:quoteId/bids/:bidId/accept` - Accept a bid

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 🧪 Testing the Backend

### Using Postman/Thunder Client

1. **Sign Up as Cargo Owner:**
```http
POST http://localhost:3000/api/auth/signup
Content-Type: application/json

{
  "fullName": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "companyName": "Test Company",
  "phoneNumber": "+260971234567",
  "role": "CARGO_OWNER"
}
```

2. **Get Dashboard:**
```http
GET http://localhost:3000/api/dashboard
Authorization: Bearer <your_token>
```

3. **Create a Quote:**
```http
POST http://localhost:3000/api/quotes
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "cargo": "Test Cargo",
  "fromLocation": "Lusaka",
  "toLocation": "Ndola",
  "weight": 5000,
  "distance": 320,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get Dashboard (replace TOKEN with actual token)
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer TOKEN"
```

---

## 🔍 Debugging

### View Database with Prisma Studio

```bash
npx prisma studio
```

This opens a visual editor at `http://localhost:5555`

### Check Database Migrations

```bash
npx prisma migrate status
```

### Reset Database (⚠️ Warning: Deletes all data)

```bash
npx prisma migrate reset
```

---

## 📊 Features Implemented

### Cargo Owner Dashboard
✅ View active shipments with progress tracking
✅ Monitor in-transit deliveries
✅ Track monthly spending
✅ Manage pending quotes
✅ Review and accept bids
✅ Post new loads (create quotes)

### Transporter Dashboard
✅ View active deliveries
✅ Browse available loads
✅ Track monthly earnings
✅ Monitor completed trips
✅ Place bids on quotes
✅ Update shipment status and progress

### General Features
✅ JWT authentication
✅ Role-based access control (RBAC)
✅ Real-time statistics calculation
✅ Automatic shipment creation on bid acceptance
✅ Quote expiration handling
✅ Input validation
✅ Error handling

---

## 🚢 Deployment

### Production Build

```bash
npm run build
npm run start:prod
```

### Environment Variables for Production

```env
DATABASE_URL="postgresql://user:pass@host:5432/nyamula_logistics"
JWT_SECRET="long-random-string-for-production"
PORT=3000
NODE_ENV=production
```

### Deploy to Railway/Render/Heroku

1. Set up PostgreSQL database
2. Add environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Build: `npm run build`
5. Start: `npm run start:prod`

---

## 🐛 Common Issues

### Issue: "PrismaClient is unable to run in this browser environment"
**Solution:** Make sure you're running the backend, not trying to use it in the browser.

### Issue: "Cannot find module '@prisma/client'"
**Solution:** 
```bash
npm install @prisma/client
npx prisma generate
```

### Issue: "JWT secret not provided"
**Solution:** Make sure your `.env` file has `JWT_SECRET` set.

### Issue: Database connection failed
**Solution:** 
1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env`
3. Test connection: `npx prisma db pull`

---

## 📞 Support

For issues or questions:
1. Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. Review error logs in the console
3. Use Prisma Studio to inspect database state

---

## 🎯 Next Steps

After setting up the backend:

1. **Test all endpoints** using Postman or similar
2. **Integrate with frontend** using the API documentation
3. **Customize business logic** as needed
4. **Add more features** like notifications, payments, etc.

---

## 📝 Notes

- All passwords are hashed using bcryptjs
- JWT tokens expire after 24 hours (configurable)
- Monetary values are in Zambian Kwacha (K)
- Distances are in kilometers
- Weights are in kilograms
- All dates use ISO 8601 format

---

**Happy Coding! 🚛📦**

