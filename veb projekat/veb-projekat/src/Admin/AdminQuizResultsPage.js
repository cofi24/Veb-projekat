import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../AuthContext";

const API_BASE = "https://localhost:7178";

export default function AdminQuizResultsPage() {
  const { id } = useParams(); // quizId iz URL-a
  const { token } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // UI state
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date_desc"); // date_desc | date_asc | score_desc | score_asc | percent_desc | percent_asc

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setErr("");

    axios
      .get(`${API_BASE}/api/quiz/${id}/results`, { headers })
      .then((res) => {
        if (ignore) return;
        setRows(res.data ?? []);
      })
      .catch((e) => {
        if (ignore) return;
        setErr(e.response?.data?.message || "Greška pri učitavanju rezultata.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, headers]);

  const filtered = useMemo(() => {
    let r = rows;

    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) => x.username?.toLowerCase().includes(q));
    }

    const sorted = [...r].sort((a, b) => {
      switch (sort) {
        case "score_desc": return (b.score ?? 0) - (a.score ?? 0);
        case "score_asc":  return (a.score ?? 0) - (b.score ?? 0);
        case "percent_desc": return (b.percentage ?? 0) - (a.percentage ?? 0);
        case "percent_asc":  return (a.percentage ?? 0) - (b.percentage ?? 0);
        case "date_asc":   return new Date(a.completedAt) - new Date(b.completedAt);
        case "date_desc":
        default:           return new Date(b.completedAt) - new Date(a.completedAt);
      }
    });

    return sorted;
  }, [rows, search, sort]);

  const downloadCsv = () => {
    const header = ["Username", "Score", "TotalQuestions", "Percentage", "CompletedAt"];
    const lines = filtered.map((r) => [
      r.username,
      r.score,
      r.totalQuestions,
      r.percentage,
      new Date(r.completedAt).toISOString(),
    ]);
    const csv =
      [header, ...lines]
        .map((arr) => arr.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz_${id}_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: 20 }}>Učitavanje…</div>;
  if (err)      return <div style={{ padding: 20, color: "red" }}>{err}</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Rezultati kviza #{id}</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            placeholder="Pretraži korisnika…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ height: 36, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 8px" }}
          >
            <option value="date_desc">Najnoviji</option>
            <option value="date_asc">Najstariji</option>
            <option value="score_desc">Najviše tačnih</option>
            <option value="score_asc">Najmanje tačnih</option>
            <option value="percent_desc">Najviši %</option>
            <option value="percent_asc">Najniži %</option>
          </select>
          <button onClick={downloadCsv} style={btnPrimary}>Export CSV</button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={th}>#</th>
              <th style={th}>Korisnik</th>
              <th style={th}>Tačnih</th>
              <th style={th}>Ukupno</th>
              <th style={th}>%</th>
              <th style={th}>Završeno</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 16 }}>
                  Nema rezultata za ovaj kviz.
                </td>
              </tr>
            ) : (
              filtered.map((r, i) => (
                <tr key={`${r.username}-${r.completedAt}-${i}`} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={td}>{i + 1}</td>
                  <td style={td}>{r.username}</td>
                  <td style={td}>{r.score}</td>
                  <td style={td}>{r.totalQuestions}</td>
                  <td style={td}>{r.percentage}%</td>
                  <td style={td}>{new Date(r.completedAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      
    </div>
  );
}

const th = { textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" };
const td = { padding: 10 };
const btnPrimary = {
  height: 36,
  padding: "0 12px",
  borderRadius: 8,
  border: "none",
  background: "#3b82f6",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};
