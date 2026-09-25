import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { uploadVideoChunked, uploadPdfDirect } from "../../utils/cloudinaryChunkedUpload";
import {
  BookOpen, Users, Target, Award, CheckCircle2, Clock,
  AlertTriangle, Plus, Pencil, X, Check, RefreshCw,
  ChevronRight, BarChart2, Layers, FileText, Search,
  Filter, Download, TrendingUp, Star, Zap, Info,
  UserCheck, Calendar, GraduationCap, ClipboardList, Trash2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ── Video length helpers ─────────────────────────────────────────
// Chapter length is auto-detected (Cloudinary upload response / first play),
// never typed by HR. Program length = total of its chapters when all are known.
const fmtVideoLen = (sec) => {
  const mins = Math.max(1, Math.round(Number(sec) / 60));
  const h = Math.floor(mins / 60), m = mins % 60;
  return h ? `${h} hr${m ? ` ${m} min` : ""}` : `${m} min`;
};
const parseVideoLen = (str) => {
  const h = /(\d+)\s*hr/i.exec(str || ""), m = /(\d+)\s*min/i.exec(str || "");
  return ((h ? +h[1] : 0) * 60 + (m ? +m[1] : 0)) * 60;
};
const programLength = (p) => {
  if (p?.chapters?.length) {
    const secs = p.chapters.map(c => parseVideoLen(c.duration));
    return secs.every(x => x > 0) ? fmtVideoLen(secs.reduce((a, b) => a + b, 0)) : "";
  }
  return p?.duration || "";
};

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
absent:          { label: "Absent / Not Attended", color: "#9f1239", bg: "#f3f4f6" },
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

// ─── Chapter Progress Helper ────────────────────────────────────
// ✅ NEW — for a multi-chapter course record, boils down record.chapterProgress
// + programId.chapters into one summary object: how many chapters are done,
// where the employee currently is, whether they look "stuck", and how the
// chapter-level quizzes (separate from the Final Test) are going. Returns
// null for a non-chapter program so callers can just skip rendering.
const STUCK_QUIZ_ATTEMPTS = 3;   // 3+ failed attempts on the current chapter's quiz
const STUCK_IDLE_DAYS     = 5;   // no activity at all for 5+ days
function getChapterInfo(record) {
  const chapters = record.programId?.chapters || [];
  const total = chapters.length;
  if (!total) return null;

  const sorted = [...chapters].sort((a, b) => a.chapterNo - b.chapterNo);
  const cpByNo = new Map((record.chapterProgress || []).map(cp => [cp.chapterNo, cp]));
  const completed = sorted.filter(c => cpByNo.get(c.chapterNo)?.watched).length;
  const percent = Math.round((completed / total) * 100);

  const currentChapter = sorted.find(c => !cpByNo.get(c.chapterNo)?.watched) || null;
  const currentCp = currentChapter ? cpByNo.get(currentChapter.chapterNo) : null;
  const currentHasQuiz = (currentChapter?.quizQuestions?.length || 0) > 0;
  const currentAttempts = currentCp?.quizAttempts?.length || 0;
  const currentBestScore = currentCp?.quizAttempts?.length
    ? Math.max(...currentCp.quizAttempts.map(a => a.score || 0))
    : null;

  // Most recent activity anywhere in the course — used only for the
  // "no progress in N days" stuck signal.
  const activityDates = [];
  (record.chapterProgress || []).forEach(cp => {
    if (cp.watchedAt) activityDates.push(new Date(cp.watchedAt));
    if (cp.contentDoneAt) activityDates.push(new Date(cp.contentDoneAt));
    (cp.quizAttempts || []).forEach(a => { if (a.attemptedAt) activityDates.push(new Date(a.attemptedAt)); });
  });
  if (record.startedDate) activityDates.push(new Date(record.startedDate));
  const lastActivity = activityDates.length ? new Date(Math.max(...activityDates.map(d => d.getTime()))) : null;
  const daysSinceActivity = lastActivity ? Math.floor((Date.now() - lastActivity.getTime()) / 86400000) : null;

  const stuckOnQuiz = currentHasQuiz && currentAttempts >= STUCK_QUIZ_ATTEMPTS;
  const stuckOnIdle = daysSinceActivity !== null && daysSinceActivity >= STUCK_IDLE_DAYS;
  const stuck = completed < total && (stuckOnQuiz || stuckOnIdle);

  const quizChapters = sorted.filter(c => (c.quizQuestions?.length || 0) > 0);
  const quizPassedCount = quizChapters.filter(c => cpByNo.get(c.chapterNo)?.watched).length;

  return {
    total, completed, percent, sorted, cpByNo,
    currentChapter, currentCp, currentHasQuiz, currentAttempts, currentBestScore,
    stuck, stuckOnQuiz, stuckOnIdle, daysSinceActivity,
    quizChapterCount: quizChapters.length, quizPassedCount,
  };
}

// Small colour/label lookup the chip and the modal both use, so a
// program's progress always reads the same way everywhere in HR.
function chapterInfoStyle(info) {
  if (info.completed === 0) return { bg: "#f3f4f6", color: "#6b7280", label: "Not started" };
  if (info.percent === 100) return { bg: "#d1fae5", color: "#059669", label: "All chapters done" };
  if (info.stuck)           return { bg: "#ffedd5", color: "#c2410c", label: "Stuck" };
  return { bg: "#dbeafe", color: "#2563eb", label: "In progress" };
}

// ─── Chapter Progress Chip ──────────────────────────────────────
// ✅ NEW — compact "42/50 chapters" pill for the Records and Compliance
// Log tables, so HR can spot a stuck employee at a glance without
// opening every record. Renders nothing for non-chapter programs.
function ChapterProgressChip({ record }) {
  const info = getChapterInfo(record);
  if (!info) return null;
  const s = chapterInfoStyle(info);
  const title = info.stuck
    ? (info.stuckOnQuiz
        ? `Stuck on Chapter ${info.currentChapter?.chapterNo} — quiz attempted ${info.currentAttempts} times`
        : `No activity for ${info.daysSinceActivity}+ days`)
    : `${info.completed} of ${info.total} chapters completed`;
  return (
    <span
      title={title}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, background: s.bg, color: s.color, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700, marginTop: 4 }}
    >
      {info.completed}/{info.total} chapters
      {info.stuck && info.percent < 100 ? " · stuck" : ""}
    </span>
  );
}

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
  const [dueAuto, setDueAuto]   = useState(false); // true while dueDate was auto-filled from the course end date
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [deptFilter, setDeptFilter] = useState("all");
const [modal, setModal] = useState(null);

  const employeeDepts = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();
  const filteredEmployees = deptFilter === "all" ? employees : employees.filter(e => e.department === deptFilter);

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
  const selectAllFiltered = () => setEmpIds(prev => [...new Set([...prev, ...filteredEmployees.map(e=>e._id)])]);
  const clearAllFiltered   = () => setEmpIds(prev => prev.filter(id => !filteredEmployees.some(e=>e._id===id)));

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
                <select className="form-select form-select-sm" value={programId} onChange={e=>{
                  const id = e.target.value;
                  setProgId(id);
                  const p = programs.find(x => x._id === id);
                  if (p?.accessEndDate && (!dueDate || dueAuto)) { setDueDate(new Date(p.accessEndDate).toISOString().slice(0,10)); setDueAuto(true); }
                }}>
                  <option value="">-- Select Program --</option>
                  {programs.map(p=>(
                    <option key={p._id} value={p._id}>{p.title} ({LEVEL_CONFIG[p.level]?.label || p.level})</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label style={labelStyle}>Due Date (deadline)</label>
                <input type="date" className="form-control form-control-sm" value={dueDate}
                  max={(() => { const p = programs.find(x => x._id === programId); return p?.accessEndDate ? new Date(p.accessEndDate).toISOString().slice(0,10) : undefined; })()}
                  onChange={e=>{ setDueDate(e.target.value); setDueAuto(false); }} />
                <div className="text-muted" style={{ fontSize: 10.5, marginTop: 3 }}>
                  Employee shows as Overdue after this date. Auto-filled from the course end date; leave blank for no deadline.
                </div>
              </div>

               {mode === "single" ? (
                <div className="col-12">
                  <label style={labelStyle}>Employee *</label>
                  <select className="form-select form-select-sm mb-2" value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}>
                    <option value="all">All Departments</option>
                    {employeeDepts.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className="form-select form-select-sm" value={employeeId} onChange={e=>setEmpId(e.target.value)}>
                    <option value="">-- Select Employee --</option>
                    {filteredEmployees.map(e=><option key={e._id} value={e._id}>{e.name} — {e.department}</option>)}
                  </select>
                </div>
              ) : (
                <div className="col-12">
                  <label style={labelStyle}>Select Employees ({employeeIds.length} selected)</label>
                  <div className="d-flex gap-2 mb-2 align-items-center flex-wrap">
                    <select className="form-select form-select-sm" style={{ maxWidth:220 }} value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}>
                      <option value="all">All Departments</option>
                      {employeeDepts.map(d=><option key={d} value={d}>{d}</option>)}
                    </select>
                    <button type="button" className="btn btn-sm btn-outline-primary" style={{ fontSize:11 }} onClick={selectAllFiltered}>
                      Select All {deptFilter !== "all" ? `(${deptFilter})` : ""}
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary" style={{ fontSize:11 }} onClick={clearAllFiltered}>
                      Clear {deptFilter !== "all" ? `(${deptFilter})` : "All"}
                    </button>
                  </div>
                  <div style={{ maxHeight:200, overflowY:"auto", border:"1px solid #e5e7eb", borderRadius:8, padding:"8px" }}>
                    {filteredEmployees.length === 0 && (
                      <p className="text-muted mb-0" style={{ fontSize:12.5 }}>No employees in this department.</p>
                    )}
                    {filteredEmployees.map(e=>(
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
  const [showChapters, setShowChapters] = useState(false); // ✅ NEW — full chapter list, collapsed by default
  const lastAttempt = record.quizAttempts?.[record.quizAttempts.length - 1]; // ✅ NEW — latest quiz submission, for HR context
  const chapterInfo = getChapterInfo(record); // ✅ NEW — null for non-chapter programs

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
            {/* ✅ NEW — Chapter Progress: multi-chapter courses only. Shows
                exactly where the employee is in the 50-chapter course (not
                just the Final Test result below) — how many chapters are
                done, which one they're stuck on, and how the per-chapter
                quizzes are going — without dumping all 50 rows by default. */}
            {chapterInfo && (
              <div style={{ background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:9, padding:"12px 14px" }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <p className="mb-0 fw-bold" style={{ fontSize:12.5 }}>Chapter Progress</p>
                  <span className="badge" style={{ background: chapterInfoStyle(chapterInfo).bg, color: chapterInfoStyle(chapterInfo).color, fontSize:11 }}>
                    {chapterInfo.completed}/{chapterInfo.total} · {chapterInfoStyle(chapterInfo).label}
                  </span>
                </div>
                <div style={{ height:7, background:"#e5e7eb", borderRadius:5, overflow:"hidden", marginBottom:8 }}>
                  <div style={{ height:"100%", width:`${chapterInfo.percent}%`, background: chapterInfo.percent===100 ? "#10b981" : chapterInfo.stuck ? "#f97316" : "#3b82f6", transition:"width .3s" }} />
                </div>

                {chapterInfo.currentChapter && (
                  <p className="mb-1" style={{ fontSize:11.5, color: chapterInfo.stuck ? "#c2410c" : "#6b7280" }}>
                    📍 Currently on Chapter {chapterInfo.currentChapter.chapterNo} — {chapterInfo.currentChapter.title}
                    {chapterInfo.currentHasQuiz && chapterInfo.currentAttempts > 0
                      ? ` · quiz attempted ${chapterInfo.currentAttempts} time${chapterInfo.currentAttempts > 1 ? "s" : ""}, best score ${chapterInfo.currentBestScore}% (needs 70%)`
                      : ""}
                    {chapterInfo.stuckOnIdle ? ` · no activity for ${chapterInfo.daysSinceActivity}+ days` : ""}
                  </p>
                )}

                {chapterInfo.quizChapterCount > 0 && (
                  <p className="mb-1 text-muted" style={{ fontSize:11 }}>
                    {chapterInfo.quizChapterCount} chapter{chapterInfo.quizChapterCount > 1 ? "s have" : " has"} a quiz — {chapterInfo.quizPassedCount} passed, {chapterInfo.quizChapterCount - chapterInfo.quizPassedCount} pending
                  </p>
                )}

                <button type="button" className="btn btn-sm btn-outline-secondary mt-1" style={{ fontSize:11 }}
                  onClick={() => setShowChapters(v => !v)}>
                  {showChapters ? "Hide" : "View"} full chapter list ({chapterInfo.total})
                </button>

                {showChapters && (
                  <div className="mt-2" style={{ maxHeight:220, overflowY:"auto", border:"1px solid #e5e7eb", borderRadius:7, background:"#fff" }}>
                    {chapterInfo.sorted.map(c => {
                      const cp = chapterInfo.cpByNo.get(c.chapterNo);
                      const hasQuiz = (c.quizQuestions?.length || 0) > 0;
                      const watched = !!cp?.watched;
                      return (
                        <div key={c.chapterNo} className="d-flex align-items-center justify-content-between px-2 py-1" style={{ fontSize:11, borderBottom:"1px solid #f1f2f4" }}>
                          <span>{watched ? "✅" : "⬜"} Ch.{c.chapterNo} — {c.title}</span>
                          <span className="text-muted">
                            {hasQuiz
                              ? (cp?.lastScore != null ? `${cp.lastScore}% ${watched ? "(passed)" : "(pending)"}` : "quiz: not attempted")
                              : (watched ? "watched" : "—")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
              {form.status === "absent" && (
                <p className="mt-1 mb-0" style={{ fontSize:11, color:"#9f1239" }}>
                  Marks this person as not attended for the offline session. They'll be notified and can be re-assigned or rescheduled.
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

// ─── Certificate Requests Panel (HR uploads certificate per employee) ──
// ✅ NEW — lists every record where the employee has requested a
// certificate (finished every chapter + passed quiz). HR picks a file
// and uploads it here; the employee can download it right after.
function CertificateRequestsPanel({ records, onUploaded }) {
  const [uploadingId, setUploadingId] = useState(null);
  const [fileFor, setFileFor] = useState({}); // recordId -> File

  const handleUpload = async (recordId) => {
    const file = fileFor[recordId];
    if (!file) return;
    setUploadingId(recordId);
    try {
      const fd = new FormData();
      fd.append("certificate", file);
      await axios.put(`${API_BASE}/api/training/records/${recordId}/certificate`, fd);
      onUploaded?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to upload certificate");
    } finally {
      setUploadingId(null);
    }
  };

  if (records.length === 0) {
    return <div className="text-center text-muted py-5" style={{ fontSize: 13 }}>No certificate requests yet.</div>;
  }

  return (
    <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
      <div className="table-responsive">
        <table className="table table-sm align-middle mb-0">
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={{ fontSize: 11.5 }}>Employee</th>
              <th style={{ fontSize: 11.5 }}>Training</th>
              <th style={{ fontSize: 11.5 }}>Requested On</th>
              <th style={{ fontSize: 11.5 }}>Status</th>
              <th style={{ fontSize: 11.5 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r._id}>
                <td style={{ fontSize: 12.5, fontWeight: 600 }}>{r.employeeId?.name || "-"}</td>
                <td style={{ fontSize: 12.5 }}>{r.programId?.title || "-"}</td>
                <td style={{ fontSize: 12 }}>{r.certificateRequestedAt ? new Date(r.certificateRequestedAt).toLocaleDateString("en-IN") : "-"}</td>
                <td>
                  {r.certificateRequestStatus === "issued" ? (
                    <span className="badge bg-success-subtle text-success" style={{ fontSize: 11 }}>Issued</span>
                  ) : (
                    <span className="badge bg-warning-subtle text-warning" style={{ fontSize: 11 }}>Pending</span>
                  )}
                </td>
                <td>
                  {r.certificateRequestStatus === "issued" ? (
                    <a href={r.certificateUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-light" style={{ fontSize: 11 }}>View</a>
                  ) : (
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        style={{ fontSize: 11, maxWidth: 160 }}
                        className="form-control form-control-sm"
                        onChange={e => setFileFor(prev => ({ ...prev, [r._id]: e.target.files[0] || null }))}
                      />
                      <button
                        className="btn btn-sm btn-success"
                        style={{ fontSize: 11 }}
                        disabled={!fileFor[r._id] || uploadingId === r._id}
                        onClick={() => handleUpload(r._id)}
                      >
                        {uploadingId === r._id ? "Uploading..." : "Upload"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Create Training Program Modal ────────────────────────────
function CreateProgramModal({ onClose, onSave, editingProgram }) {
  const isEditing = !!editingProgram;
  const [title, setTitle]             = useState(editingProgram?.title || "");
  // ✅ NEW — course-level description shown above the chapter list
  const [description, setDescription] = useState(editingProgram?.description || "");
  // ✅ NEW — multi-chapter course builder. Each chapter keeps its own
  // title/description/video. `videoFile` (local, not sent as-is) holds
  // a newly-picked File until submit, when it's collected into the
  // chapterVideos[] FormData array and swapped for a fileIndex.
  // Each chapter gets a stable `uid` (row index changes when chapters are removed) and an
  // `upload` object: { status: queued|uploading|done|error, pct, fileName, url, publicId, duration }.
  const uidRef = useRef(0);
  const newUid = () => `c${Date.now()}-${uidRef.current++}`;
  const [chapters, setChapters] = useState(
    (editingProgram?.chapters || []).map(ch => ({ ...ch, contentType: ch.contentType || "video", videoFile: null, uid: newUid(), upload: null }))
  );
  const [useChapters, setUseChapters] = useState((editingProgram?.chapters || []).length > 0);
  // ✅ NEW — HR-only access window (from date – to date) for chapter courses
  const [accessStartDate, setAccessStartDate] = useState(
    editingProgram?.accessStartDate ? new Date(editingProgram.accessStartDate).toISOString().slice(0,10) : ""
  );
  const [accessEndDate, setAccessEndDate] = useState(
    editingProgram?.accessEndDate ? new Date(editingProgram.accessEndDate).toISOString().slice(0,10) : ""
  );
  const addChapter = () => setChapters(prev => [
    ...prev,
    { uid: newUid(), upload: null, chapterNo: prev.length + 1, title: "", description: "", contentType: "video", videoSource: "upload", videoUrl: "", videoFile: null, duration: "", quizQuestions: [] },
  ]);
  const removeChapter = (idx) => {
    const uid = chapters[idx]?.uid;
    if (uid) cancelUpload(uid);
    setChapters(prev => prev.filter((_, i) => i !== idx).map((ch, i) => ({ ...ch, chapterNo: i + 1 })));
  };
  const updateChapter = (idx, patch) => setChapters(prev =>
    prev.map((ch, i) => i === idx ? { ...ch, ...patch } : ch)
  );

  // ✅ NEW — optional per-chapter quiz builder. Stored on the chapter
  // object as quizQuestions: [{questionText, options[4], correctOptionIndex}];
  // `quizOpen` is a UI-only flag (collapsible section), never sent to
  // the server — the chaptersMeta map below picks only the fields it wants.
  const addQuizQuestion = (idx) => setChapters(prev => prev.map((ch, i) => i === idx
    ? { ...ch, quizOpen: true, quizQuestions: [...(ch.quizQuestions || []), { questionText: "", options: ["", "", "", ""], correctOptionIndex: 0 }] }
    : ch
  ));
  const updateQuizQuestion = (idx, qIdx, patch) => setChapters(prev => prev.map((ch, i) => i === idx
    ? { ...ch, quizQuestions: ch.quizQuestions.map((q, j) => j === qIdx ? { ...q, ...patch } : q) }
    : ch
  ));
  const updateQuizOption = (idx, qIdx, optIdx, value) => setChapters(prev => prev.map((ch, i) => i === idx
    ? { ...ch, quizQuestions: ch.quizQuestions.map((q, j) => j === qIdx ? { ...q, options: q.options.map((o, k) => k === optIdx ? value : o) } : q) }
    : ch
  ));
  const removeQuizQuestion = (idx, qIdx) => setChapters(prev => prev.map((ch, i) => i === idx
    ? { ...ch, quizQuestions: ch.quizQuestions.filter((_, j) => j !== qIdx) }
    : ch
  ));

  // ✅ Background uploads — a video starts uploading (chunked, straight to Cloudinary) the moment
  // it is picked, 2 at a time, so "Create Program" only has to save URLs.
  const MAX_PARALLEL_UPLOADS = 2;
  const MAX_VIDEO_MB = 200; // per-video limit (raise it if your Cloudinary plan allows bigger files)
  const MAX_PDF_MB = 20;    // per-PDF limit
  const controllersRef = useRef({}); // uid -> AbortController
  const queueRef = useRef([]);       // waiting upload jobs
  const activeRef = useRef(0);       // running upload jobs
  const patchByUid = (uid, patch) => setChapters(prev => prev.map(c => c.uid === uid ? { ...c, ...patch } : c));
  const pumpQueue = () => {
    while (activeRef.current < MAX_PARALLEL_UPLOADS && queueRef.current.length) {
      const job = queueRef.current.shift();
      activeRef.current++;
      job().finally(() => { activeRef.current--; pumpQueue(); });
    }
  };
  const startUpload = (uid, file, kind = "video") => {
    controllersRef.current[uid]?.abort();
    const ctrl = new AbortController();
    controllersRef.current[uid] = ctrl;
    patchByUid(uid, { videoFile: file, upload: { status: "queued", pct: 0, fileName: file.name, kind } });
    queueRef.current.push(async () => {
      if (ctrl.signal.aborted) return;
      const set = (u) => { if (!ctrl.signal.aborted) patchByUid(uid, { upload: { fileName: file.name, kind, ...u } }); };
      set({ status: "uploading", pct: 0 });
      try {
        const r = kind === "pdf"
          ? await uploadPdfDirect(file, ctrl.signal)
          : await uploadVideoChunked(file, pct => set({ status: "uploading", pct }), ctrl.signal);
        set({ status: "done", pct: 100, url: r.url, publicId: r.publicId, duration: r.duration });
      } catch (e) {
        set({ status: "error", pct: 0, error: e.message });
      }
    });
    pumpQueue();
  };
  const cancelUpload = (uid) => {
    controllersRef.current[uid]?.abort();
    delete controllersRef.current[uid];
    patchByUid(uid, { videoFile: null, upload: null });
  };
  const abortAllUploads = () => Object.values(controllersRef.current).forEach(c => c.abort());
  const uploadingCount = chapters.filter(c => c.upload && (c.upload.status === "uploading" || c.upload.status === "queued")).length;
  useEffect(() => () => abortAllUploads(), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!uploadingCount) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [uploadingCount]);
  const requestClose = () => {
    if (uploadingCount > 0 && !window.confirm(`${uploadingCount} video(s) are still uploading. Cancel them and close?`)) return;
    abortAllUploads();
    onClose();
  };
  const [duration, setDuration]        = useState(editingProgram?.duration || "");
  const [conductedBy, setConductedBy]  = useState(editingProgram?.conductedBy || "");
  const [modulesText, setModulesText]  = useState((editingProgram?.modules || []).join(", "));
  const [videoMode, setVideoMode]      = useState(editingProgram?.videoSource === "upload" ? "upload" : "youtube");
  const [youtubeUrl, setYoutubeUrl]    = useState(editingProgram?.videoSource === "youtube" ? (editingProgram?.videoUrl || "") : "");
  const [videoFile, setVideoFile]      = useState(null);
  const [pdfFile, setPdfFile]          = useState(null);
  const [saving, setSaving]            = useState(false);
  const [error, setError]              = useState("");

   const [deliveryMode, setDeliveryMode] = useState(editingProgram?.deliveryMode || "online");
  const [sessionDate, setSessionDate]   = useState(editingProgram?.sessionDate ? new Date(editingProgram.sessionDate).toISOString().slice(0,10) : "");
  const [sessionTime, setSessionTime]   = useState(editingProgram?.sessionTime || "");
  const [venue, setVenue]               = useState(editingProgram?.venue || "");

  const [hasCertification, setHasCertification] = useState(!!editingProgram?.certification);
  const [certification, setCertification]       = useState(editingProgram?.certification || "");

  // ── Department: searchable dropdown ──
   const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [department, setDepartment]   = useState(editingProgram?.department || "all");
  const [deptQuery, setDeptQuery]     = useState(editingProgram?.department && editingProgram.department !== "all" ? editingProgram.department : "All Departments");
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
    if (useChapters) {
      const stillUploading = chapters.filter(c => (c.contentType === "pdf" || c.videoSource !== "youtube") && c.upload && (c.upload.status === "uploading" || c.upload.status === "queued")).length;
      const failed = chapters.filter(c => (c.contentType === "pdf" || c.videoSource !== "youtube") && c.upload?.status === "error");
      if (stillUploading) return setError(`${stillUploading} video(s) are still uploading — please wait until they finish.`);
      if (failed.length) return setError(`Chapter ${failed[0].chapterNo}'s video failed to upload. Use Retry, or pick the file again.`);
    }
    setError("");
    setSaving(true);

    if (useChapters && chapters.some(ch => !ch.title.trim())) {
      setSaving(false);
      return setError("Every chapter needs a title");
    }
    // ✅ NEW — every chapter quiz question needs its text + all 4 options filled
    if (useChapters) {
      const badChapter = chapters.find(ch =>
        (ch.quizQuestions || []).some(q => !q.questionText.trim() || q.options.some(o => !o.trim()))
      );
      if (badChapter) {
        setSaving(false);
        return setError(`Chapter ${badChapter.chapterNo}: every quiz question needs text and all 4 options filled in`);
      }
    }

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("description", description.trim());
    fd.append("department", department);
    fd.append("duration", useChapters ? "" : duration); // chapter courses: length = total of chapters (auto)
    fd.append("certification", hasCertification ? certification.trim() : "");
    fd.append("conductedBy", conductedBy);

    // ✅ NEW — chapters[] + chapterVideos[] + access window. Only sent
    // when "Multi-chapter course" is on; otherwise the program behaves
    // exactly like before (single video/PDF below).
    if (useChapters) {
      // Videos were already uploaded straight to Cloudinary when they were picked;
      // here we only collect the finished results (URL + public id + length).
      const uploaded = {}; // chapter index -> { url, publicId, duration }
      chapters.forEach((ch, i) => {
        if ((ch.contentType === "pdf" || ch.videoSource !== "youtube") && ch.upload?.status === "done") uploaded[i] = ch.upload;
      });

      const chaptersMeta = chapters.map((ch, i) => {
        const out = { chapterNo: ch.chapterNo, title: ch.title.trim(), description: ch.description.trim(), contentType: ch.contentType || "video", duration: ch.duration, videoSource: ch.videoSource };
        // ✅ NEW — optional per-chapter quiz, sent through untouched
        out.quizQuestions = (ch.quizQuestions || []).map(q => ({
          questionText: q.questionText.trim(),
          options: q.options.map(o => o.trim()),
          correctOptionIndex: q.correctOptionIndex,
        }));
        if (ch.contentType === "pdf") {
          // PDF chapter: keep the existing PDF unless a new one finished uploading in this edit.
          const orig = editingProgram?.chapters?.find(o => o.chapterNo === ch.chapterNo);
          out.pdfUrl = uploaded[i]?.url || orig?.pdfUrl || "";
          out.pdfPublicId = uploaded[i]?.publicId || orig?.pdfPublicId || "";
          out.duration = "";
        } else if (uploaded[i]) {
          out.videoSource = "upload";
          out.videoUrl = uploaded[i].url;
          out.videoPublicId = uploaded[i].publicId;
          out.duration = uploaded[i].duration ? fmtVideoLen(uploaded[i].duration) : "";
        } else if (ch.videoSource === "youtube") {
          out.videoUrl = ch.videoUrl.trim();
          const orig = editingProgram?.chapters?.find(o => o.chapterNo === ch.chapterNo);
          if (!orig || orig.videoUrl !== out.videoUrl) out.duration = ""; // new link → length refills on first play
        } else {
          out.videoUrl = ch.videoUrl || ""; // keep existing uploaded url when editing, unchanged
          out.videoPublicId = ch.videoPublicId || "";
        }
        return out;
      });
      fd.append("chapters", JSON.stringify(chaptersMeta));
      fd.append("accessStartDate", accessStartDate || "");
      fd.append("accessEndDate", accessEndDate || "");
    } else {
      fd.append("chapters", JSON.stringify([]));
    }

        const modules = modulesText.split(",").map(m => m.trim()).filter(Boolean);
    fd.append("modules", JSON.stringify(modules));

    fd.append("deliveryMode", deliveryMode);

    if (deliveryMode === "offline") {
      if (sessionDate) fd.append("sessionDate", sessionDate);
      fd.append("sessionTime", sessionTime.trim());
      fd.append("venue", venue.trim());
    } else {
      if (videoMode === "youtube" && youtubeUrl.trim()) {
        fd.append("videoUrl", youtubeUrl.trim());
      } else if (videoMode === "upload" && videoFile) {
        fd.append("video", videoFile);
      }
      if (pdfFile) fd.append("pdf", pdfFile);
    }

      try {
      await onSave(fd);
    } catch (e) {
      setError(e?.response?.data?.message || `Failed to ${isEditing ? "update" : "create"} program`);
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
              {isEditing ? <Pencil size={16} color="#3b82f6" /> : <Plus size={18} color="#10b981" />}
              <p className="mb-0 fw-bold" style={{ fontSize: 14 }}>{isEditing ? "Edit Training Program" : "Create Training Program"}</p>
            </div>
            <button className="btn-close" onClick={requestClose} />
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

              {/* ✅ NEW — course-level description, shown above the chapter list on the employee side */}
              <div className="col-12">
                <label style={labelStyle}>Course Description</label>
                <textarea
                  className="form-control form-control-sm"
                  rows="2"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. A complete sales team management program covering sales planning, target setting..."
                />
              </div>

              {/* ✅ NEW — Multi-chapter course toggle */}
              <div className="col-12">
                <div className="form-check form-switch d-flex align-items-center gap-2" style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 12px", border: "1px solid #e5e7eb" }}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={useChapters}
                    onChange={e => { setUseChapters(e.target.checked); if (e.target.checked && chapters.length === 0) addChapter(); }}
                    style={{ width: 34, height: 18 }}
                  />
                  <label className="form-check-label" style={{ fontSize: 12.5, fontWeight: 600 }}>
                    Multi-chapter course (e.g. "66 video sessions" — each chapter unlocks only after the previous one is finished)
                  </label>
                </div>
              </div>

              {/* ✅ NEW — Chapter builder + HR access window, only when the toggle above is on */}
              {useChapters && (
                <div className="col-12">
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label style={labelStyle}>Course Available From</label>
                      <input type="date" className="form-control form-control-sm" value={accessStartDate} onChange={e => setAccessStartDate(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label style={labelStyle}>Course Available Until</label>
                      <input type="date" className="form-control form-control-sm" value={accessEndDate} onChange={e => setAccessEndDate(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <p className="mb-0" style={{ fontSize: 11, color: "#9ca3af" }}>
                        Hard lock: outside these dates employees cannot open the course. Leave blank for no restriction. (The per-employee Due Date, set while assigning, only marks them Overdue.)
                      </p>
                    </div>
                  </div>

                  <label style={labelStyle}>Chapters ({chapters.length})</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto", padding: 2 }}>
                    {chapters.map((ch, idx) => (
                      <div key={ch.uid || idx} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, background: "#fafafa" }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6" }}>Chapter {ch.chapterNo}</span>
                          <button type="button" className="btn btn-sm btn-light text-danger" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => removeChapter(idx)}>Remove</button>
                        </div>
                        <input
                          type="text" className="form-control form-control-sm mb-2"
                          placeholder="Chapter title *"
                          value={ch.title}
                          onChange={e => updateChapter(idx, { title: e.target.value })}
                        />
                        <textarea
                          className="form-control form-control-sm mb-2" rows="2"
                          placeholder="Chapter description"
                          value={ch.description}
                          onChange={e => updateChapter(idx, { description: e.target.value })}
                        />
                        <div className="d-flex gap-2 mb-2">
                          <button type="button" className={`btn btn-sm ${(ch.contentType || "video") === "video" ? "btn-dark" : "btn-light"}`} style={{ fontSize: 11 }}
                            onClick={() => updateChapter(idx, { contentType: "video" })}>🎬 Video</button>
                          <button type="button" className={`btn btn-sm ${ch.contentType === "pdf" ? "btn-dark" : "btn-light"}`} style={{ fontSize: 11 }}
                            onClick={() => { cancelUpload(ch.uid); updateChapter(idx, { contentType: "pdf", fileError: "" }); }}>📄 PDF</button>
                          {(ch.contentType || "video") === "video" && (
                            <span className="text-muted align-self-center" style={{ fontSize: 11 }}>
                              {ch.duration ? `⏱ ${ch.duration}` : "Length is detected automatically"}
                            </span>
                          )}
                        </div>
                        {ch.contentType === "pdf" ? (
                          <>
                            <input
                              type="file" accept="application/pdf" className="form-control form-control-sm"
                              onChange={e => {
                                const f = e.target.files[0] || null;
                                if (f && f.size > MAX_PDF_MB * 1024 * 1024) {
                                  updateChapter(idx, { fileError: `"${f.name}" is ${(f.size / 1048576).toFixed(1)} MB — over the ${MAX_PDF_MB} MB limit.` });
                                  e.target.value = "";
                                  return;
                                }
                                updateChapter(idx, { fileError: "" });
                                if (f) startUpload(ch.uid, f, "pdf");
                              }}
                              disabled={ch.upload?.status === "uploading"}
                            />
                            {ch.fileError && (
                              <div className="alert alert-danger py-1 px-2 mb-0 mt-1" style={{ fontSize: 12, fontWeight: 600 }}>⚠ {ch.fileError}</div>
                            )}
                            {ch.upload?.status === "uploading" && <p className="text-muted mb-0 mt-1" style={{ fontSize: 11 }}>⏳ Uploading {ch.upload.fileName}…</p>}
                            {ch.upload?.status === "done" && <p className="mb-0 mt-1" style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>✓ Uploaded — {ch.upload.fileName}</p>}
                            {ch.upload?.status === "error" && (
                              <p className="mb-0 mt-1 text-danger" style={{ fontSize: 11 }}>
                                ✗ Upload failed: {ch.upload.error}{" "}
                                <button type="button" className="btn btn-link btn-sm p-0" style={{ fontSize: 11 }} onClick={() => startUpload(ch.uid, ch.videoFile, "pdf")}>Retry</button>
                              </p>
                            )}
                            {!ch.upload && ch.pdfUrl && <p className="text-muted mb-0 mt-1" style={{ fontSize: 11 }}>Current PDF attached (choose a new file to replace it)</p>}
                          </>
                        ) : ch.videoSource === "youtube" ? (
                          <>
                            <div className="d-flex gap-2 mb-2">
                              <button type="button" className={`btn btn-sm ${ch.videoSource === "upload" ? "btn-primary" : "btn-light"}`} style={{ fontSize: 11 }} onClick={() => updateChapter(idx, { videoSource: "upload" })}>Upload Video</button>
                              <button type="button" className={`btn btn-sm ${ch.videoSource === "youtube" ? "btn-primary" : "btn-light"}`} style={{ fontSize: 11 }} onClick={() => { cancelUpload(ch.uid); updateChapter(idx, { videoSource: "youtube" }); }}>YouTube Link</button>
                            </div>
                            <input
                              type="text" className="form-control form-control-sm"
                              placeholder="https://www.youtube.com/watch?v=..."
                              value={ch.videoUrl}
                              onChange={e => updateChapter(idx, { videoUrl: e.target.value })}
                            />
                          </>
                        ) : (
                          <>
                            <div className="d-flex gap-2 mb-2">
                              <button type="button" className={`btn btn-sm ${ch.videoSource === "upload" ? "btn-primary" : "btn-light"}`} style={{ fontSize: 11 }} onClick={() => updateChapter(idx, { videoSource: "upload" })}>Upload Video</button>
                              <button type="button" className={`btn btn-sm ${ch.videoSource === "youtube" ? "btn-primary" : "btn-light"}`} style={{ fontSize: 11 }} onClick={() => { cancelUpload(ch.uid); updateChapter(idx, { videoSource: "youtube" }); }}>YouTube Link</button>
                            </div>
                            <input
                              type="file" accept="video/*" className="form-control form-control-sm"
                              onChange={e => {
                                const f = e.target.files[0] || null;
                                if (f && f.size > MAX_VIDEO_MB * 1024 * 1024) {
                                  // shown right under this chapter's file box (the top-of-modal banner is off-screen while scrolled)
                                  updateChapter(idx, { fileError: `"${f.name}" is ${(f.size / 1048576).toFixed(0)} MB — over the ${MAX_VIDEO_MB} MB limit. Please compress it (e.g. 720p) and choose it again.` });
                                  e.target.value = "";
                                  return;
                                }
                                updateChapter(idx, { fileError: "" });
                                if (f) startUpload(ch.uid, f); // uploads right away, in the background
                              }}
                              disabled={ch.upload?.status === "uploading"}
                            />
                            {ch.fileError && (
                              <div className="alert alert-danger py-1 px-2 mb-0 mt-1" style={{ fontSize: 12, fontWeight: 600 }}>⚠ {ch.fileError}</div>
                            )}
                            {ch.upload?.status === "queued" && <p className="text-muted mb-0 mt-1" style={{ fontSize: 11 }}>⏳ Waiting to upload — {ch.upload.fileName}</p>}
                            {ch.upload?.status === "uploading" && (
                              <div className="mt-1">
                                <div className="progress" style={{ height: 8 }}>
                                  <div className={`progress-bar ${ch.upload.pct === 0 ? "progress-bar-striped progress-bar-animated" : ""}`} style={{ width: `${ch.upload.pct || 100}%` }} />
                                </div>
                                <div className="d-flex justify-content-between align-items-center" style={{ fontSize: 11 }}>
                                  <span className="text-muted">Uploading {ch.upload.fileName} — {ch.upload.pct}%</span>
                                  <button type="button" className="btn btn-link btn-sm text-danger p-0" style={{ fontSize: 11 }} onClick={() => cancelUpload(ch.uid)}>Cancel</button>
                                </div>
                              </div>
                            )}
                            {ch.upload?.status === "done" && (
                              <p className="mb-0 mt-1" style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>
                                ✓ Uploaded — {ch.upload.fileName}{ch.upload.duration ? ` (${fmtVideoLen(ch.upload.duration)})` : ""}
                              </p>
                            )}
                            {ch.upload?.status === "error" && (
                              <p className="mb-0 mt-1 text-danger" style={{ fontSize: 11 }}>
                                ✗ Upload failed: {ch.upload.error}{" "}
                                <button type="button" className="btn btn-link btn-sm p-0" style={{ fontSize: 11 }} onClick={() => startUpload(ch.uid, ch.videoFile)}>Retry</button>
                              </p>
                            )}
                            {!ch.upload && ch.videoUrl && <p className="text-muted mb-0 mt-1" style={{ fontSize: 11 }}>Current video attached (choose a new file to replace it)</p>}
                          </>
                        )}

                        {/* ✅ NEW — optional per-chapter quiz ("understanding check"). Applies to
                            video AND PDF chapters alike. Empty by default: if HR adds nothing here,
                            this chapter behaves exactly as before (straight to Complete/Mark as Read). */}
                        <div className="mt-2 pt-2" style={{ borderTop: "1px dashed #e5e7eb" }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-light w-100 d-flex justify-content-between align-items-center"
                            style={{ fontSize: 11.5, fontWeight: 600 }}
                            onClick={() => updateChapter(idx, { quizOpen: !ch.quizOpen })}
                          >
                            <span>
                              📝 Chapter Quiz (optional)
                              {(ch.quizQuestions?.length > 0) ? ` — ${ch.quizQuestions.length} question${ch.quizQuestions.length > 1 ? "s" : ""}` : ""}
                            </span>
                            <span>{ch.quizOpen ? "▲" : "▼"}</span>
                          </button>
                          {ch.quizOpen && (
                            <div className="mt-2 d-flex flex-column gap-2">
                              {(ch.quizQuestions || []).length === 0 && (
                                <p className="text-muted mb-0" style={{ fontSize: 11 }}>
                                  No questions yet — this chapter will complete straight after {ch.contentType === "pdf" ? '"Mark as Read"' : "the video"}, same as before.
                                </p>
                              )}
                              {(ch.quizQuestions || []).map((q, qIdx) => (
                                <div key={qIdx} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 10, background: "#fff" }}>
                                  <div className="d-flex justify-content-between align-items-start mb-1">
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Q{qIdx + 1}</span>
                                    <button type="button" className="btn btn-link btn-sm text-danger p-0" style={{ fontSize: 11 }} onClick={() => removeQuizQuestion(idx, qIdx)}>Remove</button>
                                  </div>
                                  <input
                                    type="text" className="form-control form-control-sm mb-2"
                                    placeholder="Question text *"
                                    value={q.questionText}
                                    onChange={e => updateQuizQuestion(idx, qIdx, { questionText: e.target.value })}
                                  />
                                  {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="d-flex align-items-center gap-2 mb-1">
                                      <input
                                        type="radio" name={`correct-${ch.uid}-${qIdx}`}
                                        checked={q.correctOptionIndex === optIdx}
                                        onChange={() => updateQuizQuestion(idx, qIdx, { correctOptionIndex: optIdx })}
                                        title="Mark as the correct answer"
                                      />
                                      <input
                                        type="text" className="form-control form-control-sm"
                                        placeholder={`Option ${optIdx + 1} *`}
                                        value={opt}
                                        onChange={e => updateQuizOption(idx, qIdx, optIdx, e.target.value)}
                                      />
                                    </div>
                                  ))}
                                  <p className="text-muted mb-0" style={{ fontSize: 10 }}>Select the radio next to the correct option.</p>
                                </div>
                              ))}
                              <button type="button" className="btn btn-sm btn-outline-primary" style={{ fontSize: 11 }} onClick={() => addQuizQuestion(idx)}>+ Add Question</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={addChapter}>+ Add Chapter</button>
                </div>
              )}

                <div className="col-12">
                <label style={labelStyle}>Delivery Mode</label>
                <div className="d-flex gap-2">
                  <button type="button" className={`btn btn-sm ${deliveryMode === "online" ? "btn-primary" : "btn-light"}`} style={{ fontSize: 12 }} onClick={() => setDeliveryMode("online")}>
                    Online (Video / PDF)
                  </button>
                  <button type="button" className={`btn btn-sm ${deliveryMode === "offline" ? "btn-primary" : "btn-light"}`} style={{ fontSize: 12 }} onClick={() => setDeliveryMode("offline")}>
                    Offline (In-Person Session)
                  </button>
                </div>
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

              {!useChapters && (
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
              )}

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

                           {deliveryMode === "online" && !useChapters && (
                <>
                  <div className="col-12">
                    <label style={labelStyle}>Training Video</label>
                    <div className="d-flex gap-2 mb-2">
                      <button type="button" className={`btn btn-sm ${videoMode === "youtube" ? "btn-primary" : "btn-light"}`} style={{ fontSize: 12 }} onClick={() => setVideoMode("youtube")}>
                        YouTube Link
                      </button>
                      <button type="button" className={`btn btn-sm ${videoMode === "upload" ? "btn-primary" : "btn-light"}`} style={{ fontSize: 12 }} onClick={() => setVideoMode("upload")}>
                        Upload Video File
                      </button>
                    </div>
                    {videoMode === "youtube" ? (
                      <input type="text" className="form-control form-control-sm" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                    ) : (
                      <input type="file" accept="video/*" className="form-control form-control-sm" onChange={e => setVideoFile(e.target.files[0] || null)} />
                    )}
                  </div>

                  <div className="col-12">
                    <label style={labelStyle}>Training PDF (optional)</label>
                    <input type="file" accept="application/pdf" className="form-control form-control-sm" onChange={e => setPdfFile(e.target.files[0] || null)} />
                    {pdfFile && <p className="text-muted mb-0 mt-1" style={{ fontSize: 11 }}>{pdfFile.name}</p>}
                    {!pdfFile && isEditing && editingProgram?.pdfName && (
                      <p className="text-muted mb-0 mt-1" style={{ fontSize: 11 }}>Current file: {editingProgram.pdfName} (choose a new one to replace it)</p>
                    )}
                  </div>
                </>
              )}

              {deliveryMode === "offline" && (
                <>
                  <div className="col-md-6">
                    <label style={labelStyle}>Session Date</label>
                    <input type="date" className="form-control form-control-sm" value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
                  </div>
                  <div className="col-md-6">
  <label style={labelStyle}>Session Time</label>
  <input type="text" className="form-control form-control-sm" value={sessionTime}
    onChange={e => setSessionTime(e.target.value)} placeholder="e.g. 10:00 AM - 1:00 PM" />
</div>
                  <div className="col-md-6">
                    <label style={labelStyle}>Venue</label>
                    <input type="text" className="form-control form-control-sm" value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. HO Training Hall, 2nd Floor" />
                  </div>
                  <div className="col-12">
                    <p className="mb-0" style={{ fontSize: 11.5, color: "#9ca3af" }}>
                      No video/PDF needed for offline sessions. After the session is conducted, come back and mark attendance via the "Update" button in the Records tab.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="modal-footer border-top">
            <button className="btn btn-sm btn-light" onClick={requestClose}>Cancel</button>
            <button className="btn btn-sm btn-success fw-bold" onClick={handleSubmit} disabled={saving || uploadingCount > 0}>
              {saving ? (isEditing ? "Saving..." : "Creating...") : uploadingCount > 0 ? `Uploading ${uploadingCount} video${uploadingCount > 1 ? "s" : ""}…` : (isEditing ? "Save Changes" : "Create Program")}
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
  const [activeTab, setActiveTab] = useState("roadmap"); // "roadmap"|"records"|"kpi"|"certificates"
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept]     = useState("all");
  const [seeding, setSeeding]     = useState(false);
  const [deletingId, setDeletingId] = useState(null); // ✅ NEW — tracks which record is being deleted, for per-row spinner/disable
  const [deletingLogId, setDeletingLogId] = useState(null); // ✅ NEW — tracks which compliance log entry is being deleted
  // ✅ CHANGED — was "which employee's compliance log group is expanded" (separate tab).
  // Now: which record's inline history row is expanded, inside the Records tab table.
  const [expandedEmp, setExpandedEmp] = useState(null);
 const [editingProgram, setEditingProgram] = useState(null);
  const [deletingProgramId, setDeletingProgramId] = useState(null);
  const [unassigningId, setUnassigningId] = useState(null);
  const [unassignInfo, setUnassignInfo] = useState(null);
  
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

  // ✅ NEW — "Finish Training" bulk action. Program-ku assign panna
// (completed/waived illatha) ella employees-um "completed" ah maarum.
const [finishingProgId, setFinishingProgId] = useState(null);
const handleMarkAllComplete = async (program) => {
  const progRecords = records.filter(r => r.programId?._id === program._id && !["completed","waived"].includes(r.status));
  if (!progRecords.length) { showMsg("Everyone assigned to this program is already completed.", "error"); return; }
  if (!window.confirm(`Mark all ${progRecords.length} assigned employee${progRecords.length>1?"s":""} as completed for "${program.title}"?\n\nIf anyone was actually absent, you can fix their record individually afterwards from the Records tab.`)) return;
  setFinishingProgId(program._id);
  try {
    const res = await axios.put(`${API_BASE}/api/training/programs/${program._id}/mark-all-complete`);
    showMsg(res.data.message || "Marked complete!");
    fetchAll();
  } catch(e) { showMsg(e?.response?.data?.message || "Failed", "error"); }
  finally { setFinishingProgId(null); }
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
  // button inside a Records row's expanded history). Independent of
  // training records — only removes the log line itself.
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


    // ✅ NEW — "Unassign" — removes this training assignment from the
  // employee (no confirm popup, quick action) and keeps enough info
  // around for a few seconds so HR can "Undo" and re-assign it if it
  // was a mistake. Undo re-creates the assignment fresh (pending),
  // it does not restore any progress/quiz history the old record had.
  const handleUnassign = async (record) => {
    if (unassignInfo?.timer) clearTimeout(unassignInfo.timer);
    const empName   = record.employeeId?.name || "this employee";
    const progTitle = record.programId?.title || "this program";
    setUnassigningId(record._id);
    try {
      await axios.delete(`${API_BASE}/api/training/records/${record._id}`);
      fetchAll();
      const timer = setTimeout(() => setUnassignInfo(null), 7000);
      setUnassignInfo({
        employeeId: record.employeeId?._id || record.employeeId,
        programId:  record.programId?._id || record.programId,
        dueDate:    record.dueDate,
        notes:      record.notes,
        empName, progTitle, timer,
      });
    } catch(e) {
      showMsg(e?.response?.data?.message || "Unassign failed", "error");
    } finally {
      setUnassigningId(null);
    }
  };

  const handleUndoUnassign = async () => {
    if (!unassignInfo) return;
    clearTimeout(unassignInfo.timer);
    const { employeeId, programId, dueDate, notes, empName, progTitle } = unassignInfo;
    setUnassignInfo(null);
    try {
      await axios.post(`${API_BASE}/api/training/assign`, { employeeId, programId, dueDate, notes });
      showMsg(`"${progTitle}" re-assigned to ${empName}.`);
      fetchAll();
    } catch(e) {
      showMsg(e?.response?.data?.message || "Undo failed — please re-assign manually", "error");
    }
  };

  // Filter records
  const handleDeleteProgram = async (program) => {
    if (!window.confirm(`Delete the training program "${program.title}"? Employees already assigned to it will keep their existing records, but it will disappear from this list and can no longer be assigned to anyone new.`)) return;
    setDeletingProgramId(program._id);
    try {
      await axios.delete(`${API_BASE}/api/training/programs/${program._id}`);
      showMsg("Training program deleted.");
      fetchAll();
    } catch(e) {
      showMsg(e?.response?.data?.message || "Delete failed", "error");
    } finally {
      setDeletingProgramId(null);
    }
  };
  const filteredRecords = records.filter(r => {
    const matchSearch = !search.trim() ||
      r.employeeId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.programId?.title?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="container-fluid py-4" style={{ maxWidth:1400 }}>

        {toast && <div className={`alert alert-${toast.type==="error"?"danger":"success"} position-fixed top-0 end-0 m-3`} style={{ zIndex:9999, fontSize:13 }}>{toast.msg}</div>}

      {/* ✅ NEW — Undo toast after "Unassign". Auto-dismisses after 7s. */}
      {unassignInfo && (
        <div className="alert alert-warning position-fixed top-0 end-0 m-3 d-flex align-items-center gap-3 shadow-sm" style={{ zIndex:9999, fontSize:13 }}>
          <span>Unassigned "{unassignInfo.progTitle}" from {unassignInfo.empName}.</span>
          <button className="btn btn-sm btn-dark fw-bold" onClick={handleUndoUnassign}>Undo</button>
        </div>
      )}

      {modal === "assign" && <AssignModal programs={programs} employees={employees} onClose={()=>setModal(null)} onSave={handleAssign} />}
      {modal === "update" && selectedRecord && <UpdateRecordModal record={selectedRecord} onClose={()=>{setModal(null);setSelectedRecord(null);}} onSave={handleUpdate} />}
      {modal === "quizQuestions" && <QuizQuestionsManagerModal onClose={()=>setModal(null)} showMsg={showMsg} />}
      {modal === "createProgram" && (
        <CreateProgramModal
          editingProgram={editingProgram}
          onClose={()=>{ setModal(null); setEditingProgram(null); }}
          onSave={async(fd)=>{
            if (editingProgram) {
              await axios.put(`${API_BASE}/api/training/programs/${editingProgram._id}`, fd, {headers:{'Content-Type':'multipart/form-data'}});
              showMsg("Training program updated!");
            } else {
              await axios.post(`${API_BASE}/api/training/programs`, fd, {headers:{'Content-Type':'multipart/form-data'}});
              showMsg("Training program created!");
            }
            setModal(null);
            setEditingProgram(null);
            fetchAll();
          }}
        />
      )}
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
          <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-2 fw-bold" onClick={()=>{ setEditingProgram(null); setModal("createProgram"); }}>
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
      {/* ✅ CHANGED — "Compliance Log" tab removed. Its data (compLog) and
          delete action (handleDeleteLog) now live inline inside the
          Records tab, as an expandable per-row history — see the Records
          table below. Nothing about how compLog is fetched changed. */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {[
          { key:"roadmap",    label:"Training Roadmap",       icon:<Layers size={13}/> },
          { key:"records",    label:`Records (${records.length})`, icon:<ClipboardList size={13}/> },
          { key:"kpi",        label:"KPI Dashboard",          icon:<BarChart2 size={13}/> },
          { key:"certificates", label:`Certificate Requests (${records.filter(r => r.certificateRequestStatus === "requested").length})`, icon:<Award size={13}/> },
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
                          <div className="d-flex align-items-center gap-1 flex-shrink-0">
                            <span className="badge" style={{ background: typ.bg, color: typ.color, fontSize: 10, fontWeight: 700 }}>{typ.label}</span>
                            <button
                              className="btn btn-sm p-1 d-flex align-items-center justify-content-center"
                              title="Edit program"
                              style={{ width: 22, height: 22, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff" }}
                              onClick={() => { setEditingProgram(p); setModal("createProgram"); }}
                            >
                              <Pencil size={11} color="#6b7280" />
                            </button>
                            <button
                              className="btn btn-sm p-1 d-flex align-items-center justify-content-center"
                              title="Delete program"
                              disabled={deletingProgramId === p._id}
                              style={{ width: 22, height: 22, border: "1px solid #fecaca", borderRadius: 6, background: "#fff" }}
                              onClick={() => handleDeleteProgram(p)}
                            >
                              {deletingProgramId === p._id
                                ? <span className="spinner-border spinner-border-sm" style={{ width: 10, height: 10 }} />
                                : <Trash2 size={11} color="#ef4444" />}
                            </button>
                          </div>
                        </div>

                        {/* ✅ NEW — Offline / Online delivery mode tag */}
                        <div className="mb-2">
                          <span className="badge" style={{
                            background: p.deliveryMode === "offline" ? "#fff7ed" : "#eff6ff",
                            color: p.deliveryMode === "offline" ? "#f97316" : "#3b82f6",
                            border: `1px solid ${p.deliveryMode === "offline" ? "#fed7aa" : "#bfdbfe"}`,
                            fontSize: 10, fontWeight: 700, padding: "3px 9px",
                          }}>
                            {p.deliveryMode === "offline" ? "📍 Offline" : "💻 Online"}
                          </span>
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
                          {programLength(p) && <span className="d-flex align-items-center gap-1"><Clock size={11} />{programLength(p)}</span>}
                                                    {p.conductedBy && <span className="d-flex align-items-center gap-1"><UserCheck size={11} />{p.conductedBy}</span>}
                          {p.deliveryMode === "offline" && (
                            <span className="d-flex align-items-center gap-1" style={{ color:"#f97316", fontWeight:600 }}>
                              <Calendar size={11} />
                              {p.sessionDate ? new Date(p.sessionDate).toLocaleDateString("en-IN") : "Offline"}{p.sessionTime ? `, ${p.sessionTime}` : ""}{p.venue ? ` · ${p.venue}` : ""}
                            </span>
                          )}
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

                        {p.deliveryMode === "offline" && assignedCount > completedCount && (
                          <button
                            className="btn btn-sm w-100 mt-2 d-flex align-items-center justify-content-center gap-1"
                            style={{ background: "#ecfdf5", color: "#10b981", border: "1px solid #a7f3d0", fontSize: 12, fontWeight: 700, borderRadius: 8 }}
                            disabled={finishingProgId === p._id}
                            onClick={() => handleMarkAllComplete(p)}
                          >
                            {finishingProgId === p._id ? <span className="spinner-border spinner-border-sm" style={{ width:12, height:12 }} /> : <CheckCircle2 size={12} />}
                            {finishingProgId === p._id ? "Finishing…" : "Finish Training — Mark All Complete"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ RECORDS TAB (now includes inline compliance history) ═══ */}
      {activeTab === "records" && (
        <div>
          {/* ✅ CHANGED — moved here from the old standalone Compliance Log
              tab, so the governance note still shows up somewhere once
              that tab is gone. */}
          <div className="alert d-flex align-items-start gap-2 mb-3" style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, fontSize:12 }}>
            <Info size={14} color="#3b82f6" style={{ flexShrink:0, marginTop:1 }}/>
            <p className="mb-0" style={{ color:"#1e40af" }}>
              All trainings are tracked via RCA (Radnus Corporate Academy). Click the arrow next to any row to see its full history log. Managers must ensure 100% training compliance before confirming employee probation or promotion.
            </p>
          </div>

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
                      <th style={{ width: 24 }}></th>
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
                    const isOverdue = r.dueDate && (() => {
  const end = new Date(r.dueDate);
  end.setHours(23, 59, 59, 999);
  return end < new Date();
})() && r.status !== "completed";
                      const isDeleting = deletingId === r._id; // ✅ NEW
                      // ✅ NEW — inline history (was the whole Compliance Log tab).
                      // Same ComplianceLog data, filtered to this employee + this program.
                      const isHistoryOpen = expandedEmp === r._id;
                      const rowLogs = compLog.filter(l =>
                        String(l.employeeId?._id || l.employeeId) === String(r.employeeId?._id) &&
                        (!l.programId || String(l.programId) === String(r.programId?._id))
                      );
                      return (
                        <React.Fragment key={r._id}>
                        <tr>
                          <td style={{ cursor: rowLogs.length ? "pointer" : "default" }}
                            onClick={() => rowLogs.length && setExpandedEmp(isHistoryOpen ? null : r._id)}>
                            {rowLogs.length > 0 && (
                              <ChevronRight size={14} color="#9ca3af"
                                style={{ transform: isHistoryOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                            )}
                          </td>
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
                            <p className="mb-0 text-muted" style={{ fontSize:11 }}>{programLength(r.programId)}</p>
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
                            <div><ChapterProgressChip record={r} /></div>
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
                            {/* Action cell has Update + Unassign + Delete side by side */}
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize:11 }}
                                onClick={()=>{ setSelectedRecord(r); setModal("update"); }}
                                disabled={isDeleting}>
                                Update
                              </button>
                              {/* Unassign: removes the assignment (no confirm), with a
                                  few-seconds "Undo" toast in case it was a mistake */}
                              <button className="btn btn-sm btn-outline-warning py-0 px-2 d-flex align-items-center gap-1" style={{ fontSize:11 }}
                                onClick={()=>handleUnassign(r)}
                                disabled={isDeleting || unassigningId === r._id}
                                title="Unassign this training from the employee">
                                {unassigningId === r._id ? (
                                  <span className="spinner-border spinner-border-sm" style={{ width:11, height:11 }} />
                                ) : (
                                  <X size={11} />
                                )}
                                Unassign
                              </button>
                              {/* Delete button, confirms then calls DELETE /api/training/records/:id */}
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
                        {/* ✅ NEW — inline history row, replaces the old separate
                            Compliance Log tab. Same ComplianceLog entries, same
                            Delete-per-entry action (handleDeleteLog), just shown
                            right under the record it belongs to instead of in
                            its own tab grouped by employee. */}
                        {isHistoryOpen && (
                          <tr>
                            <td></td>
                            <td colSpan={8} style={{ background: "#f9fafb", padding: 0 }}>
                              {rowLogs.length === 0 ? (
                                <p className="text-muted mb-0 p-3" style={{ fontSize: 12 }}>No history yet.</p>
                              ) : (
                                <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
                                  <thead>
                                    <tr className="text-muted">
                                      <th style={{ fontWeight: 600 }}>Date</th>
                                      <th style={{ fontWeight: 600 }}>Action</th>
                                      <th style={{ fontWeight: 600 }}>Note</th>
                                      <th style={{ fontWeight: 600 }}>By</th>
                                      <th></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rowLogs.map(l => {
                                      const actionColor = {
                                        assigned:"#3b82f6", started:"#f59e0b", completed:"#10b981",
                                        overdue:"#ef4444", score_updated:"#8b5cf6", cert_issued:"#10b981",
                                        waived:"#6b7280", needs_hr_review:"#dc2626", bulk_completed:"#10b981",
                                      }[l.action] || "#6b7280";
                                      return (
                                        <tr key={l._id}>
                                          <td className="text-muted" style={{ fontSize: 11 }}>{new Date(l.date).toLocaleDateString("en-IN")}</td>
                                          <td><span className="badge" style={{ background:`${actionColor}20`, color:actionColor, fontSize:11 }}>{l.action?.replace("_"," ")}</span></td>
                                          <td className="text-muted" style={{ fontSize: 11 }}>{l.note || "—"}</td>
                                          <td className="text-muted" style={{ fontSize: 11 }}>{l.addedBy}</td>
                                          <td>
                                            <button className="btn btn-sm btn-outline-danger py-0 px-2 d-flex align-items-center gap-1" style={{ fontSize: 11 }}
                                              onClick={() => handleDeleteLog(l)}
                                              disabled={deletingLogId === l._id}
                                              title="Delete this log entry">
                                              {deletingLogId === l._id ? (
                                                <span className="spinner-border spinner-border-sm" style={{ width: 11, height: 11 }} />
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
                              )}
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
          )}
        </div>
      )}

      {/* ══ KPI TAB ══════════════════════════════════════════════ */}
      {/* ══ CERTIFICATE REQUESTS TAB ═══════════════════════════════ */}
      {activeTab === "certificates" && (
        <CertificateRequestsPanel
          records={records.filter(r => r.certificateRequestStatus && r.certificateRequestStatus !== "none")}
          onUploaded={fetchAll}
        />
      )}

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