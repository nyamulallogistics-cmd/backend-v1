# Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Argument `cargoOwner` is missing" or "cargoOwnerId: undefined"

**Error Message:**
```
Invalid `this.prisma.quote.create()` invocation
Argument `cargoOwner` is missing.
cargoOwnerId: undefined
```

**Cause:** The user ID is not being extracted from the JWT token correctly.

**Solution:** 
✅ **FIXED** - The JWT strategy has been updated to return both `id` and `userId` properties.

**How to verify the fix works:**

1. **Restart your server** (important!):
   ```bash
   # Stop the server (Ctrl+C)
   npm run start:dev
   ```

2. **Login again to get a fresh token**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"john@example.com","password":"password123"}'
   ```

3. **Use the new token** in your requests:
   ```bash
   curl -X POST http://localhost:3000/api/quotes \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_NEW_TOKEN" \
     -d '{
       "cargo": "Test Cargo",
       "fromLocation": "Lusaka",
       "toLocation": "Ndola",
       "weight": 5000
     }'
   ```

---

### Issue: Authentication Not Working

**Symptoms:**
- 401 Unauthorized errors
- "User ID is required" messages

**Solutions:**

1. **Verify JWT_SECRET is set**:
   ```bash
   # Check your .env file
   cat .env | grep JWT_SECRET
   ```

2. **Check if you're sending the token correctly**:
   ```javascript
   // Frontend code should include:
   headers: {
     'Authorization': `Bearer ${token}`,  // Note the space after "Bearer"
   }
   ```

3. **Verify token is not expired**:
   - Tokens expire after 24 hours by default
   - Login again to get a fresh token

---

### Issue: Database Connection Failed

**Error Message:**
```
Can't reach database server
```

**Solutions:**

1. **Check PostgreSQL is running**:
   ```bash
   # Windows
   sc query postgresql-x64-14
   
   # Mac/Linux
   brew services list | grep postgresql
   # or
   pg_isready
   ```

2. **Verify DATABASE_URL in .env**:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/nyamula_logistics?schema=public"
   ```

3. **Test database connection**:
   ```bash
   npx prisma db pull
   ```

---

### Issue: Module Not Found

**Error Message:**
```
Cannot find module '@prisma/client'
```

**Solution:**
```bash
npm install @prisma/client
npx prisma generate
```

---

### Issue: Prisma Schema Changes Not Applied

**Symptoms:**
- Fields are missing in database
- "Unknown field" errors

**Solution:**
```bash
# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name update_schema

# If you need to reset everything (⚠️ DELETES ALL DATA)
npx prisma migrate reset
npx ts-node prisma/seed.ts
```

---

### Issue: Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

1. **Change port in .env**:
   ```env
   PORT=3001
   ```

2. **Kill process using port 3000**:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -ti:3000 | xargs kill -9
   ```

---

### Issue: CORS Errors in Frontend

**Error Message:**
```
Access to fetch at 'http://localhost:3000/api/...' has been blocked by CORS policy
```

**Solution:**
The backend already has CORS enabled in `src/main.ts`. Make sure:

1. Server is running on the correct port
2. Frontend is using the correct API URL
3. You're including the Authorization header

---

### Issue: "distance" Field Required Error

**Error Message:**
```
Field "distance" is required
```

**Solution:**
The distance field is now optional in the DTO. If you still get this error:

```typescript
// Frontend - you can omit distance or set it to 0
{
  // ... other fields
  distance: 0,  // Or omit this field entirely
}
```

The backend will automatically set it to 0 if not provided.

---

### Issue: Seed Script Fails

**Error Message:**
```
Error seeding database
```

**Solutions:**

1. **Make sure migrations are run first**:
   ```bash
   npx prisma migrate dev
   npx ts-node prisma/seed.ts
   ```

2. **If there's conflicting data**:
   ```bash
   # Reset and reseed
   npx prisma migrate reset
   npx ts-node prisma/seed.ts
   ```

---

## Testing Your Setup

### 1. Test Authentication

```bash
# Should return a token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### 2. Test Protected Endpoint

```bash
# Replace YOUR_TOKEN with the token from step 1
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Quote Creation

```bash
curl -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cargo": "Test Cargo",
    "fromLocation": "Lusaka",
    "toLocation": "Ndola",
    "weight": 5000
  }'
```

If all three work, your setup is correct! ✅

---

## Frontend Integration Checklist

When integrating with your React frontend:

- [ ] Set API URL in environment variables
- [ ] Store JWT token in localStorage after login
- [ ] Include Authorization header in all requests
- [ ] Handle 401 errors (token expired) by redirecting to login
- [ ] Convert weight from tons to kg (multiply by 1000)
- [ ] Format dates as ISO strings (`.toISOString()`)
- [ ] Handle loading and error states

### Example Frontend Code

```typescript
// Login and store token
const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem('token', data.access_token);
    return data;
  }
  
  throw new Error(data.message);
};

// Make authenticated request
const postLoad = async (loadData: any) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch('http://localhost:3000/api/quotes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...loadData,
      weight: loadData.weight * 1000, // Convert tons to kg
    }),
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
    
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
};
```

---

### Issue: "Unique constraint failed on the fields: (`quoteId`)"

**Error Message:**
```
Unique constraint failed on the fields: (`quoteId`)
```

**Cause:** Trying to create a shipment for a quote that already has a shipment.

**Solution:**
✅ **FIXED** - The acceptBid function now checks if a shipment already exists and uses a database transaction to prevent race conditions.

**How to avoid this:**
- Don't accept the same bid multiple times
- The system now prevents duplicate shipments for the same quote
- If you get this error, check if the quote already has an accepted bid

---

## Still Having Issues?

1. **Check server logs** - Look at your terminal where the server is running
2. **Use Prisma Studio** - `npx prisma studio` to inspect your database
3. **Verify environment variables** - Check your `.env` file
4. **Restart your server** - After any changes to code or .env
5. **Check the documentation**:
   - [QUICK_START.md](./QUICK_START.md)
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
   - [FRONTEND_INTEGRATION_EXAMPLES.md](./FRONTEND_INTEGRATION_EXAMPLES.md)

---

## Debug Mode

To get more detailed error messages:

1. Set `NODE_ENV=development` in `.env`
2. Check server logs in your terminal
3. Use `console.log()` to debug values
4. Use Postman/Thunder Client to test endpoints directly

---

**Remember:** After making any changes to the code or environment variables, restart your server!

```bash
# Stop server: Ctrl+C
# Start server:
npm run start:dev
```

