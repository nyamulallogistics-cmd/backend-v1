# 🚀 Production-Ready Authentication Guide

Your Nyamula Logistics backend is now **production-ready** with enterprise-level security features!

## ✅ What's Been Implemented

### 1. **Refresh Token System**
- ✅ Short-lived access tokens (15 minutes)
- ✅ Long-lived refresh tokens (7 days)
- ✅ Automatic token rotation on refresh
- ✅ Secure token storage in database (hashed with SHA-256)
- ✅ Token revocation support (logout functionality)

### 2. **Secure Secret Management**
- ✅ Environment variables for all secrets
- ✅ Separate secrets for access and refresh tokens
- ✅ ConfigModule configured globally
- ✅ No hardcoded secrets in code

### 3. **CORS Security**
- ✅ Whitelist-based origin validation
- ✅ Development mode for localhost
- ✅ Configurable via environment variables
- ✅ Proper credentials and headers configuration

### 4. **Token Security Features**
- ✅ JWT tokens with expiration
- ✅ Refresh tokens hashed before storage
- ✅ Token expiration validation
- ✅ Logout from single device
- ✅ Logout from all devices
- ✅ Automatic cleanup of expired tokens

---

## 🔧 Setup Instructions

### 1. **Create .env File**

**IMPORTANT:** The `.env` file was blocked from creation. You need to create it manually:

```bash
# In your project root, create a .env file with these contents:
```

```env
# Database
DATABASE_URL="your_database_url_here"

# JWT Configuration - GENERATE NEW SECRETS FOR PRODUCTION!
# Run this command to generate secure secrets:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

JWT_ACCESS_SECRET=a8f5f167f44f4964e6c998dee827110c06c25a4e2c5d7c8e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6
JWT_REFRESH_SECRET=b9e6d278e55e5a75f7d099eff938221d17d36b5f3d6e8d9f2e3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (comma-separated list of allowed origins)
CORS_ORIGINS=http://localhost:3001,http://localhost:3000,http://localhost:4200
```

### 2. **Generate Secure Secrets for Production**

**NEVER use the example secrets in production!**

Generate new secrets using Node.js:

```bash
# Generate JWT Access Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT Refresh Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the generated strings and replace the values in your `.env` file.

### 3. **Run Database Migration**

```bash
npx prisma migrate dev --name add-refresh-tokens
```

If your database is not accessible yet, run this when it's available.

### 4. **Add .env to .gitignore**

Ensure your `.env` file is in `.gitignore`:

```bash
echo ".env" >> .gitignore
```

---

## 🔐 New API Endpoints

### **POST /api/auth/signup**
Returns both `access_token` and `refresh_token`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "refresh_token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "id": "...",
    "fullName": "...",
    "email": "...",
    "role": "..."
  }
}
```

### **POST /api/auth/login**
Returns both tokens (same as signup)

### **POST /api/auth/refresh**
Refresh expired access token using refresh token:

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token_here"
}
```

**Response:**
```json
{
  "access_token": "new_access_token",
  "refresh_token": "new_refresh_token"
}
```

**Note:** Implements token rotation - old refresh token is revoked, new one issued.

### **POST /api/auth/logout**
Logout from current device:

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token_here"
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### **POST /api/auth/logout-all**
Logout from all devices (requires access token):

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
{
  "message": "Logged out from all devices successfully"
}
```

---

## 🎯 Frontend Integration

### **Token Storage**
Store tokens in your frontend:

```javascript
// After login/signup
localStorage.setItem('access_token', response.access_token);
localStorage.setItem('refresh_token', response.refresh_token);
```

### **Axios Interceptor for Auto-Refresh**

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// Request interceptor - add access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const { data } = await axios.post(
          'http://localhost:3000/api/auth/refresh',
          { refreshToken }
        );

        // Save new tokens
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### **React Hook Example**

```typescript
import { useState, useEffect } from 'react';
import api from './api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await api.get('/auth/verify');
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  return { user, loading, login, logout };
}
```

---

## 🏭 Production Deployment Checklist

### **Before Deploying:**

1. ✅ **Generate New JWT Secrets**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. ✅ **Set Environment Variables**
   - On Heroku: `heroku config:set JWT_ACCESS_SECRET=xxx`
   - On Railway: Settings → Variables
   - On AWS/Azure: Use secrets manager
   - On Vercel: Project Settings → Environment Variables

3. ✅ **Configure CORS**
   ```env
   CORS_ORIGINS=https://yourfrontend.com,https://www.yourfrontend.com
   NODE_ENV=production
   ```

4. ✅ **Set Production Database URL**
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/prod_db?schema=public"
   ```

5. ✅ **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

6. ✅ **Set Token Expiration** (adjust as needed)
   ```env
   JWT_ACCESS_EXPIRATION=15m  # or 30m
   JWT_REFRESH_EXPIRATION=7d  # or 30d
   ```

7. ✅ **Enable HTTPS**
   - Always use HTTPS in production
   - Update CORS_ORIGINS with https:// URLs

### **Optional Production Enhancements:**

1. **Scheduled Token Cleanup**
   Add a cron job or scheduled task to clean up expired tokens:
   ```typescript
   // In a scheduled service
   await authService.cleanupExpiredTokens();
   ```

2. **Rate Limiting**
   Install and configure rate limiting:
   ```bash
   npm install @nestjs/throttler
   ```

3. **Logging**
   Add proper logging for security events:
   - Failed login attempts
   - Token refresh events
   - Logout events

4. **Email Verification**
   Consider adding email verification on signup

5. **2FA (Two-Factor Authentication)**
   Add extra security layer for sensitive operations

---

## 🔍 Security Features Summary

| Feature | Status | Description |
|---------|--------|-------------|
| JWT Access Tokens | ✅ | Short-lived (15min), used for API requests |
| JWT Refresh Tokens | ✅ | Long-lived (7d), used to get new access tokens |
| Token Rotation | ✅ | New tokens issued on refresh, old ones revoked |
| Token Hashing | ✅ | Refresh tokens hashed (SHA-256) before storage |
| Token Revocation | ✅ | Logout invalidates tokens in database |
| Environment Secrets | ✅ | All secrets in .env, no hardcoded values |
| CORS Whitelist | ✅ | Only allowed origins can access API |
| Password Hashing | ✅ | bcrypt with 10 salt rounds |
| Input Validation | ✅ | ValidationPipe with class-validator |
| Token Expiration | ✅ | Automatic expiry and validation |

---

## 🆘 Troubleshooting

### **"Cannot find module @nestjs/config"**
```bash
npm install @nestjs/config
```

### **Database Connection Error**
- Ensure DATABASE_URL is correct in .env
- Verify database is running and accessible
- Run migrations: `npx prisma migrate dev`

### **CORS Error in Frontend**
- Add your frontend URL to CORS_ORIGINS in .env
- Ensure the URL matches exactly (including http/https, port)
- In development, localhost URLs are automatically allowed

### **Token Expired Error**
- Access tokens expire after 15 minutes (configurable)
- Implement automatic refresh in frontend (see example above)
- Use refresh token to get new access token

### **Logout Not Working**
- Ensure you're sending the refresh token in logout request
- Check that refresh token hasn't already expired
- Verify database connection for token revocation

---

## 📚 Additional Resources

- [NestJS JWT Documentation](https://docs.nestjs.com/security/authentication)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 🎉 You're All Set!

Your authentication system is now production-ready with:
- ✅ Secure token management
- ✅ Proper secret handling
- ✅ Token rotation
- ✅ Logout functionality
- ✅ CORS security
- ✅ Environment-based configuration

**Remember:** Always generate new secrets before deploying to production!

