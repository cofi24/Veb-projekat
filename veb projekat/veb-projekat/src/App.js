import { Routes,Route,Link,Navigate} from "react-router-dom";
import { useAuth } from "./AuthContext";
import './App.css';
import HomePage from "./Home/HomePage";
import AdminPage from "./Admin/AdminPage";
import UserPage from "./User/UserPage";
import LoginPage from "./Login/LoginPage";
import RegisterPage from "./Register/RegisterPage";

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
        
      </nav>

      {/* Rute */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminRoute><AdminPage/></AdminRoute>}/>
        <Route path="/user" element={<ProtectedRoute><UserPage/></ProtectedRoute>}/>
        <Route path="/register" element={<RegisterPage/>}/>
        <Route path="/login" element={<LoginPage/>}/>
      </Routes>
    </div>
  );
}

export default App;
