// src/User/UserResultsPage.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";

const API = "https://localhost:7178";

export default function UserResultsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [selectedResult, setSelectedResult] = useState(null); // Za modal

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API}/api/result/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRows(res.data || []);
      } catch (e) {
        setErr(e.response?.data || "Greška pri učitavanju rezultata.");
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
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={td}>{r.quizTitle}</td>
              <td style={td}>{new Date(r.completedAt).toLocaleString()}</td>
              <td style={td}>{r.score}/{r.totalQuestions}</td>
              <td style={td}>{r.percentage}%</td>
              <td style={td}>
                <button onClick={() => setSelectedResult(r)}>
                  Detalji
                </button>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr><td colSpan={5} style={td}>Nema rezultata.</td></tr>
          )}
        </tbody>
      </table>

      {/* Modal za detalje */}
      {selectedResult && (
  <div style={modalOverlay}>
    <div style={modalContent}>
      <h3>{selectedResult.quizTitle}</h3>
      <p><b>Vreme trajanja:</b> {selectedResult.durationSeconds}s</p>
      <p><b>Poeni:</b> {selectedResult.score}/{selectedResult.totalQuestions} ({selectedResult.percentage}%)</p>

      <h4>Pitanja i odgovori:</h4>
      <ul>
        {selectedResult.questionResults?.map((q, idx) => (
          <li key={idx} style={{ marginBottom: 12 }}>
            <b>{q.text}</b> ({q.type})<br/>

            Odgovor: {
              q.type === "FillInTheBlank"
                ? q.userTextAnswer || "(prazan odgovor)"
                : q.userAnswerIds.length
                  ? q.userAnswerIds.map(id => {
                      const a = q.answers.find(ans => ans.id === id);
                      return a ? a.text : "Nepoznato";
                    }).join(", ")
                  : "(nije odgovorio)"
            } <br/>

            Tačan odgovor: {
              q.type === "FillInTheBlank"
                ? q.answers.map(a => a.text).join(", ")
                : q.answers.filter(a => a.isCorrect).map(a => a.text).join(", ")
            } <br/>

            ✅ {q.isCorrect ? "Tačno" : "Netačno"}
          </li>
        ))}
      </ul>

      <button onClick={() => setSelectedResult(null)} style={{ padding: "6px 12px" }}>
        Zatvori
      </button>
    </div>
  </div>
)}

    </div>
  );
}

const th = { textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 };
const td = { borderBottom: "1px solid #f0f0f0", padding: 8 };

// Stil za modal
const modalOverlay = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalContent = {
  backgroundColor: "#fff",
  padding: 24,
  borderRadius: 8,
  maxWidth: 600,
  width: "90%",
  maxHeight: "80%",
  overflowY: "auto",
};
