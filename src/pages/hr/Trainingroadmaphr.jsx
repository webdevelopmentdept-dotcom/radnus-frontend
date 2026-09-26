import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { uploadVideoChunked, uploadPdfDirect } from "../../utils/cloudinaryChunkedUpload";
import {
  BookOpen, Users, Target, Award, CheckCircle2, Clock,
  AlertTriangle, Plus, Pencil, X, Check, RefreshCw,
  ChevronRight, BarChart2, Layers, FileText, Search,
  Filter, Download, TrendingUp, Star, Zap, Info,
  UserCheck, Calendar, GraduationCap, ClipboardList, Trash2,
  Lock, Unlock, Eye, PlayCircle, FileType, HelpCircle, // ✅ NEW: Eye/PlayCircle/FileType/HelpCircle for preview modal
  MoreVertical, // ✅ NEW — Records row actions dropdown (⋮)
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
    <div title={title} style={{ display: "inline-flex", flexDirection: "column", gap: 3, minWidth: 74 }}>
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: 4, background: s.bg, color: s.color, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700, width: "fit-content" }}
      >
        {info.completed}/{info.total} chapters
        {info.stuck && info.percent < 100 ? " · stuck" : ""}
      </span>
      {/* ✅ NEW — mini progress bar so chapter progress reads at a glance, not just as text */}
      <div style={{ height: 4, width: "100%", background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${info.percent}%`, background: s.color, transition: "width .3s" }} />
      </div>
    </div>
  );
}

// ─── Row Actions Menu (✅ NEW) ───────────────────────────────────
// Records table action cell: "Update" stays a visible primary button
// (most common action); Unassign / Lock-Unlock / Delete move into a
// compact ⋮ dropdown so the row doesn't overflow on narrower screens.
function RowActionsMenu({ record, isDeleting, unassigningId, lockingId, onUpdate, onUnassign, onToggleLock, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const itemStyle = { fontSize: 12, border: "none", background: "transparent", padding: "8px 12px", width: "100%", textAlign: "left" };
  return (
    <div ref={ref} className="d-flex gap-1" style={{ position: "relative" }}>
      <button className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: 11 }}
        onClick={onUpdate} disabled={isDeleting}>
        Update
      </button>
      <button
        className="btn btn-sm btn-light d-flex align-items-center justify-content-center"
        style={{ fontSize: 11, width: 26, height: 26, border: "1px solid #e5e7eb" }}
        onClick={() => setOpen(v => !v)}
        disabled={isDeleting}
        title="More actions"
      >
        <MoreVertical size={13} color="#6b7280" />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 40,
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9,
          boxShadow: "0 10px 24px rgba(16,24,40,.14)", minWidth: 160, overflow: "hidden",
        }}>
          <button className="hr-menu-item d-flex align-items-center gap-2" style={itemStyle}
            onClick={() => { setOpen(false); onUnassign(); }} disabled={unassigningId}>
            {unassigningId ? <span className="spinner-border spinner-border-sm" style={{ width: 11, height: 11 }} /> : <X size={12} color="#f59e0b" />}
            Unassign
          </button>
          <button className="hr-menu-item d-flex align-items-center gap-2" style={itemStyle}
            onClick={() => { setOpen(false); onToggleLock(); }} disabled={lockingId}>
            {lockingId ? <span className="spinner-border spinner-border-sm" style={{ width: 11, height: 11 }} /> : record.isLocked ? <Unlock size={12} color="#111827" /> : <Lock size={12} color="#111827" />}
            {record.isLocked ? "Unlock" : "Lock"}
          </button>
          <button className="hr-menu-item d-flex align-items-center gap-2" style={{ ...itemStyle, color: "#ef4444" }}
            onClick={() => { setOpen(false); onDelete(); }}>
            <Trash2 size={12} color="#ef4444" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
// ✅ CHANGED — now optionally clickable. `onClick` present → the card
// becomes a filter shortcut into the Records tab (cursor, hover lift,
// and a highlighted ring when `active` is true so HR can see which
// filter is currently applied from the stat strip).
function StatCard({ label, value, sub, color, bg, icon, onClick, active }) {
  const [hover, setHover] = useState(false);
  const clickable = !!onClick;
  return (
    <div
      className="card border-0 h-100"
      onClick={onClick}
      onMouseEnter={() => clickable && setHover(true)}
      onMouseLeave={() => clickable && setHover(false)}
      style={{
        borderRadius: 14,
        border: active ? `1.5px solid ${color}` : "1px solid #f1f2f4",
        boxShadow: active
          ? `0 0 0 3px ${color}1f, 0 4px 10px rgba(16,24,40,.08)`
          : (hover ? "0 6px 14px rgba(16,24,40,.10)" : "0 1px 2px rgba(16,24,40,.04)"),
        cursor: clickable ? "pointer" : "default",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "all .15s ease",
      }}
    >
      <div className="card-body" style={{ padding: "18px 18px" }}>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span style={{
            width: 40, height: 40, borderRadius: 10, background: bg,
            display: "flex", alignItems: "center", justifyContent: "center", color,
          }}>{icon}</span>
          {active && (
            <span className="badge" style={{ background: color, color: "#fff", fontSize: 9, fontWeight: 700 }}>Filtering</span>
          )}
        </div>
        <p className="mb-1 fw-bold" style={{ fontSize: 24, color: "#111827", lineHeight: 1 }}>{value}</p>
        <p className="mb-0" style={{ fontSize: 11.5, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
        {sub && <p className="mb-0 mt-1" style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</p>}
        {clickable && <p className="mb-0 mt-1" style={{ fontSize: 10, color: "#9ca3af" }}>Click to view in Records →</p>}
      </div>
    </div>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────
// ✅ CHANGED — accepts `initialProgramId` so the "Assign This Training"
// quick button on a program card (0-assigned state) can jump straight
// into this modal with that program already selected.
function AssignModal({ programs, employees, onClose, onSave, initialProgramId }) {
  const [mode, setMode]         = useState("single"); // "single"|"bulk"
  const [employeeId, setEmpId]  = useState("");
  const [employeeIds, setEmpIds]= useState([]);
  const [programId, setProgId]  = useState(initialProgramId || "");
  const [dueDate, setDueDate]   = useState(() => {
    if (initialProgramId) {
      const p = programs.find(x => x._id === initialProgramId);
      if (p?.accessEndDate) return new Date(p.accessEndDate).toISOString().slice(0,10);
    }
    return "";
  });
  const [dueAuto, setDueAuto]   = useState(!!initialProgramId); // true while dueDate was auto-filled from the course end date
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

  const preselectedProgram = initialProgramId ? programs.find(p => p._id === initialProgramId) : null;

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
            {/* ✅ NEW — quick-assign confirmation banner when opened from a program card */}
            {preselectedProgram && (
              <div className="d-flex align-items-center gap-2 mb-3" style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:9, padding:"8px 12px" }}>
                <Zap size={13} color="#3b82f6" />
                <span style={{ fontSize:12, color:"#1e40af" }}>Assigning <strong>{preselectedProgram.title}</strong> — pick employees below.</span>
              </div>
            )}
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
                      const q = a.questionId;
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
function QuizQuestionsManagerModal({ onClose, showMsg }) {
  const [mode, setMode]           = useState("product");
  const [products, setProducts]   = useState([]);
  const [programs, setPrograms]   = useState([]);
  const [productId, setProductId] = useState("");
  const [programId, setProgramId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadingQs, setLoadingQs] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
function CertificateRequestsPanel({ records, onUploaded }) {
  const [uploadingId, setUploadingId] = useState(null);
  const [fileFor, setFileFor] = useState({});

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
  const [description, setDescription] = useState(editingProgram?.description || "");
  const uidRef = useRef(0);
  const newUid = () => `c${Date.now()}-${uidRef.current++}`;
  const [chapters, setChapters] = useState(
    (editingProgram?.chapters || []).map(ch => ({ ...ch, contentType: ch.contentType || "video", videoFile: null, uid: newUid(), upload: null }))
  );
  const [useChapters, setUseChapters] = useState((editingProgram?.chapters || []).length > 0);
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

  const MAX_PARALLEL_UPLOADS = 2;
  const MAX_VIDEO_MB = 210;
  const MAX_PDF_MB = 20;
  const controllersRef = useRef({});
  const queueRef = useRef([]);
  const activeRef = useRef(0);
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
    fd.append("duration", useChapters ? "" : duration);
    fd.append("certification", hasCertification ? certification.trim() : "");
    fd.append("conductedBy", conductedBy);

    if (useChapters) {
      const uploaded = {};
      chapters.forEach((ch, i) => {
        if ((ch.contentType === "pdf" || ch.videoSource !== "youtube") && ch.upload?.status === "done") uploaded[i] = ch.upload;
      });

      const chaptersMeta = chapters.map((ch, i) => {
        const out = { chapterNo: ch.chapterNo, title: ch.title.trim(), description: ch.description.trim(), contentType: ch.contentType || "video", duration: ch.duration, videoSource: ch.videoSource };
        out.quizQuestions = (ch.quizQuestions || []).map(q => ({
          questionText: q.questionText.trim(),
          options: q.options.map(o => o.trim()),
          correctOptionIndex: q.correctOptionIndex,
        }));
        if (ch.contentType === "pdf") {
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
          if (!orig || orig.videoUrl !== out.videoUrl) out.duration = "";
        } else {
          out.videoUrl = ch.videoUrl || "";
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
                                  updateChapter(idx, { fileError: `"${f.name}" is ${(f.size / 1048576).toFixed(0)} MB — over the ${MAX_VIDEO_MB} MB limit. Please compress it (e.g. 720p) and choose it again.` });
                                  e.target.value = "";
                                  return;
                                }
                                updateChapter(idx, { fileError: "" });
                                if (f) startUpload(ch.uid, f);
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

// ─── Program Preview Modal (✅ NEW) ─────────────────────────────
// Read-only "View" for a program card's 🔍 icon: full description,
// chapter list (content type / duration / quiz count), certification,
// session info for offline programs. "Edit Program" jumps straight
// into CreateProgramModal in edit mode.
function ProgramPreviewModal({ program, onClose, onEdit }) {
  const typ = TYPE_CONFIG[program.type] || TYPE_CONFIG.job_role;
  const chapters = [...(program.chapters || [])].sort((a, b) => a.chapterNo - b.chapterNo);
  const totalQuizQuestions = chapters.reduce((sum, c) => sum + (c.quizQuestions?.length || 0), 0);

  return (
    <div className="modal show d-block" style={{ background: "rgba(15,23,42,.45)", zIndex: 1052 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 14 }}>
          <div className="modal-header border-bottom" style={{ background: "#f9fafb", borderRadius: "14px 14px 0 0" }}>
            <div className="d-flex align-items-center gap-2">
              <Eye size={17} color="#3b82f6" />
              <div>
                <p className="mb-0 fw-bold" style={{ fontSize: 14 }}>{program.title}</p>
                <span className="badge mt-1" style={{ background: typ.bg, color: typ.color, fontSize: 10, fontWeight: 700 }}>{typ.label}</span>
              </div>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto" }}>
            {/* Quick facts row */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="badge" style={{
                background: program.deliveryMode === "offline" ? "#fff7ed" : "#eff6ff",
                color: program.deliveryMode === "offline" ? "#f97316" : "#3b82f6",
                border: `1px solid ${program.deliveryMode === "offline" ? "#fed7aa" : "#bfdbfe"}`,
                fontSize: 11, fontWeight: 700, padding: "5px 10px",
              }}>
                {program.deliveryMode === "offline" ? "📍 Offline" : "💻 Online"}
              </span>
              {programLength(program) && (
                <span className="badge bg-light text-dark border" style={{ fontSize: 11, fontWeight: 600 }}>
                  <Clock size={11} className="me-1" />{programLength(program)}
                </span>
              )}
              {program.department && (
                <span className="badge bg-light text-dark border" style={{ fontSize: 11, fontWeight: 600 }}>
                  {program.department === "all" ? "All Departments" : program.department}
                </span>
              )}
              {chapters.length > 0 && (
                <span className="badge bg-light text-dark border" style={{ fontSize: 11, fontWeight: 600 }}>
                  <Layers size={11} className="me-1" />{chapters.length} chapters
                </span>
              )}
              {totalQuizQuestions > 0 && (
                <span className="badge bg-light text-dark border" style={{ fontSize: 11, fontWeight: 600 }}>
                  <HelpCircle size={11} className="me-1" />{totalQuizQuestions} quiz questions
                </span>
              )}
            </div>

            {program.description && (
              <div className="mb-3">
                <label style={labelStyle}>Description</label>
                <p className="mb-0" style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{program.description}</p>
              </div>
            )}

            {program.modules?.length > 0 && (
              <div className="mb-3">
                <label style={labelStyle}>Modules / Topics</label>
                <div className="d-flex flex-wrap gap-2">
                  {program.modules.map((m, i) => (
                    <span key={i} className="badge bg-light text-dark border" style={{ fontSize: 11, fontWeight: 500 }}>{m}</span>
                  ))}
                </div>
              </div>
            )}

            {program.certification && (
              <div className="d-flex align-items-center gap-2 mb-3" style={{ background: `${typ.color}0d`, borderRadius: 8, padding: "9px 12px" }}>
                <Award size={14} color={typ.color} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: typ.color, fontWeight: 600 }}>{program.certification}</span>
              </div>
            )}

            {program.deliveryMode === "offline" && (
              <div className="mb-3" style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 9, padding: "10px 12px" }}>
                <p className="mb-1 fw-bold" style={{ fontSize: 12, color: "#c2410c" }}>Session Details</p>
                <p className="mb-0" style={{ fontSize: 12, color: "#7c2d12" }}>
                  {program.sessionDate ? new Date(program.sessionDate).toLocaleDateString("en-IN") : "Date TBD"}
                  {program.sessionTime ? `, ${program.sessionTime}` : ""}{program.venue ? ` · ${program.venue}` : ""}
                </p>
              </div>
            )}

            {program.conductedBy && (
              <p className="mb-3" style={{ fontSize: 12, color: "#6b7280" }}>
                <UserCheck size={12} className="me-1" />Conducted by <strong>{program.conductedBy}</strong>
              </p>
            )}

            {(program.accessStartDate || program.accessEndDate) && (
              <p className="mb-3" style={{ fontSize: 11.5, color: "#9ca3af" }}>
                <Calendar size={11} className="me-1" />
                Access window: {program.accessStartDate ? new Date(program.accessStartDate).toLocaleDateString("en-IN") : "Anytime"}
                {" – "}
                {program.accessEndDate ? new Date(program.accessEndDate).toLocaleDateString("en-IN") : "No end date"}
              </p>
            )}

            {chapters.length > 0 && (
              <div>
                <label style={labelStyle}>Chapters ({chapters.length})</label>
                <div className="d-flex flex-column gap-2">
                  {chapters.map(c => (
                    <div key={c.chapterNo} className="d-flex align-items-start gap-2" style={{ border: "1px solid #e5e7eb", borderRadius: 9, padding: "9px 11px", background: "#fafafa" }}>
                      <span style={{ flexShrink: 0, marginTop: 1, color: "#9ca3af" }}>
                        {c.contentType === "pdf" ? <FileType size={15} /> : <PlayCircle size={15} />}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p className="mb-0 fw-semibold" style={{ fontSize: 12.5 }}>Ch.{c.chapterNo} — {c.title}</p>
                        {c.description && <p className="mb-0 text-muted" style={{ fontSize: 11 }}>{c.description}</p>}
                        <div className="d-flex flex-wrap gap-2 mt-1">
                          {c.duration && <span className="text-muted" style={{ fontSize: 10.5 }}>⏱ {c.duration}</span>}
                          {(c.quizQuestions?.length || 0) > 0 && (
                            <span className="text-muted" style={{ fontSize: 10.5 }}>📝 {c.quizQuestions.length} quiz question{c.quizQuestions.length > 1 ? "s" : ""}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!program.description && !program.modules?.length && chapters.length === 0 && (
              <p className="text-muted text-center py-3" style={{ fontSize: 12.5 }}>No further details added for this program yet.</p>
            )}
          </div>

          <div className="modal-footer gap-2">
            <button className="btn btn-light flex-fill" onClick={onClose}>Close</button>
            <button className="btn btn-primary fw-bold flex-fill d-flex align-items-center justify-content-center gap-1" onClick={onEdit}>
              <Pencil size={13} /> Edit Program
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
  const [modal, setModal]         = useState(null); // "assign"|"update"|"quizQuestions"|"createProgram"
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeTab, setActiveTab] = useState("roadmap"); // "roadmap"|"records"|"kpi"|"certificates"
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept]     = useState("all");
  const [seeding, setSeeding]     = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingLogId, setDeletingLogId] = useState(null);
  const [expandedEmp, setExpandedEmp] = useState(null);
 const [editingProgram, setEditingProgram] = useState(null);
  const [deletingProgramId, setDeletingProgramId] = useState(null);
  const [unassigningId, setUnassigningId] = useState(null);
  const [lockingId, setLockingId] = useState(null);
  const [unassignInfo, setUnassignInfo] = useState(null);

  // ✅ NEW — 🔍 read-only program preview (View button on a program card)
  const [previewProgram, setPreviewProgram] = useState(null);
  // ✅ NEW — quick-assign preset: set when "Assign This Training" is clicked
  // on a 0-assigned program card, so AssignModal opens with that program
  // already selected.
  const [assignPresetId, setAssignPresetId] = useState(null);
  // ✅ NEW — which stat card (if any) drove the current Records filter, so
  // we can highlight that card and show a "Filtered from X" banner + Clear.
  const [statFilterKey, setStatFilterKey] = useState(null); // 'in_progress'|'overdue'|'certified'|null
  const [filterCertifiedOnly, setFilterCertifiedOnly] = useState(false);
  // ✅ NEW — search box next to "Active Training Programs" (title/modules/conductedBy)
  const [programSearch, setProgramSearch] = useState("");

  const showMsg = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
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

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL training programs permanently? This cannot be undone.")) return;
    setSeeding(true);
    try {
      const res = await axios.delete(`${API_BASE}/api/training/programs`);
      showMsg(res.data.message);
      fetchAll();
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
      setAssignPresetId(null);
      fetchAll();
    } catch(e) { showMsg(e?.response?.data?.message||"Failed","error"); }
  };

  // ✅ NEW — opens the Assign modal pre-loaded with this program (from the
  // "Assign This Training" quick button that shows on 0-assigned cards).
  const openQuickAssign = (program) => {
    setAssignPresetId(program._id);
    setModal("assign");
  };

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

  const handleToggleLock = async (record) => {
    setLockingId(record._id);
    try {
      const action = record.isLocked ? "unlock" : "lock";
      await axios.put(`${API_BASE}/api/training/records/${record._id}/${action}`, { addedBy: "HR" });
      showMsg(record.isLocked ? "Training unlocked." : "Training locked.");
      fetchAll();
    } catch (e) {
      showMsg(e?.response?.data?.message || "Failed", "error");
    } finally {
      setLockingId(null);
    }
  };

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

  // ✅ NEW — stat-card → Records shortcut. `key` is a stable id used only
  // to highlight the right card; the actual filtering reuses the existing
  // filterStatus (server-side) or a client-side certified-only flag.
  const handleStatClick = (key) => {
    setActiveTab("records");
    setStatFilterKey(key);
    if (key === "in_progress") { setFilterStatus("in_progress"); setFilterCertifiedOnly(false); }
    else if (key === "overdue") { setFilterStatus("overdue"); setFilterCertifiedOnly(false); }
    else if (key === "certified") { setFilterStatus("all"); setFilterCertifiedOnly(true); }
  };
  const clearStatFilter = () => {
    setStatFilterKey(null);
    setFilterStatus("all");
    setFilterCertifiedOnly(false);
  };
  const statFilterLabel = { in_progress: "In Progress", overdue: "Overdue", certified: "Certified" }[statFilterKey] || "";

  const filteredRecords = records.filter(r => {
    const matchSearch = !search.trim() ||
      r.employeeId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.programId?.title?.toLowerCase().includes(search.toLowerCase());
    const matchCertified = !filterCertifiedOnly || r.certificationIssued;
    return matchSearch && matchCertified;
  });

  // ✅ NEW — search box next to "Active Training Programs" header
  const visiblePrograms = programs.filter(p => p.isActive !== false);
  const filteredPrograms = visiblePrograms.filter(p => {
    if (!programSearch.trim()) return true;
    const q = programSearch.toLowerCase();
    return p.title?.toLowerCase().includes(q) ||
      p.conductedBy?.toLowerCase().includes(q) ||
      (p.modules || []).some(m => m.toLowerCase().includes(q));
  });

  return (
    <div className="container-fluid py-4" style={{ maxWidth:1400 }}>
      {/* ✅ NEW — small stylesheet for the program-card hover lift + 2-line title clamp,
          kept local to this component so nothing else on the page is affected. */}
      <style>{`
        .hr-program-card { transition: transform .18s ease, box-shadow .18s ease; }
        .hr-program-card:hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(16,24,40,.12); }
        .hr-title-clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .hr-menu-item:hover { background: #f9fafb; }
        .hr-records-table > thead > tr > th { font-size: 11.5px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .03em; padding: 12px 10px; }
        .hr-records-table > tbody > tr:not(.hr-history-row) { border-bottom: 1px solid #f1f2f4; }
        .hr-records-table > tbody > tr:not(.hr-history-row) > td { padding: 14px 10px; vertical-align: middle; }
        .hr-records-table > tbody > tr:not(.hr-history-row):nth-of-type(4n+1) { background: #fcfcfd; }
        .hr-records-table > tbody > tr:not(.hr-history-row):hover { background: #f5f8ff !important; }
      `}</style>

        {toast && <div className={`alert alert-${toast.type==="error"?"danger":"success"} position-fixed top-0 end-0 m-3`} style={{ zIndex:9999, fontSize:13 }}>{toast.msg}</div>}

      {unassignInfo && (
        <div className="alert alert-warning position-fixed top-0 end-0 m-3 d-flex align-items-center gap-3 shadow-sm" style={{ zIndex:9999, fontSize:13 }}>
          <span>Unassigned "{unassignInfo.progTitle}" from {unassignInfo.empName}.</span>
          <button className="btn btn-sm btn-dark fw-bold" onClick={handleUndoUnassign}>Undo</button>
        </div>
      )}

      {modal === "assign" && (
        <AssignModal
          programs={programs}
          employees={employees}
          initialProgramId={assignPresetId}
          onClose={()=>{ setModal(null); setAssignPresetId(null); }}
          onSave={handleAssign}
        />
      )}
      {modal === "update" && selectedRecord && <UpdateRecordModal record={selectedRecord} onClose={()=>{setModal(null);setSelectedRecord(null);}} onSave={handleUpdate} />}
      {modal === "quizQuestions" && <QuizQuestionsManagerModal onClose={()=>setModal(null)} showMsg={showMsg} />}
      {/* ✅ NEW — read-only program preview, opened from the 🔍 icon on a program card */}
      {previewProgram && (
        <ProgramPreviewModal
          program={previewProgram}
          onClose={() => setPreviewProgram(null)}
          onEdit={() => { setEditingProgram(previewProgram); setPreviewProgram(null); setModal("createProgram"); }}
        />
      )}
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
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2 fw-bold" onClick={()=>setModal("quizQuestions")}>
              <ClipboardList size={14} /> Manage Quiz Questions
            </button>
            <button className="btn btn-primary d-flex align-items-center gap-2 fw-bold" onClick={()=>{ setAssignPresetId(null); setModal("assign"); }}>
              <Plus size={14} /> Assign Training
            </button>
            <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-2 fw-bold" onClick={()=>{ setEditingProgram(null); setModal("createProgram"); }}>
              <Plus size={14} /> Create Training
            </button>
          </div>
          {/* ✅ CHANGED — "Clear All Programs" visually separated with a divider
              so it doesn't sit at the same weight as Assign/Create and isn't
              an easy accidental click next to the everyday-use buttons. */}
          {programs.length > 0 && (
            <div className="d-flex align-items-center" style={{ borderLeft: "1px solid #e5e7eb", paddingLeft: 12, marginLeft: 4 }}>
              <button className="btn btn-sm btn-outline-danger fw-bold" onClick={handleClearAll} disabled={seeding}>
                {seeding ? "Clearing..." : "🗑 Clear All Programs"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      {/* ✅ CHANGED — In Progress / Overdue / Certified are now clickable
          shortcuts into the Records tab, pre-filtered. Total Assigned,
          Completion Rate and Avg Score stay as plain summary cards. */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col"><StatCard label="Total Assigned"    value={stats.total}          color="#111827" bg="#f3f4f6" icon={<BookOpen size={15}/>} /></div>
          <div className="col"><StatCard label="Completion Rate"   value={`${stats.completionRate}%`} sub={`Target ≥ 95%`} color={stats.completionRate>=95?"#10b981":"#ef4444"} bg={stats.completionRate>=95?"#ecfdf5":"#fef2f2"} icon={<CheckCircle2 size={15}/>} /></div>
          <div className="col"><StatCard label="In Progress"       value={stats.inProgress}     color="#3b82f6" bg="#eff6ff" icon={<Clock size={15}/>} onClick={()=>handleStatClick("in_progress")} active={statFilterKey==="in_progress"} /></div>
          <div className="col"><StatCard label="Overdue"           value={stats.overdue}        color="#ef4444" bg="#fef2f2" icon={<AlertTriangle size={15}/>} onClick={()=>handleStatClick("overdue")} active={statFilterKey==="overdue"} /></div>
          <div className="col"><StatCard label="Avg Score"         value={`${stats.avgScore}%`} sub="Target ≥ 80%" color={stats.avgScore>=80?"#10b981":"#f59e0b"} bg={stats.avgScore>=80?"#ecfdf5":"#fffbeb"} icon={<Target size={15}/>} /></div>
          <div className="col"><StatCard label="Certified"         value={stats.certified}      color="#8b5cf6" bg="#f5f3ff" icon={<Award size={15}/>} onClick={()=>handleStatClick("certified")} active={statFilterKey==="certified"} /></div>
        </div>
      )}

      {/* ── Tabs ── */}
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

          {/* Active Training Programs header + search */}
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <p className="fw-bold mb-0" style={{ fontSize: 14 }}>Active Training Programs</p>
            <div className="d-flex align-items-center gap-3">
              {/* ✅ NEW — search programs by title / modules / conducted-by */}
              <div className="input-group input-group-sm" style={{ maxWidth: 220 }}>
                <span className="input-group-text border-end-0 bg-white"><Search size={13} color="#9ca3af"/></span>
                <input
                  className="form-control border-start-0"
                  placeholder="Search programs..."
                  value={programSearch}
                  onChange={e=>setProgramSearch(e.target.value)}
                />
              </div>
              <span className="text-muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                {filteredPrograms.length} of {visiblePrograms.length} program{visiblePrograms.length===1?"":"s"}
              </span>
            </div>
          </div>

          {visiblePrograms.length === 0 ? (
            <div className="card border-0 shadow-sm text-center py-5" style={{ borderRadius: 13 }}>
              <Layers size={36} className="text-muted mb-3 mx-auto" />
              <p className="text-muted mb-3">No training programs yet.</p>
              <button className="btn btn-primary btn-sm mx-auto" style={{ width: "fit-content" }} onClick={()=>{ setAssignPresetId(null); setModal("assign"); }}>
                <Plus size={13} /> Assign Training
              </button>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="card border-0 shadow-sm text-center py-5" style={{ borderRadius: 13 }}>
              <Search size={32} className="text-muted mb-3 mx-auto" />
              <p className="text-muted mb-0">No programs match "{programSearch}".</p>
            </div>
          ) : (
            <div className="row g-3">
              {filteredPrograms.map(p => {
                const typ = TYPE_CONFIG[p.type] || TYPE_CONFIG.job_role;
                const progRecords = records.filter(r => r.programId?._id === p._id);
                const assignedCount = progRecords.length;
                const completedCount = progRecords.filter(r => r.status === "completed").length;
                const completionPct = assignedCount ? Math.round((completedCount / assignedCount) * 100) : 0;
                const chapterCount = p.chapters?.length || 0;
                return (
                  <div key={p._id} className="col-md-6 col-lg-4">
                    {/* ✅ CHANGED — hover-lift class added */}
                    <div className="card border-0 shadow-sm h-100 hr-program-card" style={{ borderRadius: 13, borderTop: `3px solid ${typ.color}` }}>
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                          {/* ✅ CHANGED — 2-line clamp + native tooltip on hover for the full title */}
                          <p className="fw-bold mb-0 hr-title-clamp" title={p.title} style={{ fontSize: 14, color: "#111827", lineHeight: 1.3 }}>{p.title}</p>
                          <div className="d-flex align-items-center gap-1 flex-shrink-0">
                            <span className="badge" style={{ background: typ.bg, color: typ.color, fontSize: 10, fontWeight: 700 }}>{typ.label}</span>
                            {/* ✅ NEW — 🔍 View: read-only ProgramPreviewModal */}
                            <button
                              className="btn btn-sm p-1 d-flex align-items-center justify-content-center"
                              title="View program details"
                              style={{ width: 22, height: 22, border: "1px solid #bfdbfe", borderRadius: 6, background: "#fff" }}
                              onClick={() => setPreviewProgram(p)}
                            >
                              <Eye size={11} color="#3b82f6" />
                            </button>
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

                        {/* Delivery mode + chapter-count badges */}
                        <div className="mb-2 d-flex flex-wrap gap-2">
                          <span className="badge" style={{
                            background: p.deliveryMode === "offline" ? "#fff7ed" : "#eff6ff",
                            color: p.deliveryMode === "offline" ? "#f97316" : "#3b82f6",
                            border: `1px solid ${p.deliveryMode === "offline" ? "#fed7aa" : "#bfdbfe"}`,
                            fontSize: 10, fontWeight: 700, padding: "3px 9px",
                          }}>
                            {p.deliveryMode === "offline" ? "📍 Offline" : "💻 Online"}
                          </span>
                          {/* ✅ NEW — chapter count badge */}
                          {chapterCount > 0 && (
                            <span className="badge" style={{ background: "#f5f3ff", color: "#8b5cf6", border: "1px solid #ddd6fe", fontSize: 10, fontWeight: 700, padding: "3px 9px" }}>
                              <Layers size={10} className="me-1" />{chapterCount} chapter{chapterCount > 1 ? "s" : ""}
                            </span>
                          )}
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

                        {/* ✅ NEW — quick-assign button for a program nobody is on yet */}
                        {assignedCount === 0 && (
                          <button
                            className="btn btn-sm w-100 mt-2 d-flex align-items-center justify-content-center gap-1"
                            style={{ background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", fontSize: 12, fontWeight: 700, borderRadius: 8 }}
                            onClick={() => openQuickAssign(p)}
                          >
                            <Plus size={12} /> Assign This Training
                          </button>
                        )}

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
          <div className="alert d-flex align-items-start gap-2 mb-3" style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, fontSize:12 }}>
            <Info size={14} color="#3b82f6" style={{ flexShrink:0, marginTop:1 }}/>
            <p className="mb-0" style={{ color:"#1e40af" }}>
              All trainings are tracked via RCA (Radnus Corporate Academy). Click the arrow next to any row to see its full history log. Managers must ensure 100% training compliance before confirming employee probation or promotion.
            </p>
          </div>

          {/* ✅ NEW — banner shown only when this list is filtered from a stat card click */}
          {statFilterKey && (
            <div className="alert d-flex align-items-center justify-content-between gap-2 mb-3" style={{ background:"#f5f3ff", border:"1px solid #ddd6fe", borderRadius:10, fontSize:12, padding:"8px 14px" }}>
              <span style={{ color:"#6d28d9" }}>
                <Filter size={13} className="me-1" />
                Filtered from <strong>{statFilterLabel}</strong> stat card
              </span>
              <button className="btn btn-sm btn-outline-secondary" style={{ fontSize:11 }} onClick={clearStatFilter}>
                <X size={11} className="me-1" />Clear filter
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius:10 }}>
            <div className="card-body py-2 px-3 d-flex gap-3 align-items-center flex-wrap">
              <div className="input-group input-group-sm" style={{ maxWidth:240 }}>
                <span className="input-group-text border-end-0 bg-white"><Search size={13} color="#9ca3af"/></span>
                <input className="form-control border-start-0" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <select className="form-select form-select-sm" style={{ maxWidth:150 }} value={filterStatus} onChange={e=>{ setFilterStatus(e.target.value); setStatFilterKey(null); }}>
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
              <button className="btn btn-primary btn-sm mt-2" onClick={()=>{ setAssignPresetId(null); setModal("assign"); }}>
                <Plus size={13}/> Assign First Training
              </button>
            </div>
          ) : (
            <div className="card border-0 shadow-sm" style={{ borderRadius:12, overflow:"hidden" }}>
              <div className="table-responsive">
                <table className="table align-middle mb-0 hr-records-table" style={{ fontSize:13 }}>
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
                      const isDeleting = deletingId === r._id;
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
                            <div className="d-flex flex-column gap-1 align-items-start">
                              {/* ✅ CHANGED — "all" level hidden (not useful info), pills made compact/rounded */}
                              {lvl && r.programId?.level !== "all" && (
                                <span className="badge" style={{ background:lvl.color, color:"#fff", fontSize:10, fontWeight:600, borderRadius:20, padding:"3px 9px" }}>{r.programId?.level}</span>
                              )}
                              <span className="badge" style={{ background:typ.bg, color:typ.color, fontSize:10, fontWeight:600, borderRadius:20, padding:"3px 9px" }}>{typ.label}</span>
                            </div>
                          </td>
                          <td>
                            {/* ✅ CHANGED — status badge + lock icon inline on one line instead of stacked blocks */}
                            <div className="d-flex align-items-center gap-1 flex-wrap">
                              <span className="badge" style={{ background:st.bg, color:st.color, border:`1px solid ${st.color}33`, fontSize:11, borderRadius:20, padding:"4px 10px" }}>
                                {isOverdue && r.status!=="completed" ? "Overdue" : st.label}
                              </span>
                              {r.isLocked && (
                                <span title={`Locked${r.lockReason==="auto_due_date" ? " (due date)" : ""}`}
                                  style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:20, height:20, borderRadius:"50%", background:"#1f2937", color:"#fff", flexShrink:0 }}>
                                  <Lock size={10} />
                                </span>
                              )}
                            </div>
                            {r.submittedForReview && r.status !== "completed" && (
                              <span className="badge d-block mt-1" style={{ background:"#fffbeb", color:"#92400e", border:"1px solid #fde68a", fontSize:10, width:"fit-content" }}>
                                Submitted by employee
                              </span>
                            )}
                            <div className="mt-1"><ChapterProgressChip record={r} /></div>
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
                            {/* ✅ CHANGED — was 4 buttons crammed in a row (overflowed on narrow
                                screens); now "Update" stays visible, the rest live in a ⋮ menu. */}
                            <RowActionsMenu
                              record={r}
                              isDeleting={isDeleting}
                              unassigningId={unassigningId === r._id}
                              lockingId={lockingId === r._id}
                              onUpdate={() => { setSelectedRecord(r); setModal("update"); }}
                              onUnassign={() => handleUnassign(r)}
                              onToggleLock={() => handleToggleLock(r)}
                              onDelete={() => handleDeleteRecord(r)}
                            />
                          </td>
                        </tr>
                        {isHistoryOpen && (
                          <tr className="hr-history-row">
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

      {/* ══ CERTIFICATE REQUESTS TAB ═══════════════════════════════ */}
      {activeTab === "certificates" && (
        <CertificateRequestsPanel
          records={records.filter(r => r.certificateRequestStatus && r.certificateRequestStatus !== "none")}
          onUploaded={fetchAll}
        />
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