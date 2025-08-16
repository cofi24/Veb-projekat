import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";

const API_BASE = "https://localhost:7178";

export default function AdminAllQuizResultsPage() {
  const { token } = useAuth();

  const [quizzes, setQuizzes] = useState([]);
  const [quizId, setQuizId] = useState("");       // izabrani kviz
  const [rows, setRows] = useState([]);           // rezultati
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // UI state
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date_desc");  // date_desc | date_asc | score_desc | score_asc | percent_desc | percent_asc

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // Učitaj sve kvizove za dropdown
  useEffect(() => {
    let ignore = false;
    setErr("");

    axios.get(`${API_BASE}/api/quiz`, { headers })
      .then(res => {
        if (ignore) return;
        const list = res.data?.items ?? res.data ?? [];
        setQuizzes(list);
        // automatski izaberi prvi kviz, ili ostavi prazno ako hoćeš da korisnik sam izabere
        if (list.length && !quizId) setQuizId(String(list[0].id ?? list[0].quizId));
      })
      .catch(e => {
        if (ignore) return;
        setErr(e.response?.data?.message || "Greška pri učitavanju kvizova.");
      });

    return () => { ignore = true; };
  }, [headers]); // eslint-disable-line

  // Učitaj rezultate za izabrani kviz
  useEffect(() => {
    if (!quizId) { setRows([]); return; }
    let ignore = false;
    setLoading(true);
    setErr("");

    axios.get(`${API_BASE}/api/quiz/${quizId}/results`, { headers })
      .then(res => {
        if (ignore) return;
        setRows(res.data ?? []);
      })
      .catch(e => {
        if (ignore) return;
        setErr(e.response?.data?.message || "Greška pri učitavanju rezultata.");
      })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [quizId, headers]);

  // Filtriranje i sortiranje u memoriji
  const filtered = useMemo(() => {
    let r = rows;

    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(x => (x.username ?? "").toLowerCase().includes(q));
    }

    const sorted = [...r].sort((a, b) => {
      switch (sort) {
        case "score_desc":   return (b.score ?? 0) - (a.score ?? 0);
        case "score_asc":    return (a.score ?? 0) - (b.score ?? 0);
        case "percent_desc": return (b.percentage ?? 0) - (a.percentage ?? 0);
        case "percent_asc":  return (a.percentage ?? 0) - (b.percentage ?? 0);
        case "date_asc":     return new Date(a.completedAt) - new Date(b.completedAt);
        case "date_desc":
        default:             return new Date(b.completedAt) - new Date(a.completedAt);
      }
    });

    return sorted;
  }, [rows, search, sort]);

  const downloadCsv = () => {
    const header = ["Username", "Score", "TotalQuestions", "Percentage", "CompletedAt"];
    const lines = filtered.map(r => [
      r.username,
      r.score,
      r.totalQuestions,
      r.percentage,
      new Date(r.completedAt).toISOString(),
    ]);
    const csv = [header, ...lines]
      .map(arr => arr.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz_${quizId}_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>Rezultati po kvizu (Admin)</h2>

      {/* Filter traka */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(220px, 1fr) 1fr 1fr auto",
        gap: 10,
        alignItems: "center",
        margin: "12px 0 16px"
      }}>
        {/* Biranje kviza */}
        <select
          value={quizId}
          onChange={e => setQuizId(e.target.value)}
          style={inputBase}
        >
          <option value="">— Izaberi kviz —</option>
          {quizzes.map(q => {
            const id = q.id ?? q.quizId;
            const title = q.title ?? `Kviz ${id}`;
            return <option key={id} value={id}>{title}</option>;
          })}
        </select>

        {/* Pretraga po korisniku */}
        <input
          type="text"
          placeholder="Pretraži korisnika…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={inputBase}
        />

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={inputBase}
        >
          <option value="date_desc">Najnoviji</option>
          <option value="date_asc">Najstariji</option>
          <option value="score_desc">Najviše tačnih</option>
          <option value="score_asc">Najmanje tačnih</option>
          <option value="percent_desc">Najviši %</option>
          <option value="percent_asc">Najniži %</option>
        </select>

        {/* Export */}
        <button onClick={downloadCsv} style={btnPrimary} disabled={!filtered.length}>
          Export CSV
        </button>
      </div>

      {/* Stanja */}
      {!quizId && <div style={{ padding: 8, color: "#6b7280" }}>Izaberi kviz da vidiš rezultate.</div>}
      {quizId && loading && <div style={{ padding: 8 }}>Učitavanje…</div>}
      {quizId && err && <div style={{ padding: 8, color: "red" }}>{err}</div>}

      {/* Tabela */}
      {quizId && !loading && !err && (
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
                    Nema rezultata za izabrani kviz.
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
      )}
    </div>
  );
}

const th = { textAlign: "left", padding: 10, borderBottom: "1px solid #e5e7eb" };
const td = { padding: 10 };
const inputBase = {
  height: 36,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  padding: "0 10px",
  background: "#fff",
};
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
