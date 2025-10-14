# Frontend Integration Guide

## 🔗 Connecting Your React Frontend to the Backend

This guide shows you exactly how to update your existing React Login and Signup components to work with the NestJS backend.

## 📍 Backend API Base URL

```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

## 🔄 Update Your Signup Component

Replace your `handleSubmit` function in your `Signup.tsx` component:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      // Store authentication token
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Show success message
      console.log('Signup successful!', data.user);
      
      // Redirect to appropriate dashboard
      if (formData.role === 'transporter') {
        navigate('/dashboard/transporter');
      } else {
        navigate('/dashboard/cargo-owner');
      }
    } else {
      // Handle error response
      alert(data.message || 'Signup failed. Please try again.');
    }
  } catch (error) {
    console.error('Signup error:', error);
    alert('Failed to connect to server. Please check if the backend is running.');
  }
};
```

## 🔐 Update Your Login Component

Replace your `handleSubmit` function in your `Login.tsx` component:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      // Store authentication token
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Show success message
      console.log('Login successful!', data.user);
      
      // Redirect based on user role
      if (data.user.role === 'transporter') {
        navigate('/dashboard/transporter');
      } else {
        navigate('/dashboard/cargo-owner');
      }
    } else {
      // Handle error response
      alert(data.message || 'Invalid email or password.');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Failed to connect to server. Please check if the backend is running.');
  }
};
```

## 🛡️ Create an API Service (Recommended)

Create a new file `src/services/api.ts` in your React project:

```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:3000/api';

interface SignupData {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
  phoneNumber: string;
  role: 'transporter' | 'cargo-owner';
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    companyName: string;
    phoneNumber: string;
    role: 'transporter' | 'cargo-owner';
  };
}

export const authService = {
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    return response.json();
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  async getProfile() {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get profile');
    }

    return response.json();
  },

  async verifyToken() {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { valid: false };
    }

    return response.json();
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  getToken() {
    return localStorage.getItem('access_token');
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};
```

## 📝 Using the API Service

### In Signup Component:

```typescript
import { authService } from '@/services/api';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const data = await authService.signup(formData);
    
    // Store token and user
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect based on role
    if (data.user.role === 'transporter') {
      navigate('/dashboard/transporter');
    } else {
      navigate('/dashboard/cargo-owner');
    }
  } catch (error: any) {
    alert(error.message);
  }
};
```

### In Login Component:

```typescript
import { authService } from '@/services/api';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const data = await authService.login(formData);
    
    // Store token and user
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect based on role
    if (data.user.role === 'transporter') {
      navigate('/dashboard/transporter');
    } else {
      navigate('/dashboard/cargo-owner');
    }
  } catch (error: any) {
    alert(error.message);
  }
};
```

## 🔒 Protected Routes

Create a protected route component:

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { authService } from '@/services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'transporter' | 'cargo-owner';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

### Using Protected Routes:

```typescript
// In your router configuration
import { ProtectedRoute } from '@/components/ProtectedRoute';

<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  
  <Route
    path="/dashboard/transporter"
    element={
      <ProtectedRoute requiredRole="transporter">
        <TransporterDashboard />
      </ProtectedRoute>
    }
  />
  
  <Route
    path="/dashboard/cargo-owner"
    element={
      <ProtectedRoute requiredRole="cargo-owner">
        <CargoOwnerDashboard />
      </ProtectedRoute>
    }
  />
</Routes>
```

## 🎯 Making Authenticated API Calls

For any protected API calls in your components:

```typescript
const fetchData = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:3000/api/some-endpoint', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  return data;
};
```

## 🚀 Starting Both Servers

### Terminal 1 - Backend:
```bash
cd nyamula-backend
npm run start:dev
# Server runs on http://localhost:3000
```

### Terminal 2 - Frontend:
```bash
cd nyamula-frontend
npm run dev
# Server runs on http://localhost:5173
```

## ✅ Testing Checklist

1. ✅ Start backend server (`npm run start:dev`)
2. ✅ Start frontend server (`npm run dev`)
3. ✅ Test signup form with valid data
4. ✅ Check browser console for success message
5. ✅ Verify token is stored in localStorage
6. ✅ Test login form with registered credentials
7. ✅ Verify redirect to appropriate dashboard
8. ✅ Test logout functionality
9. ✅ Test protected routes without token

## 🐛 Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
1. Check backend is running on port 3000
2. Verify frontend URL in backend `.env` file matches your frontend port
3. Clear browser cache

### 401 Unauthorized
- Token may have expired (7 days)
- Token not being sent in Authorization header
- Invalid token format

### Connection Refused
- Backend server not running
- Wrong port number in API calls
- Firewall blocking connection

## 📚 Response Examples

### Signup Success:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1696234567890",
    "fullName": "John Doe",
    "email": "john@example.com",
    "companyName": "Fast Wheels Logistics",
    "phoneNumber": "+1234567890",
    "role": "transporter"
  }
}
```

### Login Success:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1696234567890",
    "fullName": "John Doe",
    "email": "john@example.com",
    "companyName": "Fast Wheels Logistics",
    "phoneNumber": "+1234567890",
    "role": "transporter"
  }
}
```

### Error Response:
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

**You're all set! 🎉**

Your backend is ready to handle authentication for your Nyamula Logistics platform.
