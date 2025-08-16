import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../AuthContext";

const API = "https://localhost:7178";

export default function QuizSolvePage() {
  const { id } = useParams();                // quizId iz rute
  const { token } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);    // QuizDetailDTO (sa pitanjima i odgovorima)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // stanje odgovora: { [questionId]: Set<answerId> } + posebna mapa za fill-in tekst
  const [answers, setAnswers] = useState({});
  const [blanks, setBlanks] = useState({});  // { [questionId]: "neki tekst" }

  // tajmer
  const [secondsLeft, setSecondsLeft] = useState(null);
  const startedAtRef = useRef(new Date().toISOString()); // treba backendu

  const loadQuiz = async () => {
    try {
      const res = await axios.get(`${API}/api/Quiz/${id}`);
      setQuiz(res.data);
      console.log("Loaded quiz:", res.data);  // Proveri šta tačno sadrži kviz
      setSecondsLeft(res.data.timeLimitSeconds ?? 0);
      const initial = {};
      res.data.questions.forEach(q => initial[q.id] = new Set());
      setAnswers(initial);
    } catch (e) {
      setErr(e.response?.data || "Greška pri učitavanju kviza.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadQuiz();  // Učitaj kviz samo ako postoji id
    }
  }, [id]);  // Zavisi od id-a, tako da se ponovo učitava ako se id menja

  useEffect(() => {
    if (quiz && quiz.questions) {
      quiz.questions.forEach((q, idx) => {
      console.log("Question:", q);  // Proveri kako izgleda pitanje
    });// Loguj pitanja
    }
  }, [quiz]);  // Kada se quiz učita, proveri pitanja

  // Odbrojavanje
  useEffect(() => {
    if (secondsLeft === null || !quiz || !quiz.questions) return;  // Proveri da li je kviz učitan

    if (secondsLeft <= 0) { 
      handleSubmit(true);
      return;
    }

    const t = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft, quiz]);  // Zavisi od secondsLeft i quiz

  // helper: priprema payload-a
  const buildSubmission = () => ({
    startedAt: startedAtRef.current,
    answers: quiz.questions.map(q => {
      console.log("Question ID:", q.id);  // Proveri da li je ID prisutan

      if (q.type === "FillInTheBlank") {
        return {
          questionId: q.id,  // Dodaj questionId
          selectedAnswerIds: [],  // Nema selektovanih odgovora
          freeText: (blanks[q.id] || "").trim()  // Slobodni tekst za FillInTheBlank
        };
      }
      return {
        questionId: q.id,  // Dodaj questionId
        selectedAnswerIds: Array.from(answers[q.id] ?? [])  // Lista izabranih odgovora
      };
    })
  });

  const onChooseSingle = (qid, aid) => {
    setAnswers(prev => ({ ...prev, [qid]: new Set([aid]) }));
  };

  const onToggleMulti = (qid, aid) => {
    setAnswers(prev => {
      const next = new Set(prev[qid] ?? []);
      next.has(aid) ? next.delete(aid) : next.add(aid);
      return { ...prev, [qid]: next };
    });
  };

  const onBlankChange = (qid, val) => {
    setBlanks(prev => ({ ...prev, [qid]: val }));
  };

  const handleSubmit = async (auto = false) => {
    if (!id || !quiz || !quiz.questions) {
      alert("Podaci o kvizu nisu učitani.");
      return;
    }

    // Validacija: proveri da li su svi odgovori popunjeni
    const isValid = quiz.questions.every(q => {
      if (q.type === 'FillInTheBlank') {
        return blanks[q.id]?.trim() !== '';  // Proveri da li je slobodni tekst popunjen
      }
      return answers[q.id]?.size > 0;  // Proveri da li je odabrano odgovarajuće pitanje
    });

    if (!isValid) {
      alert("Morate odgovoriti na sva pitanja!");
      return;
    }

    const submission = buildSubmission();
    console.log("Submitting quiz:", submission);  // Proveri šta šalješ

    try {
      const res = await axios.post(
        `https://localhost:7178/api/Quiz/${id}/solve`,
        submission,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const r = res.data;
      alert(`${auto ? "⏳ Vreme isteklo.\n" : ""}Rezultat: ${r.score}/${r.totalQuestions} (${r.percentage}%)`);
      navigate("/user");
    } catch (e) {
      console.error("SUBMIT ERROR:", e.response?.data || e.message);
      alert(e.response?.data || "Greška pri slanju odgovora.");
    }
  };

  const mmss = useMemo(() => {
    const s = Math.max(0, secondsLeft ?? 0);
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  }, [secondsLeft]);

  if (loading) return <div style={{ padding: 20 }}>Učitavam…</div>;
  if (err) return <div style={{ color: "red", padding: 20 }}>{err}</div>;
  if (!quiz || !quiz.questions) return <div>Greška: Kviz nije učitan</div>;

  return (
    <div style={{ maxWidth: 900, margin: "50px auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>{quiz.title}</h2>
          <div style={{ color: "#666" }}>{quiz.description}</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 600 }}>⏱ {mmss}</div>
      </header>

      <ol style={{ paddingLeft: 18 }}>
        {quiz.questions.map((q) => (
          <li key={q.id} style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              {q.text} <span style={{ color: "#888", fontWeight: 400 }}>({q.type})</span>
            </div>

            {/* TrueFalse => tretiramo kao SingleChoice sa 2 odgovora */}
            {q.type === "SingleChoice" || q.type === "TrueFalse" ? (
              <div style={{ display: "grid", gap: 6 }}>
                {q.answers.map(a => (
                  <label key={`${q.id}_${a.id}`}>
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      checked={!!answers[q.id]?.has(a.id)}
                      onChange={() => onChooseSingle(q.id, a.id)}  // ← PROSLEDI a.id
                    />
                    {a.text}
                  </label>
                ))}
              </div>
            ) : null}

            {q.type === "MultipleChoice" ? (
              <div style={{ display: "grid", gap: 6 }}>
                {q.answers.map(a => (
                  <label key={`${q.id}_${a.id}`}>
                    <input
                      type="checkbox"
                      checked={!!answers[q.id]?.has(a.id)}
                      onChange={() => onToggleMulti(q.id, a.id)}    // ← PROSLEDI a.id
                    />
                    {a.text}
                  </label>
                ))}
              </div>
            ) : null}

            {q.type === "FillInTheBlank" ? (
              <input
                type="text"
                value={blanks[q.id] || ""}
                onChange={(e) => onBlankChange(q.id, e.target.value)}
              />
            ) : null}
          </li>
        ))}
      </ol>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => handleSubmit(false)} style={{ padding: "10px 16px" }}>
          Završi
        </button>
      </div>
    </div>
  );
}
