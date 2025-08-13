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
    <div style={{ maxWidth: "400px", margin: "50px auto" }}>
      <h2>Prijava</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "10px" }}>
          <label>Korisničko ime:</label><br />
          <input
            type="text"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Lozinka:</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ padding: "10px 20px" }}>
          Prijavi se
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
