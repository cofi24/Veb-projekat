import { useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://localhost:7178";

function RegisterPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [image, setImage] = useState(null); // File | null
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // client-side preview
  const imagePreviewUrl = useMemo(
    () => (image ? URL.createObjectURL(image) : ""),
    [image]
  );

  const validate = () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      return "Sva polja su obavezna (osim slike).";
    }
    if (password.length < 6) {
      return "Lozinka mora imati bar 6 karaktera.";
    }
    // vrlo bazična email provera
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return "Unesite ispravan email.";
    }
    if (image) {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowed.includes(image.type)) {
        return "Dozvoljeni formati slike su: JPEG, PNG, WEBP, GIF.";
      }
      const maxMB = 5;
      if (image.size > maxMB * 1024 * 1024) {
        return `Maksimalna veličina slike je ${maxMB} MB.`;
      }
    }
    return "";
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      // VAŽNO: ključevi moraju da se poklope sa imenima u DTO-u
      formData.append("Username", username);
      formData.append("Email", email);
      formData.append("Password", password);
      if (image) {
        // ime polja: ProfilePicture (IFormFile u DTO)
        formData.append("ProfilePicture", image, image.name);
      }

      await axios.post(`${API_BASE}/api/User/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: false, // ostavi false ako ne koristiš cookie-e
      });

      alert("✅ Uspešna registracija! Prijavite se.");
      navigate("/login");
    } catch (err) {
      // pokušaj iščitavanja poruke sa backend-a
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Registracija neuspešna.";
      setError(
        typeof serverMsg === "string" ? serverMsg : "Registracija neuspešna."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #f3f4f6, #d1d5db)", // siva pozadina
      padding: "20px",
    }}
  >
    <div
      style={{
        maxWidth: "520px",
        width: "100%",
        background: "#fff",
        padding: "30px",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)", // senka
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#111827" }}>
        Registracija korisnika
      </h2>

      <form onSubmit={handleRegister} noValidate>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: "600", color: "#374151" }}>Korisničko ime:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              outline: "none",
              marginTop: "5px",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: "600", color: "#374151" }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              outline: "none",
              marginTop: "5px",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: "600", color: "#374151" }}>Lozinka:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              outline: "none",
              marginTop: "5px",
            }}
          />
          <small style={{ color: "#6b7280" }}>Min. 6 karaktera</small>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: "600", color: "#374151" }}>Profilna slika (opciono):</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            style={{ marginTop: "5px" }}
          />
          {imagePreviewUrl && (
            <div style={{ marginTop: 8 }}>
              <img
                src={imagePreviewUrl}
                alt="Preview"
                style={{
                  maxWidth: "160px",
                  maxHeight: "160px",
                  borderRadius: "8px",
                  display: "block",
                }}
              />
              <small style={{ color: "#6b7280" }}>{image?.name}</small>
            </div>
          )}
        </div>

        {error && (
          <p style={{ color: "red", marginBottom: 16 }}>{String(error)}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "#10b981", // zelena za registraciju
            color: "#fff",
            fontWeight: "600",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {loading ? "Slanje..." : "Registruj se"}
        </button>
      </form>
    </div>
  </div>
);

}

export default RegisterPage;
