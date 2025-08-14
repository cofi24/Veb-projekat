import { Routes,Route,Link,Navigate} from "react-router-dom";
import { useAuth } from "./AuthContext";
import './App.css';
import HomePage from "./Home/HomePage";
import AdminPage from "./Admin/AdminPage";
import UserPage from "./User/UserPage";
import LoginPage from "./Login/LoginPage";
import RegisterPage from "./Register/RegisterPage";
import UserResultsPage from "./User/UserResultsPage";
import LeaderboardPage from "./User/LeaderboardPage";
import QuizSolvePage from "./User/QuizSolvePage";
import QuizResultDetails from "./User/QuizResultDetails";


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


function App() {
  return (
    <div>
      {/* Navigacija */}
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "20px" }}>
        <Link to="/">HomePage</Link>
        <Link to="/admin">AdminPage </Link>
        <Link to="/user">User</Link>
        <Link to="/register">Register</Link>
        <Link to="/login">Login</Link>
        <Link to="/user/results">Moji rezultati</Link>
        <Link to="/leaderboard">Rang lista</Link>
        
      </nav>

      {/* Rute */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminRoute><AdminPage/></AdminRoute>}/>
        <Route path="/user" element={<ProtectedRoute><UserPage/></ProtectedRoute>}/>
        <Route path="/register" element={<RegisterPage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/user/results" element={<ProtectedRoute><UserResultsPage/></ProtectedRoute>} />
        <Route path="/leaderboard" element={<LeaderboardPage/>} />
        <Route path="/quiz/:id/solve" element={<ProtectedRoute><QuizSolvePage/></ProtectedRoute>} />
        <Route path="/results/:id"  element={<ProtectedRoute><QuizResultDetails/></ProtectedRoute>}
/>

      </Routes>
    </div>
  );
}

export default App;
