import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useState } from "react";
import "./App.css";
import HomePage from "./Home/HomePage";
import AdminPage from "./Admin/AdminPage";
import UserPage from "./User/UserPage";
import LoginPage from "./Login/LoginPage";
import RegisterPage from "./Register/RegisterPage";
import UserResultsPage from "./User/UserResultsPage";
import LeaderboardPage from "./User/LeaderboardPage";
import QuizSolvePage from "./User/QuizSolvePage";
import QuizResultDetails from "./User/QuizResultDetails";
import ConfirmModal from "./Confirm/ConfirmModal";

import AdminAllQuizResultsPage from "./Admin/AdminAllQuizResultsPage";

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/user" replace />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
  logout();
  setShowLogoutModal(false);
  navigate("/login", { replace: true });

};


  return (
    <div>
      <nav>
        <div className="nav-links">
        <Link to="/">Login</Link>

        {!user && (
          <>
            <Link to="/register">Register</Link>
            
          </>
        )}

        {user?.role === "admin" && (
          <>
            <Link to="/admin">Quiz</Link>
            <Link to="/leaderboard">Rang lista</Link>
            
            <Link to="/admin/results">Rezultati</Link>
            <button
              className="logout-link"
              onClick={() => setShowLogoutModal(true)}
            >
              Logout
            </button>
          </>
        )}

        {user?.role === "user" && (
          <>
            <Link to="/user">Quiz</Link>
            <Link to="/user/results">Moji rezultati</Link>
            <Link to="/leaderboard">Rang lista</Link>
            <button
              className="logout-link"
              onClick={() => setShowLogoutModal(true)}
            >
              Logout
            </button>
          </>
          
        )}
        </div>
      </nav>

      {/* Rute */}
      <Routes>
        
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/user" element={<ProtectedRoute><UserPage /></ProtectedRoute>} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/admin/results" element={<AdminRoute><AdminAllQuizResultsPage/></AdminRoute>} />
        <Route path="/user/results" element={<ProtectedRoute><UserResultsPage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/quiz/:id/solve" element={<ProtectedRoute><QuizSolvePage /></ProtectedRoute>} />
        <Route path="/results/:id" element={<ProtectedRoute><QuizResultDetails /></ProtectedRoute>} />
      </Routes>

      {/* Modal */}
      <ConfirmModal
        open={showLogoutModal}
        title="Potvrda odjave"
        message="Da li ste sigurni da želite da se odjavite?"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
