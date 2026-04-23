# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All API requests require authentication except for registration and login. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "monthly_budget": 5000
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token_here"
}
```

#### POST /auth/login
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token_here"
}
```

### Expenses

#### GET /expenses
Get all expenses for the authenticated user.

**Query Parameters:**
- `start_date` (optional): Filter expenses from this date (YYYY-MM-DD)
- `end_date` (optional): Filter expenses until this date (YYYY-MM-DD)
- `category_id` (optional): Filter by category ID
- `type` (optional): Filter by type ('income' or 'expense')

**Response:**
```json
{
  "expenses": [
    {
      "id": 1,
      "user_id": 1,
      "category_id": 1,
      "amount": 50.00,
      "description": "Grocery shopping",
      "date": "2024-01-15",
      "type": "expense",
      "category": {
        "id": 1,
        "name": "Food",
        "color": "#FF5733"
      }
    }
  ]
}
```

#### POST /expenses
Create a new expense/income entry.

**Request Body:**
```json
{
  "category_id": 1,
  "amount": 50.00,
  "description": "Grocery shopping",
  "date": "2024-01-15",
  "type": "expense"
}
```

#### PUT /expenses/:id
Update an existing expense/income entry.

#### DELETE /expenses/:id
Delete an expense/income entry.

### Categories

#### GET /categories
Get all expense categories.

**Response:**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Food",
      "color": "#FF5733",
      "icon": "utensils"
    }
  ]
}
```

#### POST /categories
Create a new category.

**Request Body:**
```json
{
  "name": "Transportation",
  "color": "#3498DB",
  "icon": "car"
}
```

### AI Insights

#### GET /ai/insights
Get AI-powered spending insights for the authenticated user.

**Response:**
```json
{
  "insights": {
    "patterns": [
      {
        "type": "category_dominance",
        "category": "Food",
        "percentage": 45,
        "message": "Food expenses account for 45% of your total spending"
      }
    ],
    "recommendations": [
      {
        "priority": "high",
        "impact": "medium",
        "message": "Consider reducing dining out expenses",
        "category": "savings"
      }
    ],
    "alerts": [
      {
        "type": "deficit",
        "message": "Your expenses exceed your income this month"
      }
    ],
    "forecast": {
      "monthly_total": 3200,
      "confidence": "high",
      "based_on_transactions": 45
    }
  }
}
```

### Goals
### Reminders

#### GET /reminders
Get user's bill reminders.

#### POST /reminders
Create a new bill reminder.

**Request Body:**
```json
{
  "title": "Electricity Bill",
  "amount": 120,
  "due_date": "2024-01-25",
  "category_id": 2,
  "recurring": "monthly"
}
```

### Dashboard

#### GET /dashboard
Get dashboard data including charts and summaries.

**Response:**
```json
{
  "summary": {
    "total_income": 5000,
    "total_expenses": 3200,
    "net_savings": 1800,
    "budget_remaining": 1800
  },
  "charts": {
    "monthly_trend": [...],
    "category_breakdown": [...],
    "income_vs_expenses": [...]
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
