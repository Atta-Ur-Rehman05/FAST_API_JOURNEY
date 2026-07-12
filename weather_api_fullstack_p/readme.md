WeatherAPI Full-Stack Project

A full-stack weather application that provides real-time weather information using a Weather API. The project consists of a frontend for displaying weather data and a backend that securely handles API requests.

Features

Search weather by city name
View current weather conditions
Display temperature, humidity, wind speed, and weather description
Responsive user interface
Secure backend API integration
Environment variable support for API keys

Tech Stack

Frontend: React
Backend: Node.js, Express
API: WeatherAPI
Styling: CSS / Tailwind CSS (if applicable)

Getting Started
1. Clone the repository
git clone <repository-url>
cd weatherapi-fullstack

2. Install dependencies

Backend

cd backend
npm install

Frontend

cd ../frontend
npm install

3. Configure environment variables

Create a .env file in the backend directory:

WEATHER_API_KEY=your_api_key
PORT=5000
4. Run the application

Start the backend:

cd backend
npm run dev

Start the frontend:

cd frontend
npm start

The frontend will typically run on http://localhost:3000 and the backend on http://localhost:8000.

Project Structure
weatherapi-fullstack/
├── backend/
├── frontend/
└── README.md
License

This project is for learning and educational purposes.