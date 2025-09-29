# Smart Pilgrimage Crowd Management System - MVP

A comprehensive web-based solution for managing crowds at major pilgrimage sites in Gujarat, India. This MVP addresses Problem Statement ID 25165 for temple crowd management during festivals and peak seasons.

## Problem Statement

Managing large crowds at pilgrimage sites like Somnath, Dwarka, Ambaji, and Pavagadh during festivals and peak seasons, ensuring safety, order, and enhanced pilgrim experience.

## Features

### Core MVP Features Implemented

1. **Real-Time Crowd Monitoring Dashboard**
   - Live crowd density visualization with mock IoT sensor data
   - Temple-wise capacity tracking (current vs maximum occupancy)
   - Color-coded heat maps for different temple zones
   - Real-time alerts for overcrowding thresholds
   - Emergency response indicators

2. **Smart Queue Management System**
   - Virtual queue booking for darshan slots
   - QR code-based token generation
   - Real-time waiting time estimates
   - Digital queue status display
   - Queue position tracking

3. **Crowd Prediction Analytics**
   - Historical data-based crowd forecasting
   - Festival calendar integration
   - Weather impact analysis
   - Peak time predictions with analytics
   - Resource allocation recommendations

4. **Emergency Management Module**
   - Emergency incident reporting system
   - Real-time incident tracking
   - Emergency contact management
   - Severity-based alert system
   - Response time tracking

5. **Progressive Web App (PWA)**
   - Mobile-responsive design
   - Offline capability
   - App-like experience
   - Push notifications support

## Technical Architecture

### Backend (Node.js/Express)
- **Database**: MongoDB for data storage
- **Real-time**: Socket.io for live updates
- **API**: RESTful endpoints
- **Authentication**: JWT ready (can be extended)
- **Caching**: Redis integration ready

### Frontend (React/TypeScript)
- **UI Framework**: Material-UI (MUI)
- **Charts**: Chart.js with React-chartjs-2
- **QR Codes**: QRCode.react
- **Real-time**: Socket.io client
- **PWA**: Service worker and manifest.json

### Mock Data & Simulation
- **Temple Data**: 4 major Gujarat temples (Somnath, Dwarka, Ambaji, Pavagadh)
- **Crowd Simulation**: IoT sensor data simulation
- **Historical Analytics**: 7 days of mock historical data
- **Weather Integration**: Simulated weather impact
- **Festival Calendar**: Mock festival and holiday data

## Project Structure

```
MVP/
├── backend/
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic & mock data
│   │   ├── utils/          # Helper functions
│   │   └── server.js       # Main server file
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API & Socket services
│   │   ├── types/          # TypeScript definitions
│   │   └── App.tsx         # Main app component
│   ├── public/
│   │   ├── manifest.json   # PWA manifest
│   │   └── index.html
│   ├── package.json
│   └── webpack.config.js
└── README.md
```

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation & Setup

1. **Clone and navigate to project:**
   ```bash
   cd "D:\Hackathon\SIH 2025\MVP"
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install

   # Copy environment file and configure if needed
   cp .env.example .env

   # Start the backend server
   npm run dev
   ```

3. **Frontend Setup (in a new terminal):**
   ```bash
   cd frontend
   npm install

   # Start the frontend development server
   npm start
   ```

4. **Access the Application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/health

### Default Configuration

The system comes pre-configured with:
- **4 Temples**: Somnath, Dwarka, Ambaji, Pavagadh
- **Mock Data**: Automatic generation of crowd data, historical analytics, and sample queue bookings
- **Real-time Updates**: Live data generation every 5 minutes
- **Database**: Auto-initialization with sample data

## API Endpoints

### Temple Management
- `GET /api/temples` - Get all temples
- `GET /api/temples/:id` - Get temple details
- `GET /api/temples/:id/crowd` - Get real-time crowd data
- `PUT /api/temples/:id/status` - Update temple status
- `POST /api/temples/:id/alert` - Create crowd alert

### Queue Management
- `POST /api/queue/book` - Book darshan slot
- `GET /api/queue/:templeId/status` - Get queue status
- `GET /api/queue/token/:tokenNumber` - Get booking details
- `PUT /api/queue/token/:tokenNumber` - Update booking
- `DELETE /api/queue/token/:tokenNumber` - Cancel booking

### Analytics
- `GET /api/analytics/predictions` - Get crowd predictions
- `GET /api/analytics/temple/:id/history` - Get historical data
- `GET /api/analytics/daily-report` - Generate daily report

### Emergency Management
- `POST /api/emergency/report` - Report emergency
- `GET /api/emergency/active` - Get active emergencies
- `PUT /api/emergency/:id/update` - Update emergency status
- `GET /api/emergency/contacts/:templeId` - Get emergency contacts

## Key Components

### Dashboard Features
- **Real-time metrics**: Total pilgrims, average occupancy, operational status
- **Temple status cards**: Individual temple monitoring with occupancy levels
- **Heat map visualization**: Color-coded crowd intensity across temples
- **Live alerts**: Recent emergency and crowd alerts
- **Auto-refresh**: Real-time updates via WebSocket

### Queue Management Features
- **Booking system**: Complete darshan slot booking with QR codes
- **Token tracking**: Real-time queue position and wait time updates
- **Special needs**: Support for wheelchair, elderly, and pregnant pilgrims
- **Group bookings**: Support for family/group darshan bookings
- **Digital tokens**: QR code generation for contactless verification

### Analytics Features
- **Trend analysis**: Historical crowd patterns and predictions
- **Interactive charts**: Line and bar charts for data visualization
- **Forecasting**: ML-based crowd predictions (simulated)
- **Daily reports**: Automated generation of crowd analytics reports
- **Multi-timeframe**: 24 hours, 7 days, 30 days analysis

### Emergency Management Features
- **Incident reporting**: Multi-category emergency reporting system
- **Real-time tracking**: Live status updates for emergency incidents
- **Contact management**: Emergency contact directory by temple
- **Severity levels**: Low, medium, high, critical classification
- **Response tracking**: Acknowledgment and resolution time tracking

## Configuration

### Environment Variables (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pilgrimage_crowd_management
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:3000
```

### Mock Data Configuration
The system automatically generates:
- **Temple data**: 4 major Gujarat temples with realistic capacities
- **Crowd simulation**: IoT sensor data with hourly variations
- **Historical data**: 7 days of past crowd analytics
- **Queue bookings**: Sample darshan slot bookings
- **Real-time updates**: Continuous data generation every 5 minutes

## Progressive Web App (PWA)

The application is configured as a PWA with:
- **Offline support**: Basic functionality without internet
- **App-like experience**: Can be installed on mobile devices
- **Push notifications**: Ready for real-time alerts
- **Responsive design**: Mobile-first approach
- **Fast loading**: Optimized for mobile networks

## Deployment Ready

The MVP is production-ready with:
- **Environment configuration**: Separate dev/prod configs
- **Error handling**: Comprehensive error management
- **Security**: CORS configuration and input validation
- **Scalability**: WebSocket support for multiple clients
- **Monitoring**: Health check endpoints
- **Documentation**: Complete API documentation

## Success Metrics

The system tracks:
- **Queue efficiency**: Reduced waiting times through virtual queues
- **Crowd management**: Real-time occupancy monitoring and alerts
- **Emergency response**: Faster incident reporting and resolution
- **User adoption**: Pilgrim engagement with digital services
- **Operational efficiency**: Data-driven temple management decisions

## Future Enhancements

Ready for extension with:
- **IoT Integration**: Real sensor data integration
- **Machine Learning**: Advanced crowd prediction models
- **Multi-language**: Hindi, Gujarati, English support
- **Payment Integration**: Digital offerings and donations
- **Government APIs**: Integration with state tourism systems
- **Advanced Analytics**: Visitor pattern analysis and optimization

## MVP Achievements

- **Complete backend API** with all core features
- **Responsive React frontend** with real-time updates
- **Real-time crowd monitoring** with WebSocket support
- **Queue management system** with QR code generation
- **Analytics dashboard** with interactive charts
- **Emergency management** with incident tracking
- **PWA configuration** for mobile app experience
- **Mock data generation** for realistic demonstration
- **Production-ready architecture** with proper error handling
- **Comprehensive documentation** and setup guides

This MVP successfully demonstrates a complete crowd management solution for pilgrimage sites, addressing all key requirements of the problem statement with modern web technologies and scalable architecture.

## Contributing

This MVP is ready for hackathon presentation and can be extended with additional features, real IoT integration, and advanced analytics based on requirements.

---

**Built for SIH 2025 - Problem Statement 25165**
*Smart Pilgrimage Crowd Management System for Gujarat Temples*