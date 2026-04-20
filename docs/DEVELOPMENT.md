# Development Guide

## Project Overview

Smart Expense Tracker is a full-stack web application for personal finance management. It features expense tracking, AI-powered insights, savings goals, and bill reminders.

## Technology Stack

- **Backend**: Node.js, Express.js, MySQL, JWT
- **Frontend**: React, React Router, Axios, Recharts
- **AI**: Rule-based analysis with optional Gemini integration
- **Database**: MySQL with connection pooling

## Development Environment Setup

### Prerequisites
- Node.js 16+
- MySQL 8+
- Git

### Installation Steps

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd smart-expense-tracker

   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

2. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE expense_tracker;
   CREATE DATABASE expense_tracker_test; # For testing
   EXIT;

   # Run migrations
   mysql -u root -p expense_tracker < ../database/setup.sql
   ```

3. **Environment Configuration**
   Create `.env` files in both backend and frontend directories.

   **backend/.env:**
   ```env
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=expense_tracker
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   NODE_ENV=development
   GEMINI_API_KEY=your_gemini_api_key
   ```

   **frontend/.env.development.local:**
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

### Running the Application

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

## Code Quality

### Linting and Formatting

```bash
# Backend
cd backend
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format code

# Frontend
cd frontend
npm run lint
npm run lint:fix
npm run format
```

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Project Structure

### Backend Structure
```
backend/
├── config/          # Database and app configuration
├── middleware/      # Express middleware (auth, validation)
├── models/          # Database models
├── routes/          # API route handlers
├── services/        # Business logic services
├── tests/           # Unit and integration tests
├── server.js        # Main application entry point
└── package.json
```

### Frontend Structure
```
frontend/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable UI components
│   ├── pages/       # Page components
│   ├── context/     # React context providers
│   ├── services/    # API service functions
│   ├── styles/      # CSS stylesheets
│   ├── App.js       # Main app component
│   └── index.js     # React entry point
└── package.json
```

## Development Workflow

### 1. Branching Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

### 2. Code Standards
- Use ESLint and Prettier configurations
- Follow conventional commit messages
- Write tests for new features
- Update documentation for API changes

### 3. Database Changes
- Create migration scripts in `database/` folder
- Update models to reflect schema changes
- Test migrations on development database first

### 4. API Development
- Document new endpoints in `docs/API.md`
- Add validation middleware for inputs
- Include error handling
- Write integration tests

### 5. Frontend Development
- Use functional components with hooks
- Implement proper error boundaries
- Follow component composition patterns
- Test user interactions

## Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run start
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use production database credentials
- Configure proper JWT secret
- Set up SSL certificates

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **CORS Errors**
   - Check backend CORS configuration
   - Verify frontend proxy settings

3. **Authentication Issues**
   - Check JWT secret consistency
   - Verify token expiration

4. **Build Failures**
   - Clear node_modules and reinstall
   - Check for TypeScript/ESLint errors

### Debug Mode
Set `DEBUG=*` environment variable for detailed logging.

## Contributing

1. Create a feature branch from `develop`
2. Make changes following code standards
3. Write tests for new functionality
4. Update documentation if needed
5. Submit a pull request to `develop`

## Support

For development questions, check:
- Project documentation in `docs/`
- Existing issues and discussions
- Team communication channels