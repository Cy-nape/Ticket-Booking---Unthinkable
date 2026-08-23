# Ticket Booking System

A production-quality Ticket Booking API built for movies and concerts, designed with strict concurrency safety and relational integrity.

## Architecture & Tech Stack

*   **Backend:** Python 3 + FastAPI
*   **Database:** PostgreSQL (with SQLAlchemy ORM)
*   **Concurrency:** Database-level Row Locking (`SELECT ... FOR UPDATE`)
*   **Real-time:** WebSockets for live seat map updates
*   **Background Jobs:** APScheduler for auto-releasing expired seat holds & waitlist processing
*   **Frontend:** React (Vite) + Tailwind CSS (Functional/Minimal)

## Key Features

1.  **Strict Concurrency Protection:** Uses `SELECT ... FOR UPDATE` directly on the `seats` table to prevent double-booking. When 100 users try to book the exact same seat simultaneously, only 1 gets it, and 99 receive a `409 Conflict` instantly.
2.  **Stateless Auto-Release (TTL):** Seat holds expire automatically. An APScheduler background task runs every 5 seconds to sweep expired holds and broadcast `AVAILABLE` to all connected clients via WebSockets.
3.  **Intelligent Waitlist System:** If a user is on the waitlist for a sold-out category, the background sweeper job will automatically detect this when a hold expires. It natively re-uses the concurrency protection by instantly generating a new 2-hour `SeatHold` for the waitlisted user, changing their status to `OFFERED`, and simulating an email notification.
4.  **Live Seat Map Updates:** A WebSocket connection pushes real-time `HELD`, `BOOKED`, and `AVAILABLE` events down to the React frontend to visually update the seating chart without polling.
5.  **QR Code Generation:** The backend uses the `qrcode` library to generate a ticket barcode, streaming it directly to the frontend inside the JSON payload as a Base64 string to maintain stateless architecture.

## Setup Instructions

### 1. Database Setup
Ensure PostgreSQL is running. Create a database named `ticket_booking`.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Set up your `.env` file in the `backend` directory:
```
DATABASE_URL=postgresql://user:password@localhost/ticket_booking
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
SEAT_HOLD_TTL_MINUTES=10
```

Run database migrations (or init script) and start the server:
```bash
python init_db.py
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

FastAPI automatically generates interactive OpenAPI documentation.
Once the server is running, visit:
*   **Swagger UI:** `http://localhost:8000/docs`
*   **Redoc:** `http://localhost:8000/redoc`

### Core Endpoints:
*   `POST /auth/register` & `POST /auth/login` - JWT Authentication
*   `GET /events` - List events
*   `GET /events/{id}/seats` - Fetch seat layout and prices
*   `POST /events/{id}/hold` - Acquire a row-lock on a seat for 10 minutes
*   `POST /events/{id}/book` - Complete purchase, transition to BOOKED, get QR code
*   `POST /events/{id}/waitlist` - Join a queue for a specific category
*   `GET /users/me/bookings` - Dashboard history

## Testing
The `backend` directory contains functional integration scripts used to verify the assessment constraints:
*   `test_phase4_concurrency.py`: Fires 10 simultaneous threads at the exact same seat to verify PostgreSQL locks.
*   `test_phase5_booking.py`: Completes a full booking flow.
*   `test_phase6_waitlist.py`: Verifies the auto-assignment scheduler.
*   `test_phase7_history.py`: Verifies the embedded schema for dashboard rendering.
