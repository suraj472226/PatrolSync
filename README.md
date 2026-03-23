# Patrol & Incident Reporting System

A comprehensive **full-stack field patrol and incident management system** designed for security companies managing field officers across multiple sites. The system provides real-time GPS tracking, digital checklists, incident reporting, and SOS emergency alerts with strong emphasis on accountability, safety, and compliance.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [How to Run](#how-to-run)
  - [Backend API](#1-backend-api)
  - [Web Dashboard](#2-web-dashboard)
  - [Mobile App (Expo)](#3-mobile-app-expo)
- [Default Login Credentials](#default-login-credentials)
- [API Documentation](#api-documentation)

---

## Overview

The Patrol & Incident Reporting System is a production-ready solution for managing field security operations with three main components:

- **Backend API**: Python FastAPI REST API with MySQL database
- **Web Dashboard**: React + TypeScript admin dashboard for supervisors and administrators
- **Mobile App**: React Native (Expo) app for field officers with offline-first architecture

The system enables real-time monitoring, GPS-verified patrol logs, digital checklist management, incident reporting with photo evidence, and emergency SOS alerts.

---

## Key Features

### Field Officer Features (Mobile App)
- ✅ **Device-Bound Authentication**: One officer per device for accountability
- ✅ **Shift Management**: Start/end shifts with automatic GPS capture
- ✅ **Checkpoint Verification**: QR code, GPS, and NFC scanning
- ✅ **Background Location Tracking**: Continuous GPS breadcrumbs during active shifts
- ✅ **Incident Reporting**: Category-based reporting with photo uploads and GPS coordinates
- ✅ **SOS Emergency Alerts**: Panic button with real-time location broadcasting
- ✅ **Digital Checklists**: Interactive checklists with photo/video/document uploads
- ✅ **Activity Log**: View patrol history, checklist submissions, and incidents
- ✅ **Offline Mode**: Queue actions when offline and auto-sync when connection restores
- ✅ **Real-time Dashboard**: Statistics, recent patrols, and battery status monitoring

### Admin/Supervisor Features (Web Dashboard)
- ✅ **Live Dashboard**: Real-time statistics and activity feed
- ✅ **Live Map**: Track all active field officers in real-time with Leaflet maps
- ✅ **Master Data Management**: Manage companies, sites, and users
- ✅ **Incident Management**: View, filter, and resolve incident reports
- ✅ **Question Bank**: CRUD operations for checklist questions with advanced filtering
- ✅ **Checklist Composer**: Drag-and-drop checklist builder with rule configuration
- ✅ **Checklist Repository**: Manage and preview active/inactive checklists
- ✅ **Checklist Reports**: Review submissions with photo/video evidence
- ✅ **Employee Activity**: Track patrol logs and performance metrics
- ✅ **Role-Based Access Control**: Admin, Supervisor, Field Officer, and Client roles

---

## Tech Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **Server**: Uvicorn 0.24.0
- **Database**: MySQL with SQLAlchemy 2.0.23 ORM
- **Database Driver**: PyMySQL 1.1.0
- **Authentication**: JWT (python-jose)
- **Validation**: Pydantic 2.5.2
- **Environment Management**: python-dotenv

### Web Dashboard
- **Build Tool**: Vite 5.4.19
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.8.3
- **UI Library**: Shadcn UI + Radix UI Components (50+ components)
- **Styling**: Tailwind CSS 3.4.17
- **State Management**: TanStack Query (React Query) 5.83.0
- **Routing**: React Router DOM 6.30.1
- **Forms**: React Hook Form + Zod Validation
- **Charts**: Recharts 2.15.4
- **Maps**: Leaflet + React-Leaflet
- **Drag & Drop**: @dnd-kit
- **HTTP Client**: Axios

### Mobile App
- **Framework**: Expo SDK ~54.0
- **Runtime**: React Native 0.81.5
- **Navigation**: React Navigation (native-stack + bottom-tabs)
- **Storage**: expo-secure-store, AsyncStorage
- **Network Detection**: @react-native-community/netinfo
- **Camera**: expo-camera + expo-image-picker
- **Location**: expo-location (with background tracking)
- **HTTP Client**: Axios
- **Offline Queue**: Custom offline service with retry mechanism

---

## Project Structure

```
patrol-incident-system/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── core/              # Configuration & security
│   │   │   ├── config.py      # Settings & JWT config
│   │   │   ├── security.py    # Token generation
│   │   │   └── dependencies.py
│   │   ├── database/          # Database connection
│   │   │   ├── connection.py  # SQLAlchemy engine
│   │   │   └── base.py
│   │   ├── models/            # SQLAlchemy ORM models
│   │   │   ├── user.py        # User & authentication
│   │   │   ├── site.py        # Company & Site management
│   │   │   ├── patrol.py      # Shift & PatrolLog
│   │   │   ├── incident.py    # Incident reports
│   │   │   ├── checklist.py   # Question bank & checklists
│   │   │   ├── checklist_response.py  # Submissions
│   │   │   ├── sos_alert.py   # Emergency SOS
│   │   │   ├── location_history.py    # GPS tracking
│   │   │   └── notification.py
│   │   ├── schemas/           # Pydantic validation schemas
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth_routes.py
│   │   │   ├── patrol_routes.py
│   │   │   ├── incident_routes.py
│   │   │   ├── checklist_routes.py
│   │   │   ├── mobile_routes.py
│   │   │   ├── notification_routes.py
│   │   │   ├── file_routes.py
│   │   │   └── admin_routes.py
│   │   ├── services/          # Business logic
│   │   │   └── auth_service.py
│   │   └── main.py            # FastAPI app initialization
│   ├── uploads/               # Static file storage
│   ├── requirements.txt
│   ├── seed_rich_data.py      # Test data generator
│   └── .env                   # Environment variables
│
├── web/                       # React Web Dashboard
│   ├── src/
│   │   ├── pages/             # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── LiveMap.tsx
│   │   │   ├── MasterManagement.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── QuestionBank.tsx
│   │   │   ├── ChecklistComposer.tsx
│   │   │   ├── ChecklistRepository.tsx
│   │   │   └── ChecklistReports.tsx
│   │   ├── components/        # Reusable components
│   │   │   ├── layout/        # AppLayout, Sidebar, TopBar
│   │   │   ├── dashboard/     # Dashboard widgets
│   │   │   ├── checklist/     # Checklist components
│   │   │   └── ui/            # Shadcn UI components
│   │   ├── services/
│   │   │   └── api.ts         # Axios configuration
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utilities
│   │   └── App.tsx            # Router & protected routes
│   ├── public/
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
│
└── mobile/                    # React Native (Expo) Mobile App
    ├── src/
    │   ├── screens/
    │   │   ├── LoginScreen.js
    │   │   ├── DashboardScreen.js
    │   │   ├── QRScannerScreen.js
    │   │   ├── ChecklistScreen.js
    │   │   ├── ChecklistListScreen.js
    │   │   ├── ActivityScreen.js
    │   │   ├── IncidentScreen.js
    │   │   ├── SOSScreen.js
    │   │   └── ReportDetailScreen.js
    │   ├── components/        # UI components
    │   │   ├── dashboard/
    │   │   ├── checklist/
    │   │   ├── activity/
    │   │   ├── scan/
    │   │   └── sos/
    │   ├── services/
    │   │   ├── api.js         # Axios with JWT interceptor
    │   │   └── offline.service.js  # Offline queue manager
    │   └── hooks/
    │       ├── useNetworkStatus.js
    │       └── useOfflineSync.js
    ├── assets/               # Images & icons
    ├── App.js                # Navigation setup
    ├── app.json              # Expo configuration
    └── package.json
```

---

## Prerequisites

Before running the project, ensure you have the following installed:

### Backend
- **Python**: 3.10 or higher
- **MySQL**: 8.0 or higher
- **pip**: Python package manager

### Web Dashboard
- **Node.js**: 18.x or higher
- **npm** or **yarn** or **bun**: Package manager

### Mobile App
- **Node.js**: 18.x or higher
- **Expo CLI**: `npm install -g expo-cli` or `npx expo`
- **Expo Go App**: Install on your mobile device from App Store/Play Store
- **iOS Simulator** (Mac only) or **Android Emulator** (optional for testing)

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd patrol-incident-system
```

### 2. Backend Installation

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Web Dashboard Installation

```bash
cd web

# Install dependencies (choose one)
npm install
# or
yarn install
# or
bun install
```

### 4. Mobile App Installation

```bash
cd mobile

# Install dependencies
npm install
# or
yarn install
```

---

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database Configuration
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/patrol_db

# JWT Configuration (optional - defaults are set in config.py)
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=840
```

**Note**: Replace `YOUR_PASSWORD` with your MySQL root password.

### Database Setup

1. **Create MySQL Database**:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE patrol_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

2. **Run Database Migrations** (SQLAlchemy will auto-create tables on first run)

3. **Seed Sample Data** (optional):

```bash
cd backend
# or for rich test data
python seed_rich_data.py
```

### Web Dashboard Configuration

The web dashboard uses a hardcoded API base URL. To change it, edit:

**File**: `web/src/services/api.ts`

```typescript
const API_BASE_URL = 'http://127.0.0.1:8000'; // Change if needed
```

### Mobile App Configuration

The mobile app API URL is configured in the Axios setup:

**File**: `mobile/src/services/api.js`

```javascript
const API_BASE_URL = 'http://10.112.194.132:8000'; // Change to your backend IP
```

**Important**:
- For **physical devices**, use your computer's local network IP address (e.g., `http://192.168.1.100:8000`)
- For **Android Emulator**, use `http://10.0.2.2:8000`
- For **iOS Simulator**, use `http://127.0.0.1:8000` or your local IP

To find your local IP:
- **Windows**: `ipconfig` (look for IPv4 Address)
- **Mac/Linux**: `ifconfig` or `ip addr show`

---

## How to Run

### 1. Backend API

Start the FastAPI backend server:

```bash
cd backend

# Activate virtual environment (if not already activated)
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**API Documentation**:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

### 2. Web Dashboard

Start the React development server:

```bash
cd web

# Run development server
npm run dev
# or
yarn dev
# or
bun dev
```

**Expected Output**:
```
VITE v5.4.19  ready in 500 ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**Access**: Open http://localhost:8080 in your browser

### 3. Mobile App (Expo)

#### Option A: Run on Physical Device (Recommended)

```bash
cd mobile

# Start Expo development server
npx expo start
# or
npm start
```

**Steps**:
1. Open **Expo Go** app on your mobile device
2. Scan the QR code displayed in terminal with:
   - **iOS**: Camera app
   - **Android**: Expo Go app
3. The app will load on your device

#### Option B: Run on iOS Simulator (Mac only)

```bash
cd mobile
npx expo start --ios
```

#### Option C: Run on Android Emulator

```bash
cd mobile
npx expo start --android
```

**Prerequisites for emulators**:
- **iOS**: Xcode installed with iOS Simulator
- **Android**: Android Studio installed with AVD configured

#### Troubleshooting Mobile App Connection

If the mobile app cannot connect to the backend:

1. **Verify Backend is Running**: Check http://YOUR_IP:8000/docs loads in a browser
2. **Check API URL**: Ensure `mobile/src/services/api.js` uses correct IP address
3. **Same Network**: Ensure phone and computer are on the same WiFi network
4. **Firewall**: Temporarily disable firewall or allow port 8000
5. **Restart Expo**: Stop and restart `npx expo start` after changing API URL

---

## Default Login Credentials

After seeding the database with `seed_rich_data.py`, you can use these credentials:

### Web Dashboard Login

**Admin User**:
- **Employee ID**: `ADM001`
- **OTP**: `123456` (hardcoded for development)
- **Role**: Admin
- **Access**: Full system access

### Mobile App Login

**Field Officer User**:
- **Employee ID**: `EMP003`
- **OTP**: `123456`
- **Role**: Field Officer
- **Device Binding**: First login binds the device

**Note**:
- The OTP is currently hardcoded as `123456` for development purposes
- Field Officers are **device-bound** for accountability - first login binds the device permanently
- Admin and Supervisor users can login from any device

---

## API Documentation

### Authentication

All API requests (except `/auth/login`) require JWT authentication:

```
Authorization: Bearer <your-jwt-token>
```

### Key API Endpoints

#### Authentication
```
POST /auth/login
Body: { employee_id, mobile_number, device_id, otp }
Response: { access_token, token_type, user }
```

#### Patrol Management
```
GET  /patrol/dashboard/stats        # Dashboard statistics
GET  /patrol/live-locations         # Active officers' locations
POST /patrol/shift/start            # Start shift
POST /patrol/shift/end              # End shift
POST /patrol/log                    # Create patrol log
```

#### Mobile Endpoints
```
GET    /mobile/dashboard            # Mobile dashboard data
GET    /mobile/shift/active         # Current active shift
POST   /mobile/shift/location       # Background location update
GET    /mobile/checklists/assigned  # Assigned checklists
GET    /mobile/checklists/{id}      # Checklist details
POST   /mobile/checklists/{id}/start            # Start checklist
PATCH  /mobile/checklists/responses/{id}/answer # Submit answer
POST   /mobile/checklists/responses/{id}/submit # Final submission
POST   /mobile/sos/trigger          # Trigger SOS alert
POST   /mobile/sos/{id}/cancel      # Cancel SOS
GET    /mobile/activity             # Activity feed
```

#### Checklist Management
```
GET    /checklist/questions         # Question bank with pagination
POST   /checklist/questions         # Create question
PUT    /checklist/questions/{id}    # Update question
DELETE /checklist/questions/{id}    # Delete question
GET    /checklist/checklists        # All checklists
POST   /checklist/checklists        # Create checklist
PUT    /checklist/checklists/{id}   # Update checklist
PATCH  /checklist/checklists/{id}/toggle  # Activate/deactivate
GET    /checklist/submissions       # View all submissions
PATCH  /checklist/submissions/{id}/review  # Review submission
```

#### Incident Management
```
POST   /incident/report            # Report incident
POST   /incident/sos               # SOS alert
GET    /incident/                  # List incidents
PATCH  /incident/{id}/resolve      # Resolve incident
```

#### File Management
```
POST /file/upload                  # Upload files
GET  /uploads/{filename}           # Access uploaded files
```

**Full Documentation**: Visit http://127.0.0.1:8000/docs when backend is running

---
---

## Common Issues & Troubleshooting

### Backend Issues

**Issue**: `ModuleNotFoundError: No module named 'app'`
- **Solution**: Ensure you're in the `backend/` directory and virtual environment is activated

**Issue**: `Can't connect to MySQL server`
- **Solution**: Verify MySQL is running and credentials in `.env` are correct

**Issue**: `Table doesn't exist`
- **Solution**: SQLAlchemy auto-creates tables on first run. Restart the backend or run `seed_data.py`

### Web Dashboard Issues

**Issue**: `Network Error` or `API not responding`
- **Solution**: Verify backend is running on port 8000 and CORS is enabled

**Issue**: Login not working
- **Solution**: Check browser console for errors, ensure database is seeded with user data

### Mobile App Issues

**Issue**: `Network request failed`
- **Solution**:
  1. Ensure backend is running
  2. Verify API_BASE_URL in `api.js` uses correct IP (not localhost)
  3. Ensure phone and computer are on same WiFi network
  4. Check firewall allows port 8000

**Issue**: Camera/Location not working
- **Solution**: Grant permissions when prompted. For iOS, check Settings > PatrolSync > Permissions

**Issue**: Expo Go not loading app
- **Solution**: Restart Expo server and clear cache: `npx expo start -c`

---

---

## Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Expo](https://expo.dev/)
- [Shadcn UI](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
