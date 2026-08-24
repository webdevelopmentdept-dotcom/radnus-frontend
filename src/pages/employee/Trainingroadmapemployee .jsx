import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import {
  BookOpen, Award, CheckCircle2, Clock, AlertTriangle,
  Target, GraduationCap, ChevronRight, Check, Star,
  Calendar, Layers, Info, RefreshCw, Zap, TrendingUp,
  FileText, Users, BarChart2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ✅ NEW — pulls the 11-char YouTube video ID out of any common URL shape
// (watch?v=, youtu.be/, already-an-embed URL). Returns null if it can't
// find one, so callers can fall back to a plain non-interactive iframe.
function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ✅ NEW — loads the YouTube IFrame Player API script exactly once per
// page, even if several modals mount/unmount and all want it.
let ytApiPromise = null;
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevCallback?.();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

// ─── Global Styles ─────────────────────────────────────────────
// Design tokens live as CSS custom properties on .tr-page so every
// inline style below can reference var(--token) instead of a raw hex —
// re-theming happens in one place, JSX/logic is untouched.
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }

  .tr-page {
    /* ── Design tokens ───────────────────────────────────────── */
    --ink:          #101828;
    --body:         #344054;
    --muted:        #667085;
    --muted-2:      #98a2b3;
    --line:         #e4e7ec;
    --line-soft:    #eef1f5;
    --bg-soft:      #f2f4f7;
    --page-bg:      #f6f7fb;
    --surface:      #ffffff;

    --brand:        #1d4ed8;
    --brand-dark:   #101c44;
    --brand-tint:   #eaf0fe;
    --violet:       #6d28d9;
    --violet-tint:  #f3eefd;
    --success:      #0e9f6e;
    --success-tint: #e7f9f1;
    --warning:      #b45309;
    --warning-tint: #fef3e2;
    --orange:       #c2410c;
    --orange-tint:  #fff1e8;
    --danger:       #c0231b;
    --danger-tint:  #fdece9;

    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --shadow-sm: 0 1px 2px rgba(16,24,40,.05);
    --shadow-md: 0 2px 10px rgba(16,24,40,.07);
    --shadow-lg: 0 12px 32px rgba(16,24,40,.14);

    padding: 28px 32px;
    min-height: 100vh;
    background: var(--page-bg);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--body);
  }
  .tr-page * { box-sizing: border-box; }
  .tr-page ::selection { background: var(--brand-tint); color: var(--brand-dark); }
  .tr-page button:focus-visible, .tr-page a:focus-visible, .tr-page input:focus-visible {
    outline: 2px solid var(--brand); outline-offset: 2px;
  }
  .tr-font-display { font-family: 'Manrope', 'Inter', sans-serif; letter-spacing: -0.01em; }

  .tr-card { background: var(--surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--line-soft); }
  .tr-btn { font-family: 'Inter', sans-serif; transition: background .15s ease, border-color .15s ease, transform .1s ease, box-shadow .15s ease; }
  .tr-btn:active { transform: translateY(1px); }
  .tr-training-card { transition: box-shadow .18s ease, transform .18s ease; animation: fadeUp .3s ease both; }
  .tr-training-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

  .tr-tabs { scrollbar-width: none; }
  .tr-tabs::-webkit-scrollbar { display: none; }
  .tr-tab-btn { transition: background .15s ease, color .15s ease; }

  .tr-quiz-option:hover { background: var(--bg-soft); }

  /* ── Tablet ──────────────────────────────────────────────── */
  @media (max-width: 900px) {
    .tr-cards-grid { grid-template-columns: 1fr !important; }
  }

  /* ── Mobile ──────────────────────────────────────────────── */
  @media (max-width: 768px) {
    .tr-page { padding: 16px !important; }
    .tr-header-row { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
    .tr-header-row > div:first-child { width: 100% !important; }
    .tr-refresh-btn { width: 100% !important; justify-content: center !important; }
    .tr-title { font-size: 17px !important; }
    .tr-framework-banner { flex-direction: column !important; gap: 10px !important; align-items: flex-start !important; }
    .tr-framework-banner > span { display: block; }
    .tr-stats-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
    .tr-stats-grid p:first-child { font-size: 17px !important; }
    .tr-tabs { flex-wrap: nowrap !important; overflow-x: auto !important; }
    .tr-tab-btn { font-size: 11.5px !important; padding: 8px 12px !important; flex-shrink: 0; }
    .tr-cards-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
    .tr-roadmap-header { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
    .tr-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
    .tr-table-wrap table { min-width: 480px; }
    .tr-modal-sheet { align-items: flex-end !important; padding: 0 !important; }
    .tr-modal-sheet > div { max-width: 100% !important; width: 100% !important; border-radius: 18px 18px 0 0 !important; max-height: 92vh !important; }
  }

  @media (max-width: 480px) {
    .tr-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .tr-tab-btn { flex: 0 0 auto !important; }
    .tr-card-footer { flex-direction: column !important; align-items: stretch !important; }
    .tr-card-footer > div:last-child { width: 100%; justify-content: stretch !important; }
    .tr-card-footer button { flex: 1; text-align: center; }
  }
`;

// ─── Constants ─────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:     { label: "Pending",     color: "var(--muted)",  bg: "var(--bg-soft)" },
  in_progress: { label: "In Progress", color: "var(--brand)",  bg: "var(--brand-tint)" },
  completed:   { label: "Completed",   color: "var(--success)", bg: "var(--success-tint)" },
  overdue:     { label: "Overdue",     color: "var(--danger)", bg: "var(--danger-tint)" },
  waived:      { label: "Waived",      color: "var(--violet)", bg: "var(--violet-tint)" },
  pending_review:  { label: "Pending HR Review", color: "var(--warning)", bg: "var(--warning-tint)" }, // ✅ NEW — quiz submitted, awaiting HR sign-off
  retrain:         { label: "Retrain Required",  color: "var(--orange)",  bg: "var(--orange-tint)" }, // ✅ NEW — HR asked for a re-study + retake
  needs_hr_review: { label: "Needs HR Review",   color: "var(--danger)",  bg: "var(--danger-tint)" }, // legacy status, kept for old records
  failed_retake:   { label: "Failed (old data)", color: "var(--danger)",  bg: "var(--danger-tint)" }, // legacy status from the old multi-attempt system
 absent:          { label: "Absent / Not Attended", color: "var(--danger)", bg: "var(--bg-soft)" },
};

const TYPE_CONFIG = {
  induction:        { label: "Induction",       color: "var(--brand)" },
  job_role:         { label: "Job Role",         color: "var(--violet)" },
  cross_functional: { label: "Cross-Functional", color: "var(--warning)" },
  culture:          { label: "Culture",          color: "var(--success)" },
  refresher:        { label: "Refresher",        color: "var(--muted)" },
  department:       { label: "Department",       color: "var(--danger)" },
};

function getEmployeeId() {
  return (
    localStorage.getItem("employee_id") ||
    localStorage.getItem("employeeId")  ||
    localStorage.getItem("emp_id")      ||
    null
  );
}

// ─── Training Card ──────────────────────────────────────────────
function TrainingCard({ record, onStart, onViewDetails, onSubmit }) {
  const st  = STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;
  const typ = TYPE_CONFIG[record.programId?.type] || TYPE_CONFIG.job_role;
  const prog = record.programId;
  const isOffline = prog?.deliveryMode === "offline";
  const displayDate = isOffline && prog?.sessionDate ? prog.sessionDate : record.dueDate;
  const isOverdue = displayDate && (() => {
  const end = new Date(displayDate);
  end.setHours(23, 59, 59, 999);
  return end < new Date();
})() && record.status !== "completed";

  return (
    <div className="tr-card tr-training-card" style={{
      padding: "18px",
      borderLeft: `4px solid ${isOverdue ? "var(--danger)" : st.color}`,
      height: "100%",
    }}>
      {/* Top badges */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 4 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ background: typ.color, color: "#fff", borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700, letterSpacing: ".01em" }}>{typ.label}</span>
          <span style={{ background: isOverdue ? "var(--danger-tint)" : st.bg, color: isOverdue ? "var(--danger)" : st.color, border: `1px solid ${isOverdue ? "var(--danger)" : st.color}33`, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700 }}>
            {isOverdue ? "Overdue" : st.label}
          </span>
          {record.certificationIssued && (
            <span style={{ background: "var(--warning-tint)", color: "var(--warning)", border: "1px solid #fde3ad", borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
              <Award size={9} /> Certified
            </span>
          )}
        </div>
        {prog?.duration && <span style={{ fontSize: 11, color: "var(--muted-2)" }}>{prog.duration}</span>}
      </div>

      {/* Title */}
      <p className="tr-font-display" style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 15, color: "var(--ink)", lineHeight: 1.3 }}>{prog?.title}</p>

      {/* Modules */}
      {prog?.modules?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {prog.modules.slice(0, 3).map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--muted-2)", flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{m}</span>
            </div>
          ))}
          {prog.modules.length > 3 && <span style={{ fontSize: 11, color: "var(--muted-2)", marginLeft: 11 }}>+{prog.modules.length - 3} more topics</span>}
        </div>
      )}

      {/* Certification */}
      {prog?.certification && (
        <div style={{ background: "var(--warning-tint)", borderRadius: 8, padding: "6px 10px", marginBottom: 10, border: "1px solid #fde3ad", display: "flex", alignItems: "center", gap: 6 }}>
          <Award size={12} color="var(--warning)" />
          <p style={{ margin: 0, fontSize: 11.5, color: "var(--warning)", fontWeight: 500 }}>{prog.certification}</p>
        </div>
      )}

      {/* Footer */}
      <div className="tr-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, flexWrap: "wrap", gap: 8 }}>
               <div style={{ fontSize: 11.5, color: "var(--muted)", display: "flex", gap: 12, flexWrap: "wrap" }}>
          {displayDate && (
            <span style={{ color: isOverdue ? "var(--danger)" : "inherit", display: "flex", alignItems: "center", gap: 4, fontWeight: isOverdue ? 600 : 400 }}>
              <Calendar size={12} /> {isOffline ? "Session" : "Due"}: {new Date(displayDate).toLocaleDateString("en-IN")}
              {isOffline && prog?.sessionTime ? `, ${prog.sessionTime}` : ""}
            </span>
          )}
          {isOffline && prog?.venue && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📍 {prog.venue}</span>
          )}
          {record.assessmentScore !== null && record.assessmentScore !== undefined && (
            <span style={{ color: record.assessmentScore >= 80 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
              Score: {record.assessmentScore}%
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* ✅ NEW — opens the course-content modal (product list, SOPs,
              videos, procedures) for this program. */}
          <button className="tr-btn" onClick={() => onViewDetails(record)}
            style={{ padding: "6px 14px", border: "1.5px solid var(--brand)", borderRadius: "var(--radius-sm)", background: "#fff", color: "var(--brand)", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
            View Details
          </button>
                                  {!isOffline && record.status === "pending" && (
          <button onClick={() => onStart(record._id)}
            style={{ padding: "5px 12px", border: "none", borderRadius: 7, background: "#3b82f6", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            Start Training
          </button>
        )}
        {!isOffline && record.status === "in_progress" && !record.submittedForReview && (
          <button onClick={() => onSubmit(record._id)}
            style={{ padding: "5px 12px", border: "none", borderRadius: 7, background: "#10b981", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            Submit for Review
          </button>
        )}
        {!isOffline && record.status === "in_progress" && record.submittedForReview && (
          <span style={{ background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
            Submitted — Awaiting HR
          </span>
        )}
        {isOffline && record.status !== "completed" && (
          <span style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
            Attend session — HR marks attendance
          </span>
        )}
        {record.status === "completed" && (
          <CheckCircle2 size={16} color="#10b981" />
        )}
        </div>
      </div>

      {/* Progress log */}
      {record.progressLog?.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line-soft)" }}>
          <p style={{ margin: "0 0 3px", color: "var(--muted-2)", fontSize: 11 }}>Latest update:</p>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--body)" }}>{record.progressLog[record.progressLog.length - 1]?.note}</p>
        </div>
      )}
    </div>
  );
}

// ─── Training Details Modal ──────────────────────────────────────
// Shows the actual course content for a program: for "equipment" type
// programs (the shared "Equipment Training — All Products" program),
// that means every linked product's SOP, training video, operating
// procedure, and safety instructions — plus a "Mark as Studied"
// checklist per product, and a "Take Test" button once every product
// is studied. For other program types, just the module list /
// certification info already on the card.
function TrainingDetailsModal({ record: initialRecord, onClose, onRefresh, onOpenQuiz }) {
  const [record, setRecord]     = useState(initialRecord); // local copy — updated immediately from mark-studied response
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [openProductId, setOpenProductId] = useState(null);
  const [marking, setMarking]   = useState(null); // productId currently being marked
  const [completing, setCompleting] = useState(false); // ✅ NEW — "Mark as Completed" in-flight state
  const [hasProgramQuiz, setHasProgramQuiz] = useState(null); // ✅ NEW — null=checking, true/false once known

  const prog = record.programId;
  const isEquipment = prog?.type === "equipment";
  const isOffline = prog?.deliveryMode === "offline";

  useEffect(() => {
    if (!isEquipment || !prog?._id) { setLoading(false); return; }
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/training/programs/${prog._id}/products`);
        setProducts(res.data.data || []);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load course content");
      } finally { setLoading(false); }
    })();
  }, [isEquipment, prog?._id]);

  // ✅ NEW — non-equipment programs: check whether HR has authored a
  // program-level quiz. If yes, employee takes that test instead of the
  // plain "Mark as Completed" button; if no quiz exists yet, fall back
  // to "Mark as Completed" so employees aren't blocked.
  useEffect(() => {
    if (isEquipment || !prog?._id) return;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/training/quiz-questions`, { params: { programId: prog._id } });
        setHasProgramQuiz((res.data.data || []).length > 0);
      } catch (e) {
        setHasProgramQuiz(false);
      }
    })();
  }, [isEquipment, prog?._id]);

  const isStudied = (productId) =>
    !!record.productProgress?.find(p => String(p.productId) === String(productId))?.studied;

  const studiedCount = products.filter(p => isStudied(p._id)).length;
  const allStudied = products.length > 0 && studiedCount === products.length;
  const attemptsUsed = record.quizAttempts?.length || 0;
  const alreadyAttempted = attemptsUsed >= 1;

  const handleMarkStudied = async (productId) => {
    setMarking(productId);
    try {
      const res = await axios.put(`${API_BASE}/api/training/my/${record._id}/study-product`, { productId });
      setRecord(prev => ({ ...prev, ...res.data.data })); // update this modal immediately
      onRefresh?.(); // background refresh so the card list / stats stay in sync
    } catch (e) {
      // silent — the button will just stay unmarked, HR/employee can retry
    } finally {
      setMarking(null);
    }
  };

  // ✅ NEW — fires when the program-level <video> finishes playing to the
  // end. This is the only reliable "they actually watched it" signal for
  // a plain HTML5 video, so we only mark it watched on onEnded (not on
  // pause/click) to stop people just opening the modal and skipping it.
  const handleVideoEnded = async () => {
    if (record.videoWatched) return; // already marked, avoid duplicate calls
    try {
      const res = await axios.put(`${API_BASE}/api/training/my/${record._id}/video-watched`);
      setRecord(prev => ({ ...prev, ...res.data.data }));
      onRefresh?.();
    } catch (e) {
      // silent — employee can rewatch to the end to retry
    }
  };

  // ✅ NEW — YouTube videos are rendered via an <iframe>, which has no
  // native "onEnded" event. The YouTube IFrame Player API is the only
  // way to reliably detect that the video actually finished playing, so
  // we mount a real YT.Player against the div below and listen for the
  // ENDED (state 0) event.
  const ytContainerRef = useRef(null);
  const ytPlayerRef    = useRef(null);
  const videoWatchedRef = useRef(record.videoWatched);
  videoWatchedRef.current = record.videoWatched;
  const youtubeId = prog?.videoSource === "youtube" ? extractYouTubeId(prog.videoUrl) : null;

  useEffect(() => {
    if (!youtubeId || !ytContainerRef.current) return;
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !ytContainerRef.current) return;
      ytPlayerRef.current = new YT.Player(ytContainerRef.current, {
        videoId: youtubeId,
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED && !videoWatchedRef.current) {
              handleVideoEnded();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      ytPlayerRef.current?.destroy?.();
      ytPlayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  // ✅ NEW — "Mark as Completed" for non-equipment programs (no quiz, so
  // this is the employee's only completion action). Sends it to
  // pending_review — HR still has to confirm it before it's truly
  // completed, same review step the quiz path already uses.
  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      const res = await axios.put(`${API_BASE}/api/training/my/${record._id}/complete`);
      setRecord(prev => ({ ...prev, ...res.data.data }));
      onRefresh?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Could not submit — please try again.");
    } finally {
      setCompleting(false);
    }
  };

  // ✅ NEW — PDF completion tracking. There's no cross-browser reliable
  // "finished reading" event for an embedded PDF, so: (1) the iframe's
  // onLoad flips pdfOpened once they've actually opened the document,
  // then (2) they must explicitly click "Mark as Read" — the button
  // stays disabled until step 1 has happened, so it can't be faked by
  // never opening the file.
  const [pdfOpened, setPdfOpened] = useState(false);
  const [markingPdf, setMarkingPdf] = useState(false);
  const handleMarkPdfRead = async () => {
    if (record.pdfRead) return;
    setMarkingPdf(true);
    try {
      const res = await axios.put(`${API_BASE}/api/training/my/${record._id}/pdf-read`);
      setRecord(prev => ({ ...prev, ...res.data.data }));
      onRefresh?.();
    } catch (e) {
      alert(e?.response?.data?.message || "Could not save — please try again.");
    } finally {
      setMarkingPdf(false);
    }
  };

  return (
    <div className="tr-modal-sheet" style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,.55)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", maxWidth: 640, width: "100%", maxHeight: "85vh", overflowY: "auto", padding: 24 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <p className="tr-font-display" style={{ margin: 0, fontWeight: 800, fontSize: 18, color: "var(--ink)" }}>{prog?.title}</p>
            {prog?.certification && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--warning)", fontWeight: 500 }}>🏅 {prog.certification}</p>}
          </div>
          <button onClick={onClose} style={{ border: "none", background: "var(--bg-soft)", width: 30, height: 30, borderRadius: "50%", fontSize: 18, cursor: "pointer", color: "var(--muted)", lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>

        {/* Non-equipment programs: nothing extra to fetch, just show what's already known */}
        {!isEquipment && (() => {
          // ✅ NEW — true only once every attached material (video, PDF)
          // has been consumed. Both gates apply if both exist.
          const materialsReady = (!prog?.videoUrl || record.videoWatched) && (!prog?.pdfUrl || record.pdfRead);
          return (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13, color: "var(--body)", marginBottom: 8, fontWeight: 600 }}>Modules covered:</p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--body)" }}>
              {prog?.modules?.map((m, i) => <li key={i} style={{ marginBottom: 5 }}>{m}</li>)}
            </ul>
            {prog?.conductedBy && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>Conducted by: {prog.conductedBy}</p>}

            {/* ✅ NEW — completion panel for non-equipment programs. If HR
                has authored a program quiz, this unlocks "Take Test"
                (same flow as equipment); otherwise falls back to a plain
                "Mark as Completed" submit so employees aren't blocked
                while HR hasn't written questions yet. */}
            
                     {isOffline ? (
              <div style={{ marginTop: 16, padding: "13px 15px", borderRadius: "var(--radius-md)", background: record.status === "completed" ? "var(--success-tint)" : "var(--bg-soft)", border: `1px solid ${record.status === "completed" ? "#b7ecd6" : "var(--line)"}` }}>
                {record.status === "completed" ? (
                  <p style={{ margin: 0, fontSize: 12.5, color: "var(--success)", fontWeight: 600 }}>
                    ✅ HR has marked your attendance — this training is completed.
                  </p>
                ) : (
                  <>
                                        <p style={{ margin: 0, fontSize: 12.5, color: "var(--body)", fontWeight: 600 }}>
                      📍 In-person session
                      {prog?.sessionDate ? ` on ${new Date(prog.sessionDate).toLocaleDateString("en-IN")}` : ""}
                      {prog?.sessionTime ? `, ${prog.sessionTime}` : ""}
                      {prog?.venue ? ` at ${prog.venue}` : ""}
                    </p>
                    <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "var(--muted-2)" }}>
                      Attend the session — HR will mark your training as completed afterward. No action needed here.
                    </p>
                  </>
                )}
              </div>
            ) : (
            <div style={{ marginTop: 16, padding: "13px 15px", borderRadius: "var(--radius-md)", background: record.status === "completed" ? "var(--success-tint)" : record.status === "pending_review" ? "var(--warning-tint)" : "var(--bg-soft)", border: `1px solid ${record.status === "completed" ? "#b7ecd6" : record.status === "pending_review" ? "#fde3ad" : "var(--line)"}` }}>
              {record.status === "completed" ? (
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--success)", fontWeight: 600 }}>
                  ✅ HR has reviewed and confirmed this training as completed
                  {record.assessmentScore !== null && record.assessmentScore !== undefined ? ` (score: ${record.assessmentScore}%)` : ""}.
                </p>
              ) : record.status === "pending_review" ? (
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--warning)", fontWeight: 600 }}>
                  📩 {alreadyAttempted ? `Test submitted — score ${record.assessmentScore}%.` : "Submitted —"} waiting for HR to review and confirm.
                </p>
              ) : hasProgramQuiz ? (
                <>
                  <p style={{ margin: "0 0 9px", fontSize: 12.5, color: materialsReady ? "var(--brand)" : "var(--muted)" }}>
                    {materialsReady
                      ? "You get one attempt — answer carefully before submitting."
                      : "Finish the video/PDF above to unlock the test."}
                  </p>
                  <button
                    className="tr-btn"
                    onClick={() => { onOpenQuiz?.(record); onClose(); }}
                    disabled={!materialsReady}
                    style={{
                      padding: "9px 16px", border: "none", borderRadius: "var(--radius-sm)", fontSize: 12.5, fontWeight: 700,
                      background: materialsReady ? "var(--brand)" : "var(--line)",
                      color: materialsReady ? "#fff" : "var(--muted-2)",
                      cursor: materialsReady ? "pointer" : "not-allowed", width: "100%",
                    }}
                  >
                    Take Test
                  </button>
                </>
              ) : hasProgramQuiz === null ? (
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted-2)" }}>Checking…</p>
              ) : (
                <>
                  <p style={{ margin: "0 0 9px", fontSize: 12.5, color: materialsReady ? "var(--brand)" : "var(--muted)" }}>
                    {materialsReady
                      ? "Once you've gone through the material, submit it for HR review."
                      : "Finish the video/PDF above to unlock this."}
                  </p>
                  <button
                    className="tr-btn"
                    onClick={handleMarkComplete}
                    disabled={completing || !materialsReady}
                    style={{
                      padding: "9px 16px", border: "none", borderRadius: "var(--radius-sm)", fontSize: 12.5, fontWeight: 700,
                      background: materialsReady ? "var(--brand)" : "var(--line)",
                      color: materialsReady ? "#fff" : "var(--muted-2)",
                      cursor: materialsReady ? "pointer" : "not-allowed", width: "100%",
                    }}
                  >
                    {completing ? "Submitting…" : "Mark as Completed"}
                  </button>
                </>
               )}
            </div>
            )}
          </div>
          );
        })()}

        {/* Equipment program: list every linked product's actual content */}
        {isEquipment && (
          <div style={{ marginTop: 16 }}>
            {loading && <p style={{ fontSize: 13, color: "var(--muted-2)" }}>Loading course content…</p>}
            {error && <p style={{ fontSize: 13, color: "var(--danger)" }}>{error}</p>}
            {!loading && !error && products.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--muted-2)" }}>No products are linked to this training yet.</p>
            )}
            {!loading && products.length > 0 && (
              <>
                {/* ✅ NEW — shown right after HR sends the record back for retraining */}
                {record.status === "retrain" && (
                  <div style={{ marginBottom: 14, padding: "11px 14px", borderRadius: "var(--radius-md)", background: "var(--orange-tint)", border: "1px solid #fdba8c" }}>
                    <p style={{ margin: 0, fontSize: 12.5, color: "var(--orange)", fontWeight: 700 }}>
                      🔁 HR has asked you to retrain on this course.
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#9a3412" }}>
                      Your study checklist and previous test result have been reset — please go through each product again, then retake the test.
                    </p>
                  </div>
                )}

                <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 8 }}>
                  This training covers {products.length} product{products.length > 1 ? "s" : ""}. Tap one to see its details, then mark it studied.
                </p>

                {/* Study progress bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--body)" }}>Study progress</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: allStudied ? "var(--success)" : "var(--brand)" }}>{studiedCount}/{products.length} studied</span>
                  </div>
                  <div style={{ height: 8, background: "var(--bg-soft)", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: allStudied ? "var(--success)" : "var(--brand)", width: `${(studiedCount / products.length) * 100}%`, transition: "width .3s" }} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {products.map(p => {
                    const isOpen = openProductId === p._id;
                    const studied = isStudied(p._id);
                    return (
                      <div key={p._id} style={{ border: `1px solid ${studied ? "#b7ecd6" : "var(--line)"}`, borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                        <button
                          onClick={() => setOpenProductId(isOpen ? null : p._id)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", background: isOpen ? "var(--bg-soft)" : studied ? "var(--success-tint)" : "#fff", border: "none", cursor: "pointer", textAlign: "left" }}
                        >
                          {p.images?.[0]?.url ? (
                            <img src={p.images[0].url} alt={p.productName} style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 38, height: 38, borderRadius: 8, background: "var(--bg-soft)", flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>{p.productName}</p>
                            <p style={{ margin: 0, fontSize: 11, color: "var(--muted-2)" }}>{p.productCode} · {p.category} · {p.skillLevel}</p>
                          </div>
                          {studied && (
                            <span style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--success-tint)", color: "var(--success)", borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                              <CheckCircle2 size={10} /> Studied
                            </span>
                          )}
                          <ChevronRight size={16} color="var(--muted-2)" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s", flexShrink: 0 }} />
                        </button>

                        {isOpen && (
                          <div style={{ padding: "11px 13px 15px", borderTop: "1px solid var(--line-soft)", fontSize: 12.5, color: "var(--body)" }}>
                            {p.trainingVideoUrl && (
                              <p style={{ margin: "0 0 8px" }}>
                                🎥 <a href={p.trainingVideoUrl} target="_blank" rel="noreferrer" style={{ color: "var(--brand)", fontWeight: 600 }}>Watch training video</a>
                              </p>
                            )}
                            {p.sopId?.fileUrl && (
                              <p style={{ margin: "0 0 8px" }}>
                                📄 <a href={p.sopId.fileUrl} target="_blank" rel="noreferrer" style={{ color: "var(--brand)", fontWeight: 600 }}>{p.sopId.title || "View SOP"}</a>
                              </p>
                            )}
                            {p.applications && (
                              <div style={{ marginBottom: 8 }}>
                                <p style={{ margin: "0 0 2px", fontWeight: 700, color: "var(--muted)", fontSize: 11 }}>APPLICATIONS</p>
                                <p style={{ margin: 0 }}>{p.applications}</p>
                              </div>
                            )}
                            {p.operatingProcedure && (
                              <div style={{ marginBottom: 8 }}>
                                <p style={{ margin: "0 0 2px", fontWeight: 700, color: "var(--muted)", fontSize: 11 }}>OPERATING PROCEDURE</p>
                                <p style={{ margin: 0, whiteSpace: "pre-line" }}>{p.operatingProcedure}</p>
                              </div>
                            )}
                            {p.safetyInstructions && (
                              <div>
                                <p style={{ margin: "0 0 2px", fontWeight: 700, color: "var(--danger)", fontSize: 11 }}>⚠ SAFETY INSTRUCTIONS</p>
                                <p style={{ margin: 0, whiteSpace: "pre-line" }}>{p.safetyInstructions}</p>
                              </div>
                            )}
                            {!p.trainingVideoUrl && !p.sopId?.fileUrl && !p.operatingProcedure && !p.safetyInstructions && !p.applications && (
                              <p style={{ margin: 0, color: "var(--muted-2)" }}>No detailed content added for this product yet — check with your trainer.</p>
                            )}

                            {/* ✅ NEW — Mark as Studied */}
                            <button
                              className="tr-btn"
                              onClick={() => handleMarkStudied(p._id)}
                              disabled={studied || marking === p._id}
                              style={{
                                marginTop: 11, padding: "7px 15px", border: "none", borderRadius: "var(--radius-sm)",
                                background: studied ? "var(--success-tint)" : "var(--brand)", color: studied ? "var(--success)" : "#fff",
                                fontSize: 11.5, fontWeight: 700, cursor: studied ? "default" : "pointer",
                                display: "flex", alignItems: "center", gap: 6,
                              }}
                            >
                              {marking === p._id ? (
                                <span style={{ width: 11, height: 11, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .6s linear infinite" }} />
                              ) : (
                                <CheckCircle2 size={12} />
                              )}
                              {studied ? "Studied" : "Mark as Studied"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ✅ NEW — Take Test panel: unlocks once every product is studied. One attempt only. */}
                <div style={{ marginTop: 18, padding: "13px 15px", borderRadius: "var(--radius-md)", background: allStudied ? "var(--brand-tint)" : "var(--bg-soft)", border: `1px solid ${allStudied ? "#c9dcfd" : "var(--line)"}` }}>
                  {alreadyAttempted ? (
                    record.status === "completed" ? (
                      <p style={{ margin: 0, fontSize: 12.5, color: "var(--success)", fontWeight: 600 }}>
                        ✅ HR has reviewed and confirmed your training as completed
                        {record.assessmentScore !== null && record.assessmentScore !== undefined ? ` (score: ${record.assessmentScore}%)` : ""}.
                        {record.certificationIssued ? " Your certification has been issued." : ""}
                      </p>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12.5, color: "var(--warning)", fontWeight: 600 }}>
                        📩 Test submitted — score {record.assessmentScore}%. Your result is with HR for review; this will show as completed once HR confirms.
                      </p>
                    )
                  ) : (
                    <>
                      {!allStudied && (
                        <p style={{ margin: "0 0 9px", fontSize: 12.5, color: "var(--muted)" }}>
                          Study all {products.length} products above to unlock the test.
                        </p>
                      )}
                      {allStudied && (
                        <p style={{ margin: "0 0 9px", fontSize: 12.5, color: "var(--brand)" }}>
                          You get one attempt — answer carefully before submitting.
                        </p>
                      )}
                      <button
                        className="tr-btn"
                        onClick={() => { onOpenQuiz?.(record); onClose(); }}
                        disabled={!allStudied}
                        style={{
                          padding: "9px 16px", border: "none", borderRadius: "var(--radius-sm)", fontSize: 12.5, fontWeight: 700,
                          background: allStudied ? "var(--brand)" : "var(--line)", color: allStudied ? "#fff" : "var(--muted-2)",
                          cursor: allStudied ? "pointer" : "not-allowed", width: "100%",
                        }}
                      >
                        Take Test
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

                {!isOffline && prog?.videoUrl && (
  <div style={{ marginTop: 14 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Training Video:</p>
      {record.videoWatched && (
        <span style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--success-tint)", color: "var(--success)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
          <CheckCircle2 size={11} /> Watched
        </span>
      )}
    </div>
    {prog.videoSource === "youtube" ? (
      youtubeId ? (
        // Real YT.Player mounts into this div (see the useEffect above)
        // so we can detect the ENDED state — a plain <iframe src=...>
        // has no such event.
        <div style={{ width: "100%", aspectRatio: "16/9", borderRadius: 8, overflow: "hidden" }}>
          <div ref={ytContainerRef} style={{ width: "100%", height: "100%" }} />
        </div>
      ) : (
        <iframe width="100%" height="220" src={prog.videoUrl.replace("watch?v=","embed/")} frameBorder="0" allowFullScreen style={{ borderRadius: 8 }} />
      )
    ) : (
      <video
        src={prog.videoUrl}
        controls
        onEnded={handleVideoEnded}
        style={{ width: "100%", borderRadius: 8 }}
      />
    )}
    {!record.videoWatched && (
      <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--muted-2)" }}>
        Watch the video till the end to mark it as completed.
      </p>
    )}
  </div>
)}

        {/* ✅ NEW — PDF training material, independent of the video above.
            Embedded via the browser's native PDF viewer inside an
            <iframe>. "Mark as Read" only unlocks after onLoad fires at
            least once (i.e. they've actually opened the document). */}
                {!isOffline && prog?.pdfUrl && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Training Document{prog.pdfName ? `: ${prog.pdfName}` : ""}</p>
              {record.pdfRead && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--success-tint)", color: "var(--success)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                  <CheckCircle2 size={11} /> Read
                </span>
              )}
            </div>
            <iframe
              src={prog.pdfUrl}
              title="Training PDF"
              onLoad={() => setPdfOpened(true)}
              style={{ width: "100%", height: 380, border: "1px solid var(--line)", borderRadius: 8 }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, gap: 10 }}>
              <p style={{ margin: 0, fontSize: 11, color: "var(--muted-2)" }}>
                {record.pdfRead ? "Marked as read." : pdfOpened ? "Read through it, then confirm below." : "Open the document above first."}
              </p>
              {!record.pdfRead && (
                <button
                  className="tr-btn"
                  onClick={handleMarkPdfRead}
                  disabled={!pdfOpened || markingPdf}
                  style={{
                    padding: "7px 14px", border: "none", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 700, flexShrink: 0,
                    background: pdfOpened ? "var(--brand)" : "var(--line)", color: pdfOpened ? "#fff" : "var(--muted-2)",
                    cursor: pdfOpened ? "pointer" : "not-allowed",
                  }}
                >
                  {markingPdf ? "Saving…" : "Mark as Read"}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Quiz Modal ────────────────────────────────────────────────
// Combined MCQ quiz pooled across every product linked to the
// record's program. Fetches fresh (shuffled) questions on open,
// submits, auto-scores server-side, and shows pass/fail + attempts.
function QuizModal({ record, onClose, onRefresh }) {
  const [questions, setQuestions] = useState([]);
  const [meta, setMeta]           = useState(null); // { passThreshold }
  const [answers, setAnswers]     = useState({}); // { questionId: selectedOptionIndex }
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]       = useState(null); // { score, passed, status, certificationIssued }

  const loadQuiz = useCallback(async () => {
    setLoading(true); setError(null); setResult(null); setAnswers({});
    try {
      const res = await axios.get(`${API_BASE}/api/training/my/${record._id}/quiz`);
      setQuestions(res.data.data.questions || []);
      setMeta(res.data.data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load quiz");
    } finally { setLoading(false); }
  }, [record._id]);

  useEffect(() => { loadQuiz(); }, [loadQuiz]);

  const selectAnswer = (questionId, optionIndex) => setAnswers(a => ({ ...a, [questionId]: optionIndex }));

  const allAnswered = questions.length > 0 && questions.every(q => answers[q._id] !== undefined);

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      const payload = { answers: questions.map(q => ({ questionId: q._id, selectedOptionIndex: answers[q._id] })) };
      const res = await axios.post(`${API_BASE}/api/training/my/${record._id}/quiz/submit`, payload);
      setResult(res.data.data);
      onRefresh?.();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to submit quiz");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="tr-modal-sheet" style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", maxWidth: 640, width: "100%", maxHeight: "88vh", overflowY: "auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <p className="tr-font-display" style={{ margin: 0, fontWeight: 800, fontSize: 18, color: "var(--ink)" }}>{record.programId?.title} — Test</p>
            {meta && !result && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
                Pass mark: {meta.passThreshold}% · You get one attempt — answer carefully.
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ border: "none", background: "var(--bg-soft)", width: 30, height: 30, borderRadius: "50%", fontSize: 18, cursor: "pointer", color: "var(--muted)", lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>

        {loading && <p style={{ fontSize: 13, color: "var(--muted-2)", textAlign: "center", padding: "26px 0" }}>Loading test…</p>}
        {error && !loading && (
          <div style={{ background: "var(--danger-tint)", border: "1px solid #f6c6c1", borderRadius: "var(--radius-md)", padding: "12px 14px", fontSize: 13, color: "var(--danger)" }}>{error}</div>
        )}

        {/* ── Result screen ── */}
        {result && (
          <div style={{ textAlign: "center", padding: "22px 10px" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px",
              background: "var(--warning-tint)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Clock size={32} color="var(--warning)" />
            </div>
            <p className="tr-font-display" style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 24, color: result.score >= (meta?.passThreshold ?? 70) ? "var(--success)" : "var(--danger)" }}>{result.score}%</p>
            <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>
              Test Submitted
            </p>
            <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "var(--muted)" }}>
              Your result is with HR for review. This training will show as completed once HR confirms.
            </p>
            <button className="tr-btn" onClick={onClose} style={{ padding: "9px 20px", border: "1.5px solid var(--line)", borderRadius: "var(--radius-sm)", background: "#fff", color: "var(--body)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              Close
            </button>
          </div>
        )}

        {/* ── Question list ── */}
        {!loading && !error && !result && questions.length > 0 && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {questions.map((q, qi) => (
                <div key={q._id} style={{ border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: "13px 15px" }}>
                  <p style={{ margin: "0 0 9px", fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>{qi + 1}. {q.questionText}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {q.options.map((o, oi) => (
                      <label key={oi} className="tr-quiz-option" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: "var(--body)", cursor: "pointer", padding: "8px 10px", borderRadius: "var(--radius-sm)", background: answers[q._id] === oi ? "var(--brand-tint)" : "transparent", border: `1px solid ${answers[q._id] === oi ? "#c9dcfd" : "transparent"}` }}>
                        <input type="radio" name={q._id} checked={answers[q._id] === oi} onChange={() => selectAnswer(q._id, oi)} />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              className="tr-btn"
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              style={{
                marginTop: 18, width: "100%", padding: "11px 16px", border: "none", borderRadius: "var(--radius-md)",
                background: allAnswered ? "var(--brand)" : "var(--line)", color: allAnswered ? "#fff" : "var(--muted-2)",
                fontSize: 13.5, fontWeight: 700, cursor: allAnswered ? "pointer" : "not-allowed",
              }}
            >
              {submitting ? "Submitting…" : `Submit Test (${Object.keys(answers).length}/${questions.length} answered)`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function TrainingRoadmapEmployee() {
  const [records, setRecords]     = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [toast, setToast]         = useState(null);
  const [activeTab, setActiveTab] = useState("my_trainings");
  const [detailsRecord, setDetailsRecord] = useState(null); // ✅ NEW — record shown in the details modal, or null
  const [quizRecord, setQuizRecord] = useState(null); // ✅ NEW — record whose quiz is open, or null

  const employeeId = getEmployeeId();

  const showMsg = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    if (!employeeId) { setError("session"); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/training/my/${employeeId}`);
      setRecords(res.data.data || []);
      setStats(res.data.stats);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load");
    } finally { setLoading(false); }
  }, [employeeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

   const handleStart = async (recordId) => {
    try {
      await axios.put(`${API_BASE}/api/training/my/${recordId}/start`);
      showMsg("Training started! Good luck 🚀");
      fetchData();
    } catch (e) { showMsg(e?.response?.data?.message || "Failed", "error"); }
  };

  const handleSubmitForReview = async (recordId) => {
    try {
      await axios.put(`${API_BASE}/api/training/my/${recordId}/submit`);
      showMsg("Submitted to HR for confirmation ✅");
      fetchData();
    } catch (e) { showMsg(e?.response?.data?.message || "Failed", "error"); }
  };

  // ── Loading ─────────────────────────────────────────────────
  if (loading) return (
    <EmployeeLayout>
      <style>{STYLES}</style>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 80 }}>
        <div style={{ width: 36, height: 36, border: "3px solid var(--line, #e5e7eb)", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </EmployeeLayout>
  );

  // ── Session ─────────────────────────────────────────────────
  if (error === "session") return (
    <EmployeeLayout>
      <div style={{ textAlign: "center", padding: 60 }}>
        <AlertTriangle size={40} color="#f59e0b" style={{ marginBottom: 12 }} />
        <h5 style={{ color: "#6b7280" }}>Session expired. Please login again.</h5>
      </div>
    </EmployeeLayout>
  );

  if (error) return (
    <EmployeeLayout>
      <div style={{ margin: 16, padding: 14, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13 }}>{error}</div>
    </EmployeeLayout>
  );

  // ── Derived data ────────────────────────────────────────────
  const pending    = records.filter(r => r.status === "pending");
  const inProgress = records.filter(r => r.status === "in_progress");
  const completed  = records.filter(r => r.status === "completed");
    const overdue    = records.filter(r => {
    const d = r.programId?.deliveryMode === "offline" && r.programId?.sessionDate ? r.programId.sessionDate : r.dueDate;
    if (!d || r.status === "completed") return false;
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return end < new Date();
  });
  const completionRate = stats?.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <EmployeeLayout>
      <style>{STYLES}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 16, zIndex: 9999, background: toast.type === "error" ? "#c0231b" : "#0e9f6e", color: "#fff", padding: "13px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: "0 12px 32px rgba(16,24,40,.2)", maxWidth: "calc(100vw - 32px)" }}>
          {toast.msg}
        </div>
      )}

      <div className="tr-page">

        {/* ── Header ── */}
        <div className="tr-header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--brand-dark)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(16,28,68,.28)" }}>
              <GraduationCap size={24} color="#fff" />
            </div>
            <div>
              <h4 className="tr-font-display tr-title" style={{ margin: 0, fontWeight: 800, fontSize: 20, color: "var(--ink)" }}>My Training Journey</h4>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 12.5 }}>Radnus Policy 3.15 — Job-Role Based Mandatory Training (RCA)</p>
            </div>
          </div>
          <button className="tr-btn tr-refresh-btn" onClick={fetchData} disabled={loading}
            style={{ padding: "9px 15px", border: "1.5px solid var(--line)", borderRadius: 9, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "var(--body)", flexShrink: 0 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* ── Framework Banner ── */}
        <div className="tr-card" style={{ padding: "16px 20px", marginBottom: 18, borderLeft: "4px solid var(--brand)" }}>
          <p className="tr-font-display" style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>Your Learning Framework: Learn → Apply → Lead</p>
          <div className="tr-framework-banner" style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12.5, color: "var(--body)" }}>
            <span><strong style={{ color: "var(--brand)" }}>Learn:</strong> Foundation & Skill Learning → Acquire job knowledge</span>
            <span><strong style={{ color: "var(--violet)" }}>Apply:</strong> Real-world Implementation → Demonstrate proficiency</span>
            <span><strong style={{ color: "var(--success)" }}>Lead:</strong> Coaching & Mentorship → Guide others</span>
          </div>
        </div>

        {/* ── Progress Overview ── */}
        {stats && (
          <div className="tr-card" style={{ padding: "20px 22px", marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p className="tr-font-display" style={{ margin: 0, fontWeight: 700, fontSize: 14.5, color: "var(--ink)" }}>My Progress</p>
              <span className="tr-font-display" style={{ fontWeight: 800, fontSize: 19, color: completionRate >= 95 ? "var(--success)" : completionRate >= 60 ? "var(--warning)" : "var(--danger)" }}>
                {completionRate}%
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: 10, background: "var(--bg-soft)", borderRadius: 6, marginBottom: 18, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 6, background: completionRate >= 95 ? "var(--success)" : completionRate >= 60 ? "var(--warning)" : "var(--brand)", width: `${completionRate}%`, transition: "width .4s" }} />
            </div>
            {/* Stats grid */}
            <div className="tr-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
              {[
                { label: "Total",       value: stats.total,      color: "var(--ink)",     bg: "var(--bg-soft)" },
                { label: "Completed",   value: stats.completed,  color: "var(--success)", bg: "var(--success-tint)" },
                { label: "In Progress", value: stats.inProgress, color: "var(--brand)",   bg: "var(--brand-tint)" },
                { label: "Pending",     value: stats.pending,    color: "var(--muted)",   bg: "var(--bg-soft)" },
                { label: "Overdue",     value: overdue.length,   color: "var(--danger)",  bg: "var(--danger-tint)" },
                { label: "Certified",   value: stats.certified,  color: "var(--warning)", bg: "var(--warning-tint)" },
              ].map((s, i) => (
                <div key={i} style={{ background: s.bg, borderRadius: 10, padding: "10px 10px", textAlign: "center" }}>
                  <p className="tr-font-display" style={{ margin: 0, fontWeight: 800, fontSize: 20, color: s.color, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 10, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: ".03em", opacity: 0.85 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Overdue Alert ── */}
        {overdue.length > 0 && (
          <div style={{ background: "var(--danger-tint)", border: "1px solid #f6c6c1", borderRadius: 10, padding: "11px 15px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13 }}>
            <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, color: "#8c1c15" }}>
              You have <strong>{overdue.length} overdue training{overdue.length > 1 ? "s" : ""}</strong>. Please complete them immediately. Managers must confirm 100% training compliance before probation/promotion.
            </p>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="tr-tabs" style={{ display: "flex", gap: 6, marginBottom: 18, background: "#fff", borderRadius: 12, padding: 4, border: "1.5px solid var(--line)", width: "fit-content", maxWidth: "100%", overflowX: "auto" }}>
          {[
            { key: "my_trainings", label: `All (${records.length})`,            icon: <BookOpen size={13} /> },
            { key: "pending",      label: `Pending (${pending.length})`,         icon: <Clock size={13} /> },
            { key: "in_progress",  label: `In Progress (${inProgress.length})`,  icon: <Zap size={13} /> },
            { key: "completed",    label: `Completed (${completed.length})`,     icon: <CheckCircle2 size={13} /> },
            { key: "roadmap",      label: "Training Roadmap",                    icon: <Layers size={13} /> },
          ].map(tab => (
            <button key={tab.key} className="tr-tab-btn" onClick={() => setActiveTab(tab.key)}
              style={{ padding: "9px 15px", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: 12.5, background: activeTab === tab.key ? "var(--brand-dark)" : "transparent", color: activeTab === tab.key ? "#fff" : "var(--muted)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ══ MY TRAININGS ══ */}
        {activeTab === "my_trainings" && (
          records.length === 0 ? (
            <div className="tr-card" style={{ textAlign: "center", padding: "50px 24px" }}>
              <GraduationCap size={40} color="var(--muted-2)" style={{ marginBottom: 12 }} />
              <p style={{ margin: "0 0 4px", color: "var(--body)", fontWeight: 600 }}>No trainings assigned yet.</p>
              <p style={{ margin: 0, color: "var(--muted-2)", fontSize: 13 }}>HR will assign trainings based on your role and department.</p>
            </div>
          ) : (
            <div className="tr-cards-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                                       {records.map(r => <TrainingCard key={r._id} record={r} onStart={handleStart} onSubmit={handleSubmitForReview} onViewDetails={setDetailsRecord} />)}
            </div>
          )
        )}

        {/* ══ PENDING ══ */}
        {activeTab === "pending" && (
          pending.length === 0 ? (
            <div className="tr-card" style={{ textAlign: "center", padding: "50px 24px" }}>
              <CheckCircle2 size={36} color="var(--success)" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, color: "var(--muted)" }}>No pending trainings! Great job.</p>
            </div>
          ) : (
            <div className="tr-cards-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                            {pending.map(r => <TrainingCard key={r._id} record={r} onStart={handleStart} onSubmit={handleSubmitForReview} />)}
            </div>
          )
        )}

        {/* ══ IN PROGRESS ══ */}
        {activeTab === "in_progress" && (
          inProgress.length === 0 ? (
            <div className="tr-card" style={{ textAlign: "center", padding: "50px 24px" }}>
              <Clock size={36} color="var(--muted-2)" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, color: "var(--muted)" }}>No trainings in progress.</p>
            </div>
          ) : (
            <div className="tr-cards-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                                        {inProgress.map(r => <TrainingCard key={r._id} record={r} onStart={handleStart} onSubmit={handleSubmitForReview} onViewDetails={setDetailsRecord} />)}
            </div>
          )
        )}

        {/* ══ COMPLETED ══ */}
        {activeTab === "completed" && (
          completed.length === 0 ? (
            <div className="tr-card" style={{ textAlign: "center", padding: "50px 24px" }}>
              <BookOpen size={36} color="var(--muted-2)" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, color: "var(--muted)" }}>No trainings completed yet.</p>
            </div>
          ) : (
            <div>
              {/* Certificates earned */}
              {completed.filter(r => r.certificationIssued).length > 0 && (
                <div className="tr-card" style={{ padding: "16px 20px", marginBottom: 15, borderLeft: "4px solid var(--warning)" }}>
                  <p className="tr-font-display" style={{ margin: "0 0 11px", fontWeight: 700, fontSize: 13.5, color: "var(--warning)" }}>🏆 Certifications Earned</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {completed.filter(r => r.certificationIssued).map((r, i) => (
                      <span key={i} style={{ background: "var(--warning)", color: "#fff", borderRadius: 20, padding: "6px 13px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                        <Award size={11} /> {r.programId?.certification || r.programId?.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="tr-cards-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
                                             {completed.map(r => <TrainingCard key={r._id} record={r} onStart={handleStart} onSubmit={handleSubmitForReview} onViewDetails={setDetailsRecord} />)}
              </div>
            </div>
          )
        )}

        {/* ══ ROADMAP ══ */}
        {activeTab === "roadmap" && (
          <div>
            <div style={{ background: "var(--success-tint)", border: "1px solid #a9e6c8", borderRadius: 10, padding: "11px 15px", marginBottom: 18, display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.5 }}>
              <Info size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, color: "#075e42", lineHeight: 1.6 }}>
                This is the standard Radnus training roadmap for all employees (L1–L6). Your assigned trainings depend on your role, level, and department. All trainings are tracked via Radnus Corporate Academy (RCA).
              </p>
            </div>

            <p className="tr-font-display" style={{ margin: "0 0 13px", fontWeight: 700, fontSize: 14.5, color: "var(--ink)" }}>Job-Role Based Mandatory Training (L1–L6)</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 22 }}>
              {[
                { level: "L1", label: "Intern / Trainee",       color: "var(--muted)",   duration: "7 Days",    cert: "RCA Foundation Certificate",          by: "HR & Culture",          modules: ["Company Induction", "Basic Communication", "Workplace Etiquette", "Radnus Culture"] },
                { level: "L2", label: "Executive",              color: "var(--brand)",   duration: "1 Month",    cert: "RCA Role Certificate",                by: "Dept. Head + Trainer",  modules: ["Product & Service Training", "CRM & ERP Usage", "Customer Handling", "Basic Reporting"] },
                { level: "L3", label: "Senior Executive / AM",  color: "var(--violet)",  duration: "2 Months",   cert: "RCA Performance Certificate",         by: "L&D Team",              modules: ["Advanced Product Knowledge", "Dept SOP Training", "Team Coordination", "Basic Leadership"] },
                { level: "L4", label: "Manager / Sr. Manager",  color: "var(--warning)", duration: "3 Months",   cert: "RCA Leadership Readiness Badge",      by: "HR + L&D",              modules: ["Strategic Planning", "People Management", "Coaching & Mentoring", "Business Review"] },
                { level: "L5", label: "GM / AVP",               color: "var(--danger)",  duration: "3–6 Months", cert: "RCA Business Leadership Certificate", by: "CEO Office + External", modules: ["Business Growth Strategy", "Financial Awareness", "Data-driven Decision Making", "Leadership Communication"] },
                { level: "L6", label: "VP / Director / CXO",   color: "var(--success)", duration: "6 Months",   cert: "RCA Executive Leadership Certificate", by: "CEO + Advisory Board",  modules: ["Vision Alignment", "Corporate Governance", "Digital Transformation", "Cross-Functional Leadership"] },
              ].map((r, i) => (
                <div key={i} className="tr-card" style={{ padding: "15px 19px", borderLeft: `4px solid ${r.color}` }}>
                  <div className="tr-roadmap-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 11, gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                      <span style={{ background: r.color, color: "#fff", borderRadius: 20, padding: "4px 13px", fontSize: 13, fontWeight: 700 }}>{r.level}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{r.label}</p>
                        <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>Duration: {r.duration} · By: {r.by}</p>
                      </div>
                    </div>
                    <div style={{ background: "var(--bg-soft)", borderRadius: 8, padding: "6px 13px", border: `1px solid ${r.color}33`, flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 11, color: r.color, display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
                        <Award size={11} /> {r.cert}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {r.modules.map((m, j) => (
                      <span key={j} style={{ background: "var(--bg-soft)", color: "var(--body)", borderRadius: 20, padding: "4px 11px", fontSize: 11.5, fontWeight: 600 }}>{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Frequency Table */}
            <p className="tr-font-display" style={{ margin: "0 0 13px", fontWeight: 700, fontSize: 14.5, color: "var(--ink)" }}>Training Frequency & Review</p>
            <div className="tr-table-wrap tr-card" style={{ overflow: "hidden", marginBottom: 18 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--bg-soft)" }}>
                    {["Training Type", "When", "Who Conducts"].map(h => (
                      <th key={h} style={{ padding: "11px 15px", textAlign: "left", fontWeight: 700, color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".03em", borderBottom: "2px solid var(--line)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: "Induction Training",            when: "On Joining",      by: "HR & L&D" },
                    { type: "Job Role Training",             when: "Within 30 Days",  by: "Department Trainer" },
                    { type: "Cross-Functional / Leadership", when: "Every 6 Months",  by: "L&D + HR" },
                    { type: "Culture & Engagement",          when: "Quarterly",       by: "Culture Team" },
                    { type: "Refresher Training",            when: "Annual",          by: "HR & L&D" },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--line-soft)" }}>
                      <td style={{ padding: "11px 15px", fontWeight: 600, color: "var(--ink)" }}>{r.type}</td>
                      <td style={{ padding: "11px 15px" }}><span style={{ background: "var(--bg-soft)", color: "var(--body)", borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 600 }}>{r.when}</span></td>
                      <td style={{ padding: "11px 15px", color: "var(--muted)" }}>{r.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Governance note */}
            <div style={{ background: "var(--warning-tint)", border: "1px solid #fde3ad", borderRadius: 10, padding: "11px 15px", display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.5 }}>
              <Info size={14} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, color: "#7c3d0a", lineHeight: 1.6 }}>
                <strong>Training Governance:</strong> All trainings are tracked in RCA (Radnus Corporate Academy) via your dashboard. Your manager must ensure 100% training compliance before confirming probation or promotion.
              </p>
            </div>
          </div>
        )}

        {/* ✅ FIX — both modals moved INSIDE .tr-page (were rendered after
            its closing </div> before, so they never inherited the
            --surface/--ink/etc. CSS variables defined on .tr-page. That
            made the modal background transparent and let the page behind
            it bleed through / overlap with the modal's own text. */}
        {detailsRecord && (
          <TrainingDetailsModal
            record={detailsRecord}
            onClose={() => { setDetailsRecord(null); fetchData(); }}
            onRefresh={fetchData}
            onOpenQuiz={(record) => setQuizRecord(record)}
          />
        )}

        {quizRecord && (
          <QuizModal
            record={quizRecord}
            onClose={() => { setQuizRecord(null); fetchData(); }}
            onRefresh={fetchData}
          />
        )}

      </div>
    </EmployeeLayout>
  );
}