# Smart Agricultural Procurement & Queue Management Platform

A real-time coordination layer for agricultural procurement systems (e-NAM, FCI, state portals) with slot booking, live token-based queue orchestration, quality inspection, weighment, automated procurement handover, and transparent payment tracking.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Clients                                      │
├──────────────────┬──────────────────────┬──────────────────────────┤
│  Farmer Mobile   │  Centre Officer      │  Government Web          │
│  App (Expo/RN)   │  Mobile App (Expo/RN)│  Dashboard (Next.js)     │
└────────┬─────────┴──────────┬───────────┴───────────┬──────────────┘
         │                    │                       │
         ▼                    ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                                  │
├──────────────┬──────────────┬──────────────┬──────────────────────┤
│ REST API     │ State Machine│ AI Engine    │ WebSocket Hub        │
│ Gateway      │ Engine       │ (Synthetic)  │ + PubSub             │
└──────┬───────┴──────┬───────┴──────┬───────┴──────────┬───────────┘
       │              │              │                  │
       ▼              ▼              ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Storage Layer                                  │
├────────────────────────────────┬────────────────────────────────────┤
│  PostgreSQL / SQLite (auto)    │  Redis / In-Memory PubSub (auto)   │
└────────────────────────────────┴────────────────────────────────────┘
```

## Features

### Farmer Mobile App
- **Login/Register**: OTP-based authentication with demo mode (OTP: 123456)
- **Produce Declaration**: Crop selection, land area, estimated quantity
- **Centre Selection**: AI-powered recommendations with distance, queue length, wait time
- **Slot Booking**: Real-time availability with live quota
- **QR Token**: Digital token with QR code for check-in
- **Live Queue**: Real-time position, now-serving, estimated wait
- **Procurement Tracker**: Step-by-step visual progress (10 stages)
- **Payment Tracker**: MSP breakdown, gross/net amounts, payment status
- **Multilingual**: English, Hindi (हिन्दी), Punjabi (ਪੰਜਾਬੀ)

### Centre Officer App
- **Centre Login**: Select assigned procurement centre
- **Appointments List**: Today's scheduled arrivals with status filters
- **QR Check-In**: Camera scanner or manual token entry
- **Queue Management**: Call next, mark in-progress
- **Quality Entry**: Moisture %, foreign matter %, damaged grain %, grade
- **Weight Entry**: Gross/tare weight with auto net calculation
- **Procurement Complete**: Final sign-off, receipt generation, payment trigger

### Government Dashboard
- **Centre Geo-Map**: Interactive map with live status indicators
- **Queue Monitoring**: Real-time token flow across all centres
- **Capacity Monitoring**: Hourly arrivals vs capacity gauges
- **AI Congestion Predictions**: 
  - Demand forecasts (7 days)
  - Overload risk detection (>115% capacity)
  - Redistribution recommendations with reasoning chains
  - Step-by-step explainable AI traces
- **Analytics**: Wait time heatmaps, turnaround by crop, utilization %, no-show/rejection rates
- **3-Minute Demo**: Interactive end-to-end journey walkthrough

## Quick Start

### Backend (FastAPI)
```bash
cd backend_fastapi
python -m pip install -r requirements.txt
python seed.py          # Seed demo data (4 centres, 20 farmers, slots)
python -m app.main      # Start server on http://localhost:8000
```

API Documentation: http://localhost:8000/docs

### Mobile App (Expo/React Native)
```bash
cd mobile
npm install
npm start               # Opens Expo DevTools
# Press 'w' for web, 'a' for Android, 'i' for iOS
```

### Web Dashboard (Next.js)
```bash
cd web-dashboard
npm install
npm run dev             # Start on http://localhost:3000
```

## Demo Data

The seed script creates:
- **4 Centres**: Karnal Mandi, Panipat Centre, Kurukshetra Depot, Ambala Hub
- **20 Farmers**: With profiles, farms, and crop declarations
- **Slots**: 4 time slots/day for 2 days (today + tomorrow)
- **Bookings**: Various statuses (BOOKED, CONFIRMED, ARRIVED, QUALITY_CHECK)

### Demo Credentials
- **Farmer OTP**: `123456` (works for any mobile number)
- **Officer Login**: Select any centre code (KRN001, PNP001, KKR001, AMB001)

### Demo Token Example
```
TK-20260117-084
Centre: Karnal Mandi
Slot: 10:00-12:00
Crop: Wheat, 45 quintals
```

## API Endpoints

### Authentication
- `POST /auth/request-otp` - Request OTP
- `POST /auth/verify-otp` - Verify OTP, get JWT
- `POST /auth/officer/login` - Officer login

### Farmers
- `POST /farmers` - Create/update farmer profile
- `GET /farmers/{id}` - Get farmer profile
- `POST /farmers/{id}/farms` - Declare produce
- `GET /farmers/{id}/farms` - List farms
- `GET /farmers/{id}/bookings` - Farmer's bookings

### Centres & Slots
- `GET /centres` - List centres (with filters)
- `GET /centres/nearby` - Nearby centres with queue info
- `GET /centres/{id}/slots` - Available slots for a centre
- `POST /centres/{id}/slots` - Create slot

### Bookings & Tokens
- `POST /bookings` - Create booking
- `GET /bookings/{id}` - Get booking details
- `GET /bookings/token/{token}` - Get booking by token
- `POST /bookings/{id}/cancel` - Cancel booking
- `GET /bookings/{id}/timeline` - Status timeline
- `GET /tokens/{token}` - Token status with queue position
- `POST /tokens/{token}/checkin` - Officer check-in
- `GET /tokens/{token}/live` - Live queue updates

### Queue Management
- `GET /queue/centre/{id}` - Centre queue metrics
- `GET /queue/all` - All centres queue metrics
- `POST /queue/centre/{id}/call-next` - Call next token

### Quality & Weighment
- `POST /quality/booking/{id}` - Record quality check
- `GET /quality/procurement/{id}` - Get quality results
- `POST /weighments/procurement/{id}` - Record weighment

### Procurement & Payments
- `POST /procurement/booking/{id}` - Complete procurement
- `GET /procurement/booking/{id}` - Get procurement details
- `POST /payments/procurement/{id}` - Initiate payment
- `POST /payments/{id}/process` - Process payment
- `POST /payments/{id}/complete` - Complete payment
- `GET /payments/booking/{id}` - Payment breakdown

### AI & Analytics
- `GET /ai/recommend-centres` - AI centre recommendations
- `GET /ai/demand-forecast` - 7-day demand forecast
- `GET /ai/congestion-prediction` - Congestion predictions
- `GET /ai/centre/{id}/congestion` - Centre congestion detail
- `GET /analytics/summary` - KPI summary
- `GET /analytics/centre/{id}/wait-time-heatmap` - Wait time heatmap
- `GET /analytics/turnaround-by-crop` - Turnaround by crop
- `GET /analytics/utilization` - Centre utilization

### WebSocket
- `WS /ws/queue/{centre_id}` - Real-time queue updates

## Configuration

### Environment Variables (.env)
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/dbname
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your-secret-key
DEBUG=true
```

### Database Fallback
If PostgreSQL is unavailable, automatically falls back to SQLite (`sqlite+aiosqlite:///./platform.db`)

### Redis Fallback
If Redis is unavailable, automatically uses in-memory asyncio PubSub

## Design Principles

1. **Plain Language Only**: All status codes translated to farmer-friendly text (EN/HI/PA)
2. **No Color-Only Status**: Every status has icon + text label
3. **Mock External Services**: OTP, SMS, FCM, government APIs are stubbed
4. **Zero-Friction Demo**: SQLite + in-memory PubSub work out of the box
5. **Explainable AI**: Every prediction includes reasoning chain
6. **Accessibility**: High contrast, large touch targets, screen reader support

## Testing

```bash
# Backend tests
cd backend_fastapi
pytest tests/ -v

# Key test files:
# - tests/test_state_machine.py: All valid transitions
# - tests/test_api_routes.py: All 17 REST endpoints
# - tests/test_ai_engine.py: AI outputs with reasoning
```

## Project Structure

```
KisanFlow/
├── backend_fastapi/          # FastAPI Backend
│   ├── app/
│   │   ├── core/             # Config, DB, Events
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   ├── routers/          # API endpoints
│   │   └── main.py           # Entry point
│   ├── seed.py               # Demo data seeder
│   └── requirements.txt
├── mobile/                   # Expo/React Native App
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React Context providers
│   │   ├── screens/
│   │   │   ├── farmer/       # 9 farmer screens
│   │   │   └── officer/      # 7 officer screens
│   │   ├── services/         # API client
│   │   ├── i18n/             # EN/HI/PA translations
│   │   └── types.ts          # TypeScript types
│   ├── package.json
│   └── app.json
├── web-dashboard/            # Next.js Dashboard
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # Dashboard components
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utilities
│   ├── package.json
│   └── globals.css           # Design tokens
└── README.md
```

## Verification Checklist

### End-to-End Demo (3 minutes)
1. ✅ Farmer registers with mobile + OTP
2. ✅ Declares 45 quintals wheat
3. ✅ AI recommends Karnal Mandi (5.2km, 15min wait)
4. ✅ Books 10:00-12:00 slot, gets QR token TK-20260117-084
5. ✅ Live queue shows position → now serving
6. ✅ Officer scans QR → status: Arrived at Centre
7. ✅ Quality check: 11.8% moisture → Grade A accepted
8. ✅ Weighment: Gross 5200kg, Tare 700kg → Net 45.00 quintals
9. ✅ Procurement complete → Receipt RCP-20260117-ABC123
10. ✅ Payment: ₹1,02,375 (MSP ₹2,275/qtl) → Credited to bank
11. ✅ Dashboard shows Ambala congestion → Redistribution recommendation

## License

MIT License - See LICENSE file for details.
# KisanFlow
