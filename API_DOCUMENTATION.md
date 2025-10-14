# Nyamula Logistics Backend API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints except `/auth/signup` and `/auth/login` require authentication via JWT token.

Add the token to your requests:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Sign Up
```http
POST /api/auth/signup
```

**Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "companyName": "ABC Transport Ltd",
  "phoneNumber": "+260971234567",
  "role": "CARGO_OWNER" // or "TRANSPORTER"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clxxx...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "CARGO_OWNER"
  }
}
```

### Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response:** Same as Sign Up

---

## Dashboard Endpoints

### Get Dashboard Data
```http
GET /api/dashboard
```

Returns complete dashboard data based on user role (Cargo Owner or Transporter).

**Cargo Owner Response:**
```json
{
  "stats": {
    "activeShipments": { "value": 8, "awaitingPickup": 2 },
    "inTransit": { "value": 5 },
    "totalSpent": { "value": 124500, "period": "This month" },
    "pendingQuotes": { "value": 12, "expiringSoon": 3 }
  },
  "activeShipments": [...],
  "recentQuotes": [...]
}
```

**Transporter Response:**
```json
{
  "stats": {
    "activeDeliveries": { "value": 12, "pendingPickup": 3 },
    "availableLoads": { "value": 48 },
    "monthlyEarnings": { "value": 45280, "pending": 12350 },
    "completedTrips": { "value": 156, "thisMonth": 23 }
  },
  "recentDeliveries": [...],
  "availableLoads": [...]
}
```

### Get Stats Only
```http
GET /api/dashboard/stats
```

Returns only the statistics for the current user.

### Get Cargo Owner Dashboard
```http
GET /api/dashboard/cargo-owner
```

### Get Transporter Dashboard
```http
GET /api/dashboard/transporter
```

---

## Shipment Endpoints

### Create Shipment
```http
POST /api/shipments
```

**Body:**
```json
{
  "cargo": "Mining Equipment",
  "fromLocation": "Lusaka",
  "toLocation": "Ndola",
  "amount": 3500,
  "weight": 5000,
  "distance": 320,
  "eta": "2024-01-16T10:00:00Z",
  "transporterId": "clxxx..." // optional
}
```

### Get All Shipments
```http
GET /api/shipments
```

Returns all shipments for the current user (based on role).

### Get Active Shipments
```http
GET /api/shipments/active
```

Returns only active shipments (pending, awaiting pickup, in transit).

### Get Shipment by ID
```http
GET /api/shipments/:id
```

### Update Shipment
```http
PATCH /api/shipments/:id
```

**Body (all fields optional):**
```json
{
  "status": "IN_TRANSIT",
  "progress": 65,
  "eta": "2024-01-16T14:00:00Z",
  "pickupDate": "2024-01-15T08:00:00Z",
  "location": "Kasama - 2 hours ago",
  "notes": "Making good progress, weather is clear",
  "lastUpdate": "Updated location and progress"
}
```

**Note:** When `location`, `notes`, or `progress` are provided, a progress history entry is automatically created.

### Get Progress History
```http
GET /api/shipments/:id/progress
```

Returns the complete progress history for a shipment, ordered by most recent first.

**Available Statuses:**
- `PENDING_PICKUP`
- `AWAITING_PICKUP`
- `IN_TRANSIT`
- `DELIVERED`
- `CANCELLED`

### Delete Shipment
```http
DELETE /api/shipments/:id
```

Only cargo owners can delete their own shipments.

---

## Quote Endpoints

### Create Quote (Post Load)
```http
POST /api/quotes
```

**Body:**
```json
{
  "cargo": "Copper Concentrate",
  "fromLocation": "Chingola",
  "toLocation": "Dar es Salaam",
  "weight": 25000,
  "distance": 1850,
  "description": "Requires temperature-controlled transport",
  "expiresAt": "2024-01-20T23:59:59Z"
}
```

### Get All Quotes
```http
GET /api/quotes
```

- **Cargo Owners:** Returns their own quotes with all bids
- **Transporters:** Returns all active quotes they can bid on

### Get Active Quotes
```http
GET /api/quotes/active
```

Returns only active, non-expired quotes for the current user.

### Get Quote by ID
```http
GET /api/quotes/:id
```

Returns detailed quote information with all bids.

### Get Quote Shipment
```http
GET /api/quotes/:id/shipment
```

Returns the shipment created from this quote (if any). Returns `null` if no shipment exists yet.

### Delete/Cancel Quote
```http
DELETE /api/quotes/:id
```

Sets the quote status to `CANCELLED`.

---

## Bidding Endpoints

### Place a Bid
```http
POST /api/quotes/:id/bids
```

**Body:**
```json
{
  "amount": 8200,
  "estimatedDays": 3,
  "notes": "Specialized equipment available"
}
```

### Accept a Bid
```http
POST /api/quotes/:quoteId/bids/:bidId/accept
```

- Only cargo owners can accept bids on their quotes
- Automatically creates a shipment
- Updates quote status to `ACCEPTED`
- Marks the bid as accepted
- **Note:** Cannot accept a bid if a shipment already exists for this quote

---

## Data Models

### Shipment
```typescript
{
  id: string;
  cargo: string;
  cargoDescription?: string;
  fromLocation: string;
  fromAddress?: string;
  toLocation: string;
  toAddress?: string;
  status: ShipmentStatus;
  amount: number;
  eta: Date;
  progress: number; // 0-100
  weight: number;
  distance: number;
  dimensions?: string;
  pickupDate?: Date;
  deliveryDate?: Date;
  completedAt?: Date;
  driverName?: string;
  driverPhone?: string;
  truckNumber?: string;
  lastUpdate?: string;
  lastUpdateTime?: Date;
  cargoOwner: User;
  transporter?: User;
  progressHistory: ShipmentProgress[];
  createdAt: Date;
  updatedAt: Date;
}
```

### ShipmentProgress
```typescript
{
  id: string;
  location?: string;
  notes?: string;
  progress: number;
  status?: string;
  shipmentId: string;
  createdAt: Date;
}
```

### Quote
```typescript
{
  id: string;
  cargo: string;
  fromLocation: string;
  toLocation: string;
  weight: number;
  distance: number;
  description?: string;
  status: QuoteStatus;
  expiresAt: Date;
  cargoOwner: User;
  bids: Bid[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Bid
```typescript
{
  id: string;
  amount: number;
  estimatedDays: number;
  notes?: string;
  isAccepted: boolean;
  transporter: User;
  quote: Quote;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Frontend Integration Examples

### Fetch Cargo Owner Dashboard
```typescript
const response = await fetch('http://localhost:3000/api/dashboard/cargo-owner', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const data = await response.json();
// Use data.stats, data.activeShipments, data.recentQuotes
```

### Post a New Load (Create Quote)
```typescript
const response = await fetch('http://localhost:3000/api/quotes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    cargo: 'Copper Concentrate',
    fromLocation: 'Chingola',
    toLocation: 'Dar es Salaam',
    weight: 25000,
    distance: 1850,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }),
});

const quote = await response.json();
```

### Place a Bid (Transporter)
```typescript
const response = await fetch(`http://localhost:3000/api/quotes/${quoteId}/bids`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    amount: 8200,
    estimatedDays: 3,
    notes: 'Specialized equipment available',
  }),
});

const bid = await response.json();
```

### Update Shipment Status (Transporter)
```typescript
const response = await fetch(`http://localhost:3000/api/shipments/${shipmentId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    status: 'IN_TRANSIT',
    progress: 65,
    location: 'Kasama - 2 hours ago',
    notes: 'Making good progress, weather is clear',
    pickupDate: new Date().toISOString(),
  }),
});

const updatedShipment = await response.json();
```

### Get Progress History
```typescript
const response = await fetch(`http://localhost:3000/api/shipments/${shipmentId}/progress`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const progressHistory = await response.json();
// Returns array of progress entries with location, notes, progress, status, and timestamps
```

---

## Error Responses

All endpoints return standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "statusCode": 400,
  "message": ["cargo should not be empty", "amount must be a positive number"],
  "error": "Bad Request"
}
```

---

## Database Setup

Before running the backend, make sure to:

1. Set up your PostgreSQL database
2. Update `.env` with your database URL:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/nyamula_logistics"
   JWT_SECRET="your-secret-key"
   ```

3. Run Prisma migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

4. (Optional) Generate Prisma client:
   ```bash
   npx prisma generate
   ```

---

## Running the Backend

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The server will run on `http://localhost:3000`

---

## Testing with Example Data

You can use the provided examples in the frontend code to create test data. Here's a quick workflow:

1. Sign up as a Cargo Owner
2. Create a quote (post a load)
3. Sign up as a Transporter
4. View available loads and place a bid
5. Log back in as the Cargo Owner
6. Accept the bid (this creates a shipment)
7. Log back in as the Transporter
8. Update shipment status and progress

---

## Additional Notes

- All monetary values are stored as floats (e.g., 3500.00 for K 3,500)
- All dates should be in ISO 8601 format
- Distance is in kilometers
- Weight is in kilograms
- Progress is a percentage (0-100)
- The backend automatically handles timezone conversions

