import axios from 'axios';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post("https://localhost:7178/api/User/login", 
      
      { 
        UsernameOrEmail: usernameOrEmail,
        Password: password 
      },
      { headers: { "Content-Type": "application/json" } }
    );

   
      const token = typeof res.data === "string" ? res.data : res.data?.token;
      if (!token) throw new Error("Token nije primljen.");

      login(token); // AuthContext dekodir
      alert("✅ Uspešna prijava!");
      navigate("/user");
  } catch (err) {

  alert(err.response?.data || "Prijava neuspešna");
  }
};

  return (
  <div style={{ 
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #e5e7eb, #9ca3af)" /* siva pozadina sa blagim prelazom */
  }}>
    <div style={{
      maxWidth: "400px",
      width: "100%",
      background: "#fff",        /* bela kartica */
      padding: "30px",
      borderRadius: "12px",      /* zaobljeni uglovi */
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)" /* senka */
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#111827" }}>Prijava</h2>
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "600", color: "#374151" }}>Korisničko ime:</label><br />
          <input
            type="text"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
            style={{ 
              width: "95%", 
              padding: "10px", 
              border: "1px solid #d1d5db", 
              borderRadius: "8px",
              outline: "none",
              marginTop: "5px"
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ fontWeight: "600", color: "#374151" }}>Lozinka:</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ 
              width: "95%", 
              padding: "10px", 
              border: "1px solid #d1d5db", 
              borderRadius: "8px",
              outline: "none",
              marginTop: "5px"
            }}
          />
        </div>

        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

        <button 
          type="submit" 
          style={{ 
            width: "100%",
            padding: "12px",
            background: "#3b82f6",      /* plava */
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          Prijavi se
        </button>
      </form>
    </div>
  </div>
);

}

export default LoginPage;
