# 🔧 Frontend 401 Error - Authentication Fix

## ❌ Problem

```
GET http://localhost:3000/api/quotes 401 (Unauthorized)
Error: Unauthorized
```

**Why this happens:**
- ✅ Backend is correctly protecting the `/api/quotes` endpoint
- ❌ Frontend is not sending the authentication token
- The endpoint requires a valid JWT token in the `Authorization` header

---

## ✅ Solution: Update Frontend API Client

### **Step 1: Update api.ts to Include Auth Token**

```typescript
// src/api/api.ts (or wherever your API client is)
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    
    if (token) {
      // Attach token to Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Call refresh endpoint
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
        // Refresh failed, logout
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

### **Step 2: Update AvailableLoads.tsx**

```typescript
// src/components/AvailableLoads.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

function AvailableLoads() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableLoads();
  }, []);

  const fetchAvailableLoads = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in
      const token = localStorage.getItem('access_token');
      if (!token) {
        // Not logged in, redirect to login
        navigate('/login');
        return;
      }

      // Fetch quotes (token automatically attached by interceptor)
      const { data } = await api.get('/quotes');
      setLoads(data);
    } catch (error) {
      console.error('Error fetching available loads:', error);
      
      if (error.response?.status === 401) {
        // Unauthorized - redirect to login
        setError('Please login to view available loads');
        navigate('/login');
      } else {
        setError('Failed to load available loads');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="available-loads">
      <h2>Available Loads</h2>
      {loads.length === 0 ? (
        <p>No loads available at the moment</p>
      ) : (
        <div className="loads-list">
          {loads.map((load) => (
            <div key={load.id} className="load-card">
              <h3>{load.cargo}</h3>
              <p>From: {load.fromLocation}</p>
              <p>To: {load.toLocation}</p>
              <p>Weight: {load.weight} kg</p>
              <button onClick={() => navigate(`/quotes/${load.id}`)}>
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AvailableLoads;
```

---

### **Step 3: Create Login Component (if not exists)**

```typescript
// src/components/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call login endpoint (no token needed for login)
      const { data } = await api.post('/auth/login', {
        email,
        password,
      });

      // Save tokens to localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard or available loads
      navigate('/available-loads');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login to Nyamula Logistics</h2>
      <form onSubmit={handleLogin}>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p>
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </form>
    </div>
  );
}

export default Login;
```

---

### **Step 4: Create Auth Context (Recommended)**

```typescript
// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setUser(data.user);
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

### **Step 5: Protect Routes**

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
```

---

### **Step 6: Update App.tsx**

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Signup from './components/Signup';
import AvailableLoads from './components/AvailableLoads';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route
            path="/available-loads"
            element={
              <ProtectedRoute>
                <AvailableLoads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/available-loads" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

---

## 🔍 Quick Fix (If You Just Want It Working Now)

**Simplest fix for your api.ts:**

```typescript
// src/api/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

**And make sure you're logged in first:**

```typescript
// In your login component
const handleLogin = async () => {
  const { data } = await api.post('/auth/login', { email, password });
  
  // Save tokens
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  
  // Now other API calls will work!
};
```

---

## 🧪 Testing

### **1. Test Login:**
```bash
# From browser console (on your frontend)
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
})
.then(r => r.json())
.then(data => {
  console.log('Token:', data.access_token);
  localStorage.setItem('access_token', data.access_token);
});
```

### **2. Test Protected Endpoint:**
```bash
# After login, this should work:
fetch('http://localhost:3000/api/quotes', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
.then(r => r.json())
.then(console.log);
```

---

## 📋 Checklist

- [ ] Update `api.ts` with request interceptor
- [ ] Add token to Authorization header
- [ ] Create login component
- [ ] Save tokens to localStorage after login
- [ ] Redirect to login if not authenticated
- [ ] Add auto-refresh on 401 errors
- [ ] Test login flow
- [ ] Test protected endpoints

---

## 🎯 Summary

**The 401 error is CORRECT** - your backend is properly secured! ✅

**To fix:**
1. User must login first
2. Store the `access_token` in localStorage
3. Send token with every request: `Authorization: Bearer TOKEN`
4. Handle 401 errors by refreshing token or redirecting to login

**Your backend is working perfectly - the frontend just needs to authenticate!** 🔒✨

