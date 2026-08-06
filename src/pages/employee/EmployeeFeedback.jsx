// ===== SIMPLE FEEDBACK SYSTEM (standalone — NOT the 360° feedback system) =====
// Employee fills this form -> HR reviews it -> HR leaves a reply note.
// To remove this feature later: delete this file, remove its import + route
// from App.jsx, and remove its nav link from Sidebar.jsx.

import { useEffect, useState } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import {
  MessageSquarePlus, Send, CheckCircle2, Clock,
  ChevronDown, ChevronUp,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const getToken = () =>
  localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

export default function EmployeeFeedback() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: { answer, comment } }

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [mySubmissions, setMySubmissions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // ── Load employee profile (header details) + active questions + history ──
  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, myRes] = await Promise.all([
          axios.get(`${API_BASE}/api/employee/feedback-questions`, { headers: authHeader() }),
          axios.get(`${API_BASE}/api/employee/feedback/my`, { headers: authHeader() }),
        ]);
        setQuestions(Array.isArray(qRes.data) ? qRes.data : []);
        setMySubmissions(Array.isArray(myRes.data) ? myRes.data : []);
      } catch (err) {
        console.error(err);
        setError("Couldn't load the feedback form. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const setAnswer = (qId, field, value) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Build answers array, checking required questions
    const missing = questions.find(
      (q) => q.required && !answers[q._id]?.answer?.trim()
    );
    if (missing) {
      setError(`Please answer: "${missing.questionText}"`);
      return;
    }

    const payloadAnswers = questions.map((q) => ({
      questionId: q._id,
      questionText: q.questionText,
      type: q.type,
      options: q.options || [],
      answer: answers[q._id]?.answer || "",
      comment: answers[q._id]?.comment || "",
    }));

    try {
      setSubmitting(true);
      const form = new FormData();
      form.append("answers", JSON.stringify(payloadAnswers));

      await axios.post(`${API_BASE}/api/employee/feedback`, form, {
        headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
      });

      setSuccess("Thank you! Your feedback has been submitted.");
      setAnswers({});

      const myRes = await axios.get(`${API_BASE}/api/employee/feedback/my`, { headers: authHeader() });
      setMySubmissions(Array.isArray(myRes.data) ? myRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EmployeeLayout pageTitle="Feedback & Suggestions">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        .ef-wrap { font-family: 'Sora', sans-serif; padding: 22px 22px 40px; max-width: 820px; margin: 0 auto; }

        .ef-hero {
          background: linear-gradient(135deg, #3d5af1, #6366f1);
          border-radius: 20px; padding: 26px; color: #fff;
          display: flex; align-items: center; gap: 16px;
          box-shadow: 0 14px 34px rgba(61,90,241,0.28); margin-bottom: 22px;
        }
        .ef-hero-icon { width: 50px; height: 50px; border-radius: 14px; background: rgba(255,255,255,0.16); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .ef-hero-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
        .ef-hero-sub { font-size: 12.5px; opacity: 0.9; }

        .ef-card { background:#fff; border:1.5px solid #eef0f6; border-radius:16px; padding:22px; margin-bottom:18px; }
        .ef-card-title { font-size: 14px; font-weight: 700; color:#1e293b; margin-bottom: 16px; }

        .ef-q { margin-bottom: 22px; }
        .ef-q:last-child { margin-bottom: 0; }
        .ef-q-text { font-size: 13.5px; font-weight: 700; color:#1e293b; margin-bottom: 10px; }
        .ef-q-text .req { color:#dc2626; margin-left:3px; }

        .ef-textarea, .ef-input {
          width:100%; padding:12px 14px; border-radius:10px; border:1.5px solid #eef0f6;
          font-family:'Sora',sans-serif; font-size:13px; color:#1e293b; resize:vertical; outline:none;
          transition: border-color 0.15s ease;
        }
        .ef-textarea:focus, .ef-input:focus { border-color:#3d5af1; }
        .ef-textarea { min-height: 80px; }

        .ef-options { display:flex; flex-wrap:wrap; gap:10px; }
        .ef-option {
          padding: 9px 16px; border-radius: 10px; border:1.5px solid #eef0f6;
          font-size:12.5px; font-weight:600; color:#475569; cursor:pointer;
          transition: all 0.15s ease; background:#fff;
        }
        .ef-option:hover { border-color:#c7d2fe; }
        .ef-option.selected { border-color:#3d5af1; background:#eef1fd; color:#3d5af1; }

        .ef-comment { margin-top: 10px; }
        .ef-comment-label { font-size:11.5px; font-weight:600; color:#94a3b8; margin-bottom:6px; }

        .ef-msg { padding: 12px 14px; border-radius: 10px; font-size: 12.5px; font-weight:600; margin-bottom: 16px; }
        .ef-msg.error { background:#fef2f2; color:#dc2626; }
        .ef-msg.success { background:#f0fdf4; color:#16a34a; }

        .ef-submit-btn {
          width:100%; padding: 13px; border-radius: 12px; border:none;
          background:#3d5af1; color:#fff; font-family:'Sora',sans-serif; font-weight:700; font-size:14px;
          display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer;
          transition: opacity 0.15s ease;
        }
        .ef-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .ef-history-item { border:1.5px solid #eef0f6; border-radius:14px; margin-bottom:10px; overflow:hidden; }
        .ef-history-head { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; cursor:pointer; }
        .ef-history-date { font-size:12.5px; font-weight:600; color:#1e293b; }
        .ef-status-pill { display:flex; align-items:center; gap:5px; font-size:10.5px; font-weight:700; padding:5px 11px; border-radius:20px; }
        .ef-status-pill.pending { background:#fffbeb; color:#d97706; }
        .ef-status-pill.reviewed { background:#f0fdf4; color:#16a34a; }
        .ef-history-body { padding: 0 16px 16px; border-top:1px solid #f4f5f9; }
        .ef-history-qa { padding: 10px 0; border-bottom: 1px dashed #f1f1f1; }
        .ef-history-qa:last-of-type { border-bottom: none; }
        .ef-history-q { font-size:12px; font-weight:700; color:#475569; margin-bottom:3px; }
        .ef-history-a { font-size:12.5px; color:#1e293b; }
        .ef-reply-box { margin-top:12px; background:#eef1fd; border-radius:10px; padding:12px 14px; }
        .ef-reply-label { font-size:10.5px; font-weight:700; color:#3d5af1; text-transform:uppercase; margin-bottom:4px; }
        .ef-reply-text { font-size:12.5px; color:#1e293b; }

        .ef-empty { text-align:center; padding:24px; color:#94a3b8; font-size:12.5px; }

        @media (max-width: 640px) {
          .ef-wrap { padding: 14px 14px 32px; }
        }
      `}</style>

      <div className="ef-wrap">
        <div className="ef-hero">
          <div className="ef-hero-icon"><MessageSquarePlus size={24} color="#fff" /></div>
          <div>
            <div className="ef-hero-title">Employee Feedback & Suggestion Form</div>
            <div className="ef-hero-sub">Your voice helps us improve. HR will review and respond to your feedback.</div>
          </div>
        </div>

        {loading ? (
          <div className="ef-card"><div className="ef-empty">Loading form…</div></div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Dynamic questions */}
            <div className="ef-card">
              <div className="ef-card-title">Your Feedback</div>

              {error && <div className="ef-msg error">{error}</div>}
              {success && <div className="ef-msg success">{success}</div>}

              {questions.length === 0 ? (
                <div className="ef-empty">No feedback questions have been set up yet. Please check back later.</div>
              ) : (
                questions.map((q) => (
                  <div className="ef-q" key={q._id}>
                    <div className="ef-q-text">
                      {q.questionText}
                      {q.required && <span className="req">*</span>}
                    </div>

                    {q.type === "text" ? (
                      <textarea
                        className="ef-textarea"
                        placeholder="Type your answer…"
                        value={answers[q._id]?.answer || ""}
                        onChange={(e) => setAnswer(q._id, "answer", e.target.value)}
                      />
                    ) : (
                      <div className="ef-options">
                        {(q.options || []).map((opt) => (
                          <div
                            key={opt}
                            className={`ef-option ${answers[q._id]?.answer === opt ? "selected" : ""}`}
                            onClick={() => setAnswer(q._id, "answer", opt)}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.hasComment && (
                      <div className="ef-comment">
                        <div className="ef-comment-label">{q.commentLabel || "Comments"}</div>
                        <textarea
                          className="ef-textarea"
                          style={{ minHeight: 50 }}
                          placeholder="Optional…"
                          value={answers[q._id]?.comment || ""}
                          onChange={(e) => setAnswer(q._id, "comment", e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <button className="ef-submit-btn" type="submit" disabled={submitting || questions.length === 0}>
              <Send size={16} /> {submitting ? "Submitting…" : "Submit Feedback"}
            </button>
          </form>
        )}

        {/* My past submissions */}
        <div className="ef-card-title" style={{ marginTop: 30 }}>My Submitted Feedback</div>
        {mySubmissions.length === 0 ? (
          <div className="ef-card"><div className="ef-empty">You haven't submitted any feedback yet.</div></div>
        ) : (
          mySubmissions.map((f) => (
            <div className="ef-history-item" key={f._id}>
              <div className="ef-history-head" onClick={() => setExpandedId(expandedId === f._id ? null : f._id)}>
                <div className="ef-history-date">
                  {new Date(f.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className={`ef-status-pill ${f.status === "Reviewed" ? "reviewed" : "pending"}`}>
                    {f.status === "Reviewed" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                    {f.status}
                  </div>
                  {expandedId === f._id ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                </div>
              </div>
              {expandedId === f._id && (
                <div className="ef-history-body">
                  {f.answers.map((a, i) => (
                    <div className="ef-history-qa" key={i}>
                      <div className="ef-history-q">{a.questionText}</div>
                      <div className="ef-history-a">{a.answer || "—"}{a.comment ? ` · ${a.comment}` : ""}</div>
                    </div>
                  ))}
                  {f.status === "Reviewed" && f.hrReply && (
                    <div className="ef-reply-box">
                      <div className="ef-reply-label">HR Reply</div>
                      <div className="ef-reply-text">{f.hrReply}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </EmployeeLayout>
  );
}