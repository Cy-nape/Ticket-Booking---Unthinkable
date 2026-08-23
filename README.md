# Ticket Booking System - Production Grade

A production-quality Ticket Booking API and Frontend built for movies and concerts, designed from the ground up to handle massive traffic spikes with **strict concurrency safety** and **relational integrity**. 

Unlike standard CRUD applications, this project tackles the hardest problems in live ticketing: double-bookings, race conditions, and real-time state synchronization across thousands of clients.

## 🌍 Live Demo
**[Click Here to view the Live Deployed Application on Render](https://ticket-booking-frontend-hitt.onrender.com/)**

---

## 🌟 Why This Project is Better

### 1. Zero Double-Bookings (Row-Level Locking)
When highly anticipated events drop, hundreds of users might click the same seat at the exact same millisecond. 
*   **The Problem:** Standard apps will read the database, see the seat is available, and sell it to all 100 people.
*   **The Solution:** This backend uses PostgreSQL's `SELECT ... FOR UPDATE`. It physically locks the specific row in the database. The first request wins the lock. The other 99 requests hit the lock, see the state changed, and are instantly rejected with a `409 Conflict`. Mathematically, double-booking is impossible.

### 2. Live WebSockets (No Polling)
*   If User A in Tokyo clicks a seat, the backend instantly broadcasts that state change over a WebSocket connection to User B in London. User B's screen updates in real-time without needing to refresh or poll the server.

### 3. Background Sweeping & Intelligent Waitlist
*   Seat holds expire in 10 minutes. A background `APScheduler` daemon sweeps the database asynchronously every 5 seconds to automatically release expired holds.
*   If an event is sold out, the waitlist piggybacks onto this background job. When a hold expires, the system automatically detects users in the queue and instantly assigns the seat to them instead of the general public.

### 4. 100% Stateless Server
*   QR Codes for tickets are generated dynamically in memory using Python, encoded to a Base64 string, and streamed directly in the JSON response. No images are saved to a hard drive, meaning the backend can be horizontally scaled infinitely.

---

## 📸 Step-by-Step Guide

### 1. The Premium Platform (Home & Events)
The platform features a modern, dark-mode glassmorphism UI designed to look like a premium concert ticketing system.
![Home Page](frontend/public/screenshots/1-home.png)

### 2. Secure Authentication
Users can register and log in securely. The system uses JWT tokens stored safely, communicating with the FastAPI backend.
![Login Page](frontend/public/screenshots/2-login.png)

### 3. Real-Time Seat Selection
The seat map connects to WebSockets instantly. Available seats are teal. When you select a seat, it turns purple and begins pulsating to indicate your temporary 10-minute hold.
![Seat Map](frontend/public/screenshots/3-seatmap.png)

### 4. Countdown & Checkout
Once held, a 10-minute countdown begins. If another user attempts to click your pulsating seat, they receive a sleek Toast Popup indicating the seat is taken, powered by the database row locks.
![Checkout Panel](frontend/public/screenshots/4-checkout.png)

### 5. Dashboard & Waitlist Management
Users can view all their confirmed tickets and track their waitlist statuses in a stylized, card-based dashboard.
![Dashboard](frontend/public/screenshots/5-dashboard.png)

---

## 🚀 Setup Instructions

### 1. Database Setup
Ensure PostgreSQL is running on your machine.
Create a database named `ticket_booking`.

### 2. Backend Setup (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost/ticket_booking
SECRET_KEY=supersecretkey_please_change_in_production
```

Run database migrations and start the server:
```bash
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup (React/Vite)
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to view the application!

---

## ☁️ Deployment
This project features "Infrastructure as Code" via a `render.yaml` Blueprint. 
To deploy the entire Database, Backend, and Frontend to the live internet in one click:
1. Log into [Render.com](https://render.com)
2. Click **New +** -> **Blueprint**
3. Select this repository. The deployment will handle everything automatically on the Free Tier!
