import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  BookOpen, Users, Target, Award, CheckCircle2, Clock,
  AlertTriangle, Plus, Pencil, X, Check, RefreshCw,
  ChevronRight, BarChart2, Layers, FileText, Search,
  Filter, Download, TrendingUp, Star, Zap, Info,
  UserCheck, Calendar, GraduationCap, ClipboardList, Trash2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── Constants ────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:     { label: "Pending",     color: "#6b7280", bg: "#f3f4f6" },
  in_progress: { label: "In Progress", color: "#3b82f6", bg: "#eff6ff" },
  completed:   { label: "Completed",   color: "#10b981", bg: "#ecfdf5" },
  overdue:     { label: "Overdue",     color: "#ef4444", bg: "#fef2f2" },
  waived:      { label: "Waived",      color: "#8b5cf6", bg: "#f5f3ff" },
  pending_review:  { label: "Pending Review",  color: "#f59e0b", bg: "#fffbeb" }, // ✅ NEW — quiz submitted, awaiting HR to review & mark Completed
  retrain:         { label: "Retrain Required", color: "#f97316", bg: "#fff7ed" }, // ✅ NEW — HR sent employee back to re-study + retake the test
  needs_hr_review: { label: "Under HR Review", color: "#dc2626", bg: "#fef2f2" }, // legacy status, kept for old records
  failed_retake:   { label: "Failed (old data)", color: "#dc2626", bg: "#fef2f2" }, // legacy status from the old multi-attempt system, kept so old records don't silently show "Pending"
};

const LEVEL_CONFIG = {
  L1: { label: "L1 – Intern/Trainee",        color: "#6b7280" },
  L2: { label: "L2 – Executive",              color: "#3b82f6" },
  L3: { label: "L3 – Senior Executive",       color: "#8b5cf6" },
  L4: { label: "L4 – Manager",                color: "#f59e0b" },
  L5: { label: "L5 – GM / AVP",               color: "#ef4444" },
  L6: { label: "L6 – VP / Director / CXO",   color: "#10b981" },
  all:{ label: "All Levels",                  color: "#111827" },
};

const TYPE_CONFIG = {
  induction:        { label: "Induction",        color: "#3b82f6", bg: "#eff6ff" },
  job_role:         { label: "Job Role",          color: "#8b5cf6", bg: "#f5f3ff" },
  cross_functional: { label: "Cross-Functional",  color: "#f59e0b", bg: "#fffbeb" },
  culture:          { label: "Culture",           color: "#10b981", bg: "#ecfdf5" },
  refresher:        { label: "Refresher",         color: "#6b7280", bg: "#f3f4f6" },
  department:       { label: "Department",        color: "#ef4444", bg: "#fef2f2" },
  equipment:        { label: "Equipment",         color: "#0ea5e9", bg: "#f0f9ff" },
};

const DEPARTMENTS = ["Sales & Distribution","Technical & Service","HR & Admin","Accounts & Finance","Marketing","Operations","all"];
const LEVELS      = ["L1","L2","L3","L4","L5","L6","all"];
const TYPES       = ["induction","job_role","cross_functional","culture","refresher","department"];

const labelStyle = { fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4, display:"block" };

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, sub, color, bg, icon }) {
  return (
    <div className="card border-0 h-100" style={{ borderRadius: 14, border: "1px solid #f1f2f4", boxShadow: "0 1px 2px rgba(16,24,40,.04)" }}>
      <div className="card-body" style={{ padding: "18px 18px" }}>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span style={{
            width: 40, height: 40, borderRadius: 10, background: bg,
            display: "flex", alignItems: "center", justifyContent: "center", color,
          }}>{icon}</span>
        </div>
        <p className="mb-1 fw-bold" style={{ fontSize: 24, color: "#111827", lineHeight: 1 }}>{value}</p>
        <p className="mb-0" style={{ fontSize: 11.5, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
        {sub && <p className="mb-0 mt-1" style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────
function AssignModal({ programs, employees, onClose, onSave }) {
  const [mode, setMode]         = useState("single"); // "single"|"bulk"
  const [employeeId, setEmpId]  = useState("");
  const [employeeIds, setEmpIds]= useState([]);
  const [programId, setProgId]  = useState("");
  const [dueDate, setDueDate]   = useState("");
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);
const [modal, setModal] = useState(null); // "assign"|"update"|"quizQuestions"|"createProgram"

  const handle = async () => {
    if (!programId) return alert("Select a program");
    if (mode === "single" && !employeeId) return alert("Select an employee");
    if (mode === "bulk" && !employeeIds.length) return alert("Select at least one employee");
    setSaving(true);
    if (mode === "single") {
      await onSave("single", { employeeId, programId, dueDate, notes });
    } else {
      await onSave("bulk", { employeeIds, programId, dueDate });
    }
    setSaving(false);
  };

  const toggleEmp = (id) => setEmpIds(prev => prev.includes(id) ? prev.filter(e=>e!==id) : [...prev, id]);

  return (
    <div className="modal show d-block" style={{ background:"rgba(15,23,42,.45)", zIndex:1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius:14 }}>
          <div className="modal-header border-bottom" style={{ background:"#f9fafb", borderRadius:"14px 14px 0 0" }}>
            <div className="d-flex align-items-center gap-2">
              <GraduationCap size={18} color="#3b82f6" />
              <p className="mb-0 fw-bold" style={{ fontSize:14 }}>Assign Training</p>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {/* Mode toggle */}
            <div className="d-flex gap-2 mb-4">
              {["single","bulk"].map(m => (
                <button key={m} onClick={()=>setMode(m)}
                  className={`btn btn-sm ${mode===m?"btn-primary":"btn-light"}`} style={{ fontSize:12 }}>
                  {m === "single" ? "Single Employee" : "Bulk Assign"}
                </button>
              ))}
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label style={labelStyle}>Training Program *</label>
                <select className="form-select form-select-sm" value={programId} onChange={e=>setProgId(e.target.value)}>
                  <option value="">-- Select Program --</option>
                  {programs.map(p=>(
                    <option key={p._id} value={p._id}>{p.title} ({LEVEL_CONFIG[p.level]?.label || p.level})</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>Due Date</label>
                <input type="date" className="form-control form-control-sm" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
              </div>

              {mode === "single" ? (
                <div className="col-12">
                  <label style={labelStyle}>Employee *</label>
                  <select className="form-select form-select-sm" value={employeeId} onChange={e=>setEmpId(e.target.value)}>
                    <option value="">-- Select Employee --</option>
                    {employees.map(e=><option key={e._id} value={e._id}>{e.name} — {e.department}</option>)}
                  </select>
                </div>
              ) : (
                <div className="col-12">
                  <label style={labelStyle}>Select Employees ({employeeIds.length} selected)</label>
                  <div style={{ maxHeight:200, overflowY:"auto", border:"1px solid #e5e7eb", borderRadius:8, padding:"8px" }}>
                    {employees.map(e=>(
                      <div key={e._id} className="form-check">
                        <input className="form-check-input" type="checkbox"
                          checked={employeeIds.includes(e._id)}
                          onChange={()=>toggleEmp(e._id)} />
                        <label className="form-check-label" style={{ fontSize:13 }}>{e.name} — {e.department}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mode === "single" && (
                <div className="col-12">
                  <label style={labelStyle}>Notes</label>
                  <textarea className="form-control form-control-sm" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any instructions or notes..." />
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer gap-2">
            <button className="btn btn-light flex-fill" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary fw-bold flex-fill" onClick={handle} disabled={saving}>
              {saving ? "Assigning..." : "Assign Training"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Record Update Modal ──────────────────────────────────────
function UpdateRecordModal({ record, onClose, onSave }) {
  const [form, setForm] = useState({
    status:              record.status,
    assessmentScore:     record.assessmentScore || "",
    certificationIssued: record.certificationIssued || false,
    progressNote:        "",
    notes:               record.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false); // ✅ NEW — collapsed by default
  const lastAttempt = record.quizAttempts?.[record.quizAttempts.length - 1]; // ✅ NEW — latest quiz submission, for HR context

  return (
    <div className="modal show d-block" style={{ background:"rgba(15,23,42,.45)", zIndex:1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius:14 }}>
          <div className="modal-header" style={{ background:"#f9fafb", borderRadius:"14px 14px 0 0" }}>
            <div className="d-flex align-items-center gap-2">
              <ClipboardList size={16} color="#10b981" />
              <div>
                <p className="mb-0 fw-bold" style={{ fontSize:14 }}>Update Training Record</p>
                <p className="mb-0 text-muted" style={{ fontSize:11 }}>{record.employeeId?.name} — {record.programId?.title}</p>
              </div>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body d-flex flex-column gap-3">
            {/* ✅ NEW — quiz result banner, shown when the employee has submitted the test */}
            {lastAttempt && (
              <div className="d-flex align-items-center gap-2" style={{
                background: lastAttempt.passed ? "#ecfdf5" : "#fef2f2",
                border: `1px solid ${lastAttempt.passed ? "#a7f3d0" : "#fecaca"}`,
                borderRadius: 9, padding: "10px 14px",
              }}>
                {lastAttempt.passed ? <CheckCircle2 size={16} color="#10b981" /> : <AlertTriangle size={16} color="#ef4444" />}
                <div>
                  <p className="mb-0 fw-bold" style={{ fontSize:13, color: lastAttempt.passed ? "#065f46" : "#991b1b" }}>
                    Quiz score: {lastAttempt.score}% — {lastAttempt.passed ? "Passed" : "Failed"} (70% required)
                  </p>
                  <p className="mb-0" style={{ fontSize:11, color:"#6b7280" }}>Review the result, then set status to Completed to approve certification.</p>
                </div>
              </div>
            )}

            {/* ✅ NEW — question-by-question breakdown of what the employee
                actually answered, so HR isn't just reviewing a bare score. */}
            {lastAttempt && (
              <div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  style={{ fontSize: 12 }}
                  onClick={() => setShowAnswers(v => !v)}
                >
                  {showAnswers ? "Hide" : "Show"} what they answered ({lastAttempt.answers?.length || 0} questions)
                </button>
                {showAnswers && (
                  <div className="d-flex flex-column gap-2 mt-2">
                    {(lastAttempt.answers || []).map((a, i) => {
                      const q = a.questionId; // populated: { questionText, options, correctOptionIndex }
                      if (!q || typeof q === "string") {
                        return (
                          <div key={i} className="border rounded p-2" style={{ borderRadius: 8, fontSize: 12, color: "#9ca3af" }}>
                            Question {i + 1}: original question was deleted since this attempt.
                          </div>
                        );
                      }
                      return (
                        <div key={i} className="border rounded p-2" style={{ borderRadius: 8, fontSize: 12, borderColor: a.correct ? "#a7f3d0" : "#fecaca", background: a.correct ? "#f0fdf9" : "#fef7f7" }}>
                          <p className="mb-1 fw-semibold" style={{ fontSize: 12.5 }}>
                            {i + 1}. {q.questionText} {a.correct ? <span style={{ color: "#10b981" }}>✓</span> : <span style={{ color: "#ef4444" }}>✗</span>}
                          </p>
                          <div className="d-flex flex-column gap-1">
                            {(q.options || []).map((opt, oi) => {
                              const isEmployeePick = oi === a.selectedOptionIndex;
                              const isCorrectOpt   = oi === q.correctOptionIndex;
                              return (
                                <span key={oi} style={{
                                  fontSize: 11.5,
                                  color: isCorrectOpt ? "#10b981" : isEmployeePick ? "#ef4444" : "#6b7280",
                                  fontWeight: (isEmployeePick || isCorrectOpt) ? 700 : 400,
                                }}>
                                  {isEmployeePick ? "→ " : "  "}{opt}
                                  {isCorrectOpt ? "  (correct answer)" : ""}
                                  {isEmployeePick && !isCorrectOpt ? "  (their answer)" : ""}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div>
              <label style={labelStyle}>Status</label>
              <select className="form-select form-select-sm" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
              {form.status === "retrain" && (
                <p className="mt-1 mb-0" style={{ fontSize:11, color:"#c2410c" }}>
                  This resets their study checklist and clears the quiz attempt — they'll need to re-study every product and retake the test.
                </p>
              )}
            </div>
            <div>
              <label style={labelStyle}>Post-Training Assessment Score (%)</label>
              <input type="number" min="0" max="100" className="form-control form-control-sm"
                value={form.assessmentScore}
                onChange={e=>setForm(f=>({...f,assessmentScore:e.target.value}))}
                placeholder="e.g. 85" />
              <p className="text-muted mt-1" style={{ fontSize:11 }}>Policy target: ≥ 80%</p>
            </div>
            <div className="form-check form-switch d-flex align-items-center gap-2" style={{ background:"#f9fafb", borderRadius:9, padding:"10px 14px", border:"1px solid #e5e7eb" }}>
              <input className="form-check-input" type="checkbox" role="switch"
                checked={form.certificationIssued}
                onChange={e=>setForm(f=>({...f,certificationIssued:e.target.checked}))}
                style={{ width:36, height:20 }} />
              <label className="form-check-label fw-bold" style={{ fontSize:13 }}>Certification Issued</label>
            </div>
            <div>
              <label style={labelStyle}>Progress Note</label>
              <textarea className="form-control form-control-sm" rows={2}
                value={form.progressNote}
                onChange={e=>setForm(f=>({...f,progressNote:e.target.value}))}
                placeholder="What was covered, observations..." />
            </div>
          </div>
          <div className="modal-footer gap-2">
            <button className="btn btn-light flex-fill" onClick={onClose}>Cancel</button>
            <button className="btn btn-success fw-bold flex-fill" disabled={saving}
              onClick={async()=>{setSaving(true);await onSave(record._id,{...form,assessmentScore:form.assessmentScore?Number(form.assessmentScore):undefined});setSaving(false);}}>
              {saving?"Saving...":"Update Record"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz Questions Manager Modal (HR) ─────────────────────────
// HR picks a product OR a non-equipment program, then adds/edits/
// deletes 4-option MCQ questions for it. Equipment quizzes are pooled
// across every studied product; program quizzes belong to that one
// program directly (e.g. "Excel training").
function QuizQuestionsManagerModal({ onClose, showMsg }) {
  const [mode, setMode]           = useState("product"); // "product" | "program"
  const [products, setProducts]   = useState([]);
  const [programs, setPrograms]   = useState([]);
  const [productId, setProductId] = useState("");
  const [programId, setProgramId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadingQs, setLoadingQs] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = not editing, "new" = adding
  const [form, setForm] = useState({ questionText: "", options: ["", "", "", ""], correctOptionIndex: 0 });
  const [saving, setSaving]   = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const selectedId = mode === "product" ? productId : programId;

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("hrToken")}` });

  useEffect(() => {
    (async () => {
      try {
        const [prodRes, progRes] = await Promise.all([
          fetch(`${API_BASE}/api/products`, { headers: authHeaders() }),
          axios.get(`${API_BASE}/api/training/programs`),
        ]);
        const prodData = await prodRes.json();
        if (prodData.success) setProducts(prodData.data || []);
        // Only non-equipment programs get their own quiz here — equipment
        // programs are quizzed per-product via the "Product" tab above.
        setPrograms((progRes.data.data || []).filter(p => p.type !== "equipment"));
      } catch (e) { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const loadQuestions = useCallback(async (id, currentMode) => {
    if (!id) { setQuestions([]); return; }
    setLoadingQs(true);
    try {
      const params = currentMode === "product" ? { productId: id } : { programId: id };
      const res = await axios.get(`${API_BASE}/api/training/quiz-questions`, { params });
      setQuestions(res.data.data || []);
    } catch (e) { showMsg("Failed to load questions", "error"); }
    finally { setLoadingQs(false); }
  }, [showMsg]);

  useEffect(() => { loadQuestions(selectedId, mode); setEditingId(null); }, [selectedId, mode, loadQuestions]);

  // Switching tabs clears the other tab's selection so we don't
  // accidentally send both productId and programId together.
  const switchMode = (m) => {
    setMode(m);
    setProductId("");
    setProgramId("");
    setQuestions([]);
  };

  const resetForm = () => setForm({ questionText: "", options: ["", "", "", ""], correctOptionIndex: 0 });

  const startAdd = () => { resetForm(); setEditingId("new"); };
  const startEdit = (q) => {
    setForm({ questionText: q.questionText, options: [...q.options], correctOptionIndex: q.correctOptionIndex });
    setEditingId(q._id);
  };

  const handleSaveQuestion = async () => {
    if (!form.questionText.trim()) return showMsg("Question text required", "error");
    if (form.options.some(o => !o.trim())) return showMsg("All 4 options are required", "error");
    setSaving(true);
    try {
      if (editingId === "new") {
        const linkField = mode === "product" ? { productId: selectedId } : { programId: selectedId };
        await axios.post(`${API_BASE}/api/training/quiz-questions`, { ...linkField, ...form });
        showMsg("Question added!");
      } else {
        await axios.put(`${API_BASE}/api/training/quiz-questions/${editingId}`, form);
        showMsg("Question updated!");
      }
      setEditingId(null);
      resetForm();
      loadQuestions(selectedId, mode);
    } catch (e) { showMsg(e?.response?.data?.message || "Save failed", "error"); }
    finally { setSaving(false); }
  };

  const handleDeleteQuestion = async (q) => {
    if (!window.confirm("Delete this question?")) return;
    setDeletingId(q._id);
    try {
      await axios.delete(`${API_BASE}/api/training/quiz-questions/${q._id}`);
      showMsg("Question deleted");
      loadQuestions(selectedId, mode);
    } catch (e) { showMsg(e?.response?.data?.message || "Delete failed", "error"); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="modal show d-block" style={{ background: "rgba(15,23,42,.45)", zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
          <div className="modal-header border-bottom" style={{ background: "#f9fafb", borderRadius: "14px 14px 0 0" }}>
            <div className="d-flex align-items-center gap-2">
              <ClipboardList size={18} color="#8b5cf6" />
              <p className="mb-0 fw-bold" style={{ fontSize: 14 }}>Manage Quiz Questions</p>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {/* ✅ NEW — Product / Program tab toggle */}
            <div className="d-flex gap-2 mb-3">
              <button
                className={`btn btn-sm flex-fill ${mode === "product" ? "btn-primary fw-bold" : "btn-outline-secondary"}`}
                onClick={() => switchMode("product")}
              >
                Equipment Product
              </button>
              <button
                className={`btn btn-sm flex-fill ${mode === "program" ? "btn-primary fw-bold" : "btn-outline-secondary"}`}
                onClick={() => switchMode("program")}
              >
                Training Program
              </button>
            </div>

            {mode === "product" ? (
              <>
                <label style={labelStyle}>Select Product</label>
                <select className="form-select form-select-sm mb-3" value={productId} onChange={e => setProductId(e.target.value)} disabled={loading}>
                  <option value="">-- Select a Product --</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.productName} ({p.productCode})</option>)}
                </select>
              </>
            ) : (
              <>
                <label style={labelStyle}>Select Training Program</label>
                <select className="form-select form-select-sm mb-3" value={programId} onChange={e => setProgramId(e.target.value)} disabled={loading}>
                  <option value="">-- Select a Program --</option>
                  {programs.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </>
            )}

            {!selectedId && <p className="text-muted text-center py-4" style={{ fontSize: 13 }}>Select {mode === "product" ? "a product" : "a program"} to view or add its quiz questions.</p>}

            {selectedId && (
              <>
                {loadingQs ? (
                  <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-primary" /></div>
                ) : (
                  <div className="d-flex flex-column gap-2 mb-3">
                    {questions.length === 0 && <p className="text-muted" style={{ fontSize: 12 }}>No questions yet for this {mode === "product" ? "product" : "program"}.</p>}
                    {questions.map((q, i) => (
                      <div key={q._id} className="border rounded p-2" style={{ borderRadius: 9, fontSize: 12 }}>
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <p className="mb-1 fw-semibold" style={{ fontSize: 13 }}>{i + 1}. {q.questionText}</p>
                          <div className="d-flex gap-1 flex-shrink-0">
                            <button className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: 11 }} onClick={() => startEdit(q)}>
                              <Pencil size={11} />
                            </button>
                            <button className="btn btn-sm btn-outline-danger py-0 px-2" style={{ fontSize: 11 }}
                              onClick={() => handleDeleteQuestion(q)} disabled={deletingId === q._id}>
                              {deletingId === q._id ? <span className="spinner-border spinner-border-sm" style={{ width: 11, height: 11 }} /> : <Trash2 size={11} />}
                            </button>
                          </div>
                        </div>
                        <div className="d-flex flex-column gap-1 mt-1">
                          {q.options.map((o, oi) => (
                            <span key={oi} style={{ color: oi === q.correctOptionIndex ? "#10b981" : "#6b7280", fontWeight: oi === q.correctOptionIndex ? 700 : 400 }}>
                              {oi === q.correctOptionIndex ? "✓ " : "· "}{o}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {editingId ? (
                  <div className="border rounded p-3" style={{ borderRadius: 10, background: "#f9fafb" }}>
                    <label style={labelStyle}>Question</label>
                    <input className="form-control form-control-sm mb-2" value={form.questionText}
                      onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))} placeholder="e.g. What is the correct operating pressure?" />
                    <label style={labelStyle}>Options (select the correct one)</label>
                    {form.options.map((o, oi) => (
                      <div key={oi} className="d-flex align-items-center gap-2 mb-2">
                        <input type="radio" checked={form.correctOptionIndex === oi}
                          onChange={() => setForm(f => ({ ...f, correctOptionIndex: oi }))} />
                        <input className="form-control form-control-sm" value={o}
                          onChange={e => setForm(f => ({ ...f, options: f.options.map((x, xi) => xi === oi ? e.target.value : x) }))}
                          placeholder={`Option ${oi + 1}`} />
                      </div>
                    ))}
                    <div className="d-flex gap-2 mt-2">
                      <button className="btn btn-sm btn-light flex-fill" onClick={() => { setEditingId(null); resetForm(); }}>Cancel</button>
                      <button className="btn btn-sm btn-primary fw-bold flex-fill" onClick={handleSaveQuestion} disabled={saving}>
                        {saving ? "Saving..." : "Save Question"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={startAdd}>
                    <Plus size={13} /> Add Question
                  </button>
                )}
              </>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-light" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Training Program Modal ────────────────────────────
function CreateProgramModal({ onClose, onSave }) {
  const [title, setTitle]             = useState("");
  const [duration, setDuration]        = useState("");
  const [conductedBy, setConductedBy]  = useState("");
  const [modulesText, setModulesText]  = useState("");
  const [videoMode, setVideoMode]      = useState("youtube");
  const [youtubeUrl, setYoutubeUrl]    = useState("");
  const [videoFile, setVideoFile]      = useState(null);
  const [pdfFile, setPdfFile]          = useState(null); // ✅ NEW — optional PDF training material
  const [saving, setSaving]            = useState(false);
  const [error, setError]              = useState("");

  // ── Certification (optional toggle) ──
  const [hasCertification, setHasCertification] = useState(false);
  const [certification, setCertification]       = useState("");

  // ── Department: searchable dropdown ──
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [department, setDepartment]   = useState("all");
  const [deptQuery, setDeptQuery]     = useState("All Departments");
  const [deptOpen, setDeptOpen]       = useState(false);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/departments`);
        const data = await res.json();
        const all = data.data || data || [];
        setDepartments(all.filter(d => d.status === "active"));
      } catch { setDepartments([]); }
      finally { setDeptLoading(false); }
    };
    fetchDepts();
  }, []);

  const deptOptions = ["All Departments", ...departments.map(d => d.name)];

  const filteredDeptOptions = deptOptions.filter(d =>
    d.toLowerCase().includes(deptQuery.toLowerCase())
  );

  const pickDept = (d) => {
    setDepartment(d === "All Departments" ? "all" : d);
    setDeptQuery(d);
    setDeptOpen(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return setError("Title is required");
    setError("");
    setSaving(true);

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("department", department);
    fd.append("duration", duration);
    fd.append("certification", hasCertification ? certification.trim() : "");
    fd.append("conductedBy", conductedBy);

    const modules = modulesText.split(",").map(m => m.trim()).filter(Boolean);
    fd.append("modules", JSON.stringify(modules));

    if (videoMode === "youtube" && youtubeUrl.trim()) {
      fd.append("videoUrl", youtubeUrl.trim());
    } else if (videoMode === "upload" && videoFile) {
      fd.append("video", videoFile);
    }
    if (pdfFile) fd.append("pdf", pdfFile); // ✅ NEW

    try {
      await onSave(fd);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create program");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ background: "rgba(15,23,42,.45)", zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
          <div className="modal-header border-bottom" style={{ background: "#f9fafb", borderRadius: "14px 14px 0 0" }}>
            <div className="d-flex align-items-center gap-2">
              <Plus size={18} color="#10b981" />
              <p className="mb-0 fw-bold" style={{ fontSize: 14 }}>Create Training Program</p>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {error && <div className="alert alert-danger py-2" style={{ fontSize: 12 }}>{error}</div>}

            <div className="row g-3">
              <div className="col-12">
                <label style={labelStyle}>Title *</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Excel Training"
                />
              </div>

              {/* ── Searchable Department Dropdown ── */}
              <div className="col-12" style={{ position: "relative" }}>
                <label style={labelStyle}>Department</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={deptQuery}
                  onChange={e => { setDeptQuery(e.target.value); setDeptOpen(true); }}
                  onFocus={() => { setDeptQuery(""); setDeptOpen(true); }}
                  onBlur={() => setTimeout(() => {
                    setDeptOpen(false);
                    if (!deptQuery) setDeptQuery(department === "all" ? "All Departments" : department);
                  }, 150)}
                  placeholder={deptLoading ? "Loading departments..." : (department === "all" ? "All Departments" : department)}
                />
                {deptOpen && (
                  <div
                    style={{
                      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
                      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
                      marginTop: 4, maxHeight: 220, overflowY: "auto",
                      boxShadow: "0 6px 16px rgba(16,24,40,.12)",
                    }}
                  >
                    {filteredDeptOptions.length === 0 && (
                      <div style={{ padding: "8px 12px", fontSize: 12.5, color: "#9ca3af" }}>No matches</div>
                    )}
                    {filteredDeptOptions.map(d => (
                      <div
                        key={d}
                        onMouseDown={() => pickDept(d)}
                        style={{
                          padding: "8px 12px", fontSize: 13, cursor: "pointer",
                          background: department === (d === "All Departments" ? "all" : d) ? "#f3f4f6" : "#fff",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                        onMouseLeave={e => e.currentTarget.style.background =
                          department === (d === "All Departments" ? "all" : d) ? "#f3f4f6" : "#fff"}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-md-6">
                <label style={labelStyle}>Duration</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="e.g. 7 Days"
                />
              </div>

              {/* ── Certification (optional toggle) ── */}
              <div className="col-md-6">
                <label style={labelStyle}>Certification</label>
                <div className="form-check form-switch d-flex align-items-center gap-2 mb-2" style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 12px", border: "1px solid #e5e7eb" }}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={hasCertification}
                    onChange={e => { setHasCertification(e.target.checked); if (!e.target.checked) setCertification(""); }}
                    style={{ width: 34, height: 18 }}
                  />
                  <label className="form-check-label" style={{ fontSize: 12.5, fontWeight: 600 }}>
                    This training has a certification
                  </label>
                </div>
                {hasCertification && (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={certification}
                    onChange={e => setCertification(e.target.value)}
                    placeholder="e.g. Excel Proficiency Certificate"
                  />
                )}
              </div>

              <div className="col-12">
                <label style={labelStyle}>Conducted By</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={conductedBy}
                  onChange={e => setConductedBy(e.target.value)}
                  placeholder="e.g. HR & L&D"
                />
              </div>

              <div className="col-12">
                <label style={labelStyle}>Modules / Topics (comma separated)</label>
                <textarea
                  className="form-control form-control-sm"
                  rows="2"
                  value={modulesText}
                  onChange={e => setModulesText(e.target.value)}
                  placeholder="e.g. VLOOKUP, Pivot Table, Formulas, Charts"
                />
              </div>

              {/* ── Video source ── */}
              <div className="col-12">
                <label style={labelStyle}>Training Video</label>
                <div className="d-flex gap-2 mb-2">
                  <button
                    type="button"
                    className={`btn btn-sm ${videoMode === "youtube" ? "btn-primary" : "btn-light"}`}
                    style={{ fontSize: 12 }}
                    onClick={() => setVideoMode("youtube")}
                  >
                    YouTube Link
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${videoMode === "upload" ? "btn-primary" : "btn-light"}`}
                    style={{ fontSize: 12 }}
                    onClick={() => setVideoMode("upload")}
                  >
                    Upload Video File
                  </button>
                </div>

                {videoMode === "youtube" ? (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                ) : (
                  <input
                    type="file"
                    accept="video/*"
                    className="form-control form-control-sm"
                    onChange={e => setVideoFile(e.target.files[0] || null)}
                  />
                )}
              </div>

              {/* ── ✅ NEW — PDF training material (optional, independent of video) ── */}
              <div className="col-12">
                <label style={labelStyle}>Training PDF (optional)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  className="form-control form-control-sm"
                  onChange={e => setPdfFile(e.target.files[0] || null)}
                />
                {pdfFile && <p className="text-muted mb-0 mt-1" style={{ fontSize: 11 }}>{pdfFile.name}</p>}
              </div>
            </div>
          </div>

          <div className="modal-footer border-top">
            <button className="btn btn-sm btn-light" onClick={onClose}>Cancel</button>
            <button className="btn btn-sm btn-success fw-bold" onClick={handleSubmit} disabled={saving}>
              {saving ? "Creating..." : "Create Program"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main HR Component ────────────────────────────────────────
export default function TrainingRoadmapHR() {
  const [programs, setPrograms]   = useState([]);
  const [records, setRecords]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats]         = useState(null);
  const [compLog, setCompLog]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [toast, setToast]         = useState(null);
  const [modal, setModal]         = useState(null); // "assign"|"update"|"quizQuestions"
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeTab, setActiveTab] = useState("roadmap"); // "roadmap"|"records"|"compliance"|"kpi"
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept]     = useState("all");
  const [seeding, setSeeding]     = useState(false);
  const [deletingId, setDeletingId] = useState(null); // ✅ NEW — tracks which record is being deleted, for per-row spinner/disable
  const [deletingLogId, setDeletingLogId] = useState(null); // ✅ NEW — tracks which compliance log entry is being deleted
  const [expandedEmp, setExpandedEmp] = useState(null); // ✅ NEW — which employee's compliance log group is expanded

  const showMsg = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // ✅ NEW — silent self-heal, runs on every load/refresh: ensures
      // every product is linked to the single shared "Equipment Training"
      // program (merges any stray per-product programs, fixes dangling
      // links). No button, no confirm — just keeps things consistent.
      await axios.post(`${API_BASE}/api/training/consolidate-equipment`).catch(() => {});

      const params = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterDept   !== "all") params.department = filterDept;

      const [progRes, recRes, statsRes, empRes, logRes] = await Promise.all([
        axios.get(`${API_BASE}/api/training/programs`),
        axios.get(`${API_BASE}/api/training/records`, { params }),
        axios.get(`${API_BASE}/api/training/stats`),
        axios.get(`${API_BASE}/api/hr/employees`),
        axios.get(`${API_BASE}/api/training/compliance-log`, { params:{ limit:30 } }),
      ]);
      setPrograms(progRes.data.data || []);
      setRecords(recRes.data.data || []);
      setStats(statsRes.data.data);
      const allEmp = Array.isArray(empRes.data) ? empRes.data : [];
      setEmployees(allEmp.filter(e => e.status === "active"));
      setCompLog(logRes.data.data || []);
    } catch(e) { setError(e?.response?.data?.message || "Failed to load"); }
    finally { setLoading(false); }
  }, [filterStatus, filterDept]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ✅ CHANGED — was handleSeed (inserted 15 default dummy programs).
  // Now permanently wipes ALL training programs from the DB so the
  // roadmap only ever shows programs HR actually creates. fetchAll()
  // right after will silently re-heal the shared equipment program.
  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL training programs permanently? This cannot be undone.")) return;
    setSeeding(true);
    try {
      const res = await axios.delete(`${API_BASE}/api/training/programs`);
      showMsg(res.data.message);
      fetchAll(); // re-links every product to the shared equipment program automatically
    } catch(e) { showMsg(e?.response?.data?.message || "Clear failed","error"); }
    setSeeding(false);
  };

  const handleAssign = async (mode, data) => {
    try {
      if (mode === "single") {
        await axios.post(`${API_BASE}/api/training/assign`, data);
        showMsg("Training assigned successfully!");
      } else {
        await axios.post(`${API_BASE}/api/training/assign-bulk`, data);
        showMsg("Bulk assignment done!");
      }
      setModal(null);
      fetchAll();
    } catch(e) { showMsg(e?.response?.data?.message||"Failed","error"); }
  };

  const handleUpdate = async (id, data) => {
    try {
      await axios.put(`${API_BASE}/api/training/records/${id}`, data);
      showMsg("Record updated!");
      setModal(null);
      setSelectedRecord(null);
      fetchAll();
    } catch(e) { showMsg(e?.response?.data?.message||"Failed","error"); }
  };

  // ✅ NEW — deletes a single training record (the row-level Delete button
  // in the Records table). Confirms first, shows a per-row loading state,
  // then refreshes the list + stats.
  const handleDeleteRecord = async (record) => {
    const name = record.employeeId?.name || "this employee";
    const prog = record.programId?.title || "this program";
    if (!window.confirm(`Delete the training record for "${name}" — ${prog}? This cannot be undone.`)) return;
    setDeletingId(record._id);
    try {
      await axios.delete(`${API_BASE}/api/training/records/${record._id}`);
      showMsg("Training record deleted.");
      fetchAll();
    } catch(e) {
      showMsg(e?.response?.data?.message || "Delete failed", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ NEW — deletes a single compliance-log entry (row-level Delete
  // button on the Compliance Log tab). Independent of training records —
  // only removes the log line itself.
  const handleDeleteLog = async (log) => {
    const name = log.employeeId?.name || "this entry";
    if (!window.confirm(`Delete this compliance log entry for "${name}" — ${log.programTitle || "—"}? This cannot be undone.`)) return;
    setDeletingLogId(log._id);
    try {
      await axios.delete(`${API_BASE}/api/training/compliance-log/${log._id}`);
      showMsg("Compliance log entry deleted.");
      fetchAll();
    } catch(e) {
      showMsg(e?.response?.data?.message || "Delete failed", "error");
    } finally {
      setDeletingLogId(null);
    }
  };

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchSearch = !search.trim() ||
      r.employeeId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.programId?.title?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="container-fluid py-4" style={{ maxWidth:1400 }}>

      {toast && <div className={`alert alert-${toast.type==="error"?"danger":"success"} position-fixed top-0 end-0 m-3`} style={{ zIndex:9999, fontSize:13 }}>{toast.msg}</div>}

      {modal === "assign" && <AssignModal programs={programs} employees={employees} onClose={()=>setModal(null)} onSave={handleAssign} />}
      {modal === "update" && selectedRecord && <UpdateRecordModal record={selectedRecord} onClose={()=>{setModal(null);setSelectedRecord(null);}} onSave={handleUpdate} />}
      {modal === "quizQuestions" && <QuizQuestionsManagerModal onClose={()=>setModal(null)} showMsg={showMsg} />}
      {modal === "createProgram" && <CreateProgramModal onClose={()=>setModal(null)} onSave={async(fd)=>{ await axios.post(`${API_BASE}/api/training/programs`, fd, {headers:{'Content-Type':'multipart/form-data'}}); setModal(null); fetchAll(); showMsg("Training program created!"); }} />} 
      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <GraduationCap size={22} color="#fff" />
          </div>
          <div>
            <h4 className="mb-0 fw-bold">Training Roadmap</h4>
            <p className="mb-0 text-muted" style={{ fontSize:12 }}>Job-Role Based Mandatory Training (RCA)</p>
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {/* ✅ CHANGED — was the "Seed Default Programs" button (shown when
              programs.length === 0). Now a "Clear All Programs" button,
              shown when there ARE programs, so HR can wipe seeded/old data. */}
          {programs.length > 0 && (
            <button className="btn btn-sm btn-outline-danger fw-bold" onClick={handleClearAll} disabled={seeding}>
              {seeding ? "Clearing..." : "🗑 Clear All Programs"}
            </button>
          )}
          {/* ✅ REMOVED — "Restore Equipment Programs" / "Merge Equipment
              Programs" buttons. That work now happens silently inside
              fetchAll() on every load/refresh — every product always ends
              up linked to the one shared equipment program automatically,
              no manual step needed. */}
          {/* <button className="btn btn-sm btn-light d-flex align-items-center gap-1" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={13} /> Refresh
          </button> */}
          {/* ✅ NEW — HR authors the MCQ question bank used by the employee quiz */}
          <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 fw-bold" onClick={()=>setModal("quizQuestions")}>
            <ClipboardList size={14} /> Manage Quiz Questions
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-2 fw-bold" onClick={()=>setModal("assign")}>
            <Plus size={14} /> Assign Training
          </button>
          <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-2 fw-bold" onClick={()=>setModal("createProgram")}>
  <Plus size={14} /> Create Training
</button>
        </div>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col"><StatCard label="Total Assigned"    value={stats.total}          color="#111827" bg="#f3f4f6" icon={<BookOpen size={15}/>} /></div>
          <div className="col"><StatCard label="Completion Rate"   value={`${stats.completionRate}%`} sub={`Target ≥ 95%`} color={stats.completionRate>=95?"#10b981":"#ef4444"} bg={stats.completionRate>=95?"#ecfdf5":"#fef2f2"} icon={<CheckCircle2 size={15}/>} /></div>
          <div className="col"><StatCard label="In Progress"       value={stats.inProgress}     color="#3b82f6" bg="#eff6ff" icon={<Clock size={15}/>} /></div>
          <div className="col"><StatCard label="Overdue"           value={stats.overdue}        color="#ef4444" bg="#fef2f2" icon={<AlertTriangle size={15}/>} /></div>
          <div className="col"><StatCard label="Avg Score"         value={`${stats.avgScore}%`} sub="Target ≥ 80%" color={stats.avgScore>=80?"#10b981":"#f59e0b"} bg={stats.avgScore>=80?"#ecfdf5":"#fffbeb"} icon={<Target size={15}/>} /></div>
          <div className="col"><StatCard label="Certified"         value={stats.certified}      color="#8b5cf6" bg="#f5f3ff" icon={<Award size={15}/>} /></div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {[
          { key:"roadmap",    label:"Training Roadmap",       icon:<Layers size={13}/> },
          { key:"records",    label:`Records (${records.length})`, icon:<ClipboardList size={13}/> },
          { key:"compliance", label:`Compliance Log (${new Set(compLog.map(l => l.employeeId?._id || "unknown")).size})`, icon:<FileText size={13}/> },
          { key:"kpi",        label:"KPI Dashboard",          icon:<BarChart2 size={13}/> },
        ].map(tab=>(
          <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
            className={`btn btn-sm d-flex align-items-center gap-1 ${activeTab===tab.key?"btn-primary":"btn-light"}`}
            style={{ fontSize:12 }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* ══ ROADMAP TAB ══════════════════════════════════════════ */}
      {activeTab === "roadmap" && (
        <div>
          {/* Framework strip */}
          <div className="d-flex flex-wrap gap-3 mb-4">
            {[
              { stage: "Learn", icon: <BookOpen size={16} />, focus: "Foundation & Skill Learning", outcome: "Acquire job knowledge",         color: "#3b82f6" },
              { stage: "Apply", icon: <Target size={16} />,   focus: "Real-world Implementation",   outcome: "Demonstrate proficiency",       color: "#8b5cf6" },
              { stage: "Lead",  icon: <TrendingUp size={16} />,focus: "Coaching & Mentorship",       outcome: "Guide others, build leadership", color: "#10b981" },
            ].map((s, i) => (
              <div key={s.stage} className="d-flex align-items-center flex-fill" style={{ minWidth: 220 }}>
                <div className="d-flex align-items-center gap-3 flex-fill" style={{
                  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px",
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, background: `${s.color}14`, color: s.color,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {s.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="mb-0 fw-bold" style={{ fontSize: 13, color: "#111827" }}>{s.stage}</p>
                    <p className="mb-0 text-muted text-truncate" style={{ fontSize: 11 }}>{s.focus}</p>
                  </div>
                </div>
                {i < 2 && (
                  <ChevronRight size={16} color="#d1d5db" className="d-none d-lg-block flex-shrink-0" style={{ margin: "0 -2px" }} />
                )}
              </div>
            ))}
          </div>

          {/* Active Training Programs — real data, no placeholder L1-L6 levels */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <p className="fw-bold mb-0" style={{ fontSize: 14 }}>Active Training Programs</p>
            <span className="text-muted" style={{ fontSize: 12 }}>{programs.filter(p=>p.isActive!==false).length} program{programs.length===1?"":"s"}</span>
          </div>

          {programs.filter(p=>p.isActive!==false).length === 0 ? (
            <div className="card border-0 shadow-sm text-center py-5" style={{ borderRadius: 13 }}>
              <Layers size={36} className="text-muted mb-3 mx-auto" />
              <p className="text-muted mb-3">No training programs yet.</p>
              <button className="btn btn-primary btn-sm mx-auto" style={{ width: "fit-content" }} onClick={()=>setModal("assign")}>
                <Plus size={13} /> Assign Training
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {programs.filter(p=>p.isActive!==false).map(p => {
                const typ = TYPE_CONFIG[p.type] || TYPE_CONFIG.job_role;
                const progRecords = records.filter(r => r.programId?._id === p._id);
                const assignedCount = progRecords.length;
                const completedCount = progRecords.filter(r => r.status === "completed").length;
                const completionPct = assignedCount ? Math.round((completedCount / assignedCount) * 100) : 0;
                return (
                  <div key={p._id} className="col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 13, borderTop: `3px solid ${typ.color}` }}>
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                          <p className="fw-bold mb-0" style={{ fontSize: 14, color: "#111827", lineHeight: 1.3 }}>{p.title}</p>
                          <span className="badge flex-shrink-0" style={{ background: typ.bg, color: typ.color, fontSize: 10, fontWeight: 700 }}>{typ.label}</span>
                        </div>

                        {p.modules?.length > 0 && (
                          <div className="mb-2">
                            {p.modules.slice(0, 4).map((m, i) => (
                              <div key={i} className="d-flex align-items-start gap-1 mb-1">
                                <Check size={11} color={typ.color} style={{ flexShrink: 0, marginTop: 2 }} />
                                <span style={{ fontSize: 12, color: "#374151" }}>{m}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="d-flex flex-wrap gap-2 mb-3" style={{ fontSize: 11, color: "#6b7280" }}>
                          {p.duration && <span className="d-flex align-items-center gap-1"><Clock size={11} />{p.duration}</span>}
                          {p.conductedBy && <span className="d-flex align-items-center gap-1"><UserCheck size={11} />{p.conductedBy}</span>}
                          {p.frequency && p.frequency !== "once" && <span className="d-flex align-items-center gap-1"><RefreshCw size={11} />{p.frequency.replace("_"," ")}</span>}
                        </div>

                        {p.certification && (
                          <div className="d-flex align-items-center gap-2 mb-3" style={{ background: `${typ.color}0d`, borderRadius: 8, padding: "7px 10px" }}>
                            <Award size={13} color={typ.color} style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: typ.color, fontWeight: 600 }}>{p.certification}</span>
                          </div>
                        )}

                        {/* Live stats */}
                        <div className="mt-auto pt-2" style={{ borderTop: "1px solid #f3f4f6" }}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span style={{ fontSize: 11, color: "#6b7280" }}>{assignedCount} assigned · {completedCount} completed</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: completionPct >= 80 ? "#10b981" : "#3b82f6" }}>{completionPct}%</span>
                          </div>
                          <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${completionPct}%`, background: completionPct >= 80 ? "#10b981" : "#3b82f6", transition: "width .3s" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ RECORDS TAB ══════════════════════════════════════════ */}
      {activeTab === "records" && (
        <div>
          {/* Filters */}
          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius:10 }}>
            <div className="card-body py-2 px-3 d-flex gap-3 align-items-center flex-wrap">
              <div className="input-group input-group-sm" style={{ maxWidth:240 }}>
                <span className="input-group-text border-end-0 bg-white"><Search size={13} color="#9ca3af"/></span>
                <input className="form-control border-start-0" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <select className="form-select form-select-sm" style={{ maxWidth:150 }} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="form-select form-select-sm" style={{ maxWidth:200 }} value={filterDept} onChange={e=>setFilterDept(e.target.value)}>
                <option value="all">All Departments</option>
                {DEPARTMENTS.filter(d=>d!=="all").map(d=><option key={d} value={d}>{d}</option>)}
              </select>
              <span className="text-muted ms-auto" style={{ fontSize:12 }}>{filteredRecords.length} records</span>
              {loading && <div className="spinner-border spinner-border-sm text-primary"/>}
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="text-center py-5">
              <BookOpen size={40} className="text-muted mb-3"/>
              <p className="text-muted">No training records found.</p>
              <button className="btn btn-primary btn-sm mt-2" onClick={()=>setModal("assign")}>
                <Plus size={13}/> Assign First Training
              </button>
            </div>
          ) : (
            <div className="card border-0 shadow-sm" style={{ borderRadius:12, overflow:"hidden" }}>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize:13 }}>
                  <thead className="table-light">
                    <tr>
                      <th>Employee</th>
                      <th>Program</th>
                      <th>Level/Type</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Cert</th>
                      <th>Due Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(r=>{
                      const st  = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                      const typ = TYPE_CONFIG[r.programId?.type] || TYPE_CONFIG.job_role;
                      const lvl = LEVEL_CONFIG[r.programId?.level];
                      const isOverdue = r.dueDate && new Date(r.dueDate) < new Date() && r.status !== "completed";
                      const isDeleting = deletingId === r._id; // ✅ NEW
                      return (
                        <tr key={r._id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div style={{ width:30, height:30, borderRadius:"50%", background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#3b82f6", fontSize:12, flexShrink:0 }}>
                                {r.employeeId?.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="mb-0 fw-bold" style={{ fontSize:13 }}>{r.employeeId?.name}</p>
                                <p className="mb-0 text-muted" style={{ fontSize:11 }}>{r.employeeId?.department}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <p className="mb-0 fw-semibold" style={{ fontSize:12 }}>{r.programId?.title}</p>
                            <p className="mb-0 text-muted" style={{ fontSize:11 }}>{r.programId?.duration}</p>
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              {lvl && <span className="badge" style={{ background:lvl.color, fontSize:10 }}>{r.programId?.level}</span>}
                              <span className="badge" style={{ background:typ.bg, color:typ.color, fontSize:10 }}>{typ.label}</span>
                            </div>
                          </td>
                                                  <td>
                            <span className="badge" style={{ background:st.bg, color:st.color, border:`1px solid ${st.color}33`, fontSize:11 }}>
                              {isOverdue && r.status!=="completed" ? "Overdue" : st.label}
                            </span>
                            {r.submittedForReview && r.status !== "completed" && (
                              <span className="badge" style={{ background:"#fffbeb", color:"#92400e", border:"1px solid #fde68a", fontSize:10, marginTop:4, display:"block" }}>
                                Submitted by employee
                              </span>
                            )}
                          </td>
                          <td>
                            {r.assessmentScore !== null && r.assessmentScore !== undefined ? (
                              <span style={{ fontSize:13, fontWeight:700, color:r.assessmentScore>=80?"#10b981":"#ef4444" }}>
                                {r.assessmentScore}%
                              </span>
                            ) : <span className="text-muted" style={{ fontSize:11 }}>—</span>}
                          </td>
                          <td>
                            {r.certificationIssued
                              ? <span style={{ color:"#10b981" }}><Award size={14}/></span>
                              : <span className="text-muted" style={{ fontSize:11 }}>—</span>}
                          </td>
                          <td className="text-muted" style={{ fontSize:11 }}>
                            {r.dueDate ? (
                              <span style={{ color:isOverdue?"#ef4444":"inherit" }}>
                                {new Date(r.dueDate).toLocaleDateString("en-IN")}
                              </span>
                            ) : "—"}
                          </td>
                          <td>
                            {/* ✅ CHANGED — Action cell now has Update + Delete side by side */}
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize:11 }}
                                onClick={()=>{ setSelectedRecord(r); setModal("update"); }}
                                disabled={isDeleting}>
                                Update
                              </button>
                              {/* ✅ NEW — Delete button, confirms then calls DELETE /api/training/records/:id */}
                              <button className="btn btn-sm btn-outline-danger py-0 px-2 d-flex align-items-center gap-1" style={{ fontSize:11 }}
                                onClick={()=>handleDeleteRecord(r)}
                                disabled={isDeleting}
                                title="Delete this training record">
                                {isDeleting ? (
                                  <span className="spinner-border spinner-border-sm" style={{ width:11, height:11 }} />
                                ) : (
                                  <Trash2 size={11} />
                                )}
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ COMPLIANCE LOG TAB ═══════════════════════════════════ */}
      {activeTab === "compliance" && (
        <div>
          <div className="d-flex align-items-center gap-2 mb-3">
            <FileText size={16} color="#3b82f6" />
            <p className="mb-0 fw-bold" style={{ fontSize:14 }}>Training Compliance Log (HRF–TR–01)</p>
          </div>
          <div className="alert d-flex align-items-start gap-2 mb-3" style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, fontSize:12 }}>
            <Info size={14} color="#3b82f6" style={{ flexShrink:0, marginTop:1 }}/>
            <p className="mb-0" style={{ color:"#1e40af" }}>
              All trainings are tracked via RCA (Radnus Corporate Academy). HR will maintain this compliance log with completion reports. Managers must ensure 100% training compliance before confirming employee probation or promotion.
            </p>
          </div>
          {compLog.length === 0 ? (
            <div className="text-center py-5"><FileText size={36} className="text-muted mb-3"/><p className="text-muted">No compliance logs yet.</p></div>
          ) : (
            // ✅ CHANGED — one row per employee (was one row per log entry).
            // compLog is already sorted newest-first by the backend, so the
            // first log encountered per employee while grouping is their latest.
            (() => {
              const groups = [];
              const byEmp = new Map();
              compLog.forEach(l => {
                const key = l.employeeId?._id || "unknown";
                if (!byEmp.has(key)) {
                  const g = { employee: l.employeeId, logs: [] };
                  byEmp.set(key, g);
                  groups.push(g);
                }
                byEmp.get(key).logs.push(l);
              });

              return (
                <div className="card border-0 shadow-sm" style={{ borderRadius:12, overflow:"hidden" }}>
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0" style={{ fontSize:13 }}>
                      <thead className="table-light">
                        <tr><th></th><th>Employee</th><th>Program</th><th>Status</th><th>Latest Update</th><th>Last Activity</th><th></th></tr>
                      </thead>
                      <tbody>
                        {groups.map((g) => {
                          const empId = g.employee?._id;
                          const isOpen = expandedEmp === empId;
                          const latest = g.logs[0];
                          // Live status comes from the actual training record when we can find
                          // one for this employee — falls back to the latest log's action.
                          const liveRecord = records.find(r => r.employeeId?._id === empId);
                          const st = liveRecord ? (STATUS_CONFIG[liveRecord.status] || STATUS_CONFIG.pending) : null;
                          return (
                            <React.Fragment key={empId}>
                              <tr style={{ cursor:"pointer" }} onClick={()=>setExpandedEmp(isOpen ? null : empId)}>
                                <td style={{ width:24 }}>
                                  <ChevronRight size={14} color="#9ca3af" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition:"transform .15s" }} />
                                </td>
                                <td>
                                  <p className="mb-0 fw-semibold" style={{ fontSize:13 }}>{g.employee?.name || "—"}</p>
                                  <p className="mb-0 text-muted" style={{ fontSize:11 }}>{g.employee?.department}</p>
                                </td>
                                <td className="text-muted" style={{ fontSize:12 }}>{latest?.programTitle || "—"}</td>
                                <td>
                                  {st ? (
                                    <span className="badge" style={{ background:st.bg, color:st.color, border:`1px solid ${st.color}33`, fontSize:11 }}>{st.label}</span>
                                  ) : (
                                    <span className="badge bg-light text-dark" style={{ fontSize:11 }}>{latest?.action?.replace("_"," ")}</span>
                                  )}
                                </td>
                                <td className="text-muted" style={{ fontSize:11 }}>{latest?.note || "—"}</td>
                                <td className="text-muted" style={{ fontSize:11 }}>{new Date(latest?.date).toLocaleDateString("en-IN")}</td>
                                <td>
                                  {/* ✅ NEW — click to open the same status dropdown used in Records tab.
                                      This is how HR reviews a submitted quiz and marks it Completed. */}
                                  {liveRecord && (
                                    <button
                                      className="btn btn-sm btn-outline-primary py-0 px-2"
                                      style={{ fontSize:11 }}
                                      onClick={(e) => { e.stopPropagation(); setSelectedRecord(liveRecord); setModal("update"); }}
                                    >
                                      Review
                                    </button>
                                  )}
                                </td>
                              </tr>
                              {isOpen && (
                                <tr>
                                  <td></td>
                                  <td colSpan={6} style={{ background:"#f9fafb", padding:0 }}>
                                    <table className="table table-sm mb-0" style={{ fontSize:12 }}>
                                      <thead>
                                        <tr className="text-muted">
                                          <th style={{ fontWeight:600 }}>Date</th>
                                          <th style={{ fontWeight:600 }}>Action</th>
                                          <th style={{ fontWeight:600 }}>Note</th>
                                          <th style={{ fontWeight:600 }}>By</th>
                                          <th></th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {g.logs.map((l) => {
                                          const actionColor = {
                                            assigned:"#3b82f6", started:"#f59e0b", completed:"#10b981",
                                            overdue:"#ef4444", score_updated:"#8b5cf6", cert_issued:"#10b981", waived:"#6b7280", needs_hr_review:"#dc2626"
                                          }[l.action] || "#6b7280";
                                          return (
                                            <tr key={l._id}>
                                              <td className="text-muted" style={{ fontSize:11 }}>{new Date(l.date).toLocaleDateString("en-IN")}</td>
                                              <td><span className="badge" style={{ background:`${actionColor}20`, color:actionColor, fontSize:11 }}>{l.action?.replace("_"," ")}</span></td>
                                              <td className="text-muted" style={{ fontSize:11 }}>{l.note || "—"}</td>
                                              <td className="text-muted" style={{ fontSize:11 }}>{l.addedBy}</td>
                                              <td>
                                                <button className="btn btn-sm btn-outline-danger py-0 px-2 d-flex align-items-center gap-1" style={{ fontSize:11 }}
                                                  onClick={()=>handleDeleteLog(l)}
                                                  disabled={deletingLogId === l._id}
                                                  title="Delete this log entry">
                                                  {deletingLogId === l._id ? (
                                                    <span className="spinner-border spinner-border-sm" style={{ width:11, height:11 }} />
                                                  ) : (
                                                    <Trash2 size={11} />
                                                  )}
                                                  Delete
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ══ KPI TAB ══════════════════════════════════════════════ */}
      {activeTab === "kpi" && (
        <div>
          <p className="fw-bold mb-3" style={{ fontSize:14 }}>Performance Indicators (KPIs)</p>
          <div className="row g-3 mb-4">
            {[
              { kpi:"Training Completion Rate",                    target:"≥ 95%",             freq:"Quarterly",  current:`${stats?.completionRate||0}%`,  pass:(stats?.completionRate||0)>=95 },
              { kpi:"Post-Training Assessment Score",              target:"≥ 80%",             freq:"Monthly",    current:`${stats?.avgScore||0}%`,          pass:(stats?.avgScore||0)>=80 },
              { kpi:"New Hire Certification Completion",           target:"100% within 30 days",freq:"Ongoing",  current:`${stats?.certified||0} certified`, pass:true },
              { kpi:"Cross-Functional Certification Rate",         target:"≥ 60%",             freq:"Half-Yearly",current:"—",                               pass:null },
              { kpi:"Leadership Readiness (Internal Promotion)",   target:"≥ 20%",             freq:"Annual",     current:"—",                               pass:null },
            ].map((k,i)=>(
              <div key={i} className="col-md-6">
                <div className="card border-0 shadow-sm" style={{ borderRadius:12, borderLeft:`4px solid ${k.pass===null?"#e5e7eb":k.pass?"#10b981":"#ef4444"}` }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <p className="mb-0 fw-bold" style={{ fontSize:13 }}>{k.kpi}</p>
                      {k.pass !== null && (
                        <span style={{ color:k.pass?"#10b981":"#ef4444" }}>
                          {k.pass ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
                        </span>
                      )}
                    </div>
                    <div className="d-flex gap-3 mt-2" style={{ fontSize:12 }}>
                      <span className="text-muted">Target: <strong>{k.target}</strong></span>
                      <span className="text-muted">·</span>
                      <span className="text-muted">{k.freq}</span>
                    </div>
                    <p className="mb-0 mt-1" style={{ fontSize:13, fontWeight:700, color:k.pass===null?"#6b7280":k.pass?"#10b981":"#ef4444" }}>
                      Current: {k.current}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dept completion breakdown */}
          {stats?.byDept?.length > 0 && (
            <div className="card border-0 shadow-sm" style={{ borderRadius:12 }}>
              <div className="card-body">
                <p className="fw-bold mb-3" style={{ fontSize:14 }}>Department-wise Completion</p>
                <div className="d-flex flex-column gap-3">
                  {stats.byDept.map((d,i)=>{
                    const rate = d.total > 0 ? Math.round((d.completed/d.total)*100) : 0;
                    return (
                      <div key={i}>
                        <div className="d-flex justify-content-between mb-1">
                          <span style={{ fontSize:13 }}>{d._id || "Unknown"}</span>
                          <span style={{ fontSize:13, fontWeight:700 }}>{d.completed}/{d.total} ({rate}%)</span>
                        </div>
                        <div style={{ height:8, background:"#f3f4f6", borderRadius:4 }}>
                          <div style={{ height:8, background:rate>=95?"#10b981":rate>=70?"#f59e0b":"#ef4444", borderRadius:4, width:`${rate}%`, transition:"width .3s" }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}