# Smart Expense Tracker

A full-stack expense tracking application with AI-powered spending insights, built with React frontend and Node.js/Express backend.

## Tech Stack

- **Frontend**: React 18, React Router, Recharts, Axios
- **Backend**: Node.js, Express.js, JWT Authentication
- **Database**: MySQL
- **AI Features**: Rule-based analysis with optional Gemini integration
- **Additional**: CSV upload, email notifications, PWA support

## Features

- 📊 Track income and expenses with detailed categorization
- 📈 Interactive dashboard with charts and analytics
- 🤖 AI-powered spending insights and recommendations
- 📅 Bill reminders and notifications
- 📁 CSV import/export functionality
- 🔐 Secure authentication with JWT
- 📱 Progressive Web App (PWA) support
- 🌙 Dark mode support
- 💰 Multi-currency support

## Project Structure

```
├── backend/                 # Node.js/Express API server
│   ├── config/             # Database configuration
│   ├── middleware/         # Authentication middleware
│   ├── models/             # Database models
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   └── server.js           # Main server file
├── frontend/                # React application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   ├── services/       # API service functions
│   │   └── styles/         # CSS styles
│   └── build/              # Production build
├── database/                # SQL scripts and migrations
└── notes/                   # Documentation and analysis
```

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-expense-tracker
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE expense_tracker;
   EXIT;

   # Run database setup
   mysql -u root -p expense_tracker < ../database/setup.sql
   ```

5. **Environment Configuration**

   Create `.env` file in `backend/` directory:
   ```env
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=expense_tracker
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   NODE_ENV=development

   # Optional: Gemini AI API key for enhanced insights
   GEMINI_API_KEY=your_gemini_api_key
   ```

## Running the Application

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend (in new terminal)**
   ```bash
   cd frontend
   npm start
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Expense Management

- `GET /api/expenses` - Get user expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Categories

- `GET /api/categories` - Get expense categories
- `POST /api/categories` - Create category

### AI Insights

- `GET /api/ai/insights` - Get AI-powered spending insights

### Goals & Reminders

- `GET /api/goals` - Get savings goals
- `POST /api/goals` - Create savings goal
- `GET /api/reminders` - Get bill reminders

## Development

### Code Quality

The project uses ESLint and Prettier for code formatting and linting.

### Testing

Run tests with:
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Backend is ready to deploy as-is
cd backend
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.

