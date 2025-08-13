// src/Leaderboard/LeaderboardPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";

const API = "https://localhost:7178";

export default function LeaderboardPage() {
  const { token, user } = useAuth();
  const [quizId, setQuizId] = useState("");
  const [period, setPeriod] = useState(""); // "", "daily", "monthly"
  const [entries, setEntries] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [err, setErr] = useState("");

  // učitaj kvizove za dropdown
  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const res = await axios.get(`${API}/api/quiz`, {
          // AllowAnonymous u tvom kontroleru – može i bez tokena
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuizzes(res.data || []);
      } catch (e) {
        // ignore ili setErr
      }
    };
    loadQuizzes();
  }, [token]);

  // učitaj rang listu
  useEffect(() => {
    const load = async () => {
      setErr("");
      try {
        const params = {};
        if (quizId) params.quizId = quizId;
        if (period) params.period = period;

        const res = await axios.get(`${API}/api/Quiz/leaderboard`, {
          params,
          // ako si ostavio AllowAnonymous, može i bez hedera
          headers: { Authorization: `Bearer ${token}` }
        });
        setEntries(res.data || []);
      } catch (e) {
        setErr(e.response?.data || "Greška pri učitavanju rang liste.");
      }
    };
    load();
  }, [quizId, period, token]);

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
      <h2>Globalna rang lista</h2>

      {/* filteri */}
      <div style={{ display: "flex", gap: 12, margin: "16px 0" }}>
        <select value={quizId} onChange={(e) => setQuizId(e.target.value)} style={{ padding: 8 }}>
          <option value="">Svi kvizovi</option>
          {quizzes.map(q => (
            <option key={q.id} value={q.id}>{q.title}</option>
          ))}
        </select>

        <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: 8 }}>
          <option value="">Svi periodi</option>
          <option value="daily">Dnevno</option>
          <option value="monthly">Mesečno</option>
        </select>
      </div>

      {err && <p style={{ color: "red" }}>{err}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Poz.</th>
            <th style={th}>Korisnik</th>
            <th style={th}>Ukupno bodova</th>
            <th style={th}>Akcija</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={e.username + i} style={user?.username === e.username ? { background: "#f6fff3" } : {}}>
              <td style={td}>{i + 1}</td>
              <td style={td}>{e.username}</td>
              <td style={td}>{e.totalScore}</td>
              <td style={td}>
                {/* ako je filtrirano po jednom kvizu, ponudimo Start dugme */}
                {quizId ? (
                  <Link to={`/quiz/${quizId}/solve`}>
                    <button>Start</button>
                  </Link>
                ) : (
                  <span style={{ color: "#888" }}>Odaberi kviz da startuješ</span>
                )}
              </td>
            </tr>
          ))}
          {!entries.length && (
            <tr><td colSpan={4} style={td}>Nema rezultata.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const th = { textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 };
const td = { borderBottom: "1px solid #f0f0f0", padding: 8 };
