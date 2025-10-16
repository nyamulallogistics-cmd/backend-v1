# 🌐 CORS Configuration - Production Ready

## ✅ Allowed Origins

Your backend now accepts requests from the following domains:

### **Production Domains:**
- ✅ `https://www.nyamula.com` - Main website
- ✅ `https://nyamula-logistics-landing.vercel.app` - Vercel deployment

### **Development Domains:**
- ✅ `http://localhost:5173` - Vite dev server
- ✅ `http://localhost:3000` - React dev server
- ✅ `http://localhost:3001` - Alternate dev server

---

## 🔧 Configuration Location

### **Environment Variable (.env):**
```env
CORS_ORIGINS=https://www.nyamula.com,https://nyamula-logistics-landing.vercel.app,http://localhost:5173,http://localhost:3000,http://localhost:3001
```

### **CORS Logic (src/main.ts):**
```typescript
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:3000',
];

app.enableCors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in whitelist
    if (corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, allow any localhost
      if (
        process.env.NODE_ENV === 'development' &&
        origin.includes('localhost')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});
```

---

## 🚀 Frontend Integration

### **From www.nyamula.com:**

```javascript
// API calls will work from your main website
const response = await fetch('https://your-backend-url.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({ email, password })
});
```

### **From Vercel Deployment:**

```javascript
// API calls will work from Vercel
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://your-backend-url.com/api',
  withCredentials: true, // Important for cookies
});

// Login example
const { data } = await api.post('/auth/login', { email, password });
```

---

## 🧪 Testing CORS

### **Test from Browser Console:**

Visit `https://www.nyamula.com` and run:

```javascript
fetch('https://your-backend-url.com/api', {
  method: 'GET',
  credentials: 'include'
})
.then(res => res.text())
.then(console.log)
.catch(console.error);
```

**Expected:** Should return "Hello World!" without CORS errors

---

## 🔒 Security Features

✅ **Whitelist-based** - Only specified origins allowed  
✅ **Credentials support** - Allows cookies and auth headers  
✅ **Development mode** - Auto-allows localhost in development  
✅ **Production ready** - Strict origin checking in production  

---

## 📝 Adding More Origins

To add more allowed origins, update the `.env` file:

```env
CORS_ORIGINS=https://www.nyamula.com,https://nyamula-logistics-landing.vercel.app,https://new-domain.com,http://localhost:5173
```

**Note:** Separate domains with commas, no spaces.

Then restart the server:
```bash
npm run start:dev
```

---

## 🌍 Production Deployment

When deploying to production:

1. **Set NODE_ENV=production** in your hosting platform
2. **Update CORS_ORIGINS** with only production domains:
   ```env
   NODE_ENV=production
   CORS_ORIGINS=https://www.nyamula.com,https://nyamula-logistics-landing.vercel.app
   ```

3. **Remove localhost origins** from production environment

---

## 🔍 Troubleshooting

### **CORS Error from Frontend:**

```
Access to fetch at 'https://backend.com/api' from origin 'https://www.nyamula.com' 
has been blocked by CORS policy
```

**Solutions:**
1. ✅ Verify origin is in `CORS_ORIGINS` list
2. ✅ Check for typos (http vs https, trailing slash)
3. ✅ Ensure server restarted after `.env` change
4. ✅ Check `withCredentials: true` is set in frontend

### **OPTIONS Request Failing:**

**Solution:** Backend already handles OPTIONS requests. Ensure:
- `credentials: true` in CORS config ✅
- `methods` includes OPTIONS ✅
- Origin is whitelisted ✅

---

## 📊 Current Configuration Summary

| Domain | Type | Status |
|--------|------|--------|
| www.nyamula.com | Production | ✅ Allowed |
| nyamula-logistics-landing.vercel.app | Production | ✅ Allowed |
| localhost:5173 | Development | ✅ Allowed |
| localhost:3000 | Development | ✅ Allowed |
| localhost:3001 | Development | ✅ Allowed |
| Any other domain | - | ❌ Blocked |

---

## 🎉 You're All Set!

Your backend now accepts requests from:
- ✅ **Nyamula website** (www.nyamula.com)
- ✅ **Vercel deployment** (nyamula-logistics-landing.vercel.app)
- ✅ **Local development** (localhost:*)

The CORS configuration is production-ready and secure! 🔒✨

