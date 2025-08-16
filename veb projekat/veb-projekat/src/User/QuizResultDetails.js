// src/User/QuizResultDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../AuthContext";

const API = "https://localhost:7178";

export default function QuizResultDetails() {
  const { id } = useParams();            // resultId u ruti: /results/:id
  const navigate = useNavigate();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [progress, setProgress] = useState([]); // {completedAt, score, totalQuestions}[]
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const load = async () => {
      try {
        const url = `${API}/api/quiz/${id}/details`; // očekuješ detalje za konkretan rezultat
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (typeof res.data === "string" && res.data.startsWith("<!DOCTYPE")) {
          throw new Error("Server vratio HTML (pogrešna ruta ili redirect).");
        }
        setData(res.data);

        // 1) Ako backend već vraća istoriju pokušaja u detaljima
        const attemptsFromDetails = res.data?.attempts || res.data?.previousAttempts;
        if (Array.isArray(attemptsFromDetails) && attemptsFromDetails.length) {
          setProgress(attemptsFromDetails);
          return;
        }

        // 2) Pokušaj da dohvatiš istoriju putem drugog endpointa ako imamo quizId
        const quizId =
          res.data?.quizId ??
          res.data?.quiz?.id ??
          res.data?.quizID ??
          null;

        if (quizId) {
          // prilagodi ime rute ako koristiš drugačije: npr. /api/quiz/{quizId}/my-attempts
          const hist = await axios.get(`${API}/api/quiz/${quizId}/my-attempts`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProgress(Array.isArray(hist.data) ? hist.data : []);
        }
      } catch (e) {
        const d = e.response?.data;
        const msg =
          (typeof d === "string" && d) ||
          d?.title || d?.message ||
          (e.response?.status ? `HTTP ${e.response.status}` : e.message) ||
          "Greška.";
        setErr(msg);

        if (e.response?.status === 401 || e.response?.status === 403) {
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, token, navigate]);

  const chartPoints = useMemo(() => {
    if (!Array.isArray(progress)) return [];
    // normalizuj i sortiraj po datumu
    const norm = progress
      .map(p => {
        const total = p.totalQuestions ?? p.total ?? 0;
        const score = p.score ?? p.correct ?? 0;
        const when = p.completedAt ?? p.achievedAt ?? p.when ?? null;
        const ms = typeof when === "number" ? (when < 1e12 ? when * 1000 : when) : Date.parse(when);
        return {
          pct: total > 0 ? Math.round((score / total) * 100) : 0,
          whenMs: Number.isNaN(ms) ? null : ms,
          whenRaw: when
        };
      })
      .filter(p => p.whenMs !== null)
      .sort((a, b) => a.whenMs - b.whenMs);

    return norm;
  }, [progress]);

  if (loading) return <div>Učitavanje…</div>;
  if (err) return <div style={{ color: "red" }}>{err}</div>;
  if (!data) return <div>Nema podataka.</div>;

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
      <h2>{data.quizTitle}</h2>
      <p><b>Poeni:</b> {data.score}/{data.totalQuestions}</p>
      <p><b>Trajanje:</b> {Math.round(data.durationSeconds)}s</p>
      <p><b>Završeno:</b> {new Date(data.completedAt).toLocaleString()}</p>

      {/* GRAFIKON NAPRETKA */}
      {chartPoints.length > 1 && (
        <>
          <h3>Napredak kroz pokušaje</h3>
          <ProgressChart points={chartPoints} />
        </>
      )}

      <h3>Odgovori</h3>
      {data.answers?.map((a, i) => (
        <div
          key={i}
          style={{
            border: "1px solid #eee",
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
            background: a.isCorrect ? "#eaffea" : "#ffeaea"
          }}
        >
          <div><b>Pitanje {i + 1}:</b> {a.questionText}</div>
          {a.freeTextAnswer && <div><i>Tvoj odgovor:</i> {a.freeTextAnswer}</div>}
          {!!a.userSelectedAnswers?.length && (
            <div><i>Tvoj izbor:</i> {a.userSelectedAnswers.join(", ")}</div>
          )}
          <div><i>Tačno:</i> {a.correctAnswers?.join(", ")}</div>
          <div><b>{a.isCorrect ? "✅ Tačno" : "❌ Netačno"}</b></div>
        </div>
      ))}
    </div>
  );
}

/** Jednostavan linijski graf preko SVG-a. Očekuje points: [{ pct (0-100), whenMs, whenRaw }] */
function ProgressChart({ points }) {
  const width = 780;
  const height = 220;
  const pad = { left: 42, right: 12, top: 16, bottom: 28 };

  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const xs = points.map(p => p.whenMs);
  const ys = points.map(p => p.pct);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = 0;   // procenat
  const maxY = 100;

  const xScale = (v) =>
    pad.left + (innerW * (v - minX)) / Math.max(1, (maxX - minX));
  const yScale = (v) =>
    pad.top + innerH - (innerH * (v - minY)) / Math.max(1, (maxY - minY));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.whenMs)} ${yScale(p.pct)}`)
    .join(" ");

  // x-oznake (prvi, srednji, poslednji)
  const tickIdx = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  const ticks = tickIdx.filter(i => i >= 0).map(i => points[i]);

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginBottom: 16 }}>
      <svg width={width} height={height} role="img" aria-label="Grafikon napretka">
        {/* ose */}
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + innerH} stroke="#e5e7eb" />
        <line x1={pad.left} y1={pad.top + innerH} x2={pad.left + innerW} y2={pad.top + innerH} stroke="#e5e7eb" />

        {/* horizontalne grid linije za 0/50/100% */}
        {[0, 50, 100].map(v => (
          <g key={v}>
            <line
              x1={pad.left}
              y1={yScale(v)}
              x2={pad.left + innerW}
              y2={yScale(v)}
              stroke="#f1f5f9"
            />
            <text x={8} y={yScale(v) + 4} fontSize="11" fill="#64748b">{v}%</text>
          </g>
        ))}

        {/* linija */}
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" />

        {/* tačke */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={xScale(p.whenMs)} cy={yScale(p.pct)} r="3.5" fill="#1d4ed8" />
            <title>{`${new Date(p.whenMs).toLocaleString()} • ${p.pct}%`}</title>
          </g>
        ))}

        {/* x ticks */}
        {ticks.map((t, idx) => (
          <text
            key={idx}
            x={xScale(t.whenMs)}
            y={pad.top + innerH + 18}
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
          >
            {new Date(t.whenMs).toLocaleDateString()}
          </text>
        ))}
      </svg>

      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
        Graf prikazuje procenat tačnih odgovora po pokušaju (raniji → kasniji).
      </div>
    </div>
  );
}
