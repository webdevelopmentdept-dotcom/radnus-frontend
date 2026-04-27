// PolicyQuizModal.jsx — Employee side
// Usage: <PolicyQuizModal policy={p} employeeId={employeeId} onPass={() => markAcknowledged(p._id)} onClose={() => setQuizPolicy(null)} />

import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function PolicyQuizModal({ policy, employeeId, onPass, onClose }) {
  const [phase, setPhase] = useState("loading"); // loading | intro | quiz | result | no_quiz
  const [quizMeta, setQuizMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]); // array of answer_index or null
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    loadQuiz();
    return () => clearInterval(timerRef.current);
  }, []);

  const loadQuiz = async () => {
    try {
      // Check if already passed
      const chk = await axios.get(
        `${API_BASE}/api/policy-quiz/check/${policy._id}/${employeeId}`
      );
      if (chk.data.already_passed) {
        onPass && onPass();
        onClose();
        return;
      }

      // Load quiz
      const res = await axios.get(`${API_BASE}/api/policy-quiz/start/${policy._id}`);
      setQuizMeta(res.data);
      setQuestions(res.data.questions);
      setAnswers(new Array(res.data.questions.length).fill(null));
      setTimeLeft(res.data.timer_seconds);
      setPhase("intro");
    } catch (err) {
      if (err.response?.status === 404) {
        // No quiz configured — allow direct acknowledge
        setPhase("no_quiz");
      } else {
        console.error(err);
        setPhase("no_quiz");
      }
    }
  };

  const startQuiz = () => {
    setPhase("quiz");
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitAnswers(true); // force submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const selectAnswer = (optIdx) => {
    const updated = [...answers];
    updated[current] = optIdx;
    setAnswers(updated);
  };

  const goNext = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      clearInterval(timerRef.current);
      submitAnswers(false);
    }
  };

  const submitAnswers = async (timedOut = false) => {
    if (submitting) return;
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000);

    try {
      const answerPayload = questions.map((_, i) => ({
        question_index: i,
        answer_index: answers[i],
      }));

      const res = await axios.post(`${API_BASE}/api/policy-quiz/submit`, {
        policy_id: policy._id,
        employee_id: employeeId,
        answers: answerPayload,
        questions_served: questions,
        time_taken_seconds: timeTaken,
      });

      setResult({ ...res.data, timed_out: timedOut });
      setPhase("result");

      if (res.data.passed) {
        onPass && onPass();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Submit failed");
    }
    setSubmitting(false);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const timerColor = timeLeft <= 30 ? "#dc2626" : timeLeft <= 60 ? "#d97706" : "#1e40af";

  // ─── Overlay ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.75)",
      zIndex: 99999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16,
        width: "100%", maxWidth: 620,
        boxShadow: "0 25px 70px rgba(0,0,0,0.4)",
        overflow: "hidden",
        animation: "slideUp 0.25s ease",
      }}>
        <style>{`
          @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>

        {/* ── Loading ── */}
        {phase === "loading" && (
          <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
            <div style={{
              width: 36, height: 36, border: "3px solid #e2e8f0", borderTop: "3px solid #4f46e5",
              borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p>Loading quiz...</p>
          </div>
        )}

        {/* ── No Quiz — direct acknowledge ── */}
        {phase === "no_quiz" && (
          <>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{policy.title}</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Policy Acknowledgement</p>
            </div>
            <div style={{ padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <p style={{ color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
                No quiz has been configured for this policy yet.<br />
                You can acknowledge it directly.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={onClose} style={{ ...ghostBtn }}>Cancel</button>
                <button
                  onClick={async () => {
                    try {
                      await axios.post(`${API_BASE}/api/policies/acknowledge`, {
                        policy_id: policy._id,
                        employee_id: employeeId,
                      });
                      onPass && onPass();
                      onClose();
                    } catch (err) {
                      if (err.response?.data?.message === "Already acknowledged") {
                        onPass && onPass();
                        onClose();
                      } else {
                        alert(err.response?.data?.message || "Error");
                      }
                    }
                  }}
                  style={{ ...primaryBtn }}
                >
                  ✓ I have read and understood this policy
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Intro ── */}
        {phase === "intro" && quizMeta && (
          <>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>Policy Quiz</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#c7d2fe" }}>{policy.title}</p>
            </div>
            <div style={{ padding: 32 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
                {[
                  { icon: "❓", label: "Questions", value: quizMeta.total_questions },
                  { icon: "⏱", label: "Time Limit", value: formatTime(quizMeta.timer_seconds) },
                  { icon: "🎯", label: "Pass Score", value: `${quizMeta.pass_score}/${quizMeta.total_questions}` },
                ].map((s) => (
                  <div key={s.label} style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#fef9c3", border: "1px solid #fcd34d", borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#854d0e" }}>
                ⚠️ <strong>Rules:</strong> Answer all {quizMeta.total_questions} questions within the time limit.
                Score ≥ {quizMeta.pass_score}/{quizMeta.total_questions} to pass and acknowledge this policy.
                Timer runs continuously — unanswered questions count as wrong.
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={onClose} style={ghostBtn}>Cancel</button>
                <button onClick={startQuiz} style={primaryBtn}>Start Quiz →</button>
              </div>
            </div>
          </>
        )}

        {/* ── Quiz ── */}
        {phase === "quiz" && questions.length > 0 && (
          <>
            {/* Quiz Header */}
            <div style={{
              padding: "14px 20px",
              background: "#1e293b",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>Question</span>
                <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, marginLeft: 8 }}>
                  {current + 1} / {questions.length}
                </span>
              </div>
              <div style={{
                background: timerColor, color: "#fff",
                borderRadius: 8, padding: "6px 14px",
                fontWeight: 700, fontSize: 16,
                animation: timeLeft <= 10 ? "pulse 0.5s infinite" : "none",
                minWidth: 70, textAlign: "center",
              }}>
                ⏱ {formatTime(timeLeft)}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ height: 4, background: "#e2e8f0" }}>
              <div style={{
                height: "100%",
                width: `${((current + 1) / questions.length) * 100}%`,
                background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
                transition: "width 0.3s ease",
              }} />
            </div>

            {/* Question */}
            <div style={{ padding: "24px 24px 16px" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", lineHeight: 1.6, marginBottom: 20 }}>
                {questions[current].question}
              </p>

              {questions[current].options.map((opt, i) => {
                const selected = answers[current] === i;
                return (
                  <button
                    key={i}
                    onClick={() => selectAnswer(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      width: "100%", textAlign: "left",
                      background: selected ? "#e0e7ff" : "#f8fafc",
                      border: `2px solid ${selected ? "#4f46e5" : "#e2e8f0"}`,
                      borderRadius: 10, padding: "12px 16px",
                      cursor: "pointer", marginBottom: 10,
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: selected ? "#4f46e5" : "#e2e8f0",
                      color: selected ? "#fff" : "#475569",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700,
                    }}>
                      {["A", "B", "C", "D"][i]}
                    </span>
                    <span style={{ fontSize: 14, color: selected ? "#3730a3" : "#374151", fontWeight: selected ? 600 : 400 }}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Nav */}
            <div style={{
              padding: "14px 24px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", gap: 6 }}>
                {questions.map((_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: answers[i] !== null ? "#4f46e5" : i === current ? "#a5b4fc" : "#e2e8f0",
                    transition: "background 0.2s",
                  }} />
                ))}
              </div>
              <button
                onClick={goNext}
                disabled={submitting}
                style={{
                  ...primaryBtn,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Submitting..." : current < questions.length - 1 ? "Next →" : "Submit Quiz ✓"}
              </button>
            </div>
          </>
        )}

        {/* ── Result ── */}
        {phase === "result" && result && (
          <>
            <div style={{
              padding: "20px 24px",
              background: result.passed ? "linear-gradient(135deg, #059669, #065f46)" : "linear-gradient(135deg, #dc2626, #991b1b)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{result.passed ? "🎉" : "😔"}</div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>
                {result.passed ? "Quiz Passed!" : result.timed_out ? "Time's Up!" : "Quiz Failed"}
              </h3>
              <p style={{ margin: "6px 0 0", color: result.passed ? "#a7f3d0" : "#fca5a5", fontSize: 14 }}>
                {result.message}
              </p>
            </div>

            <div style={{ padding: 28 }}>
              {/* Score */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 80, height: 80, borderRadius: "50%",
                  background: result.passed ? "#dcfce7" : "#fee2e2",
                  border: `3px solid ${result.passed ? "#22c55e" : "#ef4444"}`,
                  marginBottom: 8,
                }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: result.passed ? "#166534" : "#991b1b" }}>
                    {result.score}/{result.total}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                  Pass score: {result.pass_score}/{result.total}
                </p>
              </div>

              {result.passed && (
                <div style={{
                  background: "#dcfce7", border: "1px solid #86efac",
                  borderRadius: 10, padding: "12px 16px", marginBottom: 20,
                  fontSize: 13, color: "#166534", textAlign: "center", fontWeight: 600,
                }}>
                  ✓ This policy has been marked as acknowledged
                </div>
              )}

              {!result.passed && (
                <div style={{
                  background: "#fef9c3", border: "1px solid #fcd34d",
                  borderRadius: 10, padding: "12px 16px", marginBottom: 20,
                  fontSize: 13, color: "#854d0e",
                }}>
                  💡 Please re-read the policy carefully before attempting the quiz again.
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={onClose} style={ghostBtn}>Close</button>
                {!result.passed && (
                  <button
                    onClick={() => {
                      setPhase("loading");
                      setAnswers([]);
                      setCurrent(0);
                      setResult(null);
                      loadQuiz();
                    }}
                    style={primaryBtn}
                  >
                    Retry Quiz ↺
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Shared button styles ─────────────────────────────────────────────────────
const primaryBtn = {
  background: "#4f46e5", color: "#fff", border: "none",
  borderRadius: 8, padding: "10px 24px",
  cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit",
};

const ghostBtn = {
  background: "#e2e8f0", color: "#475569", border: "none",
  borderRadius: 8, padding: "10px 20px",
  cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit",
};