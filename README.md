
# ⚡ Ebidx - Real-Time Auction Platform

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.0+-092E20.svg?logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-B73BFE.svg?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192.svg?logo=postgresql&logoColor=white)

> A modern, full-stack auction platform featuring live bidding, real-time notifications, and secure checkout.

Ebidx is designed to provide a seamless, high-performance auction experience. Built with a **React (Vite)** frontend and a **Django REST Framework** backend, it leverages **WebSockets (Django Channels)** to deliver instant price updates without page refreshes.

---

## Key Features

* ⚡ **Real-Time Bidding:** Live auction price updates and instantaneous outbid notifications powered by Django Channels & WebSockets.
* 🔒 **Secure Authentication:** Token-based user authentication with Django REST Framework.
* 💳 **Payment Integration:** Frictionless and secure checkout flow using Stripe PaymentIntents.
* ☁️ **Image Management:** Persistent, optimized cloud image hosting via Cloudinary.
* 📊 **User Dashboard:** Comprehensive hub to track active listings, monitor winning bids, and check payment statuses.
* 🎫 **Support System:** Integrated ticketing system using EmailJS for user support.
* 🛡️ **Spam Protection:** Google ReCAPTCHA v3 integrated directly into the authentication flow.

---

## 🛠️ Tech Stack & Architecture

### Frontend (Client)
* **Framework:** React 18 (bootstrapped with Vite for rapid development)
* **Styling:** Tailwind CSS + shadcn/ui components for a premium, glassmorphism aesthetic.
* **Network:** Axios for HTTP requests, Native WebSockets for live data streams.

### Backend (API & WebSockets)
* **Framework:** Django 5+ & Django REST Framework (DRF)
* **Async Server:** Daphne ASGI server + Django Channels (In-Memory layer for dev, Redis for prod).
* **Database:** PostgreSQL (configured via `dj_database_url` for easy cloud deployment), SQLite default for local dev.
* **Integrations:** Stripe Python SDK, Cloudinary Storage.

---

## 🚀 Local Development Setup

Follow these steps to get a local development environment running.

### Prerequisites
* Python 3.10+
* Node.js v18+
* *(Optional)* PostgreSQL (SQLite works out of the box for local development)

### 1. Backend Setup (Django)

Open a terminal and navigate to the backend directory:
```bash
cd backend
```

Create and activate a virtual environment:
```bash
# Mac/Linux
python -m venv venv
source venv/bin/activate  

# Windows
venv\Scripts\activate
```

Install the required Python dependencies:
```bash
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` root directory (see *Environment Variables* below for keys) and apply the database migrations:
```bash
python manage.py migrate
```

Start the Daphne ASGI development server:
```bash
python manage.py runserver
```
📍 *The backend API will be running at `http://127.0.0.1:8000`*

### 2. Frontend Setup (React)

Open a **new** terminal window and navigate to the frontend directory:
```bash
cd frontend
```

Install the Node dependencies:
```bash
npm install
```

Create a `.env` file in the `frontend/` root directory (see *Environment Variables* below).

Start the Vite development server:
```bash
npm run dev
```
📍 *The frontend UI will be running at `http://localhost:5173`*

---

## 🔐 Environment Variables

The project requires two separate `.env` files to keep secrets isolated.

### Backend `.env` (`/backend/.env`)
```env
# Core Django
SECRET_KEY=your_django_secure_secret_key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# Database (Leave blank to use default SQLite locally)
DATABASE_URL=postgres://user:pass@localhost:5432/ebidx

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# Security
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

### Frontend `.env` (`/frontend/.env`)
```env
# API & WebSocket Configuration
VITE_API_URL=[http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)
VITE_WS_URL=ws://127.0.0.1:8000/ws

# Integrations
VITE_STRIPE_PUBLIC_KEY=pk_test_your_publishable_key
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# EmailJS (Support Form)
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

---

## 🔌 API Endpoints Reference

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/register/` | Register a new user account |
| `POST` | `/api/login/` | Authenticate and receive DRF Token |

### Auctions
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/home-sections/` | Fetch categorized items for the homepage |
| `GET` | `/api/auctions/` | List all active auctions |
| `GET` | `/api/auctions/:id/` | Retrieve detailed data for a specific auction |
| `POST` | `/api/auctions/:id/bid/` | Place a new bid *(Requires Auth)* |
| `POST` | `/api/auctions/:id/end/` | End an active auction early *(Owner only)* |

### User & Dashboard
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/profile/` | Get authenticated user profile details |
| `GET` | `/api/dashboard/` | Retrieve user's active bids and listings |
| `GET` | `/api/notifications/` | Get a list of unread user notifications |

### WebSockets (Channels)
* **Live Bidding Room:** `ws://127.0.0.1:8000/ws/auction/<id>/`
* **Personal Notifications:** `ws://127.0.0.1:8000/ws/notifications/?token=<token>`

---
