# ✅ Nyamula Logistics Backend - Setup Complete!

## 🎉 What's Been Created

Your authentication system is now fully set up and ready to connect with your React frontend!

## 📁 Project Structure

```
nyamula-backend/
├── src/
│   ├── auth/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts    # Get current user in controllers
│   │   │   └── roles.decorator.ts           # Role-based access decorator
│   │   ├── dto/
│   │   │   ├── login.dto.ts                 # Login validation
│   │   │   └── signup.dto.ts                # Signup validation (Transporter/Cargo Owner)
│   │   ├── entities/
│   │   │   └── user.entity.ts               # User data model
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts            # JWT authentication guard
│   │   │   └── roles.guard.ts               # Role-based authorization guard
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts              # JWT Passport strategy
│   │   ├── auth.controller.ts               # Auth API endpoints
│   │   ├── auth.module.ts                   # Auth module configuration
│   │   ├── auth.service.ts                  # Auth business logic
│   │   ├── auth.http                        # API test file (REST Client)
│   │   └── README.md                        # Detailed auth documentation
│   ├── app.module.ts                        # Main app module (includes AuthModule)
│   └── main.ts                              # Bootstrap with CORS & validation
├── .env.example                             # Environment variables template
└── README.md                                # Project documentation

```

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
# Development mode with hot-reload
npm run start:dev

# The server will run on http://localhost:3000
```

### 2. API Endpoints Available

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | ❌ |
| POST | `/api/auth/login` | User login | ❌ |
| GET | `/api/auth/profile` | Get user profile | ✅ |
| GET | `/api/auth/verify` | Verify JWT token | ✅ |

### 3. Frontend Integration Code

Update your React frontend forms to connect to the backend:

#### Signup Integration
```typescript
// In your Signup component
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
      // Store the token
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
      alert(data.message || 'Signup failed');
    }
  } catch (error) {
    console.error('Signup error:', error);
    alert('Failed to connect to server');
  }
};
```

#### Login Integration
```typescript
// In your Login component
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
      // Store the token
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
      alert(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Failed to connect to server');
  }
};
```

#### Protected API Calls
```typescript
// For making authenticated requests
const makeAuthenticatedRequest = async (url: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  return response.json();
};

// Example: Get user profile
const profile = await makeAuthenticatedRequest('http://localhost:3000/api/auth/profile');
```

## 🧪 Testing the API

### Using REST Client (VS Code Extension)

1. Install the **REST Client** extension in VS Code
2. Open `src/auth/auth.http`
3. Click "Send Request" above each request

### Using cURL

```bash
# Sign up a new transporter
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "companyName": "Fast Wheels",
    "phoneNumber": "+1234567890",
    "role": "transporter"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Get profile (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

Import these settings:
- **Base URL**: `http://localhost:3000/api`
- **Headers**: `Content-Type: application/json`
- For protected routes: `Authorization: Bearer YOUR_TOKEN`

## 📦 Dependencies Installed

```json
{
  "@nestjs/jwt": "JWT authentication",
  "@nestjs/passport": "Passport integration",
  "passport": "Authentication middleware",
  "passport-jwt": "JWT strategy for Passport",
  "bcryptjs": "Password hashing",
  "class-validator": "DTO validation",
  "class-transformer": "DTO transformation"
}
```

## 🔒 Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT tokens with 7-day expiration
- ✅ CORS enabled for frontend origin
- ✅ Input validation on all endpoints
- ✅ Role-based access control
- ✅ Protected routes with JWT guards

## 📝 User Roles

| Role | Value | Description |
|------|-------|-------------|
| Transporter | `transporter` | Users who transport cargo |
| Cargo Owner | `cargo-owner` | Users who need cargo transported |

## ⚠️ Important Notes

### For Production:

1. **Change JWT Secret**: Update `JWT_SECRET` in `.env` to a strong random string
2. **Use a Database**: Replace in-memory storage with PostgreSQL/MongoDB
3. **Add Refresh Tokens**: Implement token refresh mechanism
4. **Enable HTTPS**: Always use HTTPS in production
5. **Add Rate Limiting**: Protect against brute force attacks
6. **Email Verification**: Add email verification on signup
7. **Password Reset**: Implement forgot password functionality

### Current Limitations:

- ⚠️ Users are stored in memory (lost on server restart)
- ⚠️ No email verification
- ⚠️ No password reset functionality
- ⚠️ No refresh token mechanism

## 🎯 Next Steps

1. **Test the API**: Use the `auth.http` file to test all endpoints
2. **Connect Frontend**: Update your React forms with the integration code above
3. **Add Database**: Integrate Prisma/TypeORM with PostgreSQL
4. **Create More Modules**: Build cargo, shipments, and tracking modules
5. **Add WebSockets**: Real-time tracking updates

## 📚 Documentation

- Full Auth API Documentation: `src/auth/README.md`
- NestJS Docs: https://docs.nestjs.com
- Passport JWT: https://www.passportjs.org/packages/passport-jwt/

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Use a different port
PORT=3001 npm run start:dev
```

### CORS errors
- Verify `FRONTEND_URL` in `.env` matches your React app URL
- Check browser console for exact CORS error

### JWT errors
- Verify the token is being sent in the `Authorization` header
- Check token format: `Bearer YOUR_TOKEN_HERE`
- Token expires after 7 days

## ✨ Features Ready for Frontend

Your React frontend can now:
- ✅ Register new users (Transporter/Cargo Owner)
- ✅ Login users and receive JWT tokens
- ✅ Make authenticated API calls
- ✅ Access user profile data
- ✅ Verify token validity
- ✅ Role-based routing

---

**Happy Coding! 🚀**

For questions or issues, check the documentation in `src/auth/README.md`
