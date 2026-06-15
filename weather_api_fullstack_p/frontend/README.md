# CloudScape - Weather Tracking Frontend

CloudScape is a premium, beautifully designed responsive React frontend for the Weather API Fullstack application. It allows users to create accounts, fetch real-time weather globally, manage favorite cities, and view their search history. 

## 📋 Features

- **Authentication System**: Secure user registration and login workflows with automatic token handling.
- **Real-time Weather**: Search dynamically for any city and get beautifully stylized real-time conditions (mocked 7-day forecast views supported for demo mode).
- **Favorites Management**: Users can star cities to save them to their account and view them later on a dedicated favorites dashboard.
- **Search History**: Automatically retains the user's latest searches in an interactive, scrollable horizontal row for quick access.
- **Premium Aesthetics**: Features custom Tailwind 4 keyframe blob animations, glassmorphism UI elements, dark mode optimizations, and dynamic color-coding based directly on live weather types.

## 🛠 Tech Stack

- **Framework**: React 19 (via Vite)
- **Routing**: React Router DOM (v7)
- **State Management**: Zustand
- **Styling**: Tailwind CSS (v4)
- **HTTP Client**: Axios (Centralized API configurations & Interceptors)
- **UI Notifications**: React Toastify

## 📂 Project Structure

```text
src/
├── api/             # Centralized Axios configs and specific API boundaries
├── components/      # Reusable UI Pieces
│   ├── common/      # General components like Navbars, Loaders, Error bars
│   ├── favorites/   # Components dedicated to the Favorite logic
│   └── weather/     # Search bars, Weather layout cards
├── hooks/           # Future extraction of local Component hooks
├── layouts/         # Layout wrappers (MainLayout with dynamic backgrounds)
├── pages/           # High-level route views (Login, Register, Dashboard)
├── routes/          # Navigation guards (ProtectedRoute handling Auth logic)
├── store/           # Zustand global state (authStore, weatherStore)
└── utils/           # Helper scripts and formatters
```

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed, and that your FastAPI backend is running locally on port `8000`.

### 1. Installation
Clone the repository, navigate into the `frontend` directory, and install the dependencies:
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root of the `frontend` directory (if needing a custom backend port) and define your backend base URL. **By default**, it is configured to fallback to `http://localhost:8000`.
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Run Development Server
Start Vite's ultra-fast hot reloading development server:
```bash
npm run dev
```
Navigate your browser to: `http://localhost:5173`

## 🤝 State Management Overview
- **`authStore.js`**: Contains local state persistence. Auto-hydrates the JWT token across reloads and syncs cleanly with the Axios request interceptors to automatically secure outgoing backend payloads.
- **`weatherStore.js`**: Pure memory store controlling application loading variables, weather payloads, favorites lists, and search history arrays smoothly across routes.
