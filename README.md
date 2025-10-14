# Nyamula Logistics Backend

> **Complete, production-ready backend API for Cargo Owner and Transporter dashboards**

Built with NestJS, Prisma, PostgreSQL, and TypeScript to power a modern logistics platform for Zambia.

---

## 🎯 What This Is

This backend provides **complete API support** for your React dashboard components:

- ✅ **Post Load Page** - Full support for detailed cargo posting with addresses, insurance, special instructions
- ✅ **Shipments Management** - Track shipments with driver info, progress updates, search/filter
- ✅ **Cargo Owner Dashboard** - View active shipments, pending quotes, monthly spending, statistics
- ✅ **Transporter Dashboard** - Browse available loads, active deliveries, earnings, bid management
- ✅ **Quote & Bidding System** - Post loads, receive bids, accept offers, automatic shipment creation

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your database credentials

# 3. Setup database
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts

# 4. Start server
npm run start:dev
```

**Server runs on:** `http://localhost:3000`

See **[QUICK_START.md](./QUICK_START.md)** for detailed instructions.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[QUICK_START.md](./QUICK_START.md)** | ⚡ Get started in 5 minutes |
| **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** | 📖 Complete API reference with examples |
| **[BACKEND_SETUP_GUIDE.md](./BACKEND_SETUP_GUIDE.md)** | 🛠️ Detailed setup and configuration |
| **[FRONTEND_INTEGRATION_EXAMPLES.md](./FRONTEND_INTEGRATION_EXAMPLES.md)** | 🔌 Frontend integration guide |
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | ✅ What's implemented |
| **[README_DASHBOARDS.md](./README_DASHBOARDS.md)** | 📊 Dashboard features overview |

---

## 🎨 Features

### For Cargo Owners
- 📦 Post loads with detailed information
- 💰 Review and accept bids from transporters
- 📊 Track active shipments with real-time progress
- 💵 Monitor monthly spending
- 📈 View comprehensive statistics

### For Transporters
- 🚛 Browse available loads in your area
- 💸 Place competitive bids on quotes
- 📍 Update shipment status and location
- 💼 Track monthly earnings
- 📊 View completed trips and statistics

### Core Features
- 🔐 JWT authentication
- 👥 Role-based access control
- 🔍 Search and filter shipments
- 📱 Real-time progress tracking (0-100%)
- 👷 Driver and vehicle information
- 📅 Date and time tracking
- 💾 Comprehensive data models

---

## 🏗️ Tech Stack

- **Framework:** NestJS 10
- **Language:** TypeScript 5
- **ORM:** Prisma 6
- **Database:** PostgreSQL 14+
- **Authentication:** JWT + Passport
- **Validation:** class-validator

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/signup       # Register new user
POST   /api/auth/login        # Login user
```

### Dashboard
```
GET    /api/dashboard         # Get role-based dashboard
GET    /api/dashboard/stats   # Get statistics only
```

### Shipments
```
GET    /api/shipments         # List all shipments (with filters)
GET    /api/shipments/active  # Active shipments only
GET    /api/shipments/completed # Completed shipments
GET    /api/shipments/stats   # Shipment statistics
GET    /api/shipments/:id     # Get shipment details
POST   /api/shipments         # Create shipment
PATCH  /api/shipments/:id     # Update shipment
DELETE /api/shipments/:id     # Delete shipment
```

### Quotes (Post Load)
```
GET    /api/quotes            # List quotes
GET    /api/quotes/active     # Active quotes only
GET    /api/quotes/:id        # Get quote details
POST   /api/quotes            # Create quote (post load)
DELETE /api/quotes/:id        # Cancel quote
```

### Bids
```
POST   /api/quotes/:id/bids                      # Place a bid
POST   /api/quotes/:quoteId/bids/:bidId/accept   # Accept bid
```

See **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** for complete details.

---

## 🎭 Test Accounts

After running the seed script:

```
Cargo Owner:
  📧 john@example.com
  🔑 password123

Transporters:
  📧 alice@transport.com / password123
  📧 david@logistics.com / password123
  📧 grace@fasttrack.com / password123
```

---

## 💻 Frontend Integration

### Example: Post a Load

```typescript
const response = await fetch('http://localhost:3000/api/quotes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    cargo: 'Mining Equipment',
    cargoType: 'mining',
    cargoDescription: 'Heavy machinery',
    weight: 15000, // kg
    fromLocation: 'Lusaka',
    fromAddress: '123 Industrial Area',
    toLocation: 'Ndola',
    toAddress: '456 Mining Site',
    pickupDate: '2024-02-01T08:00:00Z',
    deliveryDate: '2024-02-03T17:00:00Z',
    dimensions: '6 x 2.4 x 2.6',
    estimatedValue: 50000,
    insuranceRequired: true,
    specialInstructions: 'Requires flatbed truck',
  }),
});
```

### Example: Update Shipment Progress

```typescript
await fetch(`http://localhost:3000/api/shipments/${shipmentId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    progress: 65,
    lastUpdate: 'Kasama - 2 hours ago',
  }),
});
```

See **[FRONTEND_INTEGRATION_EXAMPLES.md](./FRONTEND_INTEGRATION_EXAMPLES.md)** for complete examples.

---

## 🗄️ Database Models

### Shipment
Complete shipment tracking with cargo details, addresses, driver info, progress updates, and timestamps.

### Quote
Detailed quote/load posting with cargo specifications, pickup/delivery details, insurance, and special instructions.

### Bid
Transporter bids with amount, estimated delivery time, and notes.

### User
User accounts with role-based access (CARGO_OWNER / TRANSPORTER).

See `prisma/schema.prisma` for complete schema.

---

## 🔧 Development

```bash
# Start development server with hot reload
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio (visual DB editor)
npx prisma studio

# Reset database
npx prisma migrate reset
```

---

## 📦 What's Included

### Complete Implementation
- ✅ 20+ production-ready API endpoints
- ✅ Enhanced database schema with all fields
- ✅ Search and filter capabilities
- ✅ Real-time progress tracking
- ✅ Automatic shipment creation on bid acceptance
- ✅ Driver and vehicle information
- ✅ Full address support
- ✅ Date and time tracking
- ✅ Statistics and analytics

### Security
- ✅ JWT authentication
- ✅ Role-based authorization
- ✅ Password hashing (bcryptjs)
- ✅ Input validation
- ✅ SQL injection protection (Prisma)
- ✅ CORS enabled

### Documentation
- ✅ Complete API documentation
- ✅ Setup guides
- ✅ Frontend integration examples
- ✅ TypeScript type definitions
- ✅ Error handling guide

---

## 🚢 Deployment

Ready to deploy to:
- Railway
- Render
- Heroku
- Any Node.js hosting platform

See **[BACKEND_SETUP_GUIDE.md](./BACKEND_SETUP_GUIDE.md)** for deployment instructions.

---

## 📊 Project Structure

```
src/
├── auth/               # Authentication & authorization
├── shipments/          # Shipment management
├── quotes/             # Quote & bidding system
├── dashboard/          # Dashboard statistics
└── prisma/            # Database layer

prisma/
├── schema.prisma      # Database schema
└── seed.ts           # Test data

Documentation:
├── API_DOCUMENTATION.md
├── BACKEND_SETUP_GUIDE.md
├── FRONTEND_INTEGRATION_EXAMPLES.md
├── IMPLEMENTATION_SUMMARY.md
├── README_DASHBOARDS.md
└── QUICK_START.md
```

---

## 🎯 Workflow Example

1. **Cargo Owner** posts a load via the Post Load form
2. **Transporters** see the load and place competitive bids
3. **Cargo Owner** reviews bids and accepts the best one
4. **System** automatically creates a shipment
5. **Transporter** updates shipment status and progress
6. **Both users** see real-time updates on their dashboards

---

## 🐛 Troubleshooting

See **[BACKEND_SETUP_GUIDE.md](./BACKEND_SETUP_GUIDE.md)** for common issues and solutions.

### Quick Fixes

**Database connection failed?**
```bash
pg_isready  # Check if PostgreSQL is running
```

**Module not found?**
```bash
npm install
npx prisma generate
```

**Port already in use?**
Change `PORT` in `.env` file

---

## 📞 Support

- Check the documentation files in the project root
- Use Prisma Studio to inspect database: `npx prisma studio`
- Review API endpoints in Postman/Thunder Client

---

## 📝 License

Private - Nyamula Logistics Platform

---

## 🎉 Get Started Now!

```bash
npm install && npx prisma migrate dev && npm run start:dev
```

Then visit **[QUICK_START.md](./QUICK_START.md)** to begin!

---

**Built with ❤️ for Zambian Logistics** 🇿🇲🚛📦
# backend-v1
# backend-v1
