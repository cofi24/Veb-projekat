// src/Leaderboard/LeaderboardPage.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";

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
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuizzes(res.data || []);
      } catch {
        // ignoriši ili setErr
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
          headers: { Authorization: `Bearer ${token}` }
        });
        setEntries(res.data || []);
      } catch (e) {
        setErr(e.response?.data || "Greška pri učitavanju rang liste.");
      }
    };
    load();
  }, [quizId, period, token]);

  // helper za formatiranje datuma (radi sa ISO stringom ili timestampom)
  const formatWhen = (v) => {
    if (!v) return "-";
    const ms = typeof v === "number" ? (v < 1e12 ? v * 1000 : v) : Date.parse(v);
    if (Number.isNaN(ms)) return "-";
    return new Date(ms).toLocaleString();
  };

  // sortiraj: prvo totalScore desc, pa vrijeme asc (ranije je bolje)
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const scoreDiff = (b.totalScore ?? 0) - (a.totalScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      const ta = a.achievedAt ?? a.completedAt ?? null;
      const tb = b.achievedAt ?? b.completedAt ?? null;
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      const da = typeof ta === "number" ? (ta < 1e12 ? ta * 1000 : ta) : Date.parse(ta);
      const db = typeof tb === "number" ? (tb < 1e12 ? tb * 1000 : tb) : Date.parse(tb);
      return da - db;
    });
  }, [entries]);

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
      <h2>Globalna rang lista</h2>

      {/* filteri */}
      <div style={{ display: "flex", gap: 12, margin: "16px 0", flexWrap: "wrap" }}>
        <select value={quizId} onChange={(e) => setQuizId(e.target.value)} style={{ padding: 8 }}>
          <option value="">Svi kvizovi</option>
          {quizzes.map((q) => (
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
            <th style={th}>Pozicija</th>
            <th style={th}>Korisnik</th>
            <th style={th}>Ukupno bodova</th>
            <th style={th}>Vrijeme postizanja</th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map((e, i) => {
            const when = e.achievedAt ?? e.completedAt; // backend polje
            return (
              <tr
                key={e.username + i}
                style={user?.username === e.username ? { background: "#f6fff3" } : {}}
              >
                <td style={td}>{i + 1}</td>
                <td style={td}>{e.username}</td>
                <td style={td}>{e.totalScore}</td>
                <td style={td} title={String(when ?? "")}>{formatWhen(when)}</td>
              </tr>
            );
          })}
          {!sortedEntries.length && (
            <tr><td colSpan={4} style={td}>Nema rezultata.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const th = { textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 };
const td = { borderBottom: "1px solid #f0f0f0", padding: 8 };
