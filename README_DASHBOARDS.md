# Nyamula Logistics - Dashboard Backend Implementation

This backend provides complete API support for both **Cargo Owner** and **Transporter** dashboards in the Nyamula Logistics platform.

## 🎯 Overview

The backend is built with **NestJS**, **Prisma ORM**, and **PostgreSQL**, providing a robust, type-safe API for managing logistics operations in Zambia.

### Supported Dashboards

1. **Cargo Owner Dashboard**
   - Post loads and create shipping quotes
   - Receive and review bids from transporters
   - Track active shipments in real-time
   - Monitor monthly spending
   - Manage delivery progress

2. **Transporter Dashboard**
   - Browse available loads
   - Place competitive bids on quotes
   - Track active deliveries
   - Update shipment status and progress
   - Monitor earnings and completed trips

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Cargo Owner / Transporter)
- Secure password hashing with bcryptjs

### 📦 Shipment Management
- Create and track shipments
- Real-time progress updates (0-100%)
- Status tracking (Pending, In Transit, Delivered, etc.)
- ETA management
- Automatic shipment creation from accepted bids

### 💰 Quote & Bidding System
- Cargo owners post loads as quotes
- Transporters place competitive bids
- Automatic lowest bid tracking
- Quote expiration management
- Bid acceptance workflow

### 📊 Dashboard Statistics
- **Cargo Owners:**
  - Active shipments count
  - In-transit deliveries
  - Monthly spending totals
  - Pending quotes with expiration tracking

- **Transporters:**
  - Active deliveries count
  - Available loads in the area
  - Monthly earnings (completed + pending)
  - Total completed trips

### 🔔 Smart Features
- Automatic shipment creation on bid acceptance
- Quote expiration detection
- Available loads filtering (excludes already-bid quotes)
- Progress tracking with percentage updates
- Time-based statistics (monthly, all-time)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│   - Cargo Owner Dashboard    - Transporter Dashboard        │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API (JWT Auth)
┌─────────────────────▼───────────────────────────────────────┐
│                  NestJS Backend (Node.js)                    │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │   Auth     │  │Shipments │  │  Quotes  │  │ Dashboard │ │
│  │  Module    │  │  Module  │  │  Module  │  │  Module   │ │
│  └────────────┘  └──────────┘  └──────────┘  └───────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │ Prisma ORM
┌─────────────────────▼───────────────────────────────────────┐
│              PostgreSQL Database                             │
│  Users │ Shipments │ Quotes │ Bids                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Check versions
node --version    # v18+
npm --version     # v9+
psql --version    # PostgreSQL 14+
```

### 2. Installation
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npx prisma generate
npx prisma migrate dev --name init

# Seed test data (optional)
npx ts-node prisma/seed.ts
```

### 3. Run
```bash
# Development mode
npm run start:dev

# Server runs on http://localhost:3000
```

### 4. Test
```bash
# Login with test account
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Use the token to access protected endpoints
```

---

## 📚 Documentation

- **[BACKEND_SETUP_GUIDE.md](./BACKEND_SETUP_GUIDE.md)** - Complete setup instructions
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Detailed API reference
- **[FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)** - Frontend integration guide

---

## 🌐 API Endpoints

### Core Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/dashboard` | Get dashboard data | ✅ |
| GET | `/api/shipments` | Get all shipments | ✅ |
| POST | `/api/quotes` | Post a load | ✅ |
| POST | `/api/quotes/:id/bids` | Place a bid | ✅ |

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint list.

---

## 💾 Database Models

### Entity Relationships

```
User (Cargo Owner)
  ├── owns many Quotes
  ├── owns many Shipments
  └── receives many Bids (through Quotes)

User (Transporter)
  ├── places many Bids
  └── manages many Shipments

Quote
  ├── belongs to one Cargo Owner
  ├── has many Bids
  └── creates one Shipment (when accepted)

Bid
  ├── belongs to one Quote
  ├── belongs to one Transporter
  └── creates one Shipment (when accepted)

Shipment
  ├── belongs to one Cargo Owner
  ├── assigned to one Transporter
  └── originated from one Quote (optional)
```

---

## 🎨 Frontend Integration

### Example: Fetch Dashboard Data

```typescript
// React component example
import { useEffect, useState } from 'react';

function CargoOwnerDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  
  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3000/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      setDashboardData(data);
    };
    
    fetchDashboard();
  }, []);
  
  if (!dashboardData) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Active Shipments: {dashboardData.stats.activeShipments.value}</h2>
      {/* Render dashboard */}
    </div>
  );
}
```

### Example: Post a Load

```typescript
const postLoad = async (loadData) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/quotes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      cargo: loadData.cargo,
      fromLocation: loadData.from,
      toLocation: loadData.to,
      weight: loadData.weight,
      distance: loadData.distance,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  });
  
  return response.json();
};
```

---

## 🧪 Test Accounts

After running the seed script, you can use these accounts:

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

## 📊 Data Flow Examples

### Workflow 1: Cargo Owner Posts a Load

```
1. Cargo Owner logs in
   POST /api/auth/login

2. Cargo Owner posts a load (creates quote)
   POST /api/quotes
   
3. System stores quote with ACTIVE status

4. Transporters see the quote
   GET /api/quotes (transporters)

5. Transporters place bids
   POST /api/quotes/:id/bids

6. Cargo Owner reviews bids
   GET /api/quotes/:id

7. Cargo Owner accepts best bid
   POST /api/quotes/:quoteId/bids/:bidId/accept

8. System automatically creates shipment
   - Quote status → ACCEPTED
   - Shipment created with PENDING_PICKUP status
   - Transporter assigned
```

### Workflow 2: Transporter Updates Delivery

```
1. Transporter views active deliveries
   GET /api/shipments/active

2. Transporter picks up cargo
   PATCH /api/shipments/:id
   { status: "IN_TRANSIT", progress: 0, pickupDate: "..." }

3. Transporter updates progress
   PATCH /api/shipments/:id
   { progress: 50 }

4. Transporter completes delivery
   PATCH /api/shipments/:id
   { status: "DELIVERED", progress: 100, deliveryDate: "..." }
```

---

## 🔒 Security Features

- ✅ Password hashing with bcryptjs (10 rounds)
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ Input validation with class-validator
- ✅ SQL injection prevention (Prisma ORM)
- ✅ CORS enabled for frontend integration
- ✅ Environment variable protection

---

## 🛠️ Tech Stack

- **Framework:** NestJS 10
- **Language:** TypeScript 5
- **ORM:** Prisma 6
- **Database:** PostgreSQL 14+
- **Authentication:** JWT + Passport
- **Validation:** class-validator & class-transformer

---

## 📈 Performance

- Database queries optimized with Prisma
- Indexed fields for fast lookups
- Efficient relationship loading
- Calculated statistics cached where possible
- Pagination ready (implement as needed)

---

## 🚀 Deployment

### Railway (Recommended)

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login and initialize
railway login
railway init

# 3. Add PostgreSQL
railway add -d postgres

# 4. Set environment variables
railway variables set JWT_SECRET=your-secret-key

# 5. Deploy
railway up
```

### Render

1. Create PostgreSQL database
2. Create Web Service
3. Set build command: `npm install && npx prisma generate && npm run build`
4. Set start command: `npx prisma migrate deploy && npm run start:prod`
5. Add environment variables

---

## 📝 Common Tasks

### Reset Database
```bash
npx prisma migrate reset
npx ts-node prisma/seed.ts
```

### View Database
```bash
npx prisma studio
```

### Create New Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Generate Prisma Client
```bash
npx prisma generate
```

---

## 🤝 Contributing

When adding new features:

1. Update Prisma schema if needed
2. Run migrations: `npx prisma migrate dev`
3. Create DTOs for validation
4. Implement service logic
5. Add controller endpoints
6. Update API documentation
7. Test thoroughly

---

## 📞 Support & Resources

- **Prisma Docs:** https://www.prisma.io/docs
- **NestJS Docs:** https://docs.nestjs.com
- **PostgreSQL Docs:** https://www.postgresql.org/docs

---

## 📄 License

Private - Nyamula Logistics Platform

---

**Built with ❤️ for Zambian Logistics** 🇿🇲🚛

