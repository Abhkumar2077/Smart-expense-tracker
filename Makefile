# Makefile for Smart Expense Tracker

.PHONY: help install install-backend install-frontend setup-db setup-env run run-backend run-frontend test test-backend test-frontend lint lint-backend lint-frontend format format-backend format-frontend clean clean-backend clean-frontend build build-frontend

# Default target
help:
	@echo "Available commands:"
	@echo "  install          - Install all dependencies"
	@echo "  setup-db         - Setup database"
	@echo "  setup-env        - Setup environment files"
	@echo "  run              - Run both backend and frontend"
	@echo "  test             - Run all tests"
	@echo "  lint             - Run linting on all code"
	@echo "  format           - Format all code"
	@echo "  clean            - Clean all build artifacts"
	@echo "  build            - Build for production"

# Installation
install: install-backend install-frontend

install-backend:
	cd backend && npm install

install-frontend:
	cd frontend && npm install

# Database setup
setup-db:
	@echo "Setting up database..."
	mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS expense_tracker;"
	mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS expense_tracker_test;"
	mysql -u root -p expense_tracker < database/setup.sql

# Environment setup
setup-env:
	@echo "Setting up environment files..."
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		echo "Created backend/.env - please edit with your values"; \
	fi
	@if [ ! -f frontend/.env.development.local ]; then \
		cp frontend/.env.example frontend/.env.development.local; \
		echo "Created frontend/.env.development.local"; \
	fi

# Running
run: run-backend run-frontend

run-backend:
	cd backend && npm run dev

run-frontend:
	cd frontend && npm start

# Testing
test: test-backend test-frontend

test-backend:
	cd backend && npm test

test-frontend:
	cd frontend && npm test

# Code quality
lint: lint-backend lint-frontend

lint-backend:
	cd backend && npm run lint

lint-frontend:
	cd frontend && npm run lint

format: format-backend format-frontend

format-backend:
	cd backend && npm run format

format-frontend:
	cd frontend && npm run format

# Cleaning
clean: clean-backend clean-frontend

clean-backend:
	cd backend && rm -rf node_modules coverage

clean-frontend:
	cd frontend && rm -rf node_modules build

# Building
build: build-frontend

build-frontend:
	cd frontend && npm run build