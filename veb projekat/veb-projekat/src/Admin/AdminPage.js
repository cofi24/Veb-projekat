// src/pages/AdminPage.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://localhost:7178";

/** ============ Pomoćni UI ============ */
function Row({ children, style }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", ...style }}>
      {children}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 10, width: 600, maxWidth: "90%" }}>
        <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}>×</button>
        </Row>
        {children}
      </div>
    </div>
  );
}

/** ============ Forme ============ */
// Forma za meta podatke kviza
function QuizMetaForm({ initial, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty || "");
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(initial?.timeLimitSeconds ?? 60);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ title, description, category, difficulty, timeLimitSeconds: Number(timeLimitSeconds) }); }}>
      <div style={{ display: "grid", gap: 10 }}>
        <label>Naslov
          <input value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: "97%", padding: 8 }} />
        </label>
        <label>Opis
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: "97%", padding: 8 }} />
        </label>
        <Row>
          <label style={{ flex: 1 }}>Kategorija
            <input value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "90%", padding: 8 }} />
          </label>
          <label style={{ flex: 1 }}>Težina
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ width: "97%", padding: 8 }}>
              <option value="">(odaberi)</option>
              <option value="lako">lako</option>
              <option value="srednje">srednje</option>
              <option value="tesko">tesko</option>
            </select>
          </label>
          <label style={{ width: 180 }}>Limit (sek)
            <input type="number" min={10} value={timeLimitSeconds} onChange={(e) => setTimeLimitSeconds(e.target.value)} style={{ width: "90%", padding: 8 }} />
          </label>
        </Row>
      </div>

      <Row style={{ justifyContent: "flex-end", marginTop: 14 }}>
        <button type="button" onClick={onCancel} style={{ padding: "8px 12px" }}>Otkaži</button>
        <button type="submit" style={{ padding: "8px 12px", background: "#4CAF50", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
          Sačuvaj
        </button>
      </Row>
    </form>
  );
}

// Editor pitanja i odgovora
function QuestionsEditor({ quiz, onClose, onSaved }) {
  const typeOptions = ["SingleChoice", "MultipleChoice", "TrueFalse", "Numeric", "FillInTheBlank"];
  const [items, setItems] = useState(() =>
    (quiz?.questions ?? []).map(q => ({
      text: q.text || "",
      type: q.type || "SingleChoice",
      answers: (q.answers ?? []).map(a => ({ text: a.text ?? "", isCorrect: !!a.isCorrect }))
    }))
  );

  const updateQuestion = (idx, patch) => {
    setItems(prev => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const handleTypeChange = (qIdx, newType) => {
    setItems(prev =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        // default set za novi tip
        let answers = q.answers ?? [];
        if (newType === "TrueFalse") {
          answers = [
            { text: "True", isCorrect: true },
            { text: "False", isCorrect: false }
          ];
        } else if (newType === "Numeric") {
          answers = [{ text: "", isCorrect: true }]; // jedini tačan broj
        } else if (newType === "FillInTheBlank") {
          answers = [{ text: "", isCorrect: true }]; // svi uneseni su tačni
        } else if (newType === "SingleChoice") {
          // obezbedi >=2 odgovora i tačno 1 tačan
          answers = answers.length >= 2 ? answers : [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false }
          ];
          // garantuj tačno jedan tačan
          let found = false;
          answers = answers.map(a => {
            if (!found && a.isCorrect) { found = true; return a; }
            return { ...a, isCorrect: false };
          });
          if (!found) answers[0].isCorrect = true;
        } else if (newType === "MultipleChoice") {
          // obezbedi >=2
          answers = answers.length >= 2 ? answers : [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false }
          ];
        }
        return { ...q, type: newType, answers };
      })
    );
  };

  const addQuestion = () => {
    setItems(prev => [...prev, { text: "", type: "SingleChoice", answers: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
    ] }]);
  };

  const removeQuestion = (qIdx) => {
    setItems(prev => prev.filter((_, i) => i !== qIdx));
  };

  const addAnswer = (qIdx) => {
    setItems(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      // Za Numeric i TrueFalse ne dodajemo dodatne odgovore
      if (q.type === "Numeric" || q.type === "TrueFalse") return q;
      const newAns = { text: "", isCorrect: q.type === "MultipleChoice" ? false : false };
      // Kod FillInTheBlank svi su tačni
      if (q.type === "FillInTheBlank") newAns.isCorrect = true;
      return { ...q, answers: [...(q.answers ?? []), newAns] };
    }));
  };

  const removeAnswer = (qIdx, aIdx) => {
    setItems(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      let answers = (q.answers ?? []).filter((_, j) => j !== aIdx);
      // Ograničenja: TrueFalse mora imati 2, Numeric mora imati 1
      if (q.type === "TrueFalse") return q;
      if (q.type === "Numeric") return q;
      return { ...q, answers };
    }));
  };

  const setAnswer = (qIdx, aIdx, patch) => {
    setItems(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      let answers = (q.answers ?? []).map((a, j) => j === aIdx ? { ...a, ...patch } : a);

      // SingleChoice / TrueFalse: osiguraj tačno jedan tačan
      if ((q.type === "SingleChoice" || q.type === "TrueFalse") && "isCorrect" in patch && patch.isCorrect) {
        answers = answers.map((a, j) => ({ ...a, isCorrect: j === aIdx }));
      }

      // Numeric i FillInTheBlank: svi tačni (Numeric 1 tačan)
      if (q.type === "Numeric") {
        answers = answers.map((a, j) => ({ ...a, isCorrect: true }));
      }
      if (q.type === "FillInTheBlank") {
        answers = answers.map((a) => ({ ...a, isCorrect: true }));
      }

      return { ...q, answers };
    }));
  };

  const validate = () => {
    for (const [i, q] of items.entries()) {
      const prefix = `Pitanje #${i + 1}: `;
      if (!q.text?.trim()) return prefix + "unesi tekst pitanja.";
      const answers = q.answers ?? [];

      if (q.type === "TrueFalse") {
        if (answers.length !== 2) return prefix + "True/False mora imati tačno 2 odgovora.";
        const correct = answers.filter(a => a.isCorrect).length;
        if (correct !== 1) return prefix + "True/False mora imati tačno 1 tačan odgovor.";
        if (!answers[0].text || !answers[1].text) {
          // dozvoli custom tekst, ali default True/False je OK
        }
      } else if (q.type === "SingleChoice") {
        if (answers.length < 2) return prefix + "SingleChoice mora imati bar 2 odgovora.";
        const correct = answers.filter(a => a.isCorrect).length;
        if (correct !== 1) return prefix + "SingleChoice mora imati tačno 1 tačan odgovor.";
      } else if (q.type === "MultipleChoice") {
        if (answers.length < 2) return prefix + "MultipleChoice mora imati bar 2 odgovora.";
        const correct = answers.filter(a => a.isCorrect).length;
        if (correct < 1) return prefix + "MultipleChoice mora imati bar 1 tačan odgovor.";
      } else if (q.type === "Numeric") {
        if (answers.length !== 1) return prefix + "Numeric mora imati tačno 1 tačan broj.";
        const val = answers[0].text?.trim();
        if (val === "") return prefix + "unesi tačan broj.";
        if (isNaN(Number(val))) return prefix + "vrednost mora biti broj.";
      } else if (q.type === "FillInTheBlank") {
        if (answers.length < 1) return prefix + "FillInTheBlank mora imati bar 1 tačan odgovor.";
        for (const a of answers) {
          if (!a.text?.trim()) return prefix + "svi prihvaćeni odgovori moraju imati tekst.";
        }
      } else {
        return prefix + "nepoznat tip pitanja.";
      }
    }
    return "";
  };

  const normalizeForSave = (qs) =>
    qs.map(q => {
      let answers = q.answers ?? [];
      if (q.type === "Numeric") {
        // garantuj 1 odgovor i da jeCorrect = true
        answers = [{ text: String(answers[0]?.text ?? ""), isCorrect: true }];
      }
      if (q.type === "FillInTheBlank") {
        // svi uneseni odgovori tretiraju se kao tačni
        answers = answers.map(a => ({ text: a.text ?? "", isCorrect: true }));
      }
      return {
        text: q.text,
        type: q.type,
        answers: answers.map(a => ({ text: a.text ?? "", isCorrect: !!a.isCorrect }))
      };
    });

  const handleSave = () => {
    const err = validate();
    if (err) { alert(err); return; }
    onSaved(normalizeForSave(items));
  };

  return (
    <Modal title={`Uredi pitanja: ${quiz?.title ?? ""}`} onClose={onClose}>
      <div style={{ display: "grid", gap: 12, maxHeight: "70vh", overflow: "auto" }}>
        {items.map((q, qi) => (
          <div key={qi} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Pitanje #{qi + 1}</strong>
              <div style={{ display: "flex", gap: 8 }}>
                {q.type === "TrueFalse" && (
                  <button onClick={() => handleTypeChange(qi, "TrueFalse")} style={{ padding: "6px 10px" }}>
                    Reset TF
                  </button>
                )}
                <button
                  onClick={() => removeQuestion(qi)}
                  style={{ padding: "6px 10px", background: "crimson", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                >
                  Obriši
                </button>
              </div>
            </div>

            <label>Tekst pitanja
              <input
                value={q.text}
                onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                style={{ width: "100%", padding: 8 }}
              />
            </label>

            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
              <label>Tip
                <select
                  value={q.type}
                  onChange={(e) => handleTypeChange(qi, e.target.value)}
                  style={{ padding: 8, marginLeft: 8 }}
                >
                  {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>

              {/* Dodaj odgovor: sakrij za Numeric i TrueFalse */}
              {q.type !== "Numeric" && q.type !== "TrueFalse" && (
                <button onClick={() => addAnswer(qi)} style={{ padding: "6px 10px", marginLeft: "auto" }}>
                  {q.type === "FillInTheBlank" ? "+ Dodaj prihvaćen odgovor" : "+ Dodaj odgovor"}
                </button>
              )}
            </div>

            {/* Lista odgovora */}
            {(q.answers ?? []).map((a, ai) => {
              const baseRowStyle = { display: "flex", gap: 8, alignItems: "center", marginTop: 6 };
              const textInput = (
                <input
                    value={a.text}
                    onChange={(e) => setAnswer(qi, ai, { text: e.target.value })}
                    placeholder={
                      q.type === "Numeric" ? "Tačan broj"
                      : q.type === "FillInTheBlank" ? "Prihvaćen odgovor"
                      : `Odgovor #${ai + 1}`
                    }
                    style={{ flex: 1, padding: 8 }}
                />
              );

              // Kontrole za tačnost po tipu
              let correctnessCtrl = null;
              if (q.type === "SingleChoice" || q.type === "TrueFalse") {
                correctnessCtrl = (
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="radio"
                      name={`q-${qi}-single`}
                      checked={!!a.isCorrect}
                      onChange={() => setAnswer(qi, ai, { isCorrect: true })}
                    />
                    Tačan
                  </label>
                );
              } else if (q.type === "MultipleChoice") {
                correctnessCtrl = (
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={!!a.isCorrect}
                      onChange={(e) => setAnswer(qi, ai, { isCorrect: e.target.checked })}
                    />
                    Tačan
                  </label>
                );
              } // Numeric i FillInTheBlank nemaju kontrolu (implicitno tačni)

              return (
                <div key={ai} style={baseRowStyle}>
                  {textInput}
                  {correctnessCtrl}
                  {/* Uklanjanje odgovora nije dozvoljeno za TF/Numeric */}
                  {q.type !== "TrueFalse" && q.type !== "Numeric" && (
                    <button onClick={() => removeAnswer(qi, ai)} style={{ padding: "6px 10px" }}>
                      Ukloni
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <button onClick={addQuestion} style={{ padding: "8px 12px" }}>+ Dodaj pitanje</button>
          <div>
            <button onClick={onClose} style={{ padding: "8px 12px", marginRight: 8 }}>Otkaži</button>
            <button
              onClick={handleSave}
              style={{ padding: "8px 12px", background: "#4CAF50", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
            >
              Sačuvaj pitanja
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}


/** ============ Admin Page ============ */
export default function AdminPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editQuiz, setEditQuiz] = useState(null); // za meta edit
  const [editQuestionsQuiz, setEditQuestionsQuiz] = useState(null); // za pitanja

  const debouncedSearch = useMemo(() => search, [search]);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchQuizzes = async () => {
    setLoading(true);
    setErr("");
    try {
      const params = {};
      if (category) params.category = category;
      if (difficulty) params.difficulty = difficulty;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await axios.get(`${API_BASE}/api/quiz/filter`, { params, headers: authHeaders });
      setQuizzes(res.data || []);
    } catch (e) {
      const r = e.response?.data;
      setErr(r?.title || r?.message || "Greška pri učitavanju kvizova.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, difficulty, debouncedSearch]);

  /** ============ Handleri ============ */
  const handleCreateQuiz = async (payload) => {
    try {
      await axios.post(`${API_BASE}/api/quiz`, {
        title: payload.title,
        description: payload.description,
        category: payload.category,
        difficulty: payload.difficulty,
        timeLimitSeconds: payload.timeLimitSeconds,
        // možeš odmah i questions poslati ako ti DTO dozvoljava
      }, { headers: authHeaders });

      setShowCreate(false);
      await fetchQuizzes();
      alert("✅ Kviz kreiran.");
    } catch (e) {
      alert(e.response?.data?.message || "Greška pri kreiranju kviza.");
    }
  };

  const handleUpdateQuizMeta = async (quizId, payload) => {
    try {
      await axios.put(`${API_BASE}/api/quiz/${quizId}`, {
        title: payload.title,
        description: payload.description,
        category: payload.category,
        difficulty: payload.difficulty,
        timeLimitSeconds: payload.timeLimitSeconds
      }, { headers: authHeaders });
      setEditQuiz(null);
      await fetchQuizzes();
      alert("✅ Kviz ažuriran.");
    } catch (e) {
      alert(e.response?.data?.message || "Greška pri ažuriranju kviza.");
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Obrisati ceo kviz (sa svim pitanjima i odgovorima)?")) return;
    try {
      await axios.delete(`${API_BASE}/api/quiz/${quizId}`, { headers: authHeaders });
      await fetchQuizzes();
      alert("🗑️ Kviz obrisan.");
    } catch (e) {
      alert(e.response?.data?.message || "Greška pri brisanju kviza.");
    }
  };

  const handleSaveQuestions = async (quizId, questions) => {
  try {
    const q = quizzes.find(x => x.id === quizId); // već ga imaš u listi

    await axios.put(`${API_BASE}/api/quiz/${quizId}/questions`, {
      id: quizId,
      title: q?.title ?? "",                 // ako su Required – obavezno popuni
      description: q?.description ?? "",
      category: q?.category ?? "",
      difficulty: q?.difficulty ?? "",
      timeLimitSeconds: q?.timeLimitSeconds ?? 60,
      questions: questions.map(q => ({
        text: q.text,
        type: q.type,
        answers: (q.answers ?? []).map(a => ({
          text: a.text,
          isCorrect: !!a.isCorrect
        }))
      }))
    }, { headers: authHeaders });

    setEditQuestionsQuiz(null);
    await fetchQuizzes();
    alert("✅ Pitanja sačuvana.");
  } catch (e) {
    const p = e.response?.data;
    alert(p?.title || p?.message || JSON.stringify(p?.errors) || e.message || "Greška pri čuvanju pitanja.");
  }
};

  

  /** ============ Render ============ */
  return (
    <div style={{ maxWidth: 1100, margin: "50px auto", padding: "0 16px" }}>
      {/* Header sa logoutom */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Admin – Upravljanje kvizovima</h2>
       
      </div>

     

      {/* Kontrole */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto auto", gap: 12, margin: "20px 0" }}>
        <input
          placeholder="Kategorija"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: 8 }}
        />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ padding: 8 }}>
          <option value="">Sve težine</option>
          <option value="lako">lako</option>
          <option value="srednje">srednje</option>
          <option value="tesko">tesko</option>
        </select>
        <input
          placeholder="Pretraga po nazivu/opisu…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8 }}
        />
        <button onClick={fetchQuizzes} style={{ padding: "8px 12px" }}>Osveži</button>
        <button onClick={() => setShowCreate(true)} style={{ padding: "8px 12px", background: "#4CAF50", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
          + Novi kviz
        </button>
      </div>

      {loading && <p>Učitavam…</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      {/* Lista kvizova */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {quizzes.map((q) => (
          <div key={q.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
            <h3 style={{ margin: "0 0 6px" }}>{q.title}</h3>
            <p style={{ margin: "0 0 8px", color: "#555" }}>{q.description}</p>
            <div style={{ display: "flex", gap: 10, fontSize: 14, marginBottom: 10, flexWrap: "wrap" }}>
              <span>📂 {q.category}</span>
              <span>🎯 {q.difficulty}</span>
              <span>⏱ {q.timeLimitSeconds}s</span>
              <span>❓ {(q.questions?.length ?? 0)} pitanja</span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => setEditQuiz(q)} style={{ padding: "8px 12px" }}>Uredi kviz</button>
              <button onClick={() => setEditQuestionsQuiz(q)} style={{ padding: "8px 12px" }}>Uredi pitanja</button>
              <button
                onClick={() => handleDeleteQuiz(q.id)}
                style={{ padding: "8px 12px", background: "crimson", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
              >
                Obriši
              </button>
            </div>
          </div>
        ))}
        {!loading && quizzes.length === 0 && <p>Nema kvizova za kriterijume.</p>}
      </div>

      {/* Modal: Kreiranje kviza */}
      {showCreate && (
        <Modal title="Novi kviz" onClose={() => setShowCreate(false)}>
          <QuizMetaForm
            initial={{ timeLimitSeconds: 60 }}
            onCancel={() => setShowCreate(false)}
            onSubmit={handleCreateQuiz}
          />
        </Modal>
      )}

      {/* Modal: Uređivanje meta */}
      {editQuiz && (
        <Modal title={`Uredi kviz: ${editQuiz.title}`} onClose={() => setEditQuiz(null)}>
          <QuizMetaForm
            initial={editQuiz}
            onCancel={() => setEditQuiz(null)}
            onSubmit={(payload) => handleUpdateQuizMeta(editQuiz.id, payload)}
          />
        </Modal>
      )}

      {/* Modal: Uređivanje pitanja */}
      {editQuestionsQuiz && (
        <QuestionsEditor
          quiz={editQuestionsQuiz}
          onClose={() => setEditQuestionsQuiz(null)}
          onSaved={(questions) => handleSaveQuestions(editQuestionsQuiz.id, questions)}
        />
      )}
    </div>
  );
}
