// ===== SIMPLE FEEDBACK SYSTEM (standalone — NOT the 360° feedback system) =====
// HR page with 2 tabs:
//  1. Questions   -> add / edit / delete the questions employees fill
//  2. Submissions -> review what employees submitted, leave a reply note
// To remove this feature later: delete this file, remove its import + route
// from App.jsx, and remove its nav link from HrSidebar.jsx.

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus, Pencil, Trash2, X, CheckCircle2, Clock, Send,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const getToken = () =>
  localStorage.getItem("hrToken") || localStorage.getItem("token") || sessionStorage.getItem("hrToken");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap');
  .hf-root { font-family: 'Geist', sans-serif; background: #f5f5f0; min-height: 100vh; padding: 20px 16px 100px; box-sizing: border-box; }
  .hf-root *, .hf-root *::before, .hf-root *::after { box-sizing: border-box; }
  .hf-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px; }
  .hf-title { font-size: 22px; font-weight: 800; color:#0a0a0a; }
  .hf-subtitle { font-size: 13px; color:#888; margin-top:4px; }

  .hf-tabs { display:flex; gap:6px; background:#fff; border:1.5px solid #e5e7eb; border-radius:10px; padding:4px; width:fit-content; margin-bottom:18px; }
  .hf-tab { padding:8px 16px; border-radius:8px; font-size:12.5px; font-weight:700; cursor:pointer; color:#888; }
  .hf-tab.active { background:#0a0a0a; color:#fff; }

  .hf-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 14px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; border:none; background:#0a0a0a; color:#fff; font-family:'Geist',sans-serif; }
  .hf-btn.secondary { background:#fff; color:#0a0a0a; border:1.5px solid #e5e7eb; }
  .hf-btn:disabled { opacity:0.6; cursor:not-allowed; }

  .hf-card { background:#fff; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden; margin-bottom:14px; }
  .hf-q-row { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; padding:16px 18px; border-bottom:1px solid #f1f1f1; }
  .hf-q-row:last-child { border-bottom:none; }
  .hf-q-main { flex:1; min-width:0; }
  .hf-q-text { font-size:13.5px; font-weight:700; color:#0a0a0a; }
  .hf-q-meta { font-size:11.5px; color:#888; margin-top:4px; display:flex; gap:8px; flex-wrap:wrap; }
  .hf-q-badge { padding:2px 9px; border-radius:20px; font-size:10.5px; font-weight:700; background:#eef1fd; color:#3d5af1; }
  .hf-q-badge.inactive { background:#f3f4f6; color:#888; }
  .hf-q-actions { display:flex; gap:8px; flex-shrink:0; }
  .hf-icon-btn { width:32px; height:32px; border-radius:8px; border:1.5px solid #e5e7eb; background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .hf-icon-btn:hover { background:#faf9f6; }
  .hf-icon-btn.danger:hover { background:#fef2f2; border-color:#fecaca; }

  .hf-empty { padding:40px; text-align:center; color:#888; font-size:12.5px; }

  .hf-table-wrap { overflow-x:auto; }
  .hf-datatable { width:100%; border-collapse:collapse; }
  .hf-datatable thead tr { border-bottom:1.5px solid #eee; background:#fafaf8; }
  .hf-datatable th { text-align:left; padding:16px 20px; font-size:13px; font-weight:700; color:#0a0a0a; white-space:nowrap; }
  .hf-datatable td { padding:16px 20px; font-size:14px; color:#1e1e1e; border-bottom:1px solid #f1f1f1; }
  .hf-datatable tbody tr:last-child td { border-bottom:none; }
  .hf-datatable tbody tr { cursor:pointer; transition: background 0.12s ease; }
  .hf-datatable tbody tr:hover { background:#faf9f6; }
  .hf-badge { padding:5px 12px; border-radius:20px; font-size:12px; font-weight:700; display:inline-flex; align-items:center; gap:5px; white-space:nowrap; }
  .hf-badge.pending { background:#fffbeb; color:#d97706; }
  .hf-badge.reviewed { background:#f0fdf4; color:#16a34a; }

  /* Overlay / drawer / modal */
  .hf-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; justify-content:flex-end; z-index:9999; }
  .hf-overlay.center { justify-content:center; align-items:center; }
  .hf-drawer { background:#fff; width:460px; max-width:100%; height:100%; overflow-y:auto; padding:22px; }
  .hf-modal { background:#fff; width:480px; max-width:92vw; max-height:90vh; overflow-y:auto; border-radius:16px; padding:22px; }
  .hf-drawer-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
  .hf-close { cursor:pointer; }

  .hf-drawer-meta { display:grid; grid-template-columns: 1fr 1fr; gap:10px 16px; background:#faf9f6; border:1px solid #f1f1f1; border-radius:10px; padding:12px 14px; margin-bottom:18px; }
  .hf-drawer-meta-item { }
  .hf-drawer-meta-label { font-size:10px; text-transform:uppercase; letter-spacing:0.04em; color:#999; font-weight:700; margin-bottom:2px; }
  .hf-drawer-meta-value { font-size:12.5px; font-weight:600; color:#0a0a0a; }

  .hf-field { margin-bottom:14px; }
  .hf-label { font-size:11px; text-transform:uppercase; color:#999; margin-bottom:6px; font-weight:700; display:block; }
  .hf-value { font-size:13.5px; color:#0a0a0a; font-weight:600; }
  .hf-input, .hf-select, .hf-textarea { width:100%; padding:10px 12px; border-radius:8px; border:1.5px solid #e5e7eb; font-family:'Geist',sans-serif; font-size:13px; background:#fff; }
  .hf-textarea { min-height:80px; resize:vertical; }
  .hf-checkbox-row { display:flex; align-items:center; gap:8px; font-size:12.5px; font-weight:600; color:#0a0a0a; margin-bottom:10px; }

  .hf-option-row { display:flex; gap:8px; margin-bottom:8px; }
  .hf-option-row input { flex:1; }

  .hf-qa-block { padding:12px 0; border-bottom:1px dashed #eee; }
  .hf-qa-block:last-of-type { border-bottom:none; }
  .hf-qa-q { font-size:12px; font-weight:700; color:#555; margin-bottom:3px; }
  .hf-qa-a { font-size:13.5px; color:#0a0a0a; }
`;

const BLANK_QUESTION = {
  questionText: "", type: "text", options: [], hasComment: false,
  commentLabel: "Comments", required: true, order: 0,
};

export default function HrFeedback() {
  const [tab, setTab] = useState("questions"); // questions | submissions

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [qLoading, setQLoading] = useState(true);
  const [editingQ, setEditingQ] = useState(null); // question object being edited, or BLANK_QUESTION for new
  const [savingQ, setSavingQ] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState([]);
  const [sLoading, setSLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [savingReply, setSavingReply] = useState(false);

  const loadQuestions = async () => {
    try {
      setQLoading(true);
      const res = await axios.get(`${API_BASE}/api/hr/feedback-questions`, { headers: authHeader() });
      setQuestions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setQLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      setSLoading(true);
      const res = await axios.get(`${API_BASE}/api/hr/feedback-submissions`, { headers: authHeader() });
      setSubmissions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setSLoading(false);
    }
  };

  useEffect(() => { loadQuestions(); loadSubmissions(); }, []);

  // ── Question CRUD ────────────────────────────────────────────────────
  const saveQuestion = async () => {
    if (!editingQ.questionText.trim()) return;
    if (editingQ.type === "single_choice" && editingQ.options.filter((o) => o.trim()).length < 2) {
      alert("Please add at least 2 options for a single choice question.");
      return;
    }
    try {
      setSavingQ(true);
      const payload = { ...editingQ, options: editingQ.options.filter((o) => o.trim()) };
      if (editingQ._id) {
        await axios.put(`${API_BASE}/api/hr/feedback-questions/${editingQ._id}`, payload, { headers: authHeader() });
      } else {
        await axios.post(`${API_BASE}/api/hr/feedback-questions`, payload, { headers: authHeader() });
      }
      setEditingQ(null);
      loadQuestions();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save question");
    } finally {
      setSavingQ(false);
    }
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm("Delete this question? Employees will no longer see it in the form.")) return;
    try {
      await axios.delete(`${API_BASE}/api/hr/feedback-questions/${id}`, { headers: authHeader() });
      loadQuestions();
    } catch (err) {
      alert("Failed to delete question");
    }
  };

  // ── Submission review ───────────────────────────────────────────────
  const openSubmission = async (s) => {
    try {
      const res = await axios.get(`${API_BASE}/api/hr/feedback-submissions/${s._id}`, { headers: authHeader() });
      setSelected(res.data);
      setReply(res.data.hrReply || "");
    } catch (err) {
      alert("Failed to load submission");
    }
  };

  const saveReply = async () => {
    if (!selected) return;
    try {
      setSavingReply(true);
      await axios.put(
        `${API_BASE}/api/hr/feedback-submissions/${selected._id}/reply`,
        { hrReply: reply },
        { headers: authHeader() }
      );
      setSelected(null);
      loadSubmissions();
    } catch (err) {
      alert("Failed to save reply");
    } finally {
      setSavingReply(false);
    }
  };

  return (
    <div className="hf-root">
      <style>{STYLES}</style>

      <div className="hf-header">
        <div>
          <div className="hf-title">Employee Feedback</div>
          <div className="hf-subtitle">Manage the feedback form and review what employees submit</div>
        </div>
        {tab === "questions" && (
          <button className="hf-btn" onClick={() => setEditingQ({ ...BLANK_QUESTION, order: questions.length + 1 })}>
            <Plus size={14} /> Add Question
          </button>
        )}
      </div>

      <div className="hf-tabs">
        <div className={`hf-tab ${tab === "questions" ? "active" : ""}`} onClick={() => setTab("questions")}>
          Questions
        </div>
        <div className={`hf-tab ${tab === "submissions" ? "active" : ""}`} onClick={() => setTab("submissions")}>
          Submissions {submissions.filter((s) => s.status === "Pending").length > 0 &&
            `(${submissions.filter((s) => s.status === "Pending").length} pending)`}
        </div>
      </div>

      {/* ═══════ QUESTIONS TAB ═══════ */}
      {tab === "questions" && (
        <div className="hf-card">
          {qLoading ? (
            <div className="hf-empty">Loading questions…</div>
          ) : questions.length === 0 ? (
            <div className="hf-empty">No questions yet — click "Add Question" to build the form.</div>
          ) : (
            questions
              .sort((a, b) => a.order - b.order)
              .map((q) => (
                <div className="hf-q-row" key={q._id}>
                  <div className="hf-q-main">
                    <div className="hf-q-text">{q.questionText}</div>
                    <div className="hf-q-meta">
                      <span className={`hf-q-badge ${q.isActive ? "" : "inactive"}`}>
                        {q.type === "text" ? "Open Text" : "Single Choice"}
                      </span>
                      {q.required && <span className="hf-q-badge">Required</span>}
                      {!q.isActive && <span className="hf-q-badge inactive">Inactive</span>}
                      {q.type === "single_choice" && q.options?.length > 0 && (
                        <span>{q.options.join(" / ")}</span>
                      )}
                    </div>
                  </div>
                  <div className="hf-q-actions">
                    <div className="hf-icon-btn" onClick={() => setEditingQ({ ...q, options: q.options?.length ? q.options : [""] })}>
                      <Pencil size={14} />
                    </div>
                    <div className="hf-icon-btn danger" onClick={() => deleteQuestion(q._id)}>
                      <Trash2 size={14} color="#dc2626" />
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* ═══════ SUBMISSIONS TAB ═══════ */}
      {tab === "submissions" && (
        <div className="hf-card">
          <div className="hf-table-wrap">
            <table className="hf-datatable">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sLoading ? (
                  <tr><td colSpan={5} className="hf-empty">Loading submissions…</td></tr>
                ) : submissions.length === 0 ? (
                  <tr><td colSpan={5} className="hf-empty">No feedback submitted yet.</td></tr>
                ) : (
                  submissions.map((s) => (
                    <tr key={s._id} onClick={() => openSubmission(s)}>
                      <td>{s.employeeName || "—"}</td>
                      <td>{s.employeeCode || "—"}</td>
                      <td>{s.department || "—"}</td>
                      <td>
                        {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td>
                        <span className={`hf-badge ${s.status === "Reviewed" ? "reviewed" : "pending"}`}>
                          {s.status === "Reviewed" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════ ADD/EDIT QUESTION MODAL ═══════ */}
      {editingQ && (
        <div className="hf-overlay center" onClick={() => setEditingQ(null)}>
          <div className="hf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hf-drawer-head">
              <div style={{ fontSize: 15, fontWeight: 800 }}>{editingQ._id ? "Edit Question" : "Add Question"}</div>
              <X size={18} className="hf-close" onClick={() => setEditingQ(null)} />
            </div>

            <div className="hf-field">
              <label className="hf-label">Question Text</label>
              <textarea
                className="hf-textarea"
                value={editingQ.questionText}
                onChange={(e) => setEditingQ({ ...editingQ, questionText: e.target.value })}
                placeholder="e.g. How satisfied are you with your workplace?"
              />
            </div>

            <div className="hf-field">
              <label className="hf-label">Answer Type</label>
              <select
                className="hf-select"
                value={editingQ.type}
                onChange={(e) => setEditingQ({ ...editingQ, type: e.target.value, options: e.target.value === "single_choice" ? [""] : [] })}
              >
                <option value="text">Text (open-ended)</option>
                <option value="single_choice">Single Choice (pick one)</option>
              </select>
            </div>

            {editingQ.type === "single_choice" && (
              <div className="hf-field">
                <label className="hf-label">Options</label>
                {editingQ.options.map((opt, i) => (
                  <div className="hf-option-row" key={i}>
                    <input
                      className="hf-input"
                      value={opt}
                      placeholder={`Option ${i + 1}`}
                      onChange={(e) => {
                        const opts = [...editingQ.options];
                        opts[i] = e.target.value;
                        setEditingQ({ ...editingQ, options: opts });
                      }}
                    />
                    <div
                      className="hf-icon-btn danger"
                      onClick={() => setEditingQ({ ...editingQ, options: editingQ.options.filter((_, idx) => idx !== i) })}
                    >
                      <X size={14} />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="hf-btn secondary"
                  onClick={() => setEditingQ({ ...editingQ, options: [...editingQ.options, ""] })}
                >
                  <Plus size={13} /> Add Option
                </button>
              </div>
            )}

            <div className="hf-checkbox-row">
              <input
                type="checkbox"
                checked={editingQ.hasComment}
                onChange={(e) => setEditingQ({ ...editingQ, hasComment: e.target.checked })}
              />
              Show an extra comment box with this question
            </div>

            {editingQ.hasComment && (
              <div className="hf-field">
                <label className="hf-label">Comment Box Label</label>
                <input
                  className="hf-input"
                  value={editingQ.commentLabel}
                  placeholder='e.g. "Comments" or "If No, please specify"'
                  onChange={(e) => setEditingQ({ ...editingQ, commentLabel: e.target.value })}
                />
              </div>
            )}

            <div className="hf-checkbox-row">
              <input
                type="checkbox"
                checked={editingQ.required}
                onChange={(e) => setEditingQ({ ...editingQ, required: e.target.checked })}
              />
              Required question
            </div>

            {editingQ._id && (
              <div className="hf-checkbox-row">
                <input
                  type="checkbox"
                  checked={editingQ.isActive}
                  onChange={(e) => setEditingQ({ ...editingQ, isActive: e.target.checked })}
                />
                Active (visible to employees)
              </div>
            )}

            <button className="hf-btn" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} disabled={savingQ} onClick={saveQuestion}>
              {savingQ ? "Saving…" : "Save Question"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════ SUBMISSION DETAIL DRAWER ═══════ */}
      {selected && (
        <div className="hf-overlay" onClick={() => setSelected(null)}>
          <div className="hf-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="hf-drawer-head">
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{selected.employeeName || "—"}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                  {selected.department} {selected.designation ? `· ${selected.designation}` : ""}
                </div>
              </div>
              <X size={18} className="hf-close" onClick={() => setSelected(null)} />
            </div>

            {/* Full employee details — visible to HR only */}
            <div className="hf-drawer-meta">
              <div className="hf-drawer-meta-item">
                <div className="hf-drawer-meta-label">Employee Name</div>
                <div className="hf-drawer-meta-value">{selected.employeeName || "—"}</div>
              </div>
              <div className="hf-drawer-meta-item">
                <div className="hf-drawer-meta-label">Employee ID</div>
                <div className="hf-drawer-meta-value">{selected.employeeCode || "—"}</div>
              </div>
              <div className="hf-drawer-meta-item">
                <div className="hf-drawer-meta-label">Department</div>
                <div className="hf-drawer-meta-value">{selected.department || "—"}</div>
              </div>
              <div className="hf-drawer-meta-item">
                <div className="hf-drawer-meta-label">Designation</div>
                <div className="hf-drawer-meta-value">{selected.designation || "—"}</div>
              </div>
              <div className="hf-drawer-meta-item">
                <div className="hf-drawer-meta-label">Date Submitted</div>
                <div className="hf-drawer-meta-value">
                  {selected.createdAt
                    ? new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
                    : "—"}
                </div>
              </div>
            </div>

            {selected.answers.map((a, i) => (
              <div className="hf-qa-block" key={i}>
                <div className="hf-qa-q">{a.questionText}</div>
                <div className="hf-qa-a">{a.answer || "—"}</div>
                {a.comment && <div className="hf-qa-a" style={{ color: "#888", marginTop: 2 }}>{a.comment}</div>}
              </div>
            ))}

            <div className="hf-field" style={{ marginTop: 20 }}>
              <label className="hf-label">HR Reply Note</label>
              <textarea
                className="hf-textarea"
                placeholder='e.g. "ok" / "Noted, will discuss with the team"'
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
            </div>

            <button className="hf-btn" style={{ width: "100%", justifyContent: "center" }} disabled={savingReply} onClick={saveReply}>
              <Send size={14} /> {savingReply ? "Saving…" : "Save Reply & Mark Reviewed"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}