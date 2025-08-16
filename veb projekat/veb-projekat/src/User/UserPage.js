import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = "https://localhost:7178";

export default function UserPage() {
  const { token, logout} = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // debounce jednostavan
  const debouncedSearch = useMemo(() => search, [search]);

  const fetchQuizzes = async () => {
    setLoading(true);
    setErr("");
    try {
      const params = {};
      if (category) params.category = category;
      if (difficulty) params.difficulty = difficulty;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await axios.get(`${API_BASE}/api/quiz/filter`, {
        params,
        headers: { Authorization: `Bearer ${token}` } // ako je ruta AllowAnonymous, može i bez
      });
      setQuizzes(res.data || []);
    } catch (e) {
      const response = e.response?.data;
      if (response) {
        // ovo sprečava React error kad je objekat
        setErr(response.title || response.message || JSON.stringify(response));
      } else {
        setErr("Greška pri učitavanju kvizova.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, difficulty, debouncedSearch]);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
       {/* Header sa logout dugmetom */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Dostupni kvizovi</h2>
       
      </div>
      

      {/* Filteri */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto", gap: 12, margin: "16px 0" }}>
        <input
          placeholder="Kategorija (npr. Istorija)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: 8 }}
        />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ padding: 8 }}>
          <option value="">Sve težine</option>
          <option value="lako">Lako</option>
          <option value="srednje">Srednje</option>
          <option value="tesko">Teško</option>
        </select>
        <input
          placeholder="Pretraga po nazivu/opisu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8 }}
        />
        <button onClick={fetchQuizzes} style={{ padding: "8px 12px" }}>Osveži</button>
      </div>

      {loading && <p>Učitavam…</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      {/* Lista kvizova */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {quizzes.map((q) => (
          <QuizCard key={q.id || q.title + q.category} quiz={q} />
        ))}
        {!loading && quizzes.length === 0 && <p>Nema kvizova za prikazane filtere.</p>}
      </div>
    </div>
  );
}

function QuizCard({ quiz }) {
  const questionCount = quiz.questions?.length ?? 0;
  console.log("Quiz preview:", quiz);
  console.log(quiz.id, quiz.title)

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
      <h3 style={{ margin: "0 0 6px" }}>{quiz.title}</h3>
      <p style={{ margin: "0 0 8px", color: "#555" }}>{quiz.description}</p>
      <div style={{ display: "flex", gap: 10, fontSize: 14, marginBottom: 10 }}>
        <span>📂 {quiz.category}</span>
        <span>🎯 {quiz.difficulty}</span>
        <span>⏱ {quiz.timeLimitSeconds}s</span>
        <span>❓ {questionCount} pitanja</span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        

        <Link to={`/Quiz/${quiz.id}/solve`}>
          <button style={{ padding: "8px 12px", backgroundColor: "#4CAF50", color: "#fff" }}>
            Započni
          </button>
        </Link>
      </div>
    </div>
  );
}

