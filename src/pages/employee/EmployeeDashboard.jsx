import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Mail, Phone, FileText, CheckCircle, Clock,
  ExternalLink, Plus, TrendingUp, Star,
  Megaphone, Calendar, Edit3, Save, X, User,
  Trophy, AlertTriangle, Hourglass, Medal,
  Lightbulb, Users, BadgeCheck, ArrowRight,
  Timer, StickyNote, ChevronRight, Bell
} from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";
import CareerPathModal from "./CareerPathModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const fmt = (v) => {
  if (!v) return "—";
  const n = Number(v);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

function ScoreArc({ score = 0 }) {
  const size = 110;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(score, 100) / 100) * circ;
  const color = score >= 75 ? "#00c896" : score >= 50 ? "#4f8ef7" : score >= 30 ? "#f0a500" : "#f45b5b";
  const label = score >= 90 ? "Outstanding" : score >= 75 ? "Exceeds" : score >= 60 ? "Meets Expectations" : score >= 45 ? "Needs Improvement" : "Below Target";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f4" strokeWidth={9} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={9}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1, fontFamily: "'Manrope',sans-serif", letterSpacing: "-1px" }}>{score}<span style={{ fontSize: 12 }}>%</span></span>
        <span style={{ fontSize: 8, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.3px", textAlign: "center", lineHeight: 1.2, maxWidth: 60 }}>{label}</span>
      </div>
    </div>
  );
}

const getImpactEmployeeName = (ib) => {
  return (
    ib.employee_name ||
    ib.employeeName ||
    ib.awarded_to?.name ||
    ib.awardedTo?.name ||
    ib.submitted_by?.name ||
    ib.submittedBy?.name ||
    ib.employee?.name ||
    ib.user?.name ||
    (ib.message && typeof ib.message === "string" && ib.message.includes("·")
      ? ib.message.split("·")[0].trim()
      : null) ||
    ""
  );
};

// ── Job Toast Notification ──
function JobToastNotification({ job, employeeId, apiBase, onDismiss, initialApplied, onApplySuccess }) {
  const [visible, setVisible] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [applyStatus, setApplyStatus] = useState(initialApplied ? "applied" : null);
  const toastRef = useRef(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const draggingRef = useRef(false);
  const hasDismissedRef = useRef(false);

  // Slide in from RIGHT after mount
  useEffect(() => {
    setVisible(true);
    return () => { };
  }, []);

  // ✅ FIXED: Cancel button click → swipe LEFT animation (same as touch swipe)
  const dismiss = () => {
    if (hasDismissedRef.current) return; // ✅ Prevent double dismiss
    hasDismissedRef.current = true;

    if (toastRef.current) {
      toastRef.current.style.transition = "transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.35s ease";
      toastRef.current.style.transform = "translateX(-110%)";
      toastRef.current.style.opacity = "0";
    }
    setTimeout(() => onDismiss && onDismiss(), 370);
  };

  // ── Touch: swipe LEFT to dismiss ──
  const onTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    draggingRef.current = true;
    if (toastRef.current) toastRef.current.style.transition = "none";
  };
  const onTouchMove = (e) => {
    if (!draggingRef.current) return;
    const dx = Math.min(0, e.touches[0].clientX - startXRef.current);
    currentXRef.current = dx;
    if (toastRef.current) {
      toastRef.current.style.transform = `translateX(${dx}px)`;
      toastRef.current.style.opacity = Math.max(0, 1 - Math.abs(dx) / 140);
    }
  };
  const onTouchEnd = () => {
    draggingRef.current = false;
    if (toastRef.current) toastRef.current.style.transition = "";
    if (currentXRef.current < -80) {
      if (toastRef.current) {
        toastRef.current.style.transition = "transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.35s ease";
        toastRef.current.style.transform = "translateX(-110%)";
        toastRef.current.style.opacity = "0";
      }
      setTimeout(() => onDismiss && onDismiss(), 370);
    } else {
      if (toastRef.current) {
        toastRef.current.style.transition = "";
        toastRef.current.style.transform = "";
        toastRef.current.style.opacity = "";
      }
    }
    currentXRef.current = 0;
  };

  // ── Mouse drag: swipe LEFT to dismiss (desktop) ──
  const onMouseDown = (e) => {
    startXRef.current = e.clientX;
    draggingRef.current = true;
    if (toastRef.current) toastRef.current.style.transition = "none";
  };
  const onMouseMove = (e) => {
    if (!draggingRef.current) return;
    const dx = Math.min(0, e.clientX - startXRef.current);
    currentXRef.current = dx;
    if (toastRef.current) {
      toastRef.current.style.transform = `translateX(${dx}px)`;
      toastRef.current.style.opacity = Math.max(0, 1 - Math.abs(dx) / 140);
    }
  };
  const onMouseUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (toastRef.current) toastRef.current.style.transition = "";
    if (currentXRef.current < -80) {
      if (toastRef.current) {
        toastRef.current.style.transition = "transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.35s ease";
        toastRef.current.style.transform = "translateX(-110%)";
        toastRef.current.style.opacity = "0";
      }
      setTimeout(() => onDismiss && onDismiss(), 370);
    } else {
      if (toastRef.current) {
        toastRef.current.style.transition = "";
        toastRef.current.style.transform = "";
        toastRef.current.style.opacity = "";
      }
    }
    currentXRef.current = 0;
  };

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleApply = async () => {
    if (applyStatus === "applied" || applyStatus === "applying") return;
    setApplyStatus("applying");
    try {
      await axios.post(`${apiBase}/api/jobs/${job._id}/apply`, { employeeId });
      setApplyStatus("applied");
      onApplySuccess && onApplySuccess(job._id);   // ✅ NEW
    } catch (err) {
      if (err?.response?.status === 409) {
        setApplyStatus("applied");
      } else {
        setApplyStatus("error");
        setTimeout(() => setApplyStatus(null), 2500);
      }
    }
  };

  const expLabel = {
    "Fresher": "Fresher",
    "0-1 Years": "0–1 yr",
    "6 Months – 1 Year": "6m–1yr",
    "1-3 Years": "1–3 yrs",
    "3–5 Years": "3–5 yrs",
  }[job.experience] || job.experience;

  return (
    <>
      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideUpSheet {
          from { transform: translateY(100%); }
          to   { transform: translateY(0);   }
        }
      `}</style>

      {/* ── Toast ── */}
      <div
        ref={toastRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        className="ed-job-toast"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          left: "auto",
          width: "calc(100% - 32px)",
          maxWidth: 390,
          background: "#fff",
          border: "1px solid #eef0f6",
          borderRadius: 14,
          boxShadow: "0 4px 24px rgba(0,0,0,0.13)",
          padding: "10px 12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "grab",
          userSelect: "none",
          zIndex: 999,
          // ✅ Only slide-in animation; dismiss is handled by JS directly
          animation: visible
            ? "slideInFromRight 0.4s cubic-bezier(.4,0,.2,1) forwards"
            : "none",
        }}
      >
        {/* Swipe-left hint bar */}
        <div style={{
          position: "absolute",
          left: 8,
          top: "50%",
          transform: "translateY(-50%)",
          width: 3,
          height: 28,
          borderRadius: 2,
          background: "#e5e7eb",
        }} />

        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "#f5f3ff", border: "1px solid #ddd6fe",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginLeft: 6,
        }}>
          <BadgeCheck size={16} color="#7c3aed" />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 1px", fontSize: 10, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            New opportunity
          </p>
          <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 700, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {job.title}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {job.salary && job.salary !== "N/A" ? `${job.salary} · ` : ""}{job.type}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowSheet(true); }}
            style={{
              fontSize: 11, padding: "4px 11px", borderRadius: 8,
              background: "#7c3aed", color: "#fff",
              border: "none", cursor: "pointer", fontWeight: 700,
              fontFamily: "'Manrope',sans-serif", whiteSpace: "nowrap"
            }}
          >
            See more
          </button>
          {/* ✅ FIXED: Cancel now triggers swipe-left animation */}
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            style={{
              fontSize: 11, padding: "4px 11px", borderRadius: 8,
              background: "transparent", color: "#6b7280",
              border: "1px solid #e5e7eb", cursor: "pointer", fontWeight: 600,
              fontFamily: "'Manrope',sans-serif", whiteSpace: "nowrap"
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* ── Detail bottom sheet ── */}
      {/* ── Detail bottom sheet ── */}
      {showSheet && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.35)",
            display: "flex", alignItems: "flex-end", justifyContent: "center"
          }}
          onClick={() => setShowSheet(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              background: "#fff", borderRadius: "18px 18px 0 0",
              padding: "18px 20px 0",
              animation: "slideUpSheet .3s cubic-bezier(.4,0,.2,1)",
              position: "relative",
              maxHeight: "65vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Drag handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e5e7eb", margin: "0 auto 16px", flexShrink: 0 }} />

            {/* Close button */}
            <button
              onClick={() => setShowSheet(false)}
              style={{
                position: "absolute", top: 16, right: 16,
                width: 28, height: 28, borderRadius: "50%",
                background: "#f3f4f6", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 2,
              }}
            >
              <X size={14} color="#6b7280" />
            </button>

            {/* ✅ SCROLLABLE CONTENT */}
            <div style={{ overflowY: "auto", flex: 1, paddingRight: 4 }}>

              <p style={{ margin: "0 0 3px", fontSize: 17, fontWeight: 800, color: "#1a1d2e" }}>{job.title}</p>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6b7280" }}>{job.type}</p>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                {job.experience && (
                  <span style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>
                    👤 {expLabel}
                  </span>
                )}
                {job.salary && job.salary !== "N/A" && (
                  <span style={{ fontSize: 11, color: "#059669", background: "#ecfdf5", padding: "3px 10px", borderRadius: 99, fontWeight: 700, border: "1px solid #6ee7b7" }}>
                    💰 {job.salary}
                  </span>
                )}
              </div>

              {/* REQUIREMENTS */}
              {job.requirements && job.requirements.length > 0 && (
                <>
                  <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>Requirements</p>
                  <ul style={{ margin: "0 0 14px", paddingLeft: 16, fontSize: 13, color: "#374151", lineHeight: 1.65 }}>
                    {Array.isArray(job.requirements)
                      ? job.requirements.map((req, i) => <li key={i}>{req}</li>)
                      : typeof job.requirements === "string"
                        ? job.requirements.split("\n").filter(Boolean).map((req, i) => <li key={i}>{req}</li>)
                        : null
                    }
                  </ul>
                </>
              )}

              {/* RESPONSIBILITIES */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <>
                  <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>Responsibilities</p>
                  <ul style={{ margin: "0 0 14px", paddingLeft: 16, fontSize: 13, color: "#374151", lineHeight: 1.65 }}>
                    {Array.isArray(job.responsibilities)
                      ? job.responsibilities.map((resp, i) => <li key={i}>{resp}</li>)
                      : typeof job.responsibilities === "string"
                        ? job.responsibilities.split("\n").filter(Boolean).map((resp, i) => <li key={i}>{resp}</li>)
                        : null
                    }
                  </ul>
                </>
              )}

            </div> {/* ✅ END SCROLLABLE CONTENT */}

            {/* ✅ STICKY APPLY BUTTON */}
            <div style={{
              padding: "12px 0 20px",
              background: "#fff",
              borderTop: "1px solid #f3f4f6",
              marginTop: 4,
              flexShrink: 0,
            }}>
              <button
                onClick={handleApply}
                disabled={applyStatus === "applying" || applyStatus === "applied"}
                style={{
                  width: "100%", padding: "11px",
                  borderRadius: 10, fontSize: 14, fontWeight: 700,
                  border: "1.5px solid",
                  cursor: (applyStatus === "applied" || applyStatus === "applying") ? "default" : "pointer",
                  fontFamily: "'Manrope',sans-serif", transition: "all .15s",
                  ...(applyStatus === "applied"
                    ? { background: "#ecfdf5", color: "#059669", borderColor: "#6ee7b7" }
                    : applyStatus === "error"
                      ? { background: "#fef2f2", color: "#dc2626", borderColor: "#fca5a5" }
                      : applyStatus === "applying"
                        ? { background: "#f5f3ff", color: "#7c3aed", borderColor: "#ddd6fe", opacity: .7 }
                        : { background: "#7c3aed", color: "#fff", borderColor: "#7c3aed" }
                  )
                }}
              >
                {applyStatus === "applied" ? "✓ Applied!" : applyStatus === "applying" ? "Submitting..." : applyStatus === "error" ? "Try again" : "Apply for this role"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

// ── Internal Job Row Component ──
function InternalJobRow({ job, employeeId, apiBase, onApplySuccess, onWithdrawSuccess }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const myApplication = job.applicants?.find((a) => {
      const appEmpId = a.employeeId?._id || a.employeeId;
      return appEmpId?.toString() === employeeId?.toString();
    });
    if (!myApplication) { setStatus(null); return; }
    // status "applied" nu இருந்தா மட்டும் "applied" (withdraw allowed)
    // வேற எதுவா இருந்தா அந்த real status-ஐயே வெச்சுக்கோ (withdraw hide ஆகும்)
    setStatus(myApplication.status === "applied" ? "applied" : `locked_${myApplication.status}`);
  }, [job, employeeId]);
  const expLabel = {
    "Fresher": "Fresher",
    "0-1 Years": "0–1 yr",
    "6 Months – 1 Year": "6m–1yr",
    "1-3 Years": "1–3 yrs",
    "3–5 Years": "3–5 yrs",
  }[job.experience] || job.experience;

  const handleApply = async () => {
    if (status === "applied" || status === "applying") return;
    setStatus("applying");
    try {
      await axios.post(`${apiBase}/api/jobs/${job._id}/apply`, { employeeId });
      setStatus("applied");
      onApplySuccess && onApplySuccess(job._id);   // ✅ NEW
    } catch (err) {
      if (err?.response?.status === 409) {
        setStatus("applied");
      } else {
        setStatus("error");
        setTimeout(() => setStatus(null), 2500);
      }
    }
  };

  const handleWithdraw = async (e) => {
    e.stopPropagation();
    if (status !== "applied") return;
    if (!window.confirm(`Withdraw your application for "${job.title}"?`)) return;
    setStatus("withdrawing");
    try {
      await axios.delete(`${apiBase}/api/jobs/${job._id}/withdraw/${employeeId}`);
      setStatus(null);
      onWithdrawSuccess && onWithdrawSuccess(job._id);
    } catch (err) {
      alert(err?.response?.data?.msg || "Withdraw failed");
      setStatus("applied");
    }
  };

  return (
    <div className="ed-internal-job-row" style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "11px 16px",
      borderBottom: "1px solid #f4f5f8",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: "#f5f3ff", border: "1px solid #ddd6fe",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <BadgeCheck size={15} color="#7c3aed" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: "0 0 4px", fontSize: 13, fontWeight: 700,
          color: "#1a1d2e", overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>
          {job.title}
        </p>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 7 }}>
          {job.type && (
            <span style={{
              fontSize: 10, color: "#6b7280", background: "#f3f4f6",
              padding: "1px 7px", borderRadius: 99, fontWeight: 600
            }}>📁 {job.type}</span>
          )}
          {job.experience && (
            <span style={{
              fontSize: 10, color: "#6b7280", background: "#f3f4f6",
              padding: "1px 7px", borderRadius: 99, fontWeight: 600
            }}>👤 {expLabel}</span>
          )}
          {job.salary && job.salary !== "N/A" && (
            <span style={{
              fontSize: 10, color: "#059669", background: "#ecfdf5",
              padding: "1px 7px", borderRadius: 99, fontWeight: 700,
              border: "1px solid #6ee7b7"
            }}>💰 {job.salary}</span>
          )}
        </div>
        <button
          className="ed-internal-job-btn"
          onClick={status === "applied" ? handleWithdraw : status?.startsWith("locked_") ? undefined : handleApply}
          disabled={status === "applying" || status === "withdrawing" || status?.startsWith("locked_")}
          style={{
            padding: "5px 14px", borderRadius: 7, fontSize: 11,
            fontWeight: 700,
            cursor: (status === "applying" || status === "withdrawing" || status?.startsWith("locked_")) ? "default" : "pointer",
            border: "1.5px solid", fontFamily: "'Manrope', sans-serif",
            transition: "all .15s",
            ...(status === "applied"
              ? { background: "#ecfdf5", color: "#059669", borderColor: "#6ee7b7" }
              : status?.startsWith("locked_")
                ? { background: "#f5f3ff", color: "#7c3aed", borderColor: "#ddd6fe" }
                : status === "withdrawing"
                  ? { background: "#fef2f2", color: "#dc2626", borderColor: "#fca5a5", opacity: .7 }
                  : status === "error"
                    ? { background: "#fef2f2", color: "#dc2626", borderColor: "#fca5a5" }
                    : status === "applying"
                      ? { background: "#f5f3ff", color: "#7c3aed", borderColor: "#ddd6fe", opacity: .7 }
                      : { background: "#7c3aed", color: "#fff", borderColor: "#7c3aed" }
            )
          }}
        >
          {status === "applied" ? "✓ Applied"
            : status === "locked_under_review" ? "Shortlisted"
              : status === "locked_interview" ? "Interview"
                : status === "locked_selected" ? "✓ Hired"
                  : status === "locked_rejected" ? "Not Selected"
                    : status === "withdrawing" ? "Withdrawing..."
                      : status === "applying" ? "Submitting..."
                        : status === "error" ? "Try again"
                          : "Apply Now"}
        </button>
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [kpiScore, setKpiScore] = useState(null);
  const [kpiPeriod, setKpiPeriod] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [employeeGrade, setEmployeeGrade] = useState(null);
  const [impactAnnouncements, setImpactAnnouncements] = useState([]);
  const [deptBands, setDeptBands] = useState([]);
  const [showCareer, setShowCareer] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [deptDesigs, setDeptDesigs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [internalJobs, setInternalJobs] = useState([]);
  const [toastQueue, setToastQueue] = useState([]);
  const [toastIndex, setToastIndex] = useState(0);
  const [performersRanked, setPerformersRanked] = useState([]);   // full list (not sliced)
  const [showAllPerformers, setShowAllPerformers] = useState(false); // toggle


  useEffect(() => {
    const hideCrisp = () => { if (window.$crisp) window.$crisp.push(["do", "chat:hide"]); };
    hideCrisp();
    const retry = setTimeout(hideCrisp, 1500);
    return () => { clearTimeout(retry); if (window.$crisp) window.$crisp.push(["do", "chat:show"]); };
  }, []);

  useEffect(() => {
    const id = localStorage.getItem("employeeId");
    if (!id) { window.location.href = "/login"; return; }
    fetchAll(id);
    const t = setInterval(() => fetchAll(id), 30000);

    const fetchUnread = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/notifications/${id}`);
        const data = res.data?.data || res.data || [];
        setUnreadCount(data.filter(n => !n.isRead).length);
      } catch (_) { }
    };
    fetchUnread();
    const notifInterval = setInterval(fetchUnread, 30000);

    return () => {
      clearInterval(t);
      clearInterval(notifInterval);
    };
  }, []);

  const fetchAll = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/api/employee/me/${id}`);
      try {
        const hrRes = await axios.get(`${API_BASE}/api/hr/employees`);
        const matched = hrRes.data.find(e => e._id === id);
        const mergedData = { ...res.data, employeeId: matched?.employeeId || res.data.employeeId };
        setEmployee(mergedData); setEditData(mergedData);
      } catch {
        setEmployee(res.data); setEditData(res.data);
      }

      try {
        const deptRes = await axios.get(`${API_BASE}/api/departments`);
        const activeDepts = (deptRes.data.data || deptRes.data || [])
          .filter(d => !d.status || d.status === "active");
        setDepartments(activeDepts);
        if (res.data?.department) {
          const found = activeDepts.find(d => d.name === res.data.department);
          if (found) setDeptDesigs((found.designations || []).filter(dg => dg.status === "active"));
        }
      } catch (_) { }

      try {
        const dbRes = await axios.get(`${API_BASE}/api/dept-grade-salary`);
        setDeptBands(dbRes.data.data || []);
      } catch (_) { }

      try {
        const kr = await axios.get(`${API_BASE}/api/kpi-assignments/${id}`);
        if (kr.data.success && kr.data.data) {
          const assign = kr.data.data;
          setKpiPeriod(assign.period || "");
          let scoreSet = false;
          try {
            const prRes = await axios.get(`${API_BASE}/api/performance-reviews/${id}`);
            if (prRes.data.success && prRes.data.data?.length > 0) {
              const sorted = prRes.data.data
                .filter(r => r.status === "finalized" && r.final_score != null)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              if (sorted.length > 0) {
                setKpiScore(sorted[0].final_score);
                setKpiPeriod(sorted[0].period || assign.period || "");  // ← review-ன் actual period
                scoreSet = true;
              }
            }
          } catch (_) { }
          if (!scoreSet) {
            try {
              const saRes = await axios.get(`${API_BASE}/api/self-assessment/by-assignment/${assign._id}`);
              if (saRes.data.success && saRes.data.data) {
                const items = assign.template_id?.kpi_items || [];
                const map = {};
                saRes.data.data.items.forEach(i => { map[i.kpi_item_id] = i.self_value; });
                const totalWeight = items.reduce((s, i) => s + (i.weight || 0), 0);
                let total = 0;
                items.forEach(item => {
                  const val = map[item._id] || 0;
                  const pct = Math.min((val / item.target) * 100, 100);
                  const w = totalWeight === 0 ? (100 / items.length) : (item.weight || 0);
                  const divisor = totalWeight === 0 ? 100 : totalWeight;
                  total += pct * (w / divisor);
                });
                setKpiScore(Math.round(total));
              }
            } catch (_) { }
          }
        }
      } catch (_) { }

      try {
        const an = await axios.get(`${API_BASE}/api/announcements`);
        if (an.data.success) setAnnouncements(an.data.data?.slice(0, 3) || []);
      } catch (_) { }

      try {
        const gradeRes = await axios.get(`${API_BASE}/api/assign-grade/employee/${id}`);
        if (gradeRes.data.success && gradeRes.data.data) setEmployeeGrade(gradeRes.data.data);
      } catch (_) { }

      try {
        const ibRes = await axios.get(`${API_BASE}/api/impact-bonus/announcements`);
        if (ibRes.data.success) setImpactAnnouncements(ibRes.data.data);
      } catch (_) { }

      try {
        const ijRes = await axios.get(`${API_BASE}/api/jobs/internal`);
        if (ijRes.data.success) {
          const jobs = ijRes.data.jobs || [];
          setInternalJobs(jobs);
          setToastQueue(prev => prev.length === 0 ? jobs : prev);
        }
      } catch (_) { }

      // ✅ NEW — Top Performers fetch
      // ✅ Top Performers fetch
      try {
        const revRes = await axios.get(`${API_BASE}/api/self-assessment/performance-reviews/all`);
        if (revRes.data.success) {
          const all = revRes.data.data || [];
          const latestPeriod = all.length
            ? [...all].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].period
            : null;
          const periodReviews = latestPeriod ? all.filter(r => r.period === latestPeriod) : all;
          const ranked = [...periodReviews]
            .filter(r => r.final_score != null)
            .sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
          setPerformersRanked(ranked);   // ✅ full list, no slice here
        }
      } catch (_) { }

    } catch (err) { console.log(err); }
    finally { setLoading(false); }
  };

  const handleEditToggle = () => { if (!employee) return; setEditData(JSON.parse(JSON.stringify(employee))); setIsEditing(true); };
  const handleCancel = () => setIsEditing(false);

  const handleDocReplace = async (index, file) => {
    const fd = new FormData(); fd.append("file", file); fd.append("docId", editData.documents[index]._id);
    const res = await axios.post(`${API_BASE}/api/employee/replace-doc`, fd);
    const d = [...editData.documents]; d[index] = res.data;
    setEditData(p => ({ ...p, documents: d })); setEmployee(p => ({ ...p, documents: d }));
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API_BASE}/api/employee/update-profile`, { employeeId: employee._id || employee.id, ...editData });
      const updated = await axios.get(`${API_BASE}/api/employee/me/${employee.id}`);
      setEmployee(updated.data); setEditData(updated.data); setIsEditing(false);
    } catch (err) { console.log(err); }
  };

  const handleChange = (e) => { const { name, value } = e.target; setEditData(p => ({ ...p, [name]: value })); };

  const handleDeptChange = (e) => {
    const deptName = e.target.value;
    setEditData(p => ({ ...p, department: deptName, designation: "" }));
    const found = departments.find(d => d.name === deptName);
    setDeptDesigs(found ? (found.designations || []).filter(dg => dg.status === "active") : []);
  };

  const markJobApplied = (jobId) => {
    const empId = employee?._id || employee?.id;
    setInternalJobs(prev => prev.map(j =>
      j._id === jobId
        ? { ...j, applicants: [...(j.applicants || []), { employeeId: empId, status: "applied" }] }
        : j
    ));
    setToastQueue(prev => prev.map(j =>
      j._id === jobId
        ? { ...j, applicants: [...(j.applicants || []), { employeeId: empId, status: "applied" }] }
        : j
    ));
  };

  const markJobWithdrawn = (jobId) => {
    const empId = employee?._id || employee?.id;
    const removeApplicant = (j) => j._id === jobId
      ? { ...j, applicants: (j.applicants || []).filter(a => (a.employeeId?._id || a.employeeId)?.toString() !== empId?.toString()) }
      : j;
    setInternalJobs(prev => prev.map(removeApplicant));
    setToastQueue(prev => prev.map(removeApplicant));
  };

  const handleDocChange = (i, f, v) => { const d = [...editData.documents]; d[i] = { ...d[i], [f]: v }; setEditData(p => ({ ...p, documents: d })); };
  const handleAddDoc = () => setEditData(p => ({ ...p, documents: [...p.documents, { docType: "New Document", fileUrl: "" }] }));

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f7f8fc" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #eef0f4", borderTopColor: "#4f8ef7", borderRadius: "50%", animation: "s .7s linear infinite" }} />
      <style>{`@keyframes s{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!employee) return null;

  const isApproved = employee.status === "approved" || employee.status === "active";
  const isRejected = employee.status === "rejected";
  const docs = (isEditing ? editData.documents : employee.documents) || [];

  const inp = {
    width: "100%", background: "#fff", border: "1.5px solid #e8eaf0", borderRadius: 8,
    padding: "9px 12px", fontSize: 13, color: "#1a1d2e", outline: "none",
    fontFamily: "'Manrope',sans-serif", transition: "border-color .15s"
  };

  const heroSel = {
    flex: 1, minWidth: 90,
    background: "rgba(255,255,255,.1)",
    border: "1.5px solid rgba(255,255,255,.18)",
    color: "#fff", fontSize: 12,
    padding: "9px 12px", borderRadius: 8,
    outline: "none", fontFamily: "'Manrope',sans-serif",
    cursor: "pointer",
  };

  const scoreColor = kpiScore === null ? "#c5cad8" : kpiScore >= 75 ? "#00c896" : kpiScore >= 50 ? "#4f8ef7" : kpiScore >= 30 ? "#f0a500" : "#f45b5b";
  const statusColor = isApproved ? "#00a875" : isRejected ? "#f45b5b" : "#d97706";
  const StatusIcon = isApproved ? CheckCircle : isRejected ? X : Hourglass;
  const statusIconColor = isApproved ? "#00a875" : isRejected ? "#f45b5b" : "#d97706";

  const gradeStage = employeeGrade?.grade_id?.bgr_stage;
  const gradeColor = gradeStage === "Build" ? "#059669" : gradeStage === "Grow" ? "#2563eb" : "#d97706";
  const gradeBg = gradeStage === "Build" ? "#d1fae5" : gradeStage === "Grow" ? "#dbeafe" : "#fef3c7";
  const gradeBorder = gradeStage === "Build" ? "#6ee7b7" : gradeStage === "Grow" ? "#93c5fd" : "#fcd34d";

  const careerLevels = [...deptBands]
    .filter(b => b.department_name === employee?.department)
    .sort((a, b) =>
      parseInt((a.grade_level || "L0").replace("L", "")) -
      parseInt((b.grade_level || "L0").replace("L", ""))
    );

  const careerIndex = careerLevels.findIndex(
    b => b.grade_level === employeeGrade?.grade_id?.level
  );

  const careerPct = careerLevels.length > 1
    ? Math.round(((careerIndex + 1) / careerLevels.length) * 100)
    : 0;

  const currentSalaryBand = careerLevels.find(
    b => b.grade_level === employeeGrade?.grade_id?.level
  ) || null;

  return (
    <EmployeeLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        .emp-dash *, .emp-dash *::before, .emp-dash *::after { box-sizing: border-box; }
        .emp-dash { font-family: 'Manrope', sans-serif; background: #f7f8fc; min-height: 100vh; color: #1a1d2e; overflow-x: hidden; width: 100%; max-width: 100vw; }
        .emp-dash img { max-width: 100%; }

        .ed-topbar {
          background: #fff;
          border-bottom: 1px solid #eef0f6;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 40;
          padding: 0 12px 0 52px;
          width: 100%;
          gap: 8px;
        }
        .ed-topbar-left  { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; overflow: hidden; }
        .ed-topbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .ed-topbar-name  { font-size: 12px; font-weight: 700; color: #1a1d2e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; max-width: 130px; }
        .ed-topbar-sub   { font-size: 10px; color: #9ca3af; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }
        .ed-topbar-avatar { display: flex; flex-shrink: 0; }

        .ed-status-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 99px; font-size: 10px; font-weight: 700; border: 1.5px solid; white-space: nowrap; flex-shrink: 0; }
        .ed-pill-text { display: none; }

        .ed-btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 9px 14px; border-radius: 8px; background: #4f8ef7; border: none; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Manrope', sans-serif; transition: background .15s; white-space: nowrap; flex-shrink: 0; min-height: 38px; }
        .ed-btn-primary:hover { background: #3a7be8; }
        .ed-btn-outline  { display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 8px 12px; border-radius: 8px; background: #fff; border: 1.5px solid #e8eaf0; color: #374151; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Manrope', sans-serif; transition: all .15s; white-space: nowrap; flex-shrink: 0; min-height: 38px; }
        .ed-btn-outline:hover { border-color: #4f8ef7; color: #4f8ef7; }
        .ed-topbar-actions { display: none; }

        .ed-notif-btn {
          position: relative; width: 36px; height: 36px; border-radius: 9px;
          border: 1.5px solid #eef0f6; background: #f7f8fc;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s; color: #6b7280; flex-shrink: 0; padding: 0;
        }
        .ed-notif-btn:hover { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
        .ed-notif-badge {
          position: absolute; top: -5px; right: -5px;
          min-width: 17px; height: 17px; background: #dc2626; color: #fff;
          border-radius: 99px; font-size: 9px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          padding: 0 3px; border: 2px solid #fff; line-height: 1; pointer-events: none;
        }

        .ed-hero {
          background: linear-gradient(120deg, #1a1d2e 0%, #252a45 60%, #1f2c4a 100%);
          padding: 14px 14px 16px; position: relative; overflow: hidden; width: 100%;
        }
        .ed-hero::before { content: ''; position: absolute; top: -80px; right: -80px; width: 260px; height: 260px; border-radius: 50%; background: radial-gradient(circle, rgba(79,142,247,.18) 0%, transparent 70%); pointer-events: none; }

        .ed-hero-profile-row { display: flex; align-items: center; gap: 10px; position: relative; z-index: 1; margin-bottom: 12px; width: 100%; }
        .ed-avatar-wrap { position: relative; flex-shrink: 0; }
        .ed-avatar { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2.5px solid rgba(255,255,255,.2); display: block; }
        .ed-avatar-overlay { position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .2s; cursor: pointer; }
        .ed-avatar-wrap:hover .ed-avatar-overlay { opacity: 1; }
        .ed-avatar-wrap input[type=file] { position: absolute; inset: 0; opacity: 0; cursor: pointer; z-index: 5; border-radius: 50%; }

        .ed-hero-name-block { flex: 1; min-width: 0; overflow: hidden; }
        .ed-hero-name { margin: 0 0 2px; font-size: 15px; font-weight: 800; color: #fff; letter-spacing: -0.3px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ed-hero-role { margin: 0; font-size: 10px; color: rgba(255,255,255,.5); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .ed-hero-chips { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; position: relative; z-index: 1; margin-bottom: 10px; width: 100%; }
        .ed-hero-chips .ed-chip:nth-child(1) { order: 1; }
        .ed-hero-chips .ed-chip:nth-child(2) { order: 3; grid-column: 1 / -1; }
        .ed-hero-chips .ed-chip:nth-child(3) { order: 2; }
        .ed-chip { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 8px; padding: 7px 10px; display: flex; flex-direction: column; gap: 2px; min-width: 0; overflow: hidden; }
        .ed-chip-label { font-size: 9px; color: rgba(255,255,255,.35); font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; }
        .ed-chip-val   { font-size: 11px; color: rgba(255,255,255,.85); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .ed-hero-status-bar  { display: flex; flex-direction: column; gap: 10px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 11px 12px; position: relative; z-index: 1; width: 100%; }
        .ed-hero-status-row  { display: flex; align-items: flex-start; gap: 10px; }
        .ed-hero-status-text { flex: 1; min-width: 0; }
        .ed-hero-edit-btn    { width: 100%; }
        .ed-hero-edit-btn > button, .ed-hero-edit-btn > div { width: 100%; justify-content: center; }
        .ed-hero-select option { color: #111827 !important; background: #fff !important; }

        .ed-card       { background: #fff; border-radius: 14px; border: 1px solid #eef0f6; min-width: 0; overflow: hidden; }
        .ed-card-title { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.2px; padding: 14px 14px 0; margin-bottom: 10px; display: flex; align-items: center; gap: 7px; }

        .ed-main   { padding: 12px 12px 100px; display: flex; flex-direction: column; gap: 10px; width: 100%; overflow: hidden; }
        .ed-grid-2 { display: grid; grid-template-columns: 1fr; gap: 10px; width: 100%; }
        .ed-docs-grid { display: grid; grid-template-columns: 1fr; gap: 8px; padding: 0 14px 14px; }

        .ed-doc-item { display: flex; align-items: center; gap: 10px; padding: 11px 12px; border-radius: 10px; border: 1px solid #eef0f6; background: #fafbfd; transition: border-color .15s, box-shadow .15s; min-width: 0; overflow: hidden; }
        .ed-doc-item:hover { border-color: #c7d2fe; box-shadow: 0 2px 8px rgba(79,142,247,.08); }

        .ed-ann-row { display: flex; gap: 10px; align-items: flex-start; padding: 11px 14px; border-bottom: 1px solid #f4f5f8; transition: background .15s; min-width: 0; overflow: hidden; }
        .ed-ann-row:last-child { border-bottom: none; }
        .ed-ann-row:hover { background: #fafbfd; }

        .ed-info-pair  { display: flex; flex-direction: column; gap: 2px; padding: 11px 14px; border-bottom: 1px solid #f4f5f8; min-width: 0; }
        .ed-info-pair:last-child { border-bottom: none; }
        .ed-info-label { font-size: 10px; color: #b0b8c9; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; display: flex; align-items: center; gap: 4px; }
        .ed-info-value { font-size: 13px; color: #374151; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .ed-view-btn { display: flex; align-items: center; gap: 4px; padding: 5px 9px; border-radius: 7px; background: #f0f4ff; border: 1px solid #c7d2fe; color: #4f8ef7; font-size: 11px; font-weight: 700; text-decoration: none; flex-shrink: 0; transition: all .15s; white-space: nowrap; }
        .ed-view-btn:hover { background: #4f8ef7; color: #fff; }

        .ed-score-wrap     { display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; overflow: hidden; }
        .ed-score-arc-wrap { flex-shrink: 0; transform: scale(0.78); transform-origin: left center; }
        .ed-score-num      { font-size: 24px; font-weight: 800; line-height: 1; letter-spacing: -1px; font-family: 'JetBrains Mono', monospace; }

        .ed-career-btn {
          width: 100%; margin-top: 12px; padding: 11px 0;
          border: 1.5px solid #bfdbfe; border-radius: 9px;
          background: #eff6ff; color: #2563eb;
          font-size: 13px; font-weight: 700; cursor: pointer;
          font-family: 'Manrope', sans-serif; transition: all .15s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .ed-career-btn:hover { background: #2563eb; color: #fff; border-color: #2563eb; }

        /* ── Internal job row / apply button — comfortable tap target on touch screens ── */
        .ed-internal-job-btn { min-height: 34px; }

        /* ── Extra-small phones (<=380px): tighten spacing & scale text down further ── */
        @media (max-width: 380px) {
          .ed-topbar { padding: 0 10px 0 48px; }
          .ed-topbar-name { max-width: 110px; font-size: 11px; }
          .ed-topbar-sub { font-size: 9px; }

          .ed-hero { padding: 12px 10px 14px; }
          .ed-hero-profile-row { gap: 8px; margin-bottom: 10px; }
          .ed-avatar { width: 44px; height: 44px; }
          .ed-hero-name { font-size: 13.5px; }
          .ed-hero-role { font-size: 9.5px; }

          .ed-hero-chips { gap: 5px; margin-bottom: 8px; }
          .ed-chip { padding: 6px 8px; }
          .ed-chip-label { font-size: 8px; }
          .ed-chip-val { font-size: 10px; }

          .ed-hero-status-bar { padding: 10px; gap: 8px; }

          .ed-main { padding: 10px 8px 90px; gap: 8px; }
          .ed-card-title { font-size: 10px; padding: 12px 12px 0; margin-bottom: 8px; letter-spacing: 1px; }

          .ed-score-arc-wrap { transform: scale(0.68); }
          .ed-score-num { font-size: 20px; }

          .ed-docs-grid { padding: 0 12px 12px; }
          .ed-ann-row { padding: 10px 12px; gap: 8px; }
          .ed-info-pair { padding: 10px 12px; }
          .ed-doc-item { padding: 10px; gap: 8px; }
        }

        /* ── Job toast: keep comfortably within very narrow viewports ── */
        @media (max-width: 380px) {
          .ed-job-toast { top: 10px !important; right: 10px !important; width: calc(100% - 20px) !important; padding: 9px 10px 13px !important; }
        }

        @media (min-width: 768px) {
          .ed-topbar { display: none; }
          .ed-pill-text { display: inline; }
          .ed-status-pill { padding: 5px 10px; font-size: 11px; }
          .ed-hero { padding: 28px 32px; }
          .ed-hero-profile-row { margin-bottom: 20px; gap: 14px; }
          .ed-avatar { width: 68px; height: 68px; }
          .ed-hero-name { font-size: 22px; white-space: normal; }
          .ed-hero-role { font-size: 13px; white-space: normal; }
          .ed-hero-chips { grid-template-columns: 1fr 1fr 1fr; }
          .ed-hero-chips .ed-chip:nth-child(1) { order: unset; }
          .ed-hero-chips .ed-chip:nth-child(2) { order: unset; grid-column: auto; }
          .ed-hero-chips .ed-chip:nth-child(3) { order: unset; }
          .ed-chip-val { font-size: 12px; }
          .ed-hero-status-bar { flex-direction: row; align-items: center; }
          .ed-hero-status-row { flex: 1; }
          .ed-hero-edit-btn { width: auto; }
          .ed-hero-edit-btn > button, .ed-hero-edit-btn > div { width: auto; }
          .ed-card-title { padding: 18px 20px 0; margin-bottom: 14px; }
          .ed-ann-row  { padding: 12px 20px; gap: 11px; }
          .ed-info-pair{ padding: 11px 20px; }
          .ed-info-value { white-space: normal; }
          .ed-main   { padding: 20px 28px 32px; gap: 16px; }
          .ed-grid-2 { grid-template-columns: 1fr 1fr; gap: 16px; }
          .ed-docs-grid { grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px; padding: 0 20px 20px; }
          .ed-doc-item  { padding: 12px 14px; gap: 11px; }
          .ed-score-arc-wrap { transform: scale(1); }
          .ed-score-num { font-size: 30px; }
          .ed-topbar-actions { display: flex; align-items: center; gap: 8px; }
          .ed-topbar-avatar { display: none; }
          .ed-topbar-name { font-size: 13px; max-width: none; }
          .ed-topbar-sub  { font-size: 11px; }
          .ed-topbar-right{ gap: 10px; }
        }
      `}</style>

      <div className="emp-dash">

        {/* Topbar (mobile only) */}
        <div className="ed-topbar">
          <div className="ed-topbar-left">
            <div className="ed-topbar-avatar" style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", border: "2px solid #eef0f6", flexShrink: 0 }}>
              <img
                src={employee.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=e8f0fe&color=4f8ef7&size=36`}
                alt="av"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <p className="ed-topbar-name">{employee.name}</p>
              <p className="ed-topbar-sub">{employee.designation}</p>
            </div>
          </div>
          <div className="ed-topbar-right">
            <button className="ed-notif-btn" onClick={() => window.location.href = "/employee/notifications"} title="Notifications" style={{ background: "#f7f8fc", border: "1.5px solid #eef0f6", color: "#6b7280" }}>
              <Bell size={17} />
              {unreadCount > 0 && <span className="ed-notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="ed-hero">
          <div className="ed-hero-profile-row">
            <div className="ed-avatar-wrap">
              <img
                src={employee.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=252a45&color=7fa8f7&size=72`}
                alt="profile" className="ed-avatar"
              />
              <div className="ed-avatar-overlay">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              {isEditing && (
                <input type="file" accept="image/*" onChange={async e => {
                  const file = e.target.files[0]; if (!file) return;
                  const fd = new FormData(); fd.append("file", file); fd.append("employeeId", employee.id);
                  await axios.post(`${API_BASE}/api/employee/upload-profile`, fd);
                  const r = await axios.get(`${API_BASE}/api/employee/me/${employee.id}`);
                  setEmployee(r.data);
                }} />
              )}
            </div>

            <div className="ed-hero-name-block">
              {isEditing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <input
                    style={{ ...inp, background: "rgba(255,255,255,.12)", border: "1.5px solid rgba(255,255,255,.22)", color: "#fff", fontSize: 14 }}
                    name="name" value={editData.name || ""} onChange={handleChange} placeholder="Full Name"
                  />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <select className="ed-hero-select" value={editData.department || ""} onChange={handleDeptChange} style={{ ...heroSel }}>
                      <option value="">Select Department</option>
                      {departments.map(d => (<option key={d._id} value={d.name}>{d.name}</option>))}
                    </select>
                    <select
                      className="ed-hero-select"
                      value={editData.designation || ""}
                      onChange={e => setEditData(p => ({ ...p, designation: e.target.value }))}
                      disabled={!editData.department}
                      style={{ ...heroSel, cursor: editData.department ? "pointer" : "not-allowed", opacity: editData.department ? 1 : 0.5 }}>
                      <option value="">{editData.department ? "Select Designation" : "Select dept first"}</option>
                      {deptDesigs.map(dg => (<option key={dg._id || dg.title} value={dg.title}>{dg.title}</option>))}
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <p className="ed-hero-name">{employee.name}</p>
                  <p className="ed-hero-role">{employee.designation} · {employee.department}</p>
                </>
              )}
            </div>

            <button className="ed-notif-btn ed-hero-bell-desktop" onClick={() => window.location.href = "/employee/notifications"} title="Notifications" style={{ background: "rgba(255,255,255,.1)", border: "1.5px solid rgba(255,255,255,.18)", color: "#fff" }}>
              <Bell size={16} />
              {unreadCount > 0 && <span className="ed-notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </button>
          </div>

          <div className="ed-hero-chips">
            {[
              { label: "Employee ID", value: employee.employeeId || "—" },
              { label: "Email", value: employee.email },
              { label: "Mobile", value: employee.mobile || "—" },
            ].map((s, i) => (
              <div key={i} className="ed-chip">
                <span className="ed-chip-label">{s.label}</span>
                <span className="ed-chip-val" title={s.value}>{s.value}</span>
              </div>
            ))}
          </div>

          <div className="ed-hero-status-bar">
            <div className="ed-hero-status-row">
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: isApproved ? "rgba(0,168,117,.15)" : isRejected ? "rgba(244,91,91,.15)" : "rgba(217,119,6,.15)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <StatusIcon size={16} color={statusIconColor} />
              </div>
              <div className="ed-hero-status-text" style={{ marginLeft: 10 }}>
                <p style={{ margin: "0 0 1px", fontSize: 12, fontWeight: 800, color: statusColor }}>
                  {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,.35)", lineHeight: 1.4 }}>
                  {isApproved ? "Your documents have been verified by HR" : isRejected ? (employee.remarks || "Documents rejected by HR") : "HR is reviewing your documents"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="ed-main">
          <div className="ed-grid-2">

            {/* Score Card */}
            <div className="ed-card" style={{ padding: "14px" }}>
              <p className="ed-card-title" style={{ padding: 0, marginBottom: 12 }}>
                <TrendingUp size={12} /> Performance Score
              </p>
              {kpiScore === null ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 50, height: 50, borderRadius: "50%", border: "2.5px dashed #e8eaf0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Star size={16} color="#d1d5db" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#9ca3af" }}>No KPIs Assigned</p>
                    <p style={{ margin: "0 0 6px", fontSize: 11, color: "#c5cad8" }}>HR will assign your KPIs soon</p>
                    <a href="/employee/performance" style={{ fontSize: 12, color: "#4f8ef7", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      View Performance <ArrowRight size={12} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="ed-score-wrap">
                  <div className="ed-score-arc-wrap"><ScoreArc score={kpiScore} /></div>
                  <div style={{ minWidth: 0, overflow: "hidden" }}>
                    <p style={{ margin: "0 0 2px", fontSize: 10, color: "#b0b8c9", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px" }}>Overall Score</p>
                    <p className="ed-score-num" style={{ margin: "0 0 5px", color: scoreColor }}>
                      {kpiScore}<span style={{ fontSize: 13, letterSpacing: 0 }}>%</span>
                    </p>
                    {kpiPeriod && (
                      <span style={{ background: "#f0f4ff", color: "#4f8ef7", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, border: "1px solid #c7d2fe", fontFamily: "'JetBrains Mono',monospace", display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kpiPeriod}</span>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <a href="/employee/performance" style={{ fontSize: 12, color: "#4f8ef7", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        View Full Report <ArrowRight size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Announcements Card */}
            <div className="ed-card" style={{ overflow: "hidden" }}>
              <p className="ed-card-title"><Megaphone size={12} /> Announcements</p>
              {impactAnnouncements.map((ib, i) => {
                const empName = getImpactEmployeeName(ib);
                return (
                  <div key={`ib-${i}`} className="ed-ann-row">
                    <div style={{ width: 30, height: 30, minWidth: 30, borderRadius: 8, background: "#ecfdf5", border: "1px solid #6ee7b7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Trophy size={14} color="#059669" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                        <Lightbulb size={11} color="#059669" />
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#059669", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Innovation Announced!</p>
                      </div>
                      <p style={{ margin: "0 0 1px", fontSize: 12, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 700 }}>{ib.title}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                        <User size={10} color="#6b7280" />
                        <p style={{ margin: 0, fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{empName || "—"}</p>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        {ib.bonus_amount > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "#d1fae5", padding: "2px 8px", borderRadius: 99, border: "1px solid #6ee7b7" }}>₹{ib.bonus_amount.toLocaleString("en-IN")} Bonus</span>}
                        {ib.total_score > 0 && <span style={{ fontSize: 10, color: "#b0b8c9", fontWeight: 600 }}>Score: {ib.total_score}/100</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {announcements.length === 0 && impactAnnouncements.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px 14px 20px" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f7f8fc", border: "1px solid #eef0f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                    <Megaphone size={15} color="#d1d5db" />
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: "#c5cad8" }}>No announcements right now</p>
                </div>
              ) : (
                announcements.map((ann, i) => (
                  <div key={i} className="ed-ann-row">
                    <div style={{ width: 30, height: 30, minWidth: 30, borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Megaphone size={13} color="#d97706" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                      <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ann.title}</p>
                      <p style={{ margin: "0 0 3px", fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ann.message || ann.content}</p>
                      <span style={{ fontSize: 10, color: "#b0b8c9", display: "flex", alignItems: "center", gap: 3 }}>
                        <Calendar size={9} />
                        {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


          {/* ✅ Top Performers Card — Expand in place */}
          {performersRanked.length > 0 && (
            <div className="ed-card" style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 14px 0" }}>
                <p className="ed-card-title" style={{ padding: 0, margin: 0 }}>
                  <Trophy size={12} /> Top Performers
                </p>
                {performersRanked.length > 5 && (
                  <button
                    onClick={() => setShowAllPerformers(v => !v)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 12, color: "#4f8ef7", fontWeight: 700,
                      display: "inline-flex", alignItems: "center", gap: 3,
                      fontFamily: "'Manrope',sans-serif", padding: 0,
                    }}
                  >
                    {showAllPerformers ? "Show Less ▲" : "View All ▼"}
                  </button>
                )}
              </div>

              <div style={{ marginTop: 10 }}>
                {(showAllPerformers ? performersRanked : performersRanked.slice(0, 5)).map((r, i) => {
                  const medal = ["🥇", "🥈", "🥉"][i];
                  const empId = r.employee_id?._id || r.employee_id;
                  const isMe = empId?.toString() === (employee?._id || employee?.id)?.toString();
                  const scoreColor = r.final_score >= 90 ? "#00c896" : r.final_score >= 75 ? "#4f8ef7" : r.final_score >= 60 ? "#f0a500" : "#f45b5b";
                  return (
                    <div key={r._id} className="ed-ann-row" style={isMe ? { background: "#eff6ff" } : {}}>
                      <div style={{ width: 26, textAlign: "center", fontSize: 14, fontWeight: 800, color: "#9ca3af", flexShrink: 0 }}>
                        {medal || `#${i + 1}`}
                      </div>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                        background: "#f0f4ff", border: "1px solid #c7d2fe",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, color: "#4f8ef7", fontSize: 12
                      }}>
                        {r.employee_id?.name?.charAt(0) || "?"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 1px", fontSize: 12, fontWeight: 700, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.employee_id?.name || "—"}{isMe ? " (You)" : ""}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.employee_id?.department || ""}
                        </p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor, flexShrink: 0 }}>
                        {r.final_score}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grade Card */}
          {employeeGrade && (
            <div className="ed-card" style={{ padding: "14px" }}>
              <p className="ed-card-title" style={{ padding: 0, marginBottom: 14 }}>
                <Medal size={12} /> My Grade Level
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ background: "#1a1a2e", color: "#fff", borderRadius: 12, padding: "10px 18px", fontSize: 26, fontWeight: 900, letterSpacing: "-1px", flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                  {employeeGrade.grade_id?.level}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#1a1d2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentSalaryBand?.posting || "—"}
                  </p>
                  {currentSalaryBand?.years_in_role && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                      <Calendar size={11} color="#6b7280" />
                      <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{currentSalaryBand.years_in_role}</p>
                    </div>
                  )}
                  {(currentSalaryBand?.salary_band_min || currentSalaryBand?.salary_band_mid || currentSalaryBand?.salary_band_max) && (
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {(() => {
                        const scalePoint = employeeGrade?.salary_scale_point;
                        const value = scalePoint === "min" ? currentSalaryBand?.salary_band_min : scalePoint === "mid" ? currentSalaryBand?.salary_band_mid : scalePoint === "max" ? currentSalaryBand?.salary_band_max : null;
                        const label = scalePoint === "min" ? "A" : scalePoint === "mid" ? "B" : scalePoint === "max" ? "C" : null;
                        const st = { min: { bg: "#ecfdf5", color: "#059669", border: "#6ee7b7" }, mid: { bg: "#eff6ff", color: "#2563eb", border: "#93c5fd" }, max: { bg: "#fff7ed", color: "#d97706", border: "#fcd34d" } }[scalePoint] || {};
                        return value && label ? (
                          <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, fontFamily: "'JetBrains Mono',monospace" }}>
                            Scale {label}: {fmt(value)}
                          </span>
                        ) : <span style={{ fontSize: 11, color: "#9ca3af" }}>Scale not assigned</span>;
                      })()}
                    </div>
                  )}
                </div>
              </div>
              {currentSalaryBand?.promotion_timeline && (
                <div style={{ margin: "12px 0 0", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Next promotion:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#f0fdf4", color: "#059669", border: "1px solid #6ee7b7", borderRadius: 6, padding: "2px 10px" }}>
                    <Timer size={11} color="#059669" />
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{currentSalaryBand.promotion_timeline}</span>
                  </div>
                </div>
              )}
              {currentSalaryBand?.notes && (
                <div style={{ display: "flex", gap: 8, margin: "10px 0 0", background: "#f8fafc", borderRadius: 8, padding: "10px 12px", borderLeft: "3px solid #3b82f6" }}>
                  <StickyNote size={13} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{currentSalaryBand.notes}</p>
                </div>
              )}
              {!currentSalaryBand && (
                <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>Salary band not configured for this level yet.</p>
              )}
              {careerLevels.length > 0 && careerIndex >= 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ background: "#f3f4f6", borderRadius: 99, height: 5, overflow: "hidden" }}>
                    <div style={{ width: `${careerPct}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #059669, #3b82f6, #f59e0b)", transition: "width .8s cubic-bezier(.4,0,.2,1)" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af", marginTop: 4, fontWeight: 600 }}>
                    <span>Level {careerIndex + 1} of {careerLevels.length}</span>
                    <span>{careerPct}% of career path</span>
                  </div>
                </div>
              )}
              <button className="ed-career-btn" onClick={() => setShowCareer(true)}>
                <ChevronRight size={15} /> View Career Path
              </button>
            </div>
          )}

          {/* Internal Job Opportunities Card */}
          {internalJobs.length > 0 && (
            <div className="ed-card" style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 0" }}>
                <p className="ed-card-title" style={{ padding: 0, margin: 0 }}>
                  <BadgeCheck size={12} /> Internal Opportunities
                </p>
                <span style={{
                  background: "#f5f3ff", color: "#7c3aed",
                  fontSize: 10, fontWeight: 700,
                  padding: "2px 9px", borderRadius: 99,
                  border: "1px solid #ddd6fe", whiteSpace: "nowrap"
                }}>
                  🔒 Employees only
                </span>
              </div>
              <div style={{
                margin: "12px 16px 0",
                background: "linear-gradient(120deg, #1a1d2e 0%, #252a45 100%)",
                borderRadius: 10, padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 10
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: "rgba(124,58,237,.25)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Users size={15} color="#a78bfa" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: "0 0 1px", fontSize: 12, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    Radnus Retail Expansion
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,.45)" }}>
                    {internalJobs.length} open position{internalJobs.length > 1 ? "s" : ""} — grow your career within Radnus
                  </p>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                {internalJobs.map((job, i) => (
                  <InternalJobRow
                    key={job._id || i}
                    job={job}
                    employeeId={employee?._id || employee?.id}
                    apiBase={API_BASE}
                    onApplySuccess={markJobApplied}
                    onWithdrawSuccess={markJobWithdrawn}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Job Toast Notifications */}
      {toastQueue.length > 0 && toastIndex < toastQueue.length && (
        <JobToastNotification
          key={`${toastQueue[toastIndex]._id || toastIndex}-${toastIndex}`}
          job={toastQueue[toastIndex]}
          employeeId={employee?._id || employee?.id}
          apiBase={API_BASE}
          initialApplied={toastQueue[toastIndex].applicants?.some((a) => {
            const appEmpId = a.employeeId?._id || a.employeeId;
            return appEmpId?.toString() === (employee?._id || employee?.id)?.toString();
          })}
          onDismiss={() => {
            setTimeout(() => setToastIndex(i => i + 1), 400);
          }}
          onApplySuccess={markJobApplied}
        />
      )}

      <CareerPathModal
        open={showCareer}
        onClose={() => setShowCareer(false)}
        employeeGrade={employeeGrade}
        deptBands={deptBands}
        department={employee?.department}
      />

    </EmployeeLayout>
  );
}