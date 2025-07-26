import { useState } from "react";


function RegisterPage(){
     const [username, setUsername] = useState("");
  const [image, setImage] = useState(null); // fajl
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();

    // 👇 možeš ovde slati podatke na backend, lokalno čuvati, itd.
    console.log("Registracija:", {
      username,
      email,
      password,
      image: image?.name,
    });

    alert("Uspešna registracija!");
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto" }}>
      <h2>Registracija korisnika</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label>Korisničko ime:</label><br />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          />
        </div>

        <div>
          <label>Email:</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          />
        </div>

        <div>
          <label>Lozinka:</label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          />
        </div>

        <div>
          <label>Profilna slika:</label><br />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            style={{ marginBottom: "10px" }}
          />
        </div>

        <button type="submit" style={{ padding: "10px 20px" }}>
          Registruj se
        </button>
      </form>
    </div>
  );
}


export default RegisterPage;