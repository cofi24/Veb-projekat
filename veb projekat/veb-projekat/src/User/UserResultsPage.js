// src/User/UserResultsPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";

const API = "https://localhost:7178";

export default function UserResultsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API}/api/result/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRows(res.data || []);
      } catch (e) {
        setErr(e.response?.data?.title || e.response?.data?.message || "Greška pri učitavanju rezultata.");
      }
    };
    load();
  }, [token]);

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
      <h2>Moji rezultati</h2>
      {err && <p style={{ color: "red" }}>{err}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Kviz</th>
            <th style={th}>Datum</th>
            <th style={th}>Poeni</th>
            <th style={th}>% uspeha</th>
            <th style={th}>Detalji</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            // Backend može vratiti rezultat pod r.id ili r.quizResultId — pokrij oba slučaja
            const resultId = r.quizResultId ?? r.id;
            return (
              <tr key={resultId ?? i}>
                <td style={td}>{r.quizTitle}</td>
                <td style={td}>{r.completedAt ? new Date(r.completedAt).toLocaleString() : "-"}</td>
                <td style={td}>{r.score}/{r.totalQuestions}</td>
                <td style={td}>{r.percentage}%</td>
                <td style={td}>
                  {resultId ? (
                    <Link to={`/results/${resultId}`}>
                      <button>Detalji</button>
                    </Link>
                  ) : (
                    <button disabled title="Nedostaje ID rezultata">Detalji</button>
                  )}
                </td>
              </tr>
            );
          })}
          {!rows.length && (
            <tr><td colSpan={5} style={td}>Nema rezultata.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const th = { textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 };
const td = { borderBottom: "1px solid #f0f0f0", padding: 8 };
