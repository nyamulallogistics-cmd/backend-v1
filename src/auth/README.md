# Authentication Module

This module handles user authentication for the Nyamula Logistics platform, supporting both **Transporters** and **Cargo Owners**.

## Features

- ✅ User registration (Signup)
- ✅ User login
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (Transporter/Cargo Owner)
- ✅ Protected routes with JWT guards
- ✅ Input validation

## API Endpoints

### 1. Sign Up
**POST** `/api/auth/signup`

Register a new user account.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "companyName": "ABC Logistics",
  "phoneNumber": "+1234567890",
  "role": "transporter" // or "cargo-owner"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1234567890",
    "fullName": "John Doe",
    "email": "john@example.com",
    "companyName": "ABC Logistics",
    "phoneNumber": "+1234567890",
    "role": "transporter"
  }
}
```

### 2. Login
**POST** `/api/auth/login`

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1234567890",
    "fullName": "John Doe",
    "email": "john@example.com",
    "companyName": "ABC Logistics",
    "phoneNumber": "+1234567890",
    "role": "transporter"
  }
}
```

### 3. Get Profile (Protected)
**GET** `/api/auth/profile`

Get the authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "User profile retrieved successfully",
  "user": {
    "userId": "1234567890",
    "email": "john@example.com",
    "role": "transporter"
  }
}
```

### 4. Verify Token (Protected)
**GET** `/api/auth/verify`

Verify if the JWT token is valid.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "userId": "1234567890",
    "email": "john@example.com",
    "role": "transporter"
  }
}
```

## Frontend Integration

### Signup Example
```typescript
const handleSignup = async (formData) => {
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
      // Store token
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect based on role
      if (data.user.role === 'transporter') {
        navigate('/dashboard/transporter');
      } else {
        navigate('/dashboard/cargo-owner');
      }
    } else {
      // Handle error
      console.error(data.message);
    }
  } catch (error) {
    console.error('Signup failed:', error);
  }
};
```

### Login Example
```typescript
const handleLogin = async (formData) => {
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
      // Store token
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect based on role
      if (data.user.role === 'transporter') {
        navigate('/dashboard/transporter');
      } else {
        navigate('/dashboard/cargo-owner');
      }
    } else {
      // Handle error
      console.error(data.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Protected API Calls
```typescript
const fetchProtectedData = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:3000/api/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  return data;
};
```

## Role-Based Access Control

Use the `@Roles()` decorator and `RolesGuard` to protect routes by role:

```typescript
import { Roles } from './auth/decorators/roles.decorator';
import { RolesGuard } from './auth/guards/roles.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { UserRole } from './auth/dto/signup.dto';

@Controller('shipments')
export class ShipmentsController {
  
  // Only transporters can access this
  @Get('transporter')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRANSPORTER)
  getTransporterShipments(@CurrentUser() user) {
    return { message: 'Transporter shipments', user };
  }
  
  // Only cargo owners can access this
  @Get('cargo-owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CARGO_OWNER)
  getCargoOwnerShipments(@CurrentUser() user) {
    return { message: 'Cargo owner shipments', user };
  }
}
```

## Security Notes

⚠️ **Important for Production:**

1. Change `JWT_SECRET` in `.env` to a strong, random string
2. Replace in-memory user storage with a real database (PostgreSQL, MongoDB, etc.)
3. Add refresh tokens for better security
4. Implement rate limiting on auth endpoints
5. Add email verification
6. Implement password reset functionality
7. Add account lockout after failed login attempts
8. Use HTTPS in production

## User Roles

- **transporter**: Users who transport cargo
- **cargo-owner**: Users who need cargo transported

## File Structure

```
src/auth/
├── decorators/
│   ├── current-user.decorator.ts   # Decorator to get current user
│   └── roles.decorator.ts          # Decorator for role-based access
├── dto/
│   ├── login.dto.ts                # Login validation
│   └── signup.dto.ts               # Signup validation with roles
├── entities/
│   └── user.entity.ts              # User entity
├── guards/
│   ├── jwt-auth.guard.ts           # JWT authentication guard
│   └── roles.guard.ts              # Role-based authorization guard
├── strategies/
│   └── jwt.strategy.ts             # JWT passport strategy
├── auth.controller.ts               # Auth endpoints
├── auth.module.ts                   # Auth module
├── auth.service.ts                  # Auth business logic
└── README.md                        # This file
```
