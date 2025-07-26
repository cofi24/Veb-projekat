import { useState } from "react";
import { useNavigate } from "react-router-dom";



function LoginPage(){

const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Primer provere (možeš zameniti pravom logikom)
    if (username === "admin" && password === "1234") {
      alert("Uspešna prijava!");
    } else {
      alert("Pogrešno korisničko ime ili lozinka.");
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
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
        <button  onClick={handleLogin} type="submit" style={{ padding: "10px 20px" }}>
          Login
        </button>
      </form>
    </div>
    );
    
}


export default LoginPage;