# Bloom Financial Mentor

Bloom is an AI-powered financial mentor tailored for first-time investors looking to simplify their financial goals.

## Project Structure

This project consists of two main parts:
- **`backend/`**: A Python FastAPI server backed by MongoDB and OpenAI.
- **`frontend/`**: A React single-page application built with standard modern tools (Tailwind, Radix UI).

---

## 🚀 How to Run the Project Local

### 1. Backend Setup

The backend runs on Python, typically inside a Virtual Environment (`venv`), and connects to a MongoDB database.

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Activate your virtual environment (assumes `venv` is already created):
   - **Windows**: `venv\Scripts\activate`
   - **Mac/Linux**: `source venv/bin/activate`
3. Ensure you have your environment variables set up in `backend/.env`. (Requires `MONGO_URL` and `OPENAI_API_KEY`).
4. Start the FastAPI server using uvicorn. Note: We use port **8001** because Windows sometimes blocks 8000:
   ```bash
   uvicorn server:app --reload --host 127.0.0.1 --port 8001
   ```
   *The backend will be available at `http://localhost:8001/api/`*

### 2. Frontend Setup

The frontend is a React app. It needs to know where the backend is running.

1. Open another terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Ensure your `frontend/.env` file points to the backend port. It should look like this:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8001
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   *The frontend will automatically open at `http://localhost:3000`*

---

## ☁️ Vercel Deployment

This project is pre-configured for Vercel. Because it is a monorepo, you should deploy the **Frontend** and **Backend** as two separate projects in the Vercel Dashboard.

### 1. Backend Deployment
- **Root Directory**: `backend`
- **Framework Preset**: `Other` (Vercel will detect `vercel.json`).
- **Environment Variables**:
  - `MONGO_URL`: Your MongoDB Atlas string.
  - `DB_NAME`: `bloom_db`
  - `OPENAI_API_KEY`: Your OpenAI key.
  - `JWT_SECRET`: Random string.
  - `CORS_ORIGINS`: Your Vercel frontend URL (or `*`).

### 2. Frontend Deployment
- **Root Directory**: `frontend`
- **Framework Preset**: `Create React App`
- **Environment Variables**:
  - `REACT_APP_BACKEND_URL`: Your Vercel Backend URL (from Step 1).

---

## Troubleshooting

- **Socket Access Permission Error (WinError 10013)**: If starting the backend throws a socket error, it means the requested port (usually 8000) is blocked by another service or Windows reserved ports. Try changing the port to 8001 or 8080 as shown in the launch commands above.
- **Frontend Port 3000 in Use**: If running `npm start` states that port 3000 is occupied, you can either let it run on port 3001, or you can kill the existing process occupying 3000 using `taskkill /PID <ProcessId> /F` (Windows).
- **Yarn not recognized**: Ensure you use `npm start` if `yarn` is not installed globally on your system.
