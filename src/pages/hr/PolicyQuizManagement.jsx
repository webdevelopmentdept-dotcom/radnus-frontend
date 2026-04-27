// PolicyQuizManagement.jsx  — HR side
// Drop this alongside PolicyManagement.jsx and import it wherever needed.

import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const EMPTY_QUESTION = () => ({
  question: "",
  options: ["", "", "", ""],
  correct_index: 0,
});

export default function PolicyQuizManagement({ policies = [] }) {
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [quiz, setQuiz] = useState(null);           // existing quiz from DB
  const [questions, setQuestions] = useState([EMPTY_QUESTION()]);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [passScore, setPassScore] = useState(3);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statsPolicy, setStatsPolicy] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [tab, setTab] = useState("questions"); // "questions" | "stats"

  useEffect(() => {
    if (selectedPolicy) fetchQuiz(selectedPolicy._id);
  }, [selectedPolicy]);

  const fetchQuiz = async (policyId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/policy-quiz/policy/${policyId}`);
      const q = res.data;
      setQuiz(q);
      setQuestions(q.questions.map((x) => ({ ...x, options: [...x.options] })));
      setTimerSeconds(q.timer_seconds);
      setPassScore(q.pass_score);
    } catch {
      setQuiz(null);
      setQuestions([EMPTY_QUESTION()]);
      setTimerSeconds(300);
      setPassScore(3);
    }
    setLoading(false);
  };

  const fetchStats = async (policyId) => {
    setStatsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/policy-quiz/stats/${policyId}`);
      setStats(res.data);
    } catch {
      setStats(null);
    }
    setStatsLoading(false);
  };

  const addQuestion = () => {
    if (questions.length >= 15) return alert("Maximum 15 questions allowed");
    setQuestions([...questions, EMPTY_QUESTION()]);
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) return alert("At least 1 question required");
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIdx, optIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = value;
    setQuestions(updated);
  };

  const handleSave = async () => {
    if (!selectedPolicy) return;
    // Basic validation
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) return alert(`Question ${i + 1}: enter question text`);
      for (let j = 0; j < 4; j++) {
        if (!questions[i].options[j].trim())
          return alert(`Question ${i + 1}, Option ${j + 1}: enter option text`);
      }
    }
    if (passScore < 1 || passScore > 5) return alert("Pass score must be between 1 and 5");

    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/policy-quiz`, {
        policy_id: selectedPolicy._id,
        questions,
        timer_seconds: timerSeconds,
        pass_score: passScore,
      });
      alert("✅ Quiz saved successfully!");
      fetchQuiz(selectedPolicy._id);
    } catch (err) {
      alert(err.response?.data?.message || "Save failed");
    }
    setSaving(false);
  };

  const handleDeleteQuiz = async () => {
    if (!selectedPolicy) return;
    if (!window.confirm("Remove quiz for this policy?")) return;
    try {
      await axios.delete(`${API_BASE}/api/policy-quiz/policy/${selectedPolicy._id}`);
      setQuiz(null);
      setQuestions([EMPTY_QUESTION()]);
      alert("Quiz removed");
    } catch {
      alert("Delete failed");
    }
  };

  const openStats = async (policy) => {
    setStatsPolicy(policy);
    setTab("stats");
    await fetchStats(policy._id);
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const S = {
    wrap: { padding: 24, fontFamily: "inherit" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    title: { fontSize: 22, fontWeight: 700, margin: 0 },
    sub: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
    grid: { display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 },
    sidebar: {
      background: "#f8fafc", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: 16, height: "fit-content",
    },
    policyItem: (selected) => ({
      padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 6,
      background: selected ? "#e0e7ff" : "#fff",
      border: `1px solid ${selected ? "#a5b4fc" : "#e2e8f0"}`,
      transition: "all 0.15s",
    }),
    policyName: (selected) => ({
      fontSize: 13, fontWeight: 600,
      color: selected ? "#3730a3" : "#1e293b",
    }),
    policyMeta: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
    main: {
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: 24, minHeight: 400,
    },
    tabs: { display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 12 },
    tab: (active) => ({
      padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
      background: active ? "#4f46e5" : "#f1f5f9",
      color: active ? "#fff" : "#475569", border: "none",
    }),
    qCard: {
      background: "#f8fafc", border: "1px solid #e2e8f0",
      borderRadius: 10, padding: 18, marginBottom: 14,
    },
    qLabel: { fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6, display: "block" },
    input: {
      width: "100%", padding: "8px 12px", borderRadius: 8,
      border: "1px solid #cbd5e1", fontSize: 14,
      boxSizing: "border-box", fontFamily: "inherit",
    },
    optionRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
    optionInput: {
      flex: 1, padding: "7px 11px", borderRadius: 7,
      border: "1px solid #cbd5e1", fontSize: 13,
      fontFamily: "inherit",
    },
    correctRadio: { accentColor: "#4f46e5", width: 16, height: 16, cursor: "pointer" },
    btn: (color) => ({
      background: color, color: "#fff", border: "none",
      borderRadius: 8, padding: "9px 20px",
      cursor: "pointer", fontWeight: 600, fontSize: 13,
    }),
    btnGhost: {
      background: "#e2e8f0", border: "none", borderRadius: 8,
      padding: "9px 20px", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#475569",
    },
    tag: (bg, color) => ({
      background: bg, color, borderRadius: 6,
      padding: "3px 10px", fontSize: 11, fontWeight: 700,
    }),
  };

  const categoryColor = {
    HR: { bg: "#ede9fe", color: "#6d28d9" },
    Finance: { bg: "#fef9c3", color: "#854d0e" },
    IT: { bg: "#dbeafe", color: "#1e40af" },
    General: { bg: "#dcfce7", color: "#166534" },
    Operations: { bg: "#fee2e2", color: "#991b1b" },
  };

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h2 style={S.title}>Policy Quiz Management</h2>
          <p style={S.sub}>Add up to 15 questions per policy. Employees must pass before acknowledging.</p>
        </div>
      </div>

      <div style={S.grid}>
        {/* Sidebar — Policy List */}
        <div style={S.sidebar}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
            Policies ({policies.length})
          </p>
          {policies.length === 0 && (
            <p style={{ fontSize: 13, color: "#94a3b8" }}>No policies found.</p>
          )}
          {policies.map((p) => {
            const c = categoryColor[p.category] || { bg: "#f1f5f9", color: "#475569" };
            const selected = selectedPolicy?._id === p._id;
            return (
              <div
                key={p._id}
                style={S.policyItem(selected)}
                onClick={() => { setSelectedPolicy(p); setTab("questions"); }}
              >
                <div style={S.policyName(selected)}>{p.title}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <span style={S.tag(c.bg, c.color)}>{p.category}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); openStats(p); }}
                    style={{
                      background: "#f1f5f9", border: "none", borderRadius: 6,
                      padding: "1px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600, color: "#475569",
                    }}
                  >
                    Stats
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Panel */}
        <div style={S.main}>
          {!selectedPolicy && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
              <p style={{ fontSize: 15 }}>← Select a policy to manage its quiz</p>
            </div>
          )}

          {selectedPolicy && (
            <>
              {/* Policy header */}
              <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{selectedPolicy.title}</h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
                    {quiz ? `${quiz.questions.length} questions saved` : "No quiz yet"}
                  </p>
                </div>
                {quiz && (
                  <button onClick={handleDeleteQuiz} style={S.btn("#fee2e2")}>
                    <span style={{ color: "#dc2626" }}>🗑 Remove Quiz</span>
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div style={S.tabs}>
                <button style={S.tab(tab === "questions")} onClick={() => setTab("questions")}>
                  📝 Questions
                </button>
                <button
                  style={S.tab(tab === "stats")}
                  onClick={() => { setTab("stats"); fetchStats(selectedPolicy._id); }}
                >
                  📊 Attempt Stats
                </button>
              </div>

              {/* ── Questions Tab ── */}
              {tab === "questions" && (
                <>
                  {loading ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading...</div>
                  ) : (
                    <>
                      {/* Timer & Pass Score */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
                        <div>
                          <label style={S.qLabel}>Timer (seconds)</label>
                          <input
                            type="number" min={30} max={600} value={timerSeconds}
                            onChange={(e) => setTimerSeconds(Number(e.target.value))}
                            style={S.input}
                          />
                          <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>
                            = {Math.floor(timerSeconds / 60)}m {timerSeconds % 60}s
                          </p>
                        </div>
                        <div>
                          <label style={S.qLabel}>Pass Score (out of 5)</label>
                          <input
                            type="number" min={1} max={5} value={passScore}
                            onChange={(e) => setPassScore(Number(e.target.value))}
                            style={S.input}
                          />
                          <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>
                            Employee must get ≥ {passScore} correct
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-end" }}>
                          <span style={{
                            background: "#fef9c3", color: "#854d0e", borderRadius: 8,
                            padding: "8px 12px", fontSize: 12, fontWeight: 600,
                          }}>
                            📌 {questions.length}/15 questions
                          </span>
                        </div>
                      </div>

                      {/* Questions */}
                      {questions.map((q, qIdx) => (
                        <div key={qIdx} style={S.qCard}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5" }}>
                              Q{qIdx + 1}
                            </span>
                            {questions.length > 1 && (
                              <button
                                onClick={() => removeQuestion(qIdx)}
                                style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#dc2626" }}
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <label style={S.qLabel}>Question Text *</label>
                          <textarea
                            value={q.question}
                            onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                            rows={2}
                            placeholder="Enter your question here..."
                            style={{ ...S.input, resize: "vertical", marginBottom: 14 }}
                          />

                          <label style={S.qLabel}>Options — select the correct answer (●)</label>
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} style={S.optionRow}>
                              <input
                                type="radio"
                                name={`correct_${qIdx}`}
                                checked={q.correct_index === optIdx}
                                onChange={() => updateQuestion(qIdx, "correct_index", optIdx)}
                                style={S.correctRadio}
                                title="Mark as correct"
                              />
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", minWidth: 20 }}>
                                {["A", "B", "C", "D"][optIdx]}
                              </span>
                              <input
                                value={opt}
                                onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                placeholder={`Option ${["A", "B", "C", "D"][optIdx]}`}
                                style={{
                                  ...S.optionInput,
                                  background: q.correct_index === optIdx ? "#f0fdf4" : "#fff",
                                  borderColor: q.correct_index === optIdx ? "#86efac" : "#cbd5e1",
                                }}
                              />
                              {q.correct_index === optIdx && (
                                <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, whiteSpace: "nowrap" }}>✓ Correct</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                        <button onClick={addQuestion} style={S.btnGhost}>
                          + Add Question {questions.length >= 15 ? "(max)" : ""}
                        </button>
                        <button onClick={handleSave} disabled={saving} style={S.btn(saving ? "#94a3b8" : "#4f46e5")}>
                          {saving ? "Saving..." : quiz ? "💾 Update Quiz" : "💾 Save Quiz"}
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── Stats Tab ── */}
              {tab === "stats" && (
                <>
                  {statsLoading && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading stats...</div>}
                  {!statsLoading && !stats && <div style={{ color: "#94a3b8", padding: 20 }}>No attempt data.</div>}
                  {!statsLoading && stats && (
                    <>
                      {/* Summary */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                        {[
                          { label: "Total Attempts", value: stats.total, bg: "#dbeafe", color: "#1e40af" },
                          { label: "Passed", value: stats.passed, bg: "#dcfce7", color: "#166534" },
                          { label: "Failed", value: stats.failed, bg: "#fee2e2", color: "#991b1b" },
                        ].map((s) => (
                          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "14px 16px" }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: s.color, margin: 0, textTransform: "uppercase" }}>{s.label}</p>
                            <h3 style={{ margin: "4px 0 0", color: s.color, fontSize: 28 }}>{s.value}</h3>
                          </div>
                        ))}
                      </div>

                      {/* Attempts Table */}
                      {stats.attempts.length === 0 ? (
                        <p style={{ color: "#94a3b8", fontSize: 14 }}>No attempts yet.</p>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: "#f1f5f9" }}>
                                {["Employee", "Score", "Status", "Time Taken", "Date"].map((h) => (
                                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {stats.attempts.map((a, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                  <td style={{ padding: "10px 12px" }}>
                                    <div style={{ fontWeight: 600 }}>{a.employee_id?.name || "—"}</div>
                                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{a.employee_id?.email || ""}</div>
                                  </td>
                                  <td style={{ padding: "10px 12px" }}>
                                    <span style={{
                                      background: a.passed ? "#dcfce7" : "#fee2e2",
                                      color: a.passed ? "#166534" : "#991b1b",
                                      borderRadius: 6, padding: "2px 10px", fontWeight: 700, fontSize: 12,
                                    }}>
                                      {a.score}/{a.questions_served?.length || 5}
                                    </span>
                                  </td>
                                  <td style={{ padding: "10px 12px" }}>
                                    <span style={{
                                      background: a.passed ? "#dcfce7" : "#fee2e2",
                                      color: a.passed ? "#166534" : "#991b1b",
                                      borderRadius: 6, padding: "2px 10px", fontWeight: 700, fontSize: 11,
                                    }}>
                                      {a.passed ? "✓ Passed" : "✗ Failed"}
                                    </span>
                                  </td>
                                  <td style={{ padding: "10px 12px", color: "#64748b" }}>
                                    {a.time_taken_seconds}s
                                  </td>
                                  <td style={{ padding: "10px 12px", color: "#94a3b8" }}>
                                    {new Date(a.createdAt).toLocaleDateString("en-IN")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}