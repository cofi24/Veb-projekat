// src/User/QuizResultDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../AuthContext";

const API = "https://localhost:7178";

export default function QuizResultDetails() {
  const { id } = useParams();            // :id iz rute
  const navigate = useNavigate();
  const { token } = useAuth();           // 👈 uzmi token iz AuthContext-a

  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // nema tokena? idi na login
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const load = async () => {
      try {
        const url = `${API}/api/quiz/${id}/details`; // po tvojoj Opciji B
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` } // 👈 ovde ide JWT
        });
        // osiguraj da nije HTML
        if (typeof res.data === "string" && res.data.startsWith("<!DOCTYPE")) {
          throw new Error("Server vratio HTML (pogrešna ruta ili redirect).");
        }
        setData(res.data);
      } catch (e) {
        const d = e.response?.data;
        const msg =
          (typeof d === "string" && d) ||
          d?.title || d?.message ||
          (e.response?.status ? `HTTP ${e.response.status}` : e.message) ||
          "Greška.";
        setErr(msg);

        // 401/403 → login
        if (e.response?.status === 401 || e.response?.status === 403) {
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, token, navigate]);

  if (loading) return <div>Učitavanje…</div>;
  if (err) return <div style={{ color: "red" }}>{err}</div>;
  if (!data) return <div>Nema podataka.</div>;

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
      <h2>{data.quizTitle}</h2>
      <p><b>Poeni:</b> {data.score}/{data.totalQuestions}</p>
      <p><b>Trajanje:</b> {Math.round(data.durationSeconds)}s</p>
      <p><b>Završeno:</b> {new Date(data.completedAt).toLocaleString()}</p>

      <h3>Odgovori</h3>
      {data.answers?.map((a, i) => (
        <div key={i} style={{border:"1px solid #eee", borderRadius:8, padding:12, marginBottom:8, background:a.isCorrect?"#eaffea":"#ffeaea"}}>
          <div><b>Pitanje {i+1}:</b> {a.questionText}</div>
          {a.freeTextAnswer && <div><i>Tvoj odgovor:</i> {a.freeTextAnswer}</div>}
          {a.userSelectedAnswers?.length > 0 && <div><i>Tvoj izbor:</i> {a.userSelectedAnswers.join(", ")}</div>}
          <div><i>Tačno:</i> {a.correctAnswers?.join(", ")}</div>
          <div><b>{a.isCorrect ? "✅ Tačno" : "❌ Netačno"}</b></div>
        </div>
      ))}
    </div>
  );
}
