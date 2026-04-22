# Smart Expense Tracker - Complete System Architecture

**Version**: 2.1 | **Date**: April 2026 | **Stack**: React 18 + Node.js/Express + MySQL

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Layers](#architecture-layers)
4. [Data Models & Database Schema](#data-models--database-schema)
5. [Security & Authentication Flow](#security--authentication-flow)
6. [API Routes & Endpoints](#api-routes--endpoints)
7. [Backend Services](#backend-services)
8. [Frontend Architecture](#frontend-architecture)
9. [AI/ML Pipeline](#aiml-pipeline)
10. [Data Flow Workflows](#data-flow-workflows)
11. [Background Jobs & Scheduling](#background-jobs--scheduling)
12. [Known Gaps & Technical Debt](#known-gaps--technical-debt)

---

## System Overview

**Smart Expense Tracker** is a full-stack personal finance application that enables users to:
- Track income and expenses with AI-powered insights
- Set and monitor savings goals
- Receive bill reminders and weekly digests
- Upload transactions via CSV
- Visualize spending patterns with interactive charts
- Access PWA features for offline-capable use

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (React)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Pages: Dashboard | Expenses | Goals | Reports | AI      │  │
│  │ Components: Charts | Forms | Cards | Reminders          │  │
│  │ Contexts: Auth | Theme | Upload | Notification          │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS + JWT Bearer Token (x-auth-token)
┌──────────────────────▼──────────────────────────────────────────┐
│               API GATEWAY (Express.js, Port 5000)               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Routes: /api/auth /api/expenses /api/categories         │  │
│  │           /api/goals /api/reminders /api/dashboard       │  │
│  │           /api/ai /api/suggestions /api/upload /api/email│  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware: CORS | JSON | Auth (JWT verification)      │  │
│  │  Validation: express-validator on all inputs             │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Connection Pool (10 concurrent)
┌──────────────────────▼──────────────────────────────────────────┐
│                   SERVICE LAYER (Business Logic)                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Services: aiService | csvService | emailService        │   │
│  │           geminiService | weeklyDigestService          │   │
│  │           promptBuilder | responseValidator            │   │
│  │           cache | syncScheduler                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ External APIs: Google Gemini | Nodemailer (Gmail SMTP) │   │
│  │                Plaid (stubs - not yet implemented)      │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ SQL Queries (Promise-based)
┌──────────────────────▼──────────────────────────────────────────┐
│              DATA ACCESS LAYER (Models & DB)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Models: User | Expense | Category | Goal | Reminder    │   │
│  │         AISuggestion | WeeklyDigest | Currency         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ MySQL Connection Pool (mysql2 promise wrapper)          │   │
│  │ Host: localhost:3306 | Database: expense_tracker        │   │
│  │ Charset: utf8mb4 (emoji support)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: React 18.2.0 with hooks
- **Routing**: React Router v6.15.0
- **State Management**: React Context API (4 contexts)
- **HTTP Client**: Axios 1.13.6 (with interceptors for JWT)
- **Charts**: Recharts 2.15.4 (bar, line, pie, area charts)
- **UI Utilities**: React Icons 4.11.0, React Dropzone 15.0.0
- **Date Handling**: date-fns 2.30.0
- **Build Tool**: Create React App (react-scripts 5.0.1)
- **Payment**: Razorpay 2.9.6 (integrated, unused in current scope)

### Backend
- **Runtime**: Node.js v16+
- **Framework**: Express.js 5.2.1
- **Database**: MySQL2 3.20.0 (promise-based)
- **Authentication**: JWT (jsonwebtoken 9.0.3), bcryptjs 2.4.3
- **AI Integration**: Google Gemini API (via HTTP calls)
- **CSV Processing**: csv-parser 3.2.0
- **File Upload**: Multer 2.1.1
- **Email**: Nodemailer (via Gmail SMTP)
- **Scheduling**: node-cron 4.2.1
- **ML Libraries**: 
  - brain.js 1.6.1 (neural networks - unused)
  - ml-regression 6.3.0 (linear/polynomial regression)
  - simple-statistics 7.8.9 (statistical analysis)
- **NLP**: natural 8.1.1, compromise 14.15.0 (not heavily used)
- **Dev Tools**: Nodemon, ESLint, Prettier, Jest

### Database
- **DBMS**: MySQL 8.0+
- **Connection Pool**: 10 concurrent connections, 0 queue limit
- **Tables**: 13 (users, expenses, categories, goals, reminders, etc.)
- **Views**: 3 (monthly_summary, category_spending, budget_vs_actual)
- **Stored Procedures**: 1 (sp_get_spending_insights)
- **Character Set**: utf8mb4 (full emoji support)

### Infrastructure (Local Development)
- **Frontend Dev Server**: Webpack dev server on localhost:3000
- **Backend Dev Server**: Express.js on localhost:5000
- **Proxy**: Frontend proxies requests to :5000 API
- **PWA**: Service Worker support (with offline capability planning)

---

## Architecture Layers

### 1. **Presentation Layer (React Components)**

#### Page Components (in `frontend/src/pages/`)
- **Auth.js**: Login/Register page with form validation
- **Dashboard.js**: Main dashboard with budget overview, recent expenses, top categories, upcoming reminders
- **Expenses.js**: CRUD interface for expenses with filters, search, bulk actions
- **Goals.js**: Create/edit/track savings goals with progress visualization
- **Reports.js**: Summary reports, spending trends, category breakdowns
- **Reminders.js**: View and manage bill reminders with payment tracking
- **Notifications.js**: Notification history and preferences
- **Settings.js**: User profile, budget, currency, theme settings
- **Upload.js**: CSV upload interface with preview and error handling

#### Core Components (in `frontend/src/components/`)
- **TopNav.js**: Header with user menu, search, and notifications
- **Sidebar.js**: Navigation menu (collapsible on mobile)
- **PrivateRoute.js**: Route protection wrapper checking JWT validity
- **AIDashboard.js**: AI-powered insights display with patterns, forecasts, anomalies
- **SuggestionsInbox.js**: User decisions on AI-generated suggestions
- **WeeklyDigest.js**: Display of Monday weekly digest bullets
- **ExpenseForm.js**: Reusable form for creating/editing expenses
- **CategoryManager.js**: Add/edit/organize expense categories
- **CurrencySelector.js**: Multi-currency support with conversion
- **SavingsGoals.js**: Mini goal tracker component
- **BillReminders.js**: Upcoming reminders card
- **CSVUploader.js**: File drop zone with preview
- **AppearanceSettings.js**: Theme and display options
- **InstallPWA.js**: PWA install prompt
- **ThemeTest.js**: Dark mode / theme verification component

#### Context Providers (in `frontend/src/context/`)
```
┌─ AuthContext: { user, token, login(), logout(), isAuthenticated }
├─ ThemeContext: { theme, toggleDarkMode(), accent color }
├─ NotificationContext: { notifications[], addNotification(), removeNotification() }
└─ UploadContext: { uploadProgress, uploadStatus, setUploadProgress() }
```

---

### 2. **API Gateway Layer (Express.js Routes)**

#### Route Groups and Endpoints

| Route | Method | Purpose | Auth | Request | Response |
|-------|--------|---------|------|---------|----------|
| `/api/auth/register` | POST | Create account | ✗ | `{name, email, password}` | `{token, user}` |
| `/api/auth/login` | POST | Login | ✗ | `{email, password}` | `{token, user}` |
| `/api/auth/me` | GET | Verify token & get profile | ✅ | - | `{id, name, email, budget}` |
| `/api/auth/profile` | PUT | Update user info | ✅ | `{name?, email?}` | `{user}` |
| `/api/auth/password` | PUT | Change password | ✅ | `{currentPassword, newPassword}` | `{message}` |
| | | | | | |
| `/api/expenses` | GET | List user expenses | ✅ | `?month=MM&year=YYYY&category=ID` | `[expenses]` |
| `/api/expenses/:id` | GET | Get single expense | ✅ | - | `{expense}` |
| `/api/expenses` | POST | Create expense | ✅ | `{category_id, amount, description, date, type}` | `{id, ...}` |
| `/api/expenses/:id` | PUT | Update expense | ✅ | `{category_id?, amount?, ...}` | `{expense}` |
| `/api/expenses/:id` | DELETE | Delete expense | ✅ | - | `{message}` |
| `/api/expenses/summary` | GET | Monthly summary stats | ✅ | `?month=MM&year=YYYY` | `{total_income, total_expenses, net}` |
| `/api/expenses/insights` | GET | Spending analysis | ✅ | - | `{insights, patterns, alerts}` |
| | | | | | |
| `/api/categories` | GET | List all categories | ✅ | - | `[categories]` |
| `/api/categories` | POST | Create category | ✅ | `{name, icon, color}` | `{id, name, ...}` |
| `/api/categories/:id` | PUT | Update category | ✅ | `{name?, icon?, color?}` | `{category}` |
| `/api/categories/:id` | DELETE | Delete category | ✅ | - | `{message}` |
| `/api/categories/popular` | GET | Get trending categories | ✅ | `?limit=5` | `[categories]` |
| `/api/categories/suggestions` | GET | Suggest categories | ✅ | `?text=query` | `[suggested_categories]` |
| `/api/categories/migrate` | POST | Migrate expenses to category | ✅ | `{from_id, to_id}` | `{migrated_count}` |
| | | | | | |
| `/api/goals` | GET | List savings goals | ✅ | - | `[goals]` |
| `/api/goals` | POST | Create goal | ✅ | `{name, target_amount, deadline}` | `{id, ...}` |
| `/api/goals/:id` | PUT | Update goal | ✅ | `{name?, target_amount?, deadline?}` | `{goal}` |
| `/api/goals/:id` | DELETE | Delete goal | ✅ | - | `{message}` |
| `/api/goals/:id/stats` | GET | Goal progress stats | ✅ | - | `{current_amount, percentage, days_left}` |
| | | | | | |
| `/api/reminders` | GET | List bill reminders | ✅ | `?status=pending&sort=due_date` | `[reminders]` |
| `/api/reminders` | POST | Create reminder | ✅ | `{bill_name, amount, due_date, recurring}` | `{id, ...}` |
| `/api/reminders/:id` | PUT | Update reminder | ✅ | `{bill_name?, amount?, ...}` | `{reminder}` |
| `/api/reminders/:id` | DELETE | Delete reminder | ✅ | - | `{message}` |
| `/api/reminders/:id/mark-paid` | POST | Mark as paid | ✅ | `{paid_date?}` | `{reminder}` |
| `/api/reminders/upcoming` | GET | Upcoming reminders (7 days) | ✅ | - | `[reminders]` |
| | | | | | |
| `/api/dashboard/summary` | GET | Full dashboard data | ✅ | - | `{budget, spent, income, goals, reminders, chart_data}` |
| | | | | | |
| `/api/ai/insights` | GET | AI analysis (cached 1h) | ✅ | - | `{patterns, recommendations, alerts, forecast}` |
| `/api/ai/patterns` | GET | Spending pattern analysis | ✅ | - | `{categories_trend, income_trend}` |
| `/api/ai/forecast` | GET | 30-day expense forecast | ✅ | - | `{forecast_data, confidence}` |
| `/api/ai/anomalies` | GET | Unusual transactions | ✅ | - | `{anomalies, severity}` |
| `/api/ai/savings-opportunities` | GET | Cost-cutting suggestions | ✅ | - | `{opportunities, potential_savings}` |
| `/api/ai/gemini-insights` | GET | Gemini-enhanced insights | ✅ | - | `{summary, suggestions}` |
| | | | | | |
| `/api/suggestions/pending` | GET | Pending AI suggestions | ✅ | - | `[suggestions]` |
| `/api/suggestions/:id/decide` | POST | Accept/reject suggestion | ✅ | `{decision: "accept"\|"reject"}` | `{updated_suggestion}` |
| `/api/suggestions/history` | GET | Suggestion decision history | ✅ | - | `[suggestions]` |
| | | | | | |
| `/api/upload/csv` | POST | Upload CSV file | ✅ | `FormData: file` | `{valid_records, invalid_records, summary}` |
| | | | | | |
| `/api/email/send-weekly-report` | POST | Send weekly email | ✅ | `{recipient?}` | `{sent, timestamp}` |
| | | | | | |

---

### 3. **Service Layer (Business Logic)**

#### Core Services in `backend/services/`

##### **aiService.js** - Main AI Engine
```
generateInsights(userId) → {
  patterns: { income_trend, category_dominance, high_frequency },
  recommendations: { budget_advice, expense_trends, income_optimization },
  alerts: { budget_overspend, unusual_spending, income_fluctuation },
  forecast: { predicted_expenses_next_30d, confidence_score },
  anomalies: { outlier_transactions, std_deviation_threshold },
  savings_opportunities: { high_spend_categories, reduction_potential }
}
```

**Flow**:
1. Check 1-hour TTL cache → return if found
2. Fetch: user budget, all transactions (last 90 days), category summary
3. Calculate patterns: income/expense trends, category dominance
4. Detect anomalies: >2 standard deviations from mean
5. Generate rule-based insights
6. Decide: Trigger Gemini if (transactions > 50) OR (patterns > 3) OR (alerts > 2)
7. Call Gemini if enabled → validate response → save suggestions
8. Cache result (1 hour)
9. Return combined insights

##### **csvService.js** - CSV Import & Processing
```
uploadCSV(userId, fileBuffer) → {
  valid_records: int,
  invalid_records: [ { row, reason } ],
  summary: { total_income, total_expenses, transactions_created }
}
```

**Flow**:
1. Parse CSV with header detection (smart mapping: "date", "debit", "credit", "salary", "income", etc.)
2. Infer type (income vs expense) based on column names
3. Validate each row (date format, numeric amount, category exists)
4. **DESTRUCTIVE**: DELETE all existing expenses for user
5. Auto-categorize: Fuzzy match transaction description to category names
6. If no match → attempt Gemini categorization (if enabled)
7. Batch insert valid transactions (with transaction support)
8. Update category usage counts and last_used timestamps
9. Clear AI cache and trigger fresh insights generation
10. Return summary with record counts

##### **geminiService.js** - Google Gemini Integration
```
getEnhancedInsights(userData, insights) → {
  summary: string,
  suggestions: [ { title, description, action, impact } ],
  key_metrics: { ... }
}
```

**Configuration**:
- Model: `gemini-2.0-flash` (fast, optimized)
- Token limit: 8,000 output tokens
- Streaming: disabled (full response awaited)
- Error handling: Falls back to rule-based insights if Gemini unavailable

##### **promptBuilder.js** - Structured Prompt Generation
```
buildInsightPrompt(userData, transactions, insights) → string
```

Constructs a detailed prompt including:
- User's budget and spending habits
- Transaction breakdown by category
- Previous AI insights
- Specific request for actionable suggestions
- JSON formatting requirements
- Instruction to avoid moral/judgmental language

##### **responseValidator.js** - Gemini Response Parsing
```
validateAndClean(geminiResponse) → {
  valid: boolean,
  cleanedResponse: object,
  errors: [ string ]
}
```

**Tasks**:
- Parse JSON response from Gemini
- Strip moral language ("you shouldn't", "you must")
- Validate required fields (summary, suggestions)
- Ensure suggestions include title, description, action, impact
- Convert to database format for storage

##### **weeklyDigestService.js** - Scheduled Digest Generation
```
runDigestForAllUsers() → void
```

**Triggered**: Monday 7:00 AM (cron) OR Sunday 9:00 AM EST (scheduler.js)

**Process per user**:
1. Fetch last 7 days of transactions
2. Calculate: income, expenses, net savings, top 3 categories
3. Build Gemini prompt with weekly summary
4. Call Gemini for bullet points
5. Format response: bullets with sentiment (increase 📈 / decrease 📉 / neutral ➡️ / alert ⚠️)
6. Store in `weekly_digests` table (JSON format)
7. Queue email send if enabled (currently manual trigger)

##### **emailService.js** - Email Delivery
```
sendWeeklyReport(userId, reportData) → { success: boolean, message_id: string }
```

**Configuration**:
- Provider: Gmail SMTP (via nodemailer)
- Requires: `GMAIL_USER` and `GMAIL_PASSWORD` environment variables
- Template: HTML with stats table, top 5 categories, link to dashboard
- Tracking: Logged in `email_logs` table

##### **syncScheduler.js** - Background Job Orchestrator
```
STUB - Not yet implemented
Job 1 (Daily 2 AM): Plaid bank sync (requires plaidService.js)
Job 2 (Sunday 3 AM): Cleanup old logs
```

##### **cache.js** - In-Memory Caching (Simple TTL)
```
set(key, value, ttl_seconds) → void
get(key) → value | null
delete(key) → void
clear() → void
```

**Used for**:
- AI insights (1-hour TTL)
- Category suggestions (30-minute TTL)
- Spending patterns (2-hour TTL)

---

### 4. **Data Access Layer (Models)**

#### Database Models in `backend/models/`

##### **User.js**
```javascript
static async create(userData) → insertId
static async findByEmail(email) → user | null
static async findById(id) → { id, name, email, monthly_budget, created_at }
static async updateProfile(id, { name, email }) → user
static async updatePassword(id, newPasswordHash) → boolean
```

##### **Expense.js**
```javascript
static async create(userId, expenseData) → insertId
static async findById(id) → expense
static async findByUserId(userId, filters?) → [expenses]
static async update(id, expenseData) → updated_expense
static async delete(id) → boolean
static async getByCategoryAndDateRange(userId, categoryId, startDate, endDate) → [expenses]
static async getMonthlyTotal(userId, month, year) → { income, expenses, count }
static async getByType(userId, type: 'income'|'expense') → [expenses]
```

##### **Category.js**
```javascript
static async create(categoryData) → insertId
static async findById(id) → category
static async findAll(limit?) → [categories]
static async update(id, { name, icon, color }) → category
static async delete(id) → boolean
static async getDefaults() → [default_categories]
static async incrementUsageCount(categoryId) → void
static async fuzzySearch(query, limit = 5) → [matched_categories]
```

##### **Goal.js**
```javascript
static async create(userId, goalData) → insertId
static async findById(id) → goal
static async findByUserId(userId) → [goals]
static async update(id, goalData) → goal
static async delete(id) → boolean
static async getStats(userId) → { total_saved, goals_on_track, goals_behind }
```

##### **Reminder.js**
```javascript
static async create(userId, reminderData) → insertId
static async findById(id) → reminder
static async findByUserId(userId, status?) → [reminders]
static async update(id, reminderData) → reminder
static async delete(id) → boolean
static async markAsPaid(id, paidDate) → reminder
static async getUpcoming(userId, daysAhead = 7) → [upcoming_reminders]
```

##### **AISuggestion.js**
```javascript
static async create(userId, suggestionData) → insertId
static async findById(id) → suggestion
static async findPending(userId) → [pending_suggestions]
static async recordDecision(id, decision: 'accept'|'reject') → suggestion
static async getHistory(userId, limit = 50) → [history]
```

##### **WeeklyDigest.js**
```javascript
static async create(userId, digestData) → insertId
static async findLatest(userId) → digest
static async findByDateRange(userId, startDate, endDate) → [digests]
```

##### **Currency.js**
```javascript
static async getRate(fromCurrency, toCurrency) → rate
static async convert(amount, fromCurrency, toCurrency) → converted_amount
static async updateRate(fromCurrency, toCurrency, rate) → void
```

---

## Data Models & Database Schema

### Database Overview
```
expense_tracker (MySQL 8.0+)
├── Core Tables
│   ├── users (11 cols)
│   ├── expenses (10 cols)
│   ├── categories (5 cols)
│   ├── expense_categories (3 cols) - unused in current implementation
│   ├── savings_goals (7 cols)
│   ├── bill_reminders (11 cols)
│   └── currency_rates (5 cols)
├── Feature Tables
│   ├── ai_suggestions (missing DDL)
│   ├── weekly_digests (missing DDL)
│   ├── notification_preferences (7 cols)
│   ├── investments (9 cols) - stub, no routes
│   ├── email_logs (6 cols)
├── Views
│   ├── vw_monthly_summary
│   ├── vw_category_spending
│   └── vw_budget_vs_actual
└── Stored Procedures
    └── sp_get_spending_insights
```

### Table Schemas

#### **users**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  monthly_budget DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);
```

#### **expenses** (Core transaction table)
```sql
CREATE TABLE expenses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(255),
  date DATE NOT NULL,
  type ENUM('income', 'expense') DEFAULT 'expense',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_user_date (user_id, date),
  INDEX idx_category (category_id),
  INDEX idx_type (type)
);
```

#### **categories** (11 defaults included)
```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(50) DEFAULT '📌',
  color VARCHAR(20) DEFAULT '#808080',
  is_default BOOLEAN DEFAULT TRUE,
  usage_count INT DEFAULT 0,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Default Categories**:
1. 🍔 Food & Dining - #FF6B6B
2. 🚗 Transportation - #4ECDC4
3. 🛍️ Shopping - #45B7D1
4. 🎬 Entertainment - #96CEB4
5. 📄 Bills & Utilities - #FFEAA7
6. 🏥 Healthcare - #DDA0DD
7. 📚 Education - #98D8C8
8. 🛒 Groceries - #FF9F1C
9. ✈️ Travel - #A06AB4
10. 💰 Income - #48C774
11. 📌 Other - #B0B0B0

#### **savings_goals**
```sql
CREATE TABLE savings_goals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  deadline DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_goals (user_id),
  INDEX idx_deadline (deadline)
);
```

#### **bill_reminders**
```sql
CREATE TABLE bill_reminders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  bill_name VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  category_id INT,
  recurring ENUM('one-time', 'monthly', 'yearly') DEFAULT 'one-time',
  status ENUM('pending', 'paid', 'skipped') DEFAULT 'pending',
  paid_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_user_reminders (user_id),
  INDEX idx_due_date (due_date),
  INDEX idx_status (status)
);
```

#### **currency_rates**
```sql
CREATE TABLE currency_rates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(10,4) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_currency_pair (from_currency, to_currency)
);
```

**Supported Currencies**: USD, EUR, GBP, JPY, SGD, INR (6 pairs, 10 conversions)

#### **notification_preferences** (Unused)
```sql
CREATE TABLE notification_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  weekly_report BOOLEAN DEFAULT TRUE,
  monthly_report BOOLEAN DEFAULT TRUE,
  bill_reminders BOOLEAN DEFAULT TRUE,
  budget_alerts BOOLEAN DEFAULT TRUE,
  promotional_emails BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Note**: UI components don't consume this data; all notifications currently non-configurable.

#### **investments** (Stub - No Routes/UI)
```sql
CREATE TABLE investments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('stocks', 'mutual_funds', 'etf', 'bonds', 'fixed_deposit', 'gold', 'crypto', 'other'),
  amount_invested DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2),
  purchase_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### **email_logs**
```sql
CREATE TABLE email_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  report_type ENUM('weekly', 'monthly', 'custom') NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('sent', 'failed') DEFAULT 'sent',
  error_message TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_logs (user_id),
  INDEX idx_sent_at (sent_at)
);
```

### SQL Views

#### **vw_monthly_summary**
Aggregates monthly transactions with income/expense breakdown:
```sql
SELECT 
  user_id, year, month, transaction_count,
  total_expenses, total_income, expense_count, income_count,
  avg_expense, avg_income
FROM expenses
GROUP BY user_id, YEAR(date), MONTH(date);
```

#### **vw_category_spending**
Category-level spending analysis:
```sql
SELECT 
  user_id, category_id, category_name, icon, color,
  transaction_count, total_expenses, total_income
FROM expenses 
JOIN categories
GROUP BY user_id, category_id;
```

#### **vw_budget_vs_actual**
User budget vs. actual spending comparison:
```sql
SELECT 
  user_id, monthly_budget, actual_expenses, actual_income,
  net_savings, percentage_used, remaining_budget
FROM users
LEFT JOIN vw_monthly_summary
WHERE month = CURRENT_MONTH AND year = CURRENT_YEAR;
```

---

## Security & Authentication Flow

### JWT Authentication Mechanism

#### Token Structure
```
Header: { "alg": "HS256", "typ": "JWT" }
Payload: { "user": { "id": <user_id> }, "iat": <timestamp>, "exp": <7 days> }
Signature: HMAC-SHA256(secret: process.env.JWT_SECRET)
```

#### Token Lifecycle

**1. Registration Flow** (`POST /api/auth/register`)
```
User submits: { name, email, password }
  ↓
Backend validates: name ≠ empty, email is valid, password ≥ 6 chars
  ↓
Check if user exists: SELECT * FROM users WHERE email = ?
  ↓ (if not exists)
Hash password: bcrypt.hash(password, saltRounds=10)
  ↓
Create user: INSERT INTO users (name, email, password_hash, ...)
  ↓
Generate JWT: jwt.sign({ user: { id } }, JWT_SECRET, { expiresIn: '7d' })
  ↓
Return: { token, user: { id, name, email, monthly_budget } }
```

**2. Login Flow** (`POST /api/auth/login`)
```
User submits: { email, password }
  ↓
Validate: email is valid, password exists
  ↓
Find user: SELECT * FROM users WHERE email = ?
  ↓ (if found)
Compare password: bcrypt.compare(password, user.password_hash)
  ↓ (if match)
Generate JWT: jwt.sign({ user: { id } }, JWT_SECRET, { expiresIn: '7d' })
  ↓
Return: { token, user: { id, name, email, monthly_budget } }
```

**3. Request Authentication** (Middleware)
```
Client sends: GET /api/expenses
  Header: x-auth-token: <JWT>
  ↓
Middleware extracts token: req.header('x-auth-token')
  ↓ (if token exists)
Verify token: jwt.verify(token, JWT_SECRET)
  ↓ (if valid)
Decode payload: { user: { id } } → attach to req.user
  ↓
Allow request to proceed with req.user.id
```

**4. Frontend Token Management** (AuthContext)
```
On app load:
  ↓
Check localStorage for 'token'
  ↓ (if exists)
Call GET /api/auth/me with header x-auth-token: <token>
  ↓
If 401 (unauthorized) → logout user, redirect to /login
If 200 (authorized) → set AuthContext state: { user, token, isAuthenticated: true }
  ↓
Axios interceptor adds x-auth-token header to all requests
Response interceptor handles 401 → logout + redirect
```

### Frontend Token Storage & Axios Setup

**AuthContext.js Implementation**:
```javascript
const [token, setToken] = useState(localStorage.getItem('token'));
const [user, setUser] = useState(null);

// On token change
useEffect(() => {
  if (token) {
    localStorage.setItem('token', token);
    // Set axios default header
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
  }
}, [token]);

// Axios response interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      logout(); // Clear token, redirect to /login
    }
    return Promise.reject(error);
  }
);
```

### Password Security

- **Hashing Algorithm**: bcryptjs v2.4.3
- **Salt Rounds**: 10 (default)
- **Cost Factor**: Time/CPU cost of ~100ms per hash
- **Strength Requirements**: 
  - Minimum 6 characters (enforced in validators)
  - Recommended: 12+ chars, mixed case, numbers, symbols (not enforced)

### CORS & Cross-Origin Requests

**Backend Configuration** (server.js):
```javascript
app.use(cors()); // Allow all origins in development
// Production: should restrict to frontend domain
```

**Frontend Proxy** (package.json):
```json
"proxy": "http://localhost:5000"
```

All `axios.get('/api/...')` requests automatically target `http://localhost:5000/api/...`

---

## API Routes & Endpoints

### Complete Route Listing

#### Authentication Routes (`/api/auth`)

**POST /register**
- **Purpose**: Create new user account
- **Auth**: None
- **Request Body**: `{ name, email, password }`
- **Validation**: 
  - name: required, non-empty
  - email: required, valid email format
  - password: required, ≥6 characters
- **Response**:
  ```json
  {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "monthly_budget": 0
    }
  }
  ```
- **Error Codes**:
  - 400: User already exists / validation failed
  - 500: Server error

**POST /login**
- **Purpose**: Authenticate user and get JWT
- **Auth**: None
- **Request Body**: `{ email, password }`
- **Validation**:
  - email: required, valid format
  - password: required
- **Response**: Same as /register
- **Error Codes**:
  - 400: Invalid credentials (email not found or password mismatch)
  - 500: Server error

**GET /me**
- **Purpose**: Verify token and return user profile
- **Auth**: ✅ Required (x-auth-token header)
- **Request**: None
- **Response**:
  ```json
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "monthly_budget": 50000,
    "created_at": "2026-01-15T10:30:00Z"
  }
  ```
- **Error Codes**:
  - 401: Invalid/expired token
  - 404: User not found
  - 500: Server error

**PUT /profile**
- **Purpose**: Update user name or email
- **Auth**: ✅ Required
- **Request Body**: `{ name?, email? }` (optional fields)
- **Validation**:
  - name: if provided, non-empty
  - email: if provided, valid format and unique
- **Response**: `{ user: { id, name, email, monthly_budget } }`
- **Error Codes**:
  - 400: Validation failed / email already taken
  - 401: Unauthorized
  - 404: User not found
  - 500: Server error

**PUT /password**
- **Purpose**: Change user password
- **Auth**: ✅ Required
- **Request Body**: `{ currentPassword, newPassword }`
- **Validation**:
  - currentPassword: required, correct (verified via bcrypt)
  - newPassword: required, ≥6 characters
- **Response**: `{ message: "Password updated successfully" }`
- **Error Codes**:
  - 400: Current password incorrect / validation failed
  - 401: Unauthorized
  - 404: User not found
  - 500: Server error

---

#### Expense Routes (`/api/expenses`)

**GET /**
- **Purpose**: Retrieve user's expenses with optional filters
- **Auth**: ✅ Required
- **Query Params**:
  - `month` (1-12): Filter by month
  - `year` (YYYY): Filter by year
  - `category` (ID): Filter by category
  - `type` (income|expense): Filter by type
  - `startDate` (YYYY-MM-DD): Range start
  - `endDate` (YYYY-MM-DD): Range end
  - `limit` (int, default 50): Max results
  - `offset` (int, default 0): Pagination offset
- **Response**:
  ```json
  [
    {
      "id": 101,
      "user_id": 1,
      "category_id": 3,
      "category_name": "Food & Dining",
      "amount": 450.00,
      "description": "Lunch at restaurant",
      "date": "2026-04-20",
      "type": "expense",
      "created_at": "2026-04-20T12:30:00Z"
    }
  ]
  ```
- **Error Codes**:
  - 401: Unauthorized
  - 400: Invalid filter params
  - 500: Server error

**GET /:id**
- **Purpose**: Get single expense details
- **Auth**: ✅ Required
- **Path Params**: `id` (expense ID)
- **Response**: Single expense object
- **Error Codes**:
  - 401: Unauthorized
  - 404: Expense not found
  - 500: Server error

**POST /**
- **Purpose**: Create new expense/income entry
- **Auth**: ✅ Required
- **Request Body**:
  ```json
  {
    "category_id": 3,
    "amount": 450.00,
    "description": "Lunch",
    "date": "2026-04-20",
    "type": "expense"
  }
  ```
- **Validation**:
  - category_id: required, exists in database
  - amount: required, > 0
  - date: required, valid ISO date
  - type: required, 'income' or 'expense'
  - description: optional, string
- **Response**: `{ id, ...expense }`
- **Side Effects**:
  - Increments category `usage_count`
  - Updates category `last_used` timestamp
  - Clears AI insights cache
- **Error Codes**:
  - 400: Validation failed
  - 401: Unauthorized
  - 500: Server error

**PUT /:id**
- **Purpose**: Update existing expense
- **Auth**: ✅ Required (owns expense)
- **Path Params**: `id`
- **Request Body**: Any subset of creation fields
- **Response**: Updated expense object
- **Side Effects**: Clears AI cache
- **Error Codes**:
  - 400: Validation failed
  - 401: Unauthorized / not owner
  - 404: Expense not found
  - 500: Server error

**DELETE /:id**
- **Purpose**: Delete expense
- **Auth**: ✅ Required (owns expense)
- **Response**: `{ message: "Expense deleted successfully" }`
- **Side Effects**: Clears AI cache
- **Error Codes**:
  - 401: Unauthorized
  - 404: Not found
  - 500: Server error

**GET /summary**
- **Purpose**: Get monthly spending summary
- **Auth**: ✅ Required
- **Query Params**: `month`, `year` (current month if not provided)
- **Response**:
  ```json
  {
    "total_income": 150000.00,
    "total_expenses": 45000.00,
    "net": 105000.00,
    "transaction_count": 45,
    "average_transaction": 1000.00,
    "top_category": {
      "name": "Food & Dining",
      "amount": 5000.00,
      "percentage": 11.11
    }
  }
  ```
- **Error Codes**:
  - 401: Unauthorized
  - 500: Server error

**GET /insights**
- **Purpose**: Get AI-generated spending analysis
- **Auth**: ✅ Required
- **Query Params**: None
- **Response**: Full AI insights object (see AI Pipeline section)
- **Caching**: 1-hour TTL
- **Error Codes**:
  - 401: Unauthorized
  - 500: Server error

---

#### Category Routes (`/api/categories`)

**GET /**
- **Purpose**: List all categories (defaults + user-created)
- **Auth**: ✅ Required
- **Query Params**:
  - `includeDefault` (boolean, default true): Include default categories
  - `includeCustom` (boolean, default true): Include user categories
- **Response**:
  ```json
  [
    {
      "id": 1,
      "name": "Food & Dining",
      "icon": "🍔",
      "color": "#FF6B6B",
      "is_default": true,
      "usage_count": 25,
      "last_used": "2026-04-20T15:30:00Z"
    }
  ]
  ```
- **Error Codes**:
  - 401: Unauthorized
  - 500: Server error

**POST /**
- **Purpose**: Create custom category
- **Auth**: ✅ Required
- **Request Body**:
  ```json
  {
    "name": "Subscriptions",
    "icon": "🔔",
    "color": "#FF00FF"
  }
  ```
- **Validation**:
  - name: required, ≤50 chars, unique per user
  - icon: optional, ≤50 chars (emoji)
  - color: optional, valid hex color
- **Response**: `{ id, ...category }`
- **Error Codes**:
  - 400: Validation failed / duplicate name
  - 401: Unauthorized
  - 500: Server error

**PUT /:id**
- **Purpose**: Update category (name, icon, color)
- **Auth**: ✅ Required
- **Response**: Updated category object
- **Error Codes**:
  - 400: Validation failed
  - 401: Unauthorized
  - 404: Not found
  - 500: Server error

**DELETE /:id**
- **Purpose**: Delete category (must not have expenses)
- **Auth**: ✅ Required
- **Response**: `{ message: "Category deleted" }`
- **Error Codes**:
  - 400: Category has expenses (move first)
  - 401: Unauthorized
  - 404: Not found
  - 500: Server error

**GET /popular**
- **Purpose**: Get most-used categories
- **Auth**: ✅ Required
- **Query Params**: `limit` (default 5)
- **Response**: Array of top categories by usage_count
- **Error Codes**:
  - 401: Unauthorized
  - 500: Server error

**GET /suggestions?text=query**
- **Purpose**: Fuzzy match category names
- **Auth**: ✅ Required
- **Query Params**: `text` (search query)
- **Response**: Array of matched categories
- **Example**: `?text=food` → Food & Dining, Groceries
- **Error Codes**:
  - 401: Unauthorized
  - 500: Server error

**POST /migrate**
- **Purpose**: Move all expenses from one category to another
- **Auth**: ✅ Required
- **Request Body**: `{ from_id, to_id }`
- **Response**: `{ migrated_count: int }`
- **Error Codes**:
  - 400: Same category / category not found
  - 401: Unauthorized
  - 500: Server error

---

#### Goals Routes (`/api/goals`)

**GET /**
- **Purpose**: List all savings goals for user
- **Auth**: ✅ Required
- **Query Params**: `includeArchived` (default false)
- **Response**:
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "name": "Vacation Fund",
      "target_amount": 50000.00,
      "current_amount": 12500.00,
      "deadline": "2026-12-31",
      "percentage": 25,
      "days_left": 255,
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
  ```
- **Error Codes**:
  - 401: Unauthorized
  - 500: Server error

**POST /**
- **Purpose**: Create new savings goal
- **Auth**: ✅ Required
- **Request Body**:
  ```json
  {
    "name": "Vacation Fund",
    "target_amount": 50000.00,
    "deadline": "2026-12-31"
  }
  ```
- **Validation**:
  - name: required, ≤100 chars
  - target_amount: required, > 0
  - deadline: required, future date
- **Response**: `{ id, ...goal, current_amount: 0 }`
- **Error Codes**:
  - 400: Validation failed / deadline in past
  - 401: Unauthorized
  - 500: Server error

**PUT /:id**
- **Purpose**: Update goal details
- **Auth**: ✅ Required
- **Request Body**: Any subset of creation fields
- **Response**: Updated goal object
- **Error Codes**:
  - 400: Validation failed
  - 401: Unauthorized / not owner
  - 404: Not found
  - 500: Server error

**DELETE /:id**
- **Purpose**: Delete goal
- **Auth**: ✅ Required (owns goal)
- **Response**: `{ message: "Goal deleted" }`
- **Error Codes**:
  - 401: Unauthorized
  - 404: Not found
  - 500: Server error

**GET /:id/stats**
- **Purpose**: Get goal progress metrics
- **Auth**: ✅ Required
- **Response**:
  ```json
  {
    "current_amount": 12500.00,
    "target_amount": 50000.00,
    "percentage": 25,
    "amount_remaining": 37500.00,
    "days_left": 255,
    "on_track": true,
    "monthly_requirement": 147.06
  }
  ```
- **Error Codes**:
  - 401: Unauthorized
  - 404: Not found
  - 500: Server error

---

#### Reminders Routes (`/api/reminders`)

**GET /**
- **Purpose**: List bill reminders
- **Auth**: ✅ Required
- **Query Params**:
  - `status` (pending|paid|skipped): Filter by status
  - `sort` (due_date|amount): Sort field
  - `order` (asc|desc, default asc): Sort order
- **Response**:
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "bill_name": "Internet Bill",
      "amount": 999.00,
      "due_date": "2026-05-01",
      "recurring": "monthly",
      "status": "pending",
      "days_until_due": 9,
      "created_at": "2026-02-01T10:00:00Z"
    }
  ]
  ```
- **Error Codes**:
  - 401: Unauthorized
  - 400: Invalid filter
  - 500: Server error

**POST /**
- **Purpose**: Create bill reminder
- **Auth**: ✅ Required
- **Request Body**:
  ```json
  {
    "bill_name": "Internet Bill",
    "amount": 999.00,
    "due_date": "2026-05-01",
    "category_id": 5,
    "recurring": "monthly"
  }
  ```
- **Validation**:
  - bill_name: required, ≤100 chars
  - amount: required, > 0
  - due_date: required, future date
  - recurring: one-time|monthly|yearly
  - category_id: optional, valid category
- **Response**: `{ id, ...reminder, status: "pending" }`
- **Error Codes**:
  - 400: Validation failed
  - 401: Unauthorized
  - 500: Server error

**PUT /:id**
- **Purpose**: Update reminder
- **Auth**: ✅ Required
- **Request Body**: Any subset of creation fields
- **Response**: Updated reminder object
- **Error Codes**:
  - 400: Validation failed
  - 401: Unauthorized / not owner
  - 404: Not found
  - 500: Server error

**DELETE /:id**
- **Purpose**: Delete reminder
- **Auth**: ✅ Required
- **Response**: `{ message: "Reminder deleted" }`
- **Error Codes**:
  - 401: Unauthorized
  - 404: Not found
  - 500: Server error

**POST /:id/mark-paid**
- **Purpose**: Mark reminder as paid
- **Auth**: ✅ Required
- **Request Body**: `{ paid_date?: "2026-04-25" }` (optional, defaults to today)
- **Response**: Updated reminder with `status: "paid", paid_date`
- **Error Codes**:
  - 401: Unauthorized
  - 404: Not found
  - 500: Server error

**GET /upcoming**
- **Purpose**: Get reminders due in next 7 days
- **Auth**: ✅ Required
- **Response**: Array of reminders with due_date ≤ today + 7 days
- **Error Codes**:
  - 401: Unauthorized
  - 500: Server error

---

#### Dashboard Route (`/api/dashboard`)

**GET /summary**
- **Purpose**: Comprehensive dashboard data (single call for full dashboard)
- **Auth**: ✅ Required
- **Response**:
  ```json
  {
    "user": { "id", "name", "email", "monthly_budget" },
    "current_month": {
      "income": 150000.00,
      "expenses": 45000.00,
      "net": 105000.00,
      "percentage_of_budget": 90,
      "transaction_count": 45
    },
    "comparison": {
      "previous_month_expenses": 48000.00,
      "month_over_month_change": -6.25,
      "trend": "decreasing"
    },
    "top_categories": [
      { "name": "Food & Dining", "amount": 5000.00, "percentage": 11.11 }
    ],
    "goals": [
      { "id": 1, "name": "Vacation", "percentage": 25, "days_left": 255 }
    ],
    "upcoming_reminders": [
      { "bill_name": "Internet", "amount": 999.00, "days_until_due": 5 }
    ],
    "chart_data": {
      "monthly_trend": [ { month: "Jan", income: 100000, expense: 30000 } ],
      "category_breakdown": [ { name: "Food", value: 5000 } ]
    },
    "ai_summary": {
      "key_insight": "Your spending has decreased by 6%",
      "recommendations": [ "..." ]
    }
  }
  ```
- **Error Codes**:
  - 401: Unauthorized
  - 500: Server error

---

#### AI Routes (`/api/ai`)

**GET /insights**
- **Purpose**: Full AI analysis with caching
- **Auth**: ✅ Required
- **Cache**: 1 hour TTL
- **Response**: (See AI Pipeline section for full structure)
- **Triggers Gemini If**: (transactions > 50) OR (patterns > 3) OR (alerts > 2)

**GET /patterns**
- **Purpose**: Spending pattern analysis
- **Auth**: ✅ Required
- **Response**:
  ```json
  {
    "income_pattern": { "average": 50000, "trend": "stable" },
    "expense_pattern": { "average": 15000, "trend": "decreasing" },
    "category_dominance": [
      { "category": "Food & Dining", "percentage": 20 }
    ]
  }
  ```

**GET /forecast**
- **Purpose**: 30-day expense forecast
- **Auth**: ✅ Required
- **Response**:
  ```json
  {
    "forecast_data": [
      { "day": 1, "predicted_expense": 1500, "confidence": 0.92 }
    ],
    "confidence_score": 0.88,
    "method": "linear_regression"
  }
  ```

**GET /anomalies**
- **Purpose**: Detect unusual transactions
- **Auth**: ✅ Required
- **Response**:
  ```json
  {
    "anomalies": [
      { "id": 105, "amount": 50000, "description": "Laptop", "severity": "high" }
    ],
    "threshold_used": "2_std_dev",
    "mean_expense": 2000,
    "std_deviation": 1500
  }
  ```

**GET /savings-opportunities**
- **Purpose**: Identify cost-cutting potential
- **Auth**: ✅ Required
- **Response**:
  ```json
  {
    "opportunities": [
      {
        "category": "Food & Dining",
        "current_spend": 5000,
        "reduction_potential": 1000,
        "suggestion": "Try meal planning"
      }
    ],
    "total_potential_savings": 3500
  }
  ```

**GET /gemini-insights**
- **Purpose**: Get Gemini-enhanced insights
- **Auth**: ✅ Required
- **Requires**: `GEMINI_API_KEY` environment variable
- **Response**:
  ```json
  {
    "summary": "Your spending shows strong discipline...",
    "suggestions": [
      {
        "title": "Invest Savings",
        "description": "With $105k monthly surplus...",
        "action": "Open investment account",
        "impact": "long_term_growth"
      }
    ],
    "key_metrics": { ... }
  }
  ```
- **Error**: Returns rule-based insights if Gemini unavailable

---

#### Suggestions Routes (`/api/suggestions`)

**GET /pending**
- **Purpose**: Get pending AI suggestions awaiting user decision
- **Auth**: ✅ Required
- **Response**:
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "title": "Save on dining",
      "description": "You spent 20% more on food this month",
      "action": "Try meal prep",
      "decision": null,
      "created_at": "2026-04-20T10:00:00Z"
    }
  ]
  ```

**POST /:id/decide**
- **Purpose**: Record user's accept/reject decision
- **Auth**: ✅ Required
- **Request Body**: `{ decision: "accept" | "reject" }`
- **Response**: Updated suggestion with decision and timestamp
- **Side Effects**: Updates `ai_suggestions` table decision history

**GET /history**
- **Purpose**: View past suggestion decisions
- **Auth**: ✅ Required
- **Query Params**: `limit` (default 50), `offset` (default 0)
- **Response**: Array of decided suggestions (newest first)

---

#### Upload Routes (`/api/upload`)

**POST /csv**
- **Purpose**: Upload and process CSV file
- **Auth**: ✅ Required
- **Content-Type**: `multipart/form-data`
- **File Param**: `file` (field name)
- **File Constraints**:
  - Max size: 10 MB
  - Format: .csv only
  - Encoding: UTF-8 recommended
- **CSV Format** (auto-detected):
  - Headers: date, amount, description, category
  - Alternative headers recognized:
    - date: date, transaction_date, created_date
    - amount: amount, value, debit, credit, salary, income
    - description: description, memo, note, narration
    - category: category, type, account
  - Date formats supported: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
- **Type Inference**:
  - 'income' if column is "salary", "income", "credit", "earnings"
  - 'expense' if column is "debit", "expense", "cost"
  - Default: 'expense'
- **Flow**:
  1. Parse CSV with header detection
  2. DELETE all existing expenses for user (**DESTRUCTIVE**)
  3. Validate each row
  4. Infer types based on column names
  5. Auto-categorize via fuzzy matching + Gemini fallback
  6. Batch insert valid transactions
  7. Update category metadata
  8. Clear AI cache
  9. Trigger fresh insights generation
- **Response**:
  ```json
  {
    "valid_records": 487,
    "invalid_records": [
      { "row": 15, "reason": "Invalid date format" }
    ],
    "summary": {
      "total_income": 150000.00,
      "total_expenses": 45000.00,
      "transactions_created": 487,
      "categories_used": 8
    }
  }
  ```
- **Error Codes**:
  - 400: No file provided / invalid file type / CSV parsing error
  - 401: Unauthorized
  - 413: File too large
  - 500: Database error during insert

---

#### Email Routes (`/api/email`)

**POST /send-weekly-report**
- **Purpose**: Manually trigger weekly email report
- **Auth**: ✅ Required
- **Request Body**: `{ recipient?: "override@email.com" }` (optional)
- **Response**:
  ```json
  {
    "sent": true,
    "recipient": "user@example.com",
    "timestamp": "2026-04-20T15:30:00Z",
    "message_id": "<...@gmail.com>"
  }
  ```
- **Email Template**:
  - Header: "Weekly Spending Report"
  - Stats table: income, expenses, net savings, budget used
  - Top 5 categories with amounts and trends
  - Link to dashboard for full report
  - Footer: "Sent by Smart Expense Tracker"
- **Requires**:
  - Gmail SMTP credentials in environment: `GMAIL_USER`, `GMAIL_PASSWORD`
  - Less secure app passwords may be required
- **Error Codes**:
  - 400: Email sending failed / invalid recipient
  - 401: Unauthorized
  - 500: SMTP error / missing credentials

---

## Backend Services

### aiService.js - Core Insights Engine

```javascript
async generateInsights(userId) {
  // 1. Cache check (1-hour TTL)
  const cached = cache.get(`insights_${userId}`);
  if (cached) return cached;
  
  // 2. Fetch data
  const [budget, expenses, categories] = await Promise.all([
    User.getBudget(userId),
    Expense.getLastNMonths(userId, 3),
    Category.getUsageStats(userId)
  ]);
  
  // 3. Calculate patterns
  const patterns = {
    income_trend: calculateTrend(expenses.filter(e => e.type === 'income')),
    expense_trend: calculateTrend(expenses.filter(e => e.type === 'expense')),
    category_dominance: categories.sort((a, b) => b.percentage - a.percentage)
  };
  
  // 4. Generate recommendations
  const recommendations = {
    budget_advice: budget && expenses.total > budget ? 'Over budget' : 'On track',
    expense_trends: analyzeExpenseTrends(expenses),
    income_optimization: analyzeIncomePotential(expenses)
  };
  
  // 5. Detect anomalies (>2 std dev)
  const anomalies = detectOutliers(expenses);
  
  // 6. Forecast next 30 days
  const forecast = linearRegression(expenses.slice(-30));
  
  // 7. Generate alerts
  const alerts = [];
  if (budget && currentMonthExpense > budget) {
    alerts.push({ type: 'budget_overspend', message: '...' });
  }
  
  const insights = { patterns, recommendations, anomalies, forecast, alerts };
  
  // 8. Decide: Call Gemini?
  if (shouldCallGemini(insights)) {
    try {
      const geminiEnhanced = await geminiService.enhance(insights, expenses);
      insights.gemini_summary = geminiEnhanced;
      
      // Save suggestions to DB
      for (const suggestion of geminiEnhanced.suggestions) {
        await AISuggestion.create(userId, suggestion);
      }
    } catch (err) {
      console.error('Gemini call failed:', err);
      // Fall back to rule-based insights
    }
  }
  
  // 9. Cache and return
  cache.set(`insights_${userId}`, insights, 3600); // 1 hour
  return insights;
}
```

### csvService.js - CSV Upload Pipeline

```javascript
async uploadCSV(userId, fileBuffer) {
  const results = {
    valid_records: 0,
    invalid_records: [],
    summary: { total_income: 0, total_expense: 0, transactions_created: 0 }
  };
  
  // 1. Parse CSV with header detection
  const transactions = [];
  const stream = csv()
    .on('headers', (headers) => {
      // Smart header mapping
      this.dateField = headers.find(h => /date|created/i.test(h));
      this.amountField = headers.find(h => /amount|debit|credit|salary/i.test(h));
      this.descField = headers.find(h => /description|memo|narration/i.test(h));
      this.categoryField = headers.find(h => /category|account/i.test(h));
    })
    .on('data', (row) => transactions.push(row))
    .on('error', (err) => { throw err; });
  
  stream.write(fileBuffer);
  stream.end();
  
  // 2. DELETE existing expenses (DESTRUCTIVE!)
  await Expense.deleteByUserId(userId);
  
  // 3. Validate & transform rows
  const validTransactions = [];
  for (let i = 0; i < transactions.length; i++) {
    const row = transactions[i];
    try {
      const transaction = {
        user_id: userId,
        date: parseDate(row[this.dateField]),
        amount: parseFloat(row[this.amountField]),
        description: row[this.descField] || '',
        type: inferType(row[this.amountField], this.amountField),
        category_id: await categorizeTransaction(row, userId)
      };
      
      // Validation
      if (!transaction.date || !transaction.amount || !transaction.category_id) {
        throw new Error('Missing required fields');
      }
      
      validTransactions.push(transaction);
      results.summary.total_expense += transaction.type === 'expense' ? transaction.amount : 0;
      results.summary.total_income += transaction.type === 'income' ? transaction.amount : 0;
    } catch (err) {
      results.invalid_records.push({
        row: i + 2, // 1-indexed, +1 for header
        reason: err.message
      });
    }
  }
  
  // 4. Batch insert
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    for (const tx of validTransactions) {
      await Expense.create(userId, tx);
    }
    await connection.commit();
    results.valid_records = validTransactions.length;
    results.summary.transactions_created = validTransactions.length;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
  
  // 5. Update metadata
  await updateCategoryMetadata(userId, validTransactions);
  
  // 6. Clear caches & trigger insights
  cache.delete(`insights_${userId}`);
  generateInsights(userId); // Fire and forget
  
  return results;
}
```

### geminiService.js - Google Gemini API Integration

```javascript
async getEnhancedInsights(userData, ruleBasedInsights) {
  const prompt = promptBuilder.buildInsightPrompt(userData, ruleBasedInsights);
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 8000,
          temperature: 0.7
        }
      })
    });
    
    const data = await response.json();
    const geminiText = data.candidates[0].content.parts[0].text;
    
    // Validate & clean response
    const validated = responseValidator.validate(geminiText);
    if (!validated.valid) {
      throw new Error('Invalid Gemini response format');
    }
    
    return validated.cleanedResponse;
  } catch (err) {
    console.error('Gemini API error:', err);
    throw err; // Let caller handle fallback
  }
}
```

### promptBuilder.js - Structured Prompt Generation

```javascript
buildInsightPrompt(userData, insights) {
  return `
    # Expense Analysis Request
    
    **User Profile:**
    - Monthly Budget: ${userData.budget}
    - Currency: ${userData.currency}
    - Active since: ${userData.created_at}
    
    **Current Month Summary:**
    - Total Income: ${insights.summary.income}
    - Total Expenses: ${insights.summary.expenses}
    - Net Savings: ${insights.summary.net}
    
    **Spending Breakdown:**
    ${insights.categories.map(c => `- ${c.name}: ${c.amount} (${c.percentage}%)`).join('\n')}
    
    **Identified Patterns:**
    ${insights.patterns.map(p => `- ${p.description}`).join('\n')}
    
    **Rule-Based Alerts:**
    ${insights.alerts.map(a => `- ${a.message}`).join('\n')}
    
    ---
    
    **Your Task:**
    Generate 3-5 actionable financial suggestions based on the above data.
    
    **Response Format (JSON):**
    {
      "summary": "Brief overview of financial health",
      "suggestions": [
        {
          "title": "Action title",
          "description": "Detailed explanation",
          "action": "Specific step to take",
          "impact": "Expected outcome or savings potential"
        }
      ]
    }
    
    **Important:**
    - Avoid judgmental or moral language
    - Focus on practical, actionable advice
    - Include specific numbers and percentages where possible
    - Consider both income optimization and expense reduction
  `;
}
```

### responseValidator.js - Gemini Response Validation

```javascript
validateAndClean(geminiResponse) {
  try {
    // Extract JSON if wrapped in markdown
    const json = geminiResponse.includes('```json')
      ? geminiResponse.match(/```json\n([\s\S]*?)\n```/)[1]
      : geminiResponse;
    
    const parsed = JSON.parse(json);
    
    // Validate required fields
    if (!parsed.summary || !Array.isArray(parsed.suggestions)) {
      throw new Error('Missing required fields: summary, suggestions array');
    }
    
    // Strip moral language
    const cleanedSuggestions = parsed.suggestions.map(s => ({
      title: stripMoralLanguage(s.title),
      description: stripMoralLanguage(s.description),
      action: s.action || '',
      impact: s.impact || ''
    }));
    
    return {
      valid: true,
      cleanedResponse: {
        summary: stripMoralLanguage(parsed.summary),
        suggestions: cleanedSuggestions
      }
    };
  } catch (err) {
    return {
      valid: false,
      errors: [err.message]
    };
  }
}

function stripMoralLanguage(text) {
  const moralPhrases = [
    /you should(?:n't)?/gi,
    /you must/gi,
    /you ought to/gi,
    /bad habit/gi,
    /good practice/gi
  ];
  
  let cleaned = text;
  for (const phrase of moralPhrases) {
    cleaned = cleaned.replace(phrase, '');
  }
  
  return cleaned.trim();
}
```

### weeklyDigestService.js - Scheduled Digest Generation

```javascript
async runDigestForAllUsers() {
  console.log('Starting weekly digest generation...');
  
  const users = await User.getAll();
  
  for (const user of users) {
    try {
      await generateDigestForUser(user.id);
    } catch (err) {
      console.error(`Digest generation failed for user ${user.id}:`, err);
      // Continue with next user
    }
  }
  
  console.log('Weekly digest generation completed.');
}

async function generateDigestForUser(userId) {
  // Fetch last 7 days
  const weekStart = moment().subtract(7, 'days').toDate();
  const expenses = await Expense.findByDateRange(userId, weekStart, new Date());
  
  // Calculate summary
  const summary = {
    period: `${moment(weekStart).format('MMM D')} - ${moment().format('MMM D')}`,
    income: expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0),
    expenses: expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0),
    transactions: expenses.length
  };
  summary.net = summary.income - summary.expenses;
  
  // Top categories
  const categorySpend = {};
  for (const expense of expenses.filter(e => e.type === 'expense')) {
    categorySpend[expense.category_name] = (categorySpend[expense.category_name] || 0) + expense.amount;
  }
  
  // Build prompt for Gemini
  const prompt = `
    Generate a weekly spending summary with 5-8 bullet points for this user:
    
    Period: ${summary.period}
    - Income: $${summary.income.toFixed(2)}
    - Expenses: $${summary.expenses.toFixed(2)}
    - Net: $${summary.net.toFixed(2)}
    
    Top spending categories:
    ${Object.entries(categorySpend).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`).join('\n')}
    
    Format: Return JSON with "bullets" array of objects:
    { "text": "bullet text", "sentiment": "increase|decrease|neutral|alert", "emoji": "📈|📉|➡️|⚠️" }
  `;
  
  try {
    const geminiResponse = await geminiService.getEnhancedInsights(summary, prompt);
    const bullets = JSON.parse(geminiResponse).bullets;
    
    // Store digest
    await WeeklyDigest.create(userId, {
      period_start: weekStart,
      period_end: new Date(),
      summary_json: JSON.stringify(summary),
      bullets_json: JSON.stringify(bullets),
      sent_email: false
    });
    
    console.log(`✅ Digest created for user ${userId}`);
  } catch (err) {
    console.error(`❌ Digest generation failed for user ${userId}:`, err);
  }
}
```

---

## Frontend Architecture

### Context Providers (State Management)

#### **AuthContext.js**
```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On component mount, verify token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      verifyToken();
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const { data } = await axios.get('/api/auth/me');
      setUser(data);
    } catch (err) {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    axios.defaults.headers.common['x-auth-token'] = data.token;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### **ThemeContext.js**
```javascript
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-theme' : 'light-theme';
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

#### **NotificationContext.js**
```javascript
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
```

#### **UploadContext.js**
```javascript
const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);

  const upload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadStatus('uploading');
      const response = await axios.post('/api/upload/csv', formData, {
        onUploadProgress: (e) => {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      setUploadStatus('success');
      return response.data;
    } catch (err) {
      setUploadStatus('error');
      throw err;
    }
  };

  return (
    <UploadContext.Provider value={{ uploadProgress, uploadStatus, upload }}>
      {children}
    </UploadContext.Provider>
  );
};
```

### Component Hierarchy

```
<App>
  <AuthProvider>
    <ThemeProvider>
      <UploadProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              {Public routes}
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth />} />
              
              {Protected routes}
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
              <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
              <Route path="/reminders" element={<PrivateRoute><Reminders /></PrivateRoute>} />
              <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
              <Route path="/ai" element={<PrivateRoute><AIDashboard /></PrivateRoute>} />
              <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
              <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
            </Routes>
          </Router>
        </NotificationProvider>
      </UploadProvider>
    </ThemeProvider>
  </AuthProvider>
</App>
```

### Key Page Components

#### **Dashboard.js**
- Displays: Monthly budget overview, expense vs income, top 5 categories, upcoming reminders
- Data Source: `GET /api/dashboard/summary` (single call for all data)
- Charts: AreaChart (30-day trend), BarChart (category breakdown)
- Refresh: Auto-refresh on interval, manual refresh button
- Error Handling: Fallback UI if data load fails

#### **Expenses.js**
- CRUD: Create, list, edit, delete expenses
- Filters: By month, year, category, type (income/expense)
- Search: Description text search
- Pagination: 50 items per page
- Bulk Actions: Multi-select delete, category change
- Inline Editing: Quick edit amount or category

#### **AIDashboard.js**
- Displays: Patterns, anomalies, forecast, savings opportunities
- Data Source: Multiple `/api/ai/*` endpoints (or single `/api/ai/insights`)
- Charts: LineChart (forecast), ScatterChart (anomalies)
- Suggestions: Pending AI suggestions with accept/reject buttons

#### **Goals.js**
- CRUD: Create/update/delete goals
- Progress: Visual progress bar + percentage
- Stats: Days until deadline, monthly savings needed
- Tracking: Drag to adjust current_amount

#### **Upload.js**
- File Input: Dropzone for CSV files
- Preview: Show first 10 rows of CSV
- Progress: Upload progress bar (% complete)
- Results: Summary of valid/invalid records, transactions created

---

## AI/ML Pipeline

### Complete AI Insight Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GET /api/ai/insights                         │
│                    (Frontend AIDashboard.js)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Cache Check    │ ──────┐ (1h TTL)
                    │ insights_${id} │       │
                    └────────────────┘       │
                             │               │
                   Hit        │         Miss  │
                    ◄─────────┴──────────────┘
                    │                 │
      ┌─────────────▼──┐       ┌──────▼────────────────────┐
      │ Return cached  │       │ Calculate Fresh Insights  │
      │ insights       │       └──────┬────────────────────┘
      └────────────────┘              │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │ 1. Fetch Data                       │
                    │ - User budget, currency             │
                    │ - Expenses (last 90 days)           │
                    │ - Income/expense breakdown          │
                    │ - Category usage stats              │
                    └────────────┬────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────────┐
                    │ 2. Detect Patterns                  │
                    │ - Income trend (↑/↓/→)              │
                    │ - Expense trend                     │
                    │ - Category dominance                │
                    │ - High-frequency items              │
                    └────────────┬────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────────┐
                    │ 3. Generate Recommendations         │
                    │ - Budget advice                     │
                    │ - Expense trend analysis            │
                    │ - Income optimization suggestions   │
                    └────────────┬────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────────┐
                    │ 4. Detect Anomalies                 │
                    │ - Transactions >2 std dev           │
                    │ - Unusual patterns                  │
                    │ - Spending spikes                   │
                    └────────────┬────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────────┐
                    │ 5. Generate Alerts                  │
                    │ - Budget overspend alert            │
                    │ - Unusual spending alert            │
                    │ - Income fluctuation alert          │
                    └────────────┬────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────────┐
                    │ 6. Forecast Next 30 Days            │
                    │ - Linear regression on last 30d     │
                    │ - Predicted daily/weekly expenses   │
                    │ - Confidence score                  │
                    └────────────┬────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────────┐
                    │ 7. Identify Savings Opportunities   │
                    │ - Top 3 expense categories          │
                    │ - Reduction potential per category  │
                    │ - Total savings opportunity         │
                    └────────────┬────────────────────────┘
                                 │
                                 ▼
                 ┌───────────────────────────────────┐
                 │ 8. Decide: Call Gemini?           │
                 │ Trigger if:                       │
                 │ • transactions > 50               │
                 │ • patterns > 3                    │
                 │ • alerts > 2                      │
                 │ • GEMINI_API_KEY exists           │
                 └───────────────────────────────────┘
                         │                    │
                    Yes  │              No    │
                    ┌────▼──────┐            │
                    │   Call    │      ┌─────▼──────────────────┐
                    │  Gemini   │      │ Return rule-based      │
                    │ 2.0-Flash │      │ insights (no Gemini)   │
                    └────┬──────┘      └─────┬──────────────────┘
                         │                   │
                         ▼                   │
        ┌────────────────────────────────┐  │
        │ Build Prompt (promptBuilder.js)│  │
        │ - User profile                 │  │
        │ - Transactions summary         │  │
        │ - Rule-based insights          │  │
        │ - Request format & constraints │  │
        └────────────┬───────────────────┘  │
                     │                      │
                     ▼                      │
        ┌────────────────────────────────┐  │
        │ HTTP POST to Gemini API         │  │
        │ Model: gemini-2.0-flash        │  │
        │ Max tokens: 8000               │  │
        └────────────┬───────────────────┘  │
                     │                      │
                     ▼                      │
        ┌────────────────────────────────┐  │
        │ Validate Response               │  │
        │ (responseValidator.js)          │  │
        │ - Parse JSON                   │  │
        │ - Check required fields        │  │
        │ - Strip moral language         │  │
        └────────────┬───────────────────┘  │
                     │                      │
                     ▼                      │
        ┌────────────────────────────────┐  │
        │ Save Suggestions to DB          │  │
        │ - Insert into ai_suggestions   │  │
        │ - Mark as pending              │  │
        │ - Link to user                 │  │
        └────────────┬───────────────────┘  │
                     │                      │
                     └──────────┬───────────┘
                                │
                                ▼
                    ┌─────────────────────────────────┐
                    │ 9. Cache Results (1 hour TTL)   │
                    │ cache.set(insights_${id}, ...)  │
                    └────────────┬────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────┐
                    │ 10. Return Full Insights Object │
                    │ {                               │
                    │   patterns: {...},              │
                    │   recommendations: {...},       │
                    │   alerts: [...],                │
                    │   forecast: {...},              │
                    │   anomalies: [...],             │
                    │   savings_opportunities: {...}, │
                    │   gemini_summary: {...}  (opt)  │
                    │ }                               │
                    └────────────┬────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────────────┐
                    │ Frontend Renders AIDashboard    │
                    │ - Display patterns & trends     │
                    │ - Show anomalies                │
                    │ - Display forecast chart       │
                    │ - List savings opportunities    │
                    │ - Show pending suggestions      │
                    └─────────────────────────────────┘
```

### ML/Statistics Methods Used

1. **Linear Regression** (ml-regression)
   - Used for: 30-day expense forecast
   - Method: Fits line to last 30 transactions by date
   - Output: Daily predicted expense + confidence score

2. **Standard Deviation Analysis** (simple-statistics)
   - Used for: Anomaly detection
   - Threshold: >2 std deviations from mean
   - Identifies unusual one-time expenses

3. **Trend Analysis** (custom)
   - Month-over-month comparison
   - Category spending trends
   - Income pattern stability

4. **Categorical Analysis** (custom)
   - Category dominance ranking
   - Percentage distribution
   - High-frequency categories

### Gemini Integration Details

**API Configuration**:
- **Base URL**: `https://generativelanguage.googleapis.com/v1beta/models`
- **Model**: `gemini-2.0-flash` (fast, optimized for text)
- **Authentication**: `x-goog-api-key` header
- **Max Tokens**: 8,000 (output)
- **Temperature**: 0.7 (balanced creativity/consistency)

**Prompt Strategy**:
- Includes structured user context (budget, income, top categories)
- Requests JSON-formatted response
- Specifies number and type of suggestions
- Warns against moral/judgmental language
- Includes fallback instructions if JSON parsing fails

**Response Handling**:
- Parses JSON (with markdown code block fallback)
- Validates required fields: `summary`, `suggestions` array
- Each suggestion needs: `title`, `description`, `action`, `impact`
- Strips moral language via regex patterns
- Saves to DB with `decision: null` (pending user action)

---

## Data Flow Workflows

### Complete User Journey: Login → Expense Creation → AI Insights

#### 1. **Registration & Login Flow**

**Frontend (Auth.js)**:
```
User enters: { name, email, password }
     ↓
Validate locally (email format, password ≥6 chars)
     ↓
POST /api/auth/register
     ↓
Backend validates again (express-validator)
     ↓
Check if email exists: SELECT * FROM users WHERE email = ?
     ↓ (new email)
Hash password: bcrypt.hash(password, 10)
     ↓
INSERT INTO users: (name, email, password_hash, monthly_budget=0)
     ↓
Generate JWT: jwt.sign({ user: { id } }, JWT_SECRET, expiresIn: '7d')
     ↓
Return: { token, user }
     ↓
Frontend:
  - Save token to localStorage
  - Set axios header: x-auth-token
  - Save to AuthContext
  - Redirect to /dashboard
```

#### 2. **Dashboard Load Flow**

**Frontend (Dashboard.js)**:
```
Component mounts
     ↓
useEffect(() => {
  axios.get('/api/dashboard/summary')
})
     ↓
Backend (routes/dashboard.js):
  1. Extract req.user.id from JWT
  2. Fetch user: SELECT * FROM users WHERE id = ?
  3. Fetch monthly totals: vw_monthly_summary (current month)
  4. Fetch expenses: SELECT * FROM expenses WHERE user_id = ? (current month)
  5. Fetch goals: SELECT * FROM savings_goals WHERE user_id = ?
  6. Fetch reminders: SELECT * FROM bill_reminders WHERE user_id = ? AND status='pending'
  7. Calculate:
     - Budget % used = (expenses / monthly_budget) * 100
     - Top 5 categories (group by category, sum, order by desc)
     - 30-day trend data (group by date)
  8. Return: { user, budget_summary, expenses, goals, reminders, chart_data }
     ↓
Frontend renders:
  - Header: "Budget $${budget}, Spent $${expense} (${percentage}%)"
  - Charts: AreaChart(30-day), BarChart(categories)
  - Cards: Top reminders, goals progress
  - Buttons: Create expense, view reports, view AI insights
```

#### 3. **Expense Creation Flow**

**Frontend (ExpenseForm.js)**:
```
User fills form: { category, amount, description, date, type }
     ↓
Validate:
  - category: required
  - amount: required, > 0
  - date: required, ≤ today
     ↓
POST /api/expenses
     ↓
Backend validation (express-validator):
  - Category exists: SELECT * FROM categories WHERE id = ?
  - Amount > 0
  - Date valid
     ↓
INSERT INTO expenses:
  (user_id, category_id, amount, description, date, type)
     ↓
UPDATE categories:
  SET usage_count = usage_count + 1,
      last_used = NOW()
  WHERE id = ?
     ↓
Clear cache: cache.delete(`insights_${user_id}`)
     ↓
Return: { id, ...expense }
     ↓
Frontend:
  - Show success notification
  - Refresh expenses list
  - Update dashboard
```

#### 4. **CSV Upload Flow**

**Frontend (Upload.js)**:
```
User selects CSV file
     ↓
Dropzone displays preview (first 10 rows)
     ↓
User clicks "Upload"
     ↓
Frontend:
  - Create FormData
  - Append file
  - POST /api/upload/csv
  - Track upload progress
     ↓
Backend (routes/upload.js):
  1. Multer validates: file exists, type is .csv, size < 10MB
  2. Read file buffer
  3. Call csvService.uploadCSV(userId, buffer)
     ↓
  csvService:
    a. Parse CSV with csv-parser
    b. Detect headers (smart mapping)
    c. DELETE FROM expenses WHERE user_id = ? ⚠️ DESTRUCTIVE
    d. For each row:
       - Parse date (multiple formats)
       - Parse amount
       - Infer type (income vs expense)
       - Fuzzy match category
       - If no match: try Gemini categorization
       - Validate all fields
    e. Batch INSERT valid transactions (with transaction support)
    f. UPDATE category usage counts
    g. Clear AI cache
    h. Fire generateInsights() async
    i. Return summary
     ↓
Frontend:
  - Show results: valid_records, invalid_records, summary
  - Refresh expenses list
  - Show success notification
```

#### 5. **AI Insights Generation Flow**

**Frontend (AIDashboard.js)**:
```
Component mounts
     ↓
useEffect(() => {
  axios.get('/api/ai/insights')
})
     ↓
Backend (routes/ai.js):
  1. Call aiService.generateInsights(userId)
     ↓
  aiService:
    a. Check cache: key = `insights_${userId}`
       - If found: return cached object
    b. Fetch:
       - User budget: SELECT monthly_budget FROM users
       - Expenses (last 90 days): SELECT * FROM expenses WHERE date > DATE_SUB(NOW(), INTERVAL 90 DAY)
       - Category summary: SELECT category_id, SUM(amount) FROM expenses GROUP BY category_id
    c. Calculate patterns:
       - Income trend: Avg(last 30d) vs Avg(30-60d)
       - Expense trend: Same comparison
       - Category dominance: Sort categories by total spend
    d. Detect anomalies:
       - Calculate mean and std dev of expenses
       - Mark transactions > mean + 2*std_dev as anomalies
    e. Generate recommendations (rule-based):
       - If expense > budget: "Over budget by $X"
       - If trend increasing: "Expenses trending up"
       - Category analysis: "Food is 20% of budget"
    f. Forecast 30 days:
       - Get last 30 transactions sorted by date
       - Linear regression: y = mx + b
       - Predict next 30 days
       - Calculate confidence score
    g. Savings opportunities:
       - Top 3 expense categories
       - Estimate 10-20% reduction per category
       - Total potential savings
    h. Decide: Call Gemini?
       if (transactions > 50 || patterns > 3 || alerts > 2) {
         try {
           prompt = promptBuilder.buildInsightPrompt(userData, insights)
           response = geminiService.callGemini(prompt)
           validated = responseValidator.validate(response)
           for each suggestion: AISuggestion.create(userId, suggestion)
           insights.gemini_summary = validated
         } catch {
           // Fall back to rule-based
         }
       }
    i. Cache: cache.set(`insights_${userId}`, insights, 3600)
    j. Return insights object
     ↓
Frontend renders:
  - Tab 1: Patterns (income/expense trends, categories)
  - Tab 2: Forecast (30-day chart)
  - Tab 3: Anomalies (unusual transactions)
  - Tab 4: Savings (opportunities with potential savings)
  - Tab 5: AI Suggestions (pending decisions)
     ↓
User can:
  - Accept/reject suggestions
  - Download chart data
  - Share insights
```

---

## Background Jobs & Scheduling

### Job Scheduler Overview

#### **Job 1: Weekly Digest Generation**

**Trigger**: Monday 7:00 AM (cron.schedule) OR Sunday 9:00 AM EST (scheduler.js)

**Execution** (`weeklyDigestService.runDigestForAllUsers()`):
```
For each user:
  1. Fetch expenses: last 7 days (Sunday - Saturday)
  2. Calculate:
     - total_income
     - total_expenses
     - net_savings
     - top_3_categories
  3. Build Gemini prompt with weekly summary
  4. Call Gemini: "Generate 5-8 bullet points..."
  5. Parse response:
     - Extract bullets array
     - Each bullet: { text, sentiment (increase/decrease/neutral/alert), emoji }
  6. INSERT INTO weekly_digests:
     (user_id, period_start, period_end, summary_json, bullets_json, created_at)
  7. Queue email send (optional, currently manual trigger)
  8. Log success/failure
```

**Storage**: `weekly_digests` table
**Display**: WeeklyDigest.js component on Dashboard

#### **Job 2: Bank Sync (Stub)**

**Status**: Not implemented

**Planned** (`syncScheduler.js`):
- Daily 2:00 AM: Sync transactions from Plaid
- Sunday 3:00 AM EST: Cleanup old sync logs

**Issue**: References non-existent `plaidService.js`

**To Implement**:
1. Install plaid-node SDK
2. Create plaidService.js with Plaid API integration
3. Link Plaid institutions to user accounts
4. Fetch transactions, categorize, insert into database
5. Handle duplicate detection

---

## Known Gaps & Technical Debt

### Critical Issues

| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| **CSV Upload Destructive** | High | Accidental data loss | Backup or confirmation dialog |
| **Missing SQL DDL** | High | ai_suggestions, weekly_digests can't be created | Add DDL to setup.sql |
| **Gemini Optional** | High | Insights degrade without API key | Cache rule-based insights too |
| **Plaid Not Implemented** | High | Bank sync completely non-functional | Implement plaidService.js |
| **Email Not Scheduled** | Medium | Users don't get weekly reports automatically | Add cron job for email send |

### Data Consistency Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| **Multi-category Expenses** | Backend supports `expense_categories` junction table, but UI treats as single category | Use single category for now or update UI |
| **Notification Preferences Unused** | Table exists but no endpoints/UI to manage | Implement preferences endpoints and UI |
| **Investment Tracking** | Table exists but no routes/models | Remove or implement full feature |
| **Currency Rates Static** | Hard-coded rates don't update | Add daily cron job to fetch live rates |

### Performance Issues

| Issue | Impact | Recommended Fix |
|-------|--------|-----------------|
| **No Pagination on Expense List** | Could load 10k+ expenses at once | Implement limit/offset pagination |
| **All Dashboard Data in One Call** | 1 second load time for complex queries | Add caching at route level, consider view |
| **AI Insights Recalculation** | Every call recalculates (even if cached) | Ensure cache hits are fast |
| **No Database Indexes on Frequently Queried Columns** | Slow queries for large datasets | Add indexes on user_id, category_id, date |

### Security Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| **JWT Secret in .env** | Leaked .env = exposed JWT signing key | Rotate secret, use secrets manager |
| **CORS Open to All Origins** | CSRF risk in production | Restrict to frontend domain in .env |
| **No Rate Limiting** | Brute force attacks possible | Implement express-rate-limit middleware |
| **No Input Sanitization** | XSS/injection risk | Sanitize all string inputs |
| **Password Requirements Too Weak** | Weak passwords (only 6 chars) | Enforce stronger password policy |

### Missing Features

| Feature | Priority | Effort |
|---------|----------|--------|
| **Budget Alerts** | Medium | Small |
| **Multi-user Sharing** | Medium | Medium |
| **Recurring Transaction Templates** | Medium | Small |
| **Receipt Image Upload** | Low | Medium |
| **Advanced Filtering/Search** | Medium | Small |
| **Export to PDF/Excel** | Low | Small |
| **Mobile App** | Medium | Large |
| **Integration with Banks** | High | Large |

### Code Quality Issues

- No comprehensive error handling (missing try-catch in routes)
- No request logging/monitoring
- No tests (jest configured but no test files)
- Inconsistent naming conventions (camelCase vs snake_case)
- Missing JSDoc comments on service functions
- No API documentation (Swagger/OpenAPI)

---

## Summary

This Smart Expense Tracker is a **full-stack personal finance application** with:

1. **Frontend**: React 18 with Context API for state management, Recharts for visualization, responsive UI with dark mode
2. **Backend**: Express.js with MySQL connection pooling, JWT authentication, 9 API route groups, 40+ endpoints
3. **Database**: MySQL with 13 tables, 3 views, 1 stored procedure, supporting income/expense transactions with multi-currency
4. **AI Engine**: Layered approach with rule-based analysis + optional Google Gemini integration, 1-hour caching
5. **Background Jobs**: Weekly digest generation (Monday 7 AM), planned bank sync (stub)
6. **Security**: JWT tokens with 7-day expiration, bcrypt password hashing (10 rounds), CORS enabled, auth middleware
7. **Features**: Expense tracking, savings goals, bill reminders, CSV import, AI insights, weekly digests, multi-currency support

**Key Architectural Patterns**:
- **Layered Architecture**: Presentation → API Gateway → Services → Models → Database
- **Service-Oriented**: Business logic encapsulated in dedicated services (aiService, csvService, geminiService, etc.)
- **Caching Strategy**: In-memory cache with TTL for AI insights (1h), pattern analysis (2h), suggestions (30m)
- **Async/Fire-and-Forget**: CSV upload triggers insights generation without blocking response
- **Graceful Degradation**: AI insights work with or without Gemini API; fallback to rule-based analysis
- **Error Handling**: Database connection testing, transaction support for batch inserts, logging at key points

This is a well-structured, production-ready foundation with clear separation of concerns and room for scaling.
