# Task Management System

A full-stack Task Management System built with FastAPI, PostgreSQL, React, and JWT Authentication.

This application allows users to register, authenticate, and manage personal tasks through a modern dashboard interface. Each user has access only to their own tasks, ensuring secure and isolated task management.

---

## Features

### Authentication

* User Registration
* User Login
* JWT Authentication
* Protected Routes
* Secure Password Hashing

### Task Management

* Create Tasks
* View Tasks
* Update Tasks
* Delete Tasks
* Task Ownership Protection

### Advanced Features

* Pagination
* Search Tasks
* Filter by Status
* Filter by Priority
* Sorting Support
* Responsive Dashboard

### User Dashboard

* Total Tasks
* Pending Tasks
* In Progress Tasks
* Completed Tasks

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router DOM
* Axios
* Zustand
* React Hook Form
* React Toastify
* Day.js

### Backend

* FastAPI
* SQLAlchemy
* Pydantic
* JWT Authentication
* Passlib
* Python-JOSE

### Database

* PostgreSQL

---

## Project Structure

```text
task-management-system/

├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── database.py
│   └── config.py
│
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       ├── store/
│       └── utils/
│
└── README.md
```

---

## Database Design

### Users

| Field    | Type            |
| -------- | --------------- |
| id       | Integer         |
| username | String          |
| password | String (hashed) |

### Tasks

| Field       | Type        |
| ----------- | ----------- |
| id          | Integer     |
| title       | String      |
| description | Text        |
| status      | String      |
| priority    | String      |
| due_date    | DateTime    |
| owner_id    | Foreign Key |
| created_at  | DateTime    |
| updated_at  | DateTime    |

### Relationship

```text
User (1)
   │
   └───────< Task (Many)
```

Each user can own multiple tasks.

Each task belongs to a single user.

---

## API Endpoints

### Authentication

| Method | Endpoint  | Description                    |
| ------ | --------- | ------------------------------ |
| POST   | /register | Register a new user            |
| POST   | /login    | Login and receive JWT token    |
| GET    | /me       | Get current authenticated user |

### Tasks

| Method | Endpoint    | Description    |
| ------ | ----------- | -------------- |
| POST   | /tasks      | Create task    |
| GET    | /tasks      | Get tasks      |
| GET    | /tasks/{id} | Get task by ID |
| PUT    | /tasks/{id} | Update task    |
| DELETE | /tasks/{id} | Delete task    |

---

## Authentication Flow

```text
Register User
      ↓
Login
      ↓
Receive JWT Token
      ↓
Store Token
      ↓
Attach Token to Requests
      ↓
Protected FastAPI Routes
      ↓
Authorized Task Operations
```

Authorization Header:

```http
Authorization: Bearer <access_token>
```

---

## Frontend Architecture

```text
Pages
   ↓
Services
   ↓
Axios Instance
   ↓
FastAPI API
   ↓
PostgreSQL
```

The frontend never communicates directly with the database.

All requests are routed through FastAPI APIs.

---

## Running the Project

### Backend

Create a virtual environment:

```bash
python -m venv venv
```

Activate:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start server:

```bash
uvicorn --app-dir backend main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

---

### Frontend

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Frontend:

```text
http://127.0.0.1:5173
```

---

## Environment Variables

### Backend

```env
DATABASE_URL=postgresql://username:password@localhost/taskdb

SECRET_KEY=your_secret_key

ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend

```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## Key Learning Outcomes

This project demonstrates:

* FastAPI Development
* PostgreSQL Integration
* SQLAlchemy ORM
* JWT Authentication
* REST API Design
* React Frontend Development
* State Management with Zustand
* Form Handling with React Hook Form
* Frontend–Backend Integration
* Full-Stack Application Architecture

---

## Future Improvements

* Role-Based Access Control (RBAC)
* Task Categories
* File Attachments
* Email Notifications
* Dark Mode
* Activity Logs
* Docker Deployment
* CI/CD Pipeline
* Unit & Integration Testing

---

## Author

Atta Ur Rehman

Built as part of a FastAPI and Full-Stack Development Journey.
