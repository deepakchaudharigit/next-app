# NPCL Dashboard - API Documentation

## Base Information

### Base URLs
- **Development:** `http://localhost:3000/api`
- **Production:** `https://your-domain.com/api`

### Authentication
All protected endpoints require authentication via NextAuth.js session or JWT token.

```http
Authorization: Bearer <jwt-token>
Cookie: next-auth.session-token=<session-token>
```

### Response Format
All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Authentication Endpoints

### NextAuth.js Endpoints

#### Sign In
```http
POST /api/auth/signin/credentials
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "ADMIN"
  },
  "expires": "2024-01-01T00:00:00.000Z"
}
```

#### Sign Out
```http
POST /api/auth/signout
```

#### Get Session
```http
GET /api/auth/session
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "ADMIN"
  },
  "expires": "2024-01-01T00:00:00.000Z"
}
```

#### Get Providers
```http
GET /api/auth/providers
```

### Custom Authentication Endpoints

#### User Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "VIEWER"
  }
}
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "password": "newPassword123"
}
```

#### Change Password
```http
POST /api/auth/change-password
Content-Type: application/json
Authorization: Bearer <token>

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

#### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ADMIN",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update User Profile
```http
PUT /api/auth/profile
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

## User Management Endpoints (Admin Only)

#### List All Users
```http
GET /api/auth/users
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `role` (string): Filter by role (ADMIN, OPERATOR, VIEWER)
- `search` (string): Search by name or email

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "ADMIN",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "isDeleted": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### Create User
```http
POST /api/auth/users
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securePassword123",
  "role": "OPERATOR"
}
```

#### Get Specific User
```http
GET /api/auth/users/{id}
Authorization: Bearer <admin-token>
```

#### Update User
```http
PUT /api/auth/users/{id}
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "name": "Jane Smith",
  "email": "janesmith@example.com",
  "role": "ADMIN"
}
```

#### Delete User
```http
DELETE /api/auth/users/{id}
Authorization: Bearer <admin-token>
```

## Dashboard Endpoints

#### Get Dashboard Statistics
```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)
- `timeRange` (string): Predefined range (today, week, month, year)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalPowerUnits": 25,
    "totalPowerGeneration": 1250.5,
    "averageEfficiency": 87.3,
    "activeAlerts": 3,
    "systemUptime": "99.8%",
    "recentActivity": [
      {
        "id": "activity_id",
        "type": "USER_LOGIN",
        "description": "User logged in",
        "timestamp": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### Get Power Units
```http
GET /api/dashboard/power-units
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (string): Filter by status (ONLINE, OFFLINE, MAINTENANCE, ERROR)
- `type` (string): Filter by type (THERMAL, HYDRO, SOLAR, WIND, NUCLEAR)
- `limit` (number): Number of results

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "unit_id",
      "name": "Thermal Unit 1",
      "type": "THERMAL",
      "status": "ONLINE",
      "capacity": 500.0,
      "currentOutput": 450.0,
      "efficiency": 90.0,
      "lastMaintenance": "2024-01-01T00:00:00.000Z",
      "location": "Plant A"
    }
  ]
}
```

#### Create Power Unit (Admin/Operator)
```http
POST /api/dashboard/power-units
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Solar Unit 1",
  "type": "SOLAR",
  "capacity": 100.0,
  "location": "Rooftop A"
}
```

#### Update Power Unit (Admin/Operator)
```http
PUT /api/dashboard/power-units/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Solar Unit 1 - Updated",
  "status": "MAINTENANCE",
  "currentOutput": 0.0
}
```

#### Delete Power Unit (Admin Only)
```http
DELETE /api/dashboard/power-units/{id}
Authorization: Bearer <admin-token>
```

## Reports Endpoints

#### Get Voicebot Call Reports
```http
GET /api/reports/voicebot-calls
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (string): Start date filter
- `endDate` (string): End date filter
- `language` (string): Filter by language
- `queryType` (string): Filter by query type
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "calls": [
      {
        "id": "call_id",
        "cli": "+1234567890",
        "receivedAt": "2024-01-01T00:00:00.000Z",
        "language": "en",
        "queryType": "billing",
        "ticketsIdentified": 2,
        "durationSeconds": 120,
        "callResolutionStatus": "RESOLVED"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    },
    "summary": {
      "totalCalls": 100,
      "averageDuration": 95,
      "resolutionRate": 85.5
    }
  }
}
```

#### Export Voicebot Call Reports
```http
GET /api/reports/voicebot-calls/export
Authorization: Bearer <token>
```

**Query Parameters:**
- Same as above, plus:
- `format` (string): Export format (csv, excel)

**Response:** File download

## System Endpoints

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  },
  "system": {
    "uptime": 86400,
    "memory": {
      "used": "256MB",
      "total": "1GB"
    },
    "version": "1.0.0"
  }
}
```

## Error Codes

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Custom Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_FAILED` - Invalid credentials
- `AUTHORIZATION_FAILED` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Rate Limiting

### Limits
- **Authentication endpoints:** 5 requests per minute per IP
- **General API endpoints:** 100 requests per minute per user
- **Report exports:** 10 requests per hour per user

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## User Roles and Permissions

### ADMIN
- Full access to all endpoints
- User management (create, update, delete)
- System configuration
- All dashboard features
- Report generation and export

### OPERATOR
- Power unit management (create, update)
- Dashboard access (read/write)
- Report generation
- Maintenance scheduling

### VIEWER
- Read-only dashboard access
- View reports
- View power unit data
- No modification permissions

## Webhook Events (Future)

### User Events
- `user.created`
- `user.updated`
- `user.deleted`
- `user.login`
- `user.logout`

### System Events
- `power_unit.status_changed`
- `alert.created`
- `maintenance.scheduled`
- `report.generated`

## SDK Examples

### JavaScript/TypeScript
```typescript
import { NPCLDashboardAPI } from '@npcl/dashboard-sdk'

const api = new NPCLDashboardAPI({
  baseURL: 'http://localhost:3000/api',
  token: 'your-jwt-token'
})

// Get dashboard stats
const stats = await api.dashboard.getStats({
  timeRange: 'week'
})

// Create user
const user = await api.users.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'OPERATOR'
})
```

### Python
```python
import requests

class NPCLDashboardAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {token}'}
    
    def get_dashboard_stats(self, time_range='week'):
        response = requests.get(
            f'{self.base_url}/dashboard/stats',
            params={'timeRange': time_range},
            headers=self.headers
        )
        return response.json()

api = NPCLDashboardAPI('http://localhost:3000/api', 'your-token')
stats = api.get_dashboard_stats()
```

### cURL Examples
```bash
# Get dashboard stats
curl -X GET "http://localhost:3000/api/dashboard/stats" \
  -H "Authorization: Bearer your-token"

# Create user
curl -X POST "http://localhost:3000/api/auth/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-token" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "OPERATOR"
  }'

# Get voicebot call reports
curl -X GET "http://localhost:3000/api/reports/voicebot-calls?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer your-token"
```

## Testing

### Postman Collection
Import the provided Postman collection (`postman.collection.json`) for easy API testing.

### Test Accounts
Use these accounts for testing different permission levels:

| Role     | Email             | Password    |
|----------|-------------------|-------------|
| Admin    | admin@npcl.com    | admin123    |
| Operator | operator@npcl.com | operator123 |
| Viewer   | viewer@npcl.com   | viewer123   |

### Environment Variables
Set these variables in your testing environment:
- `baseUrl`: `http://localhost:3000/api`
- `adminToken`: JWT token for admin user
- `operatorToken`: JWT token for operator user
- `viewerToken`: JWT token for viewer user