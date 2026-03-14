import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { Sprout, Loader2 } from "lucide-react";
import AuthPage from "@/pages/AuthPage";
import QuizPage from "@/pages/QuizPage";
import DashboardPage from "@/pages/DashboardPage";
import ChatPage from "@/pages/ChatPage";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const api = axios.create({ baseURL: `${BACKEND_URL}/api` });

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("bloom_token"));
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/user/profile");
      setUser(res.data.user);
      setQuizData(res.data.quiz);
    } catch {
      localStorage.removeItem("bloom_token");
      setToken(null);
      setUser(null);
      setQuizData(null);
      delete api.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token, fetchProfile]);

  const handleLogin = useCallback((newToken, userData) => {
    localStorage.setItem("bloom_token", newToken);
    setToken(newToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    setUser(userData);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("bloom_token");
    setToken(null);
    setUser(null);
    setQuizData(null);
    delete api.defaults.headers.common["Authorization"];
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
          <span className="text-lg font-nunito font-bold text-stone-500">Loading Bloom...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, token, login: handleLogin, logout: handleLogout, quizData, setQuizData, fetchProfile }}>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={!user ? <AuthPage /> : (user.quiz_completed ? <Navigate to="/dashboard" /> : <Navigate to="/quiz" />)} />
          <Route path="/quiz" element={user ? <QuizPage /> : <Navigate to="/" />} />
          <Route path="/dashboard" element={user ? (user.quiz_completed ? <DashboardPage /> : <Navigate to="/quiz" />) : <Navigate to="/" />} />
          <Route path="/chat" element={user ? (user.quiz_completed ? <ChatPage /> : <Navigate to="/quiz" />) : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
