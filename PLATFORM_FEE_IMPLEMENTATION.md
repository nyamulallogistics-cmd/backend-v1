# 💰 20% Platform Fee on Bids - Implementation Guide

## Overview

The system now automatically applies a **20% platform fee** on all bids. This means:
- **Transporters** submit their desired bid amount
- **System** automatically deducts 20% as platform fee
- **Transporters** receive 80% of their bid amount
- **Cargo owners** see the full bid amount (what they pay)
- **Shipments** are created with the final amount (after deduction)

---

## 🔢 How It Works

### **Example Calculation:**

```
Transporter bids: $1,000
Platform fee (20%): $200
Final amount (what transporter receives): $800
```

### **Database Fields:**

```typescript
Bid {
  amount: 1000,          // Original bid from transporter
  platformFee: 200,      // 20% platform fee
  finalAmount: 800,      // What transporter actually receives
  // ... other fields
}
```

---

## 🎯 Implementation Details

### **1. Database Schema (Prisma)**

```prisma
model Bid {
  id              String   @id @default(cuid())
  amount          Float    // Original bid amount from transporter
  platformFee     Float    @default(0) // 20% platform fee
  finalAmount     Float    @default(0) // Amount after deduction
  estimatedDays   Int
  notes           String?
  isAccepted      Boolean  @default(false)
  quoteId         String
  transporterId   String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  quote           Quote    @relation(fields: [quoteId], references: [id])
  transporter     User     @relation(fields: [transporterId], references: [id])
}
```

### **2. Service Logic (quotes.service.ts)**

```typescript
async createBid(quoteId: string, userId: string, createBidDto: CreateBidDto) {
  // ... validation code ...

  // Calculate platform fee (20%) and final amount
  const platformFee = createBidDto.amount * 0.20; // 20% deduction
  const finalAmount = createBidDto.amount - platformFee; // Amount after deduction

  return this.prisma.bid.create({
    data: {
      amount: createBidDto.amount,
      platformFee,
      finalAmount,
      estimatedDays: createBidDto.estimatedDays,
      notes: createBidDto.notes,
      quoteId,
      transporterId: userId,
    },
    // ... includes ...
  });
}
```

### **3. Shipment Creation**

When a bid is accepted, the shipment is created with the **finalAmount** (after deduction):

```typescript
const shipment = await tx.shipment.create({
  data: {
    // ... other fields ...
    amount: bid.finalAmount, // Use 80% of original bid
    // ... rest of fields ...
  }
});
```

---

## 📊 API Response Format

### **Creating a Bid:**

**Request:**
```json
POST /api/quotes/:quoteId/bids
{
  "amount": 1000,
  "estimatedDays": 5,
  "notes": "Fast delivery guaranteed"
}
```

**Response:**
```json
{
  "id": "bid_abc123",
  "amount": 1000,
  "platformFee": 200,
  "finalAmount": 800,
  "estimatedDays": 5,
  "notes": "Fast delivery guaranteed",
  "isAccepted": false,
  "transporter": {
    "id": "user_xyz",
    "fullName": "John Transport",
    "companyName": "Fast Logistics"
  },
  "createdAt": "2025-10-16T12:00:00Z"
}
```

### **Viewing Quotes with Bids:**

```json
GET /api/quotes/:id
{
  "id": "quote_123",
  "cargo": "Electronics",
  "fromLocation": "New York",
  "toLocation": "Los Angeles",
  "bids": [
    {
      "id": "bid_1",
      "amount": 1000,
      "platformFee": 200,
      "finalAmount": 800,
      "transporter": {
        "fullName": "John Transport"
      }
    },
    {
      "id": "bid_2",
      "amount": 900,
      "platformFee": 180,
      "finalAmount": 720,
      "transporter": {
        "fullName": "Quick Delivery"
      }
    }
  ]
}
```

---

## 🎨 Frontend Display Examples

### **For Cargo Owners (What they pay):**

```jsx
<div className="bid-card">
  <h3>{bid.transporter.companyName}</h3>
  <div className="bid-amount">
    <span className="label">Total Cost:</span>
    <span className="amount">${bid.amount}</span>
  </div>
  <div className="bid-details">
    <small>Estimated Days: {bid.estimatedDays}</small>
  </div>
  <button onClick={() => acceptBid(bid.id)}>Accept Bid</button>
</div>
```

### **For Transporters (What they receive):**

```jsx
<div className="my-bid">
  <h4>Your Bid</h4>
  <div className="bid-breakdown">
    <div className="row">
      <span>Bid Amount:</span>
      <span>${bid.amount}</span>
    </div>
    <div className="row deduction">
      <span>Platform Fee (20%):</span>
      <span>-${bid.platformFee}</span>
    </div>
    <div className="row total">
      <span>You Receive:</span>
      <span className="highlight">${bid.finalAmount}</span>
    </div>
  </div>
  <p className="info">
    💡 A 20% platform fee is automatically deducted from your bid
  </p>
</div>
```

### **Transporter Bid Form:**

```jsx
<form onSubmit={handleSubmit}>
  <div className="form-group">
    <label>Your Bid Amount</label>
    <input 
      type="number" 
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
      placeholder="Enter your bid amount"
    />
    <small className="helper-text">
      Amount you want to charge the cargo owner
    </small>
  </div>
  
  <div className="calculation-preview">
    <h4>Breakdown:</h4>
    <p>Cargo Owner Pays: ${amount}</p>
    <p>Platform Fee (20%): ${(amount * 0.20).toFixed(2)}</p>
    <p className="final">You Receive: ${(amount * 0.80).toFixed(2)}</p>
  </div>
  
  <button type="submit">Submit Bid</button>
</form>
```

---

## 🔄 Migration Guide

### **For Existing Bids:**

Existing bids in the database will have `platformFee` and `finalAmount` set to 0 by default. You can update them with a script:

```typescript
// migration-script.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExistingBids() {
  const bids = await prisma.bid.findMany();
  
  for (const bid of bids) {
    const platformFee = bid.amount * 0.20;
    const finalAmount = bid.amount - platformFee;
    
    await prisma.bid.update({
      where: { id: bid.id },
      data: {
        platformFee,
        finalAmount,
      },
    });
  }
  
  console.log(`Updated ${bids.length} bids`);
}

updateExistingBids()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run it:
```bash
npx ts-node migration-script.ts
```

---

## 📱 User Communication

### **For Transporters:**

**Notification when bidding:**
> "Your bid of $1,000 has been submitted. After the 20% platform fee ($200), you will receive $800 when the shipment is completed."

**In Dashboard:**
```
Active Bids:
┌─────────────────────────────────────┐
│ Quote: Electronics Shipment         │
│ Your Bid: $1,000                    │
│ Platform Fee: $200 (20%)            │
│ You Receive: $800                   │
│ Status: Pending                     │
└─────────────────────────────────────┘
```

### **For Cargo Owners:**

**Notification when bid received:**
> "New bid received: $1,000 for 5-day delivery from Fast Logistics."

**In Dashboard:**
```
Bids Received:
┌─────────────────────────────────────┐
│ Fast Logistics                      │
│ Amount: $1,000                      │
│ Delivery: 5 days                    │
│ [Accept Bid] [View Details]         │
└─────────────────────────────────────┘
```

---

## 💡 Business Logic Rules

1. **Platform Fee is Fixed at 20%**
   - Automatically calculated on bid creation
   - Cannot be modified by users

2. **Shipments Use Final Amount**
   - When bid accepted, shipment amount = `finalAmount`
   - Transporter sees what they'll actually receive

3. **Transparent to Both Parties**
   - Cargo owners see what they pay
   - Transporters see what they receive
   - Fee breakdown shown in UI

4. **Historical Record**
   - All three amounts stored in database
   - Can generate platform revenue reports
   - Audit trail for financial reconciliation

---

## 📈 Analytics & Reporting

### **Platform Revenue Calculation:**

```typescript
// Get total platform fees for a period
async getTotalPlatformFees(startDate: Date, endDate: Date) {
  const result = await prisma.bid.aggregate({
    _sum: { platformFee: true },
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      isAccepted: true, // Only accepted bids
    },
  });
  
  return result._sum.platformFee || 0;
}
```

### **Transporter Earnings:**

```typescript
// Get transporter's total earnings (after fees)
async getTransporterEarnings(transporterId: string) {
  const result = await prisma.bid.aggregate({
    _sum: { finalAmount: true },
    where: {
      transporterId,
      isAccepted: true,
    },
  });
  
  return result._sum.finalAmount || 0;
}
```

---

## ✅ Testing Checklist

- [ ] Create a bid and verify 20% deduction is calculated
- [ ] Verify `platformFee` = `amount * 0.20`
- [ ] Verify `finalAmount` = `amount - platformFee`
- [ ] Accept a bid and verify shipment uses `finalAmount`
- [ ] Test with various amounts (decimals, large numbers)
- [ ] Verify frontend displays all three amounts correctly
- [ ] Test existing bids still work with default values
- [ ] Verify transporter sees correct "You Receive" amount

---

## 🚀 Deployment Steps

1. **Update Database Schema:**
   ```bash
   npx prisma db push
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Restart Server:**
   ```bash
   npm run start:dev
   ```

4. **(Optional) Update Existing Bids:**
   Run migration script to update old bids

---

## 🛠️ Configuration (Optional Future Enhancement)

If you want to make the platform fee configurable:

```typescript
// config/constants.ts
export const PLATFORM_FEE_PERCENTAGE = 0.20; // 20%

// In service:
const platformFee = createBidDto.amount * PLATFORM_FEE_PERCENTAGE;
```

Or via environment variable:
```env
PLATFORM_FEE_PERCENTAGE=0.20
```

---

## 📞 Support

For questions about the platform fee implementation, refer to:
- Database schema: `prisma/schema.prisma`
- Business logic: `src/quotes/quotes.service.ts`
- API responses: Test with Postman or check frontend integration

---

**Summary:** Every bid now automatically calculates and stores the 20% platform fee, ensuring transparent pricing for both cargo owners and transporters! 💰✨

