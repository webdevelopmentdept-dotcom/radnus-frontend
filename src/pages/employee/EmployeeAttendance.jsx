import React, { useState, useEffect } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const getToken = () =>
  localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken");

const pad  = (n) => String(n).padStart(2, "0");
const fmt  = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtD = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const todayStr = () => new Date().toISOString().split("T")[0];

const STATUS_META = {
  present:  { label: "Present",  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  absent:   { label: "Absent",   color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  late:     { label: "Late",     color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  half_day: { label: "Half Day", color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },
  leave:    { label: "On Leave", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  holiday:  { label: "Holiday",  color: "#be185d", bg: "#fdf2f8", border: "#f9a8d4" },
  weekend:  { label: "Weekend",  color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
};

const LEAVE_TYPES = [
  "Casual Leave", "Sick Leave", "Annual Leave",
  "Maternity Leave", "Paternity Leave", "Loss of Pay",
];

/* ── Live Clock ── */
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontSize: "clamp(40px, 8vw, 60px)",
        fontWeight: 200,
        color: "#fff",
        letterSpacing: -3,
        lineHeight: 1,
        fontFamily: "'DM Mono', 'Courier New', monospace",
      }}>
        {pad(time.getHours())}:{pad(time.getMinutes())}
        <span style={{ fontSize: "clamp(22px, 4vw, 30px)", opacity: 0.35 }}>:{pad(time.getSeconds())}</span>
      </div>
      <div style={{
        fontSize: 11,
        color: "rgba(255,255,255,0.35)",
        marginTop: 10,
        fontWeight: 500,
        letterSpacing: 2,
        textTransform: "uppercase",
      }}>
        {time.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </div>
    </div>
  );
}

/* ── Attendance Calendar ── */
function AttendanceCalendar({ records, year, month, onMonthChange }) {
  const daysInMonth    = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const recordMap      = {};
  records.forEach((r) => { recordMap[new Date(r.date).toISOString().split("T")[0]] = r; });

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthName = new Date(year, month).toLocaleString("en-IN", { month: "long", year: "numeric" });
  const dayNames  = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button onClick={() => onMonthChange(-1)} style={calNavBtn}>‹</button>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#111827", letterSpacing: -0.3 }}>{monthName}</span>
        <button onClick={() => onMonthChange(1)}  style={calNavBtn}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 4 }}>
        {dayNames.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#9ca3af", padding: "2px 0", letterSpacing: 0.5 }}>{d}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const rec     = recordMap[dateStr];
          const dow     = new Date(year, month, day).getDay();
          const isToday = dateStr === todayStr();
          const status  = rec?.status || (dow === 0 || dow === 6 ? "weekend" : null);
          const meta    = status ? STATUS_META[status] : null;
          return (
            <div
              key={day}
              title={meta?.label}
              style={{
                borderRadius: 8,
                padding: "7px 2px 5px",
                textAlign: "center",
                background: isToday ? "#111827" : meta ? meta.bg : "transparent",
                border: `1px solid ${isToday ? "#111827" : meta ? meta.border : "#f3f4f6"}`,
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? "#fff" : meta ? meta.color : "#d1d5db" }}>{day}</div>
              {meta && !isToday && (
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: meta.color, margin: "3px auto 0", opacity: 0.7 }} />
              )}
              {isToday && (
                <div style={{ fontSize: 7, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>TODAY</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        {Object.entries(STATUS_META).filter(([k]) => k !== "weekend").map(([k, m]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6b7280", fontWeight: 500 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.color }} />
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
}

const calNavBtn = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  width: 28,
  height: 28,
  borderRadius: 7,
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 700,
  color: "#374151",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

/* ── Leave Form Modal ── */
function LeaveForm({ onSubmit, onClose }) {
  const [form, setForm]     = useState({ leave_type: "Casual Leave", from_date: todayStr(), to_date: todayStr(), reason: "" });
  const [saving, setSaving] = useState(false);

  const days = Math.max(1, Math.floor((new Date(form.to_date) - new Date(form.from_date)) / 86400000) + 1);

  const handle = async () => {
    if (!form.reason.trim()) return alert("Please enter reason");
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9000, backdropFilter: "blur(6px)", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 18, width: "100%", maxWidth: 440,
          boxShadow: "0 32px 80px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto",
          animation: "slideUp 0.22s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div style={{ padding: "22px 22px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>Apply for Leave</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>Submit a leave request to HR</div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", fontSize: 18, color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Leave Type</label>
            <select value={form.leave_type} onChange={(e) => setForm(f => ({ ...f, leave_type: e.target.value }))} style={inputStyle}>
              {LEAVE_TYPES.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>From Date</label>
              <input type="date" value={form.from_date} min={todayStr()} onChange={(e) => setForm(f => ({ ...f, from_date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>To Date</label>
              <input type="date" value={form.to_date} min={form.from_date} onChange={(e) => setForm(f => ({ ...f, to_date: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Reason</label>
            <textarea rows={3} placeholder="Brief reason for leave..." value={form.reason} onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "11px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Duration</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{days} day{days > 1 ? "s" : ""}</span>
          </div>
        </div>

        <div style={{ padding: "0 22px 22px", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...outlineBtn, flex: 1 }}>Cancel</button>
          <button onClick={handle} disabled={saving} style={{ ...primaryBtn, flex: 2 }}>{saving ? "Submitting..." : "Submit Request"}</button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 6, letterSpacing: 0.4, textTransform: "uppercase" };
const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 13, outline: "none", fontFamily: "inherit", color: "#111827", background: "#fff", boxSizing: "border-box", transition: "border-color 0.15s" };
const primaryBtn = { padding: "12px 20px", borderRadius: 10, border: "none", background: "#111827", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", letterSpacing: -0.2 };
const outlineBtn = { padding: "12px 20px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" };

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function EmployeeAttendance() {
  const [employee,          setEmployee]          = useState(null);
  const [todayRecord,       setTodayRecord]       = useState(null);
  const [records,           setRecords]           = useState([]);
  const [leaves,            setLeaves]            = useState([]);
  const [summary,           setSummary]           = useState({});
  const [loading,           setLoading]           = useState(true);
  const [checkInLoading,    setCheckInLoading]    = useState(false);
  const [checkOutLoading,   setCheckOutLoading]   = useState(false);
  const [breakStartLoading, setBreakStartLoading] = useState(false);
  const [breakEndLoading,   setBreakEndLoading]   = useState(false);
  const [showLeaveForm,     setShowLeaveForm]     = useState(false);
  const [toast,             setToast]             = useState(null);
  const [activeTab,         setActiveTab]         = useState("today");
  const [calYear,           setCalYear]           = useState(new Date().getFullYear());
  const [calMonth,          setCalMonth]          = useState(new Date().getMonth());

  const empId = localStorage.getItem("employeeId");

  useEffect(() => {
    if (!empId) { window.location.href = "/login"; return; }
    fetchAll();
  }, []);

  useEffect(() => { if (empId) fetchRecords(); }, [calYear, calMonth]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

  const fetchAll = async () => {
    try {
      const [empRes, todayRes, summaryRes, leavesRes] = await Promise.allSettled([
        axios.get(`${API_BASE}/api/employee/me/${empId}`,             { headers: authHeader() }),
        axios.get(`${API_BASE}/api/attendance/today/${empId}`,        { headers: authHeader() }),
        axios.get(`${API_BASE}/api/attendance/summary/${empId}`,      { headers: authHeader() }),
        axios.get(`${API_BASE}/api/leave-requests/employee/${empId}`, { headers: authHeader() }),
      ]);
      if (empRes.status     === "fulfilled") setEmployee(empRes.value.data);
      if (todayRes.status   === "fulfilled") setTodayRecord(todayRes.value.data?.data || null);
      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value.data?.data   || {});
      if (leavesRes.status  === "fulfilled") setLeaves(leavesRes.value.data?.data     || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchRecords = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/attendance/monthly/${empId}?year=${calYear}&month=${calMonth + 1}`,
        { headers: authHeader() }
      );
      setRecords(res.data?.data || []);
    } catch (e) { console.error(e); }
  };

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/attendance/check-in`,
        { employee_id: empId, method: "manual" },
        { headers: authHeader() }
      );
      setTodayRecord(res.data?.data);
      showToast("Checked in successfully ✓");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Check-in failed", "error");
    } finally { setCheckInLoading(false); }
  };

  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/attendance/check-out`,
        { employee_id: empId, method: "manual" },
        { headers: authHeader() }
      );
      setTodayRecord(res.data?.data);
      showToast("Checked out successfully ✓");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Check-out failed", "error");
    } finally { setCheckOutLoading(false); }
  };

  const handleBreakStart = async () => {
    setBreakStartLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/attendance/break-start`, { employee_id: empId }, { headers: authHeader() });
      setTodayRecord(res.data?.data);
      showToast("Lunch break started");
    } catch (err) { showToast(err.response?.data?.message || "Break start failed", "error"); }
    finally { setBreakStartLoading(false); }
  };

  const handleBreakEnd = async () => {
    setBreakEndLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/attendance/break-end`, { employee_id: empId }, { headers: authHeader() });
      setTodayRecord(res.data?.data);
      showToast("Break ended. Welcome back!");
    } catch (err) { showToast(err.response?.data?.message || "Break end failed", "error"); }
    finally { setBreakEndLoading(false); }
  };

  const handleLeaveSubmit = async (form) => {
    try {
      await axios.post(
        `${API_BASE}/api/leave-requests`,
        { employee_id: empId, employee_name: employee?.name, department: employee?.department, ...form },
        { headers: authHeader() }
      );
      showToast("Leave request submitted ✓");
      setShowLeaveForm(false);
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || "Submission failed", "error"); }
  };

  const handleMonthChange = (dir) => {
    let m = calMonth + dir, y = calYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setCalMonth(m); setCalYear(y);
  };

  // ─────────────────────────────────────────────────────────────
  // ✅ HYBRID FIX: treat status "present" or "late" as checked-in
  // even when checkIn timestamp is missing (auto attendance case)
  // ─────────────────────────────────────────────────────────────
  const autoMarked     = ["present", "late"].includes(todayRecord?.status);
  const hasCheckedIn   = !!todayRecord?.checkIn  || autoMarked;
  const hasCheckedOut  = !!todayRecord?.checkOut;
  const isCheckedIn    = hasCheckedIn && !hasCheckedOut;
  const isOnBreak      = !!todayRecord?.breakStart && !todayRecord?.breakEnd;
  const canBreak       = isCheckedIn; // ✅ now works for auto-marked too

  // ✅ Safe workHours — handles missing checkIn (auto case)
  const workHours = (() => {
    if (todayRecord?.checkIn && todayRecord?.checkOut) {
      const d = (new Date(todayRecord.checkOut) - new Date(todayRecord.checkIn)) / 3600000;
      return `${Math.floor(d)}h ${pad(Math.round((d % 1) * 60))}m`;
    }
    if (isCheckedIn) return "In progress";
    return "—";
  })();

  // ✅ Method badge label
  const methodLabel = todayRecord?.method
    ? todayRecord.method === "auto" ? "Auto" : todayRecord.method === "hr_manual" ? "HR" : "Manual"
    : autoMarked ? "Auto" : "—";

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f9fafb" }}>
      <div style={{ width: 28, height: 28, border: "2px solid #e5e7eb", borderTopColor: "#111827", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const SUMMARY_CARDS = [
    { label: "Present",   value: summary.present   || 0, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    { label: "Absent",    value: summary.absent    || 0, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
    { label: "Late",      value: summary.late      || 0, color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
    { label: "On Leave",  value: summary.onLeave   || 0, color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
    { label: "Half Day",  value: summary.halfDay   || 0, color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },
    { label: "Work Days", value: summary.totalDays || 0, color: "#374151", bg: "#f9fafb", border: "#e5e7eb" },
  ];

  const TABS = [
    { id: "today",    label: "Today"    },
    { id: "calendar", label: "Calendar" },
    { id: "history",  label: "History"  },
    { id: "leaves",   label: `Leaves${leaves.length ? ` (${leaves.length})` : ""}` },
  ];

  return (
    <EmployeeLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ea-root { font-family: 'DM Sans', sans-serif; background: #f8f9fb; min-height: 100vh; }

        .ea-topbar {
          background: #fff; border-bottom: 1px solid #f0f0f0;
          padding: 12px 20px; position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; gap: 12px;
        }
        @media (min-width: 768px) { .ea-topbar { padding: 14px 28px; } }

        .ea-page { padding: 16px; }
        @media (min-width: 768px) { .ea-page { padding: 24px 28px; } }

        .stat-row {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 8px; margin-bottom: 18px;
        }
        @media (min-width: 768px) {
          .stat-row { grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 22px; }
        }

        .ea-tabs {
          display: flex; overflow-x: auto; -webkit-overflow-scrolling: touch;
          scrollbar-width: none; border-bottom: 1px solid #f0f0f0; margin-bottom: 20px; gap: 0;
        }
        .ea-tabs::-webkit-scrollbar { display: none; }
        @media (min-width: 768px) { .ea-tabs { margin-bottom: 24px; } }

        .ea-tab {
          border: none; background: none; padding: 10px 14px; font-weight: 600;
          font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif;
          border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap;
          transition: color 0.15s, border-color 0.15s; color: #9ca3af; letter-spacing: -0.1px;
        }
        .ea-tab.active { color: #111827; border-bottom-color: #111827; }

        .today-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 768px) {
          .today-grid { grid-template-columns: minmax(0,2fr) minmax(0,3fr); gap: 18px; }
        }

        .clock-panel {
          background: #0d1117; border-radius: 16px; padding: 26px 20px 22px;
          display: flex; flex-direction: column; align-items: center; gap: 16px;
          position: relative; overflow: hidden;
        }
        .clock-panel::before {
          content: ''; position: absolute; top: -40px; right: -40px;
          width: 180px; height: 180px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        @media (min-width: 768px) { .clock-panel { padding: 36px 28px 30px; gap: 20px; } }

        .time-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%; }

        .ea-action-btn {
          width: 100%; padding: 12px; border-radius: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif; letter-spacing: -0.2px;
          transition: all 0.15s; border: none; text-align: center;
        }
        .ea-action-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .ea-action-btn:hover:not(:disabled) { filter: brightness(0.9); transform: translateY(-1px); }
        .ea-action-btn:active:not(:disabled) { transform: translateY(0); }

        .detail-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 16px; overflow: hidden; }
        .detail-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 20px; border-bottom: 1px solid #f9fafb; gap: 12px;
        }
        .detail-row:last-child { border-bottom: none; }

        .calendar-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 768px) {
          .calendar-grid { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 18px; }
        }

        .history-cards { display: flex; flex-direction: column; gap: 10px; }
        .history-table-wrap { display: none; }
        @media (min-width: 768px) {
          .history-cards { display: none; }
          .history-table-wrap { display: block; overflow-x: auto; }
        }

        .ea-card { background: #fff; border: 1px solid #f0f0f0; border-radius: 16px; }

        .ea-toast {
          position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
          z-index: 9999; padding: 11px 18px; border-radius: 10px; font-weight: 600;
          font-size: 13px; display: flex; align-items: center; gap: 8px;
          white-space: nowrap; box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          animation: toastIn 0.2s ease;
        }

        /* ✅ Auto badge pill */
        .method-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 20px; font-size: 10px;
          font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
        }
      `}</style>

      <div className="ea-root">

        {/* ── Topbar ── */}
        <header className="ea-topbar">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>Attendance</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          {employee && (
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%", background: "#111827",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {employee.name?.charAt(0)}
              </div>
            </div>
          )}
        </header>

        {/* ── Toast ── */}
        {toast && (
          <div className="ea-toast" style={{ background: toast.type === "error" ? "#dc2626" : "#111827", color: "#fff" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: toast.type === "error" ? "#fca5a5" : "#6ee7b7" }} />
            {toast.msg}
          </div>
        )}

        {/* ── Leave Modal ── */}
        {showLeaveForm && <LeaveForm onSubmit={handleLeaveSubmit} onClose={() => setShowLeaveForm(false)} />}

        <div className="ea-page">

          {/* ── Summary stat cards ── */}
          <div className="stat-row">
            {SUMMARY_CARDS.map((c) => (
              <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: "13px 12px" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: c.color, lineHeight: 1, fontFamily: "'DM Mono', monospace", letterSpacing: -1 }}>{c.value}</div>
                <div style={{ fontSize: 11, color: c.color, fontWeight: 500, marginTop: 5, opacity: 0.75 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div className="ea-tabs">
            {TABS.map((t) => (
              <button key={t.id} className={`ea-tab${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ════════════ TODAY TAB ════════════ */}
          {activeTab === "today" && (
            <div className="today-grid">

              {/* Clock / Action panel */}
              <div className="clock-panel">
                <LiveClock />

                {/* Status badge */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center",
                }}>
                  <div style={{
                    padding: "5px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    letterSpacing: 0.8, textTransform: "uppercase",
                    background: hasCheckedOut ? "rgba(110,231,183,0.1)" : isCheckedIn ? "rgba(253,230,138,0.1)" : "rgba(252,165,165,0.1)",
                    color: hasCheckedOut ? "#6ee7b7" : isCheckedIn ? "#fde68a" : "#fca5a5",
                    border: `1px solid ${hasCheckedOut ? "rgba(110,231,183,0.2)" : isCheckedIn ? "rgba(253,230,138,0.2)" : "rgba(252,165,165,0.2)"}`,
                  }}>
                    {hasCheckedOut ? "Day Complete" : isCheckedIn ? "Checked In" : "Not Checked In"}
                  </div>

                  {/* ✅ Method badge — shows Auto / Manual / HR */}
                  {todayRecord && (
                    <span
                      className="method-badge"
                      style={{
                        background: autoMarked && !todayRecord?.checkIn
                          ? "rgba(99,102,241,0.12)"
                          : "rgba(255,255,255,0.07)",
                        color: autoMarked && !todayRecord?.checkIn
                          ? "#818cf8"
                          : "rgba(255,255,255,0.35)",
                        border: `1px solid ${autoMarked && !todayRecord?.checkIn ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      {autoMarked && !todayRecord?.checkIn ? "🤖" : "✋"} {methodLabel}
                    </span>
                  )}
                </div>

                {/* ✅ Auto-marked info banner */}
                {autoMarked && !todayRecord?.checkIn && !hasCheckedOut && (
                  <div style={{
                    width: "100%",
                    background: "rgba(99,102,241,0.07)",
                    border: "1px solid rgba(99,102,241,0.15)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 11,
                    color: "rgba(160,165,255,0.85)",
                    fontWeight: 500,
                    textAlign: "center",
                    lineHeight: 1.5,
                  }}>
                    Auto-marked Present · Use <strong>Check Out</strong> button when leaving
                  </div>
                )}

                {/* Time stats row — show when checkIn exists OR auto-marked */}
                {hasCheckedIn && (
                  <div className="time-stats">
                    {[
                      { label: "In",    value: todayRecord?.checkIn ? fmt(todayRecord.checkIn) : "Auto" },
                      { label: "Out",   value: fmt(todayRecord?.checkOut) },
                      { label: "Hours", value: workHours },
                    ].map((s) => (
                      <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Break info */}
                {hasCheckedIn && todayRecord?.breakStart && (
                  <div style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: "9px 14px", fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                    {isOnBreak
                      ? `Break started · ${fmt(todayRecord.breakStart)}`
                      : `Break · ${fmt(todayRecord.breakStart)} – ${fmt(todayRecord.breakEnd)} · ${todayRecord.break_minutes || 0} min`}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>

                    {/* ✅ FIXED BUTTON LOGIC */}
                    {!hasCheckedIn ? (
                      /* Not checked in at all → show Check In */
                      <button
                        className="ea-action-btn"
                        onClick={handleCheckIn}
                        disabled={checkInLoading}
                        style={{ background: "#fff", color: "#111827" }}
                      >
                        {checkInLoading ? "Checking in…" : "Check In"}
                      </button>
                    ) : !hasCheckedOut ? (
                      /* Checked in (manual or auto) but not checked out → show Check Out */
                      <button
                        className="ea-action-btn"
                        onClick={handleCheckOut}
                        disabled={checkOutLoading || isOnBreak}
                        title={isOnBreak ? "End your break first" : ""}
                        style={{
                          background: isOnBreak ? "rgba(255,255,255,0.06)" : "rgba(252,165,165,0.13)",
                          color: isOnBreak ? "rgba(255,255,255,0.25)" : "#fca5a5",
                          border: `1px solid ${isOnBreak ? "rgba(255,255,255,0.07)" : "rgba(252,165,165,0.2)"}`,
                        }}
                      >
                        {checkOutLoading ? "Checking out…" : "Check Out"}
                      </button>
                    ) : (
                      /* Both done → Day Completed */
                      <div
                        className="ea-action-btn"
                        style={{ background: "rgba(110,231,183,0.07)", color: "rgba(110,231,183,0.45)", border: "1px solid rgba(110,231,183,0.1)", cursor: "default" }}
                      >
                        Day Completed ✓
                      </div>
                    )}

                    {/* Leave shortcut */}
                    <button
                      onClick={() => setShowLeaveForm(true)}
                      style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.45)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 13, whiteSpace: "nowrap", transition: "all 0.15s" }}
                    >
                      Leave
                    </button>
                  </div>

                  {/* ✅ Break buttons — now works for auto-marked employees too */}
                  {canBreak && !hasCheckedOut && (
                    !todayRecord?.breakStart ? (
                      <button
                        className="ea-action-btn"
                        onClick={handleBreakStart}
                        disabled={breakStartLoading}
                        style={{ background: "rgba(253,230,138,0.07)", color: "rgba(253,230,138,0.65)", border: "1px solid rgba(253,230,138,0.14)", fontSize: 13 }}
                      >
                        {breakStartLoading ? "Starting…" : "☕  Start Lunch Break"}
                      </button>
                    ) : isOnBreak ? (
                      <button
                        className="ea-action-btn"
                        onClick={handleBreakEnd}
                        disabled={breakEndLoading}
                        style={{ background: "rgba(110,231,183,0.07)", color: "rgba(110,231,183,0.65)", border: "1px solid rgba(110,231,183,0.14)", fontSize: 13 }}
                      >
                        {breakEndLoading ? "Ending…" : "End Lunch Break"}
                      </button>
                    ) : (
                      <div
                        className="ea-action-btn"
                        style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.05)", cursor: "default", fontSize: 13 }}
                      >
                        Break done · {todayRecord.break_minutes || 0} min
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Today's details card */}
              <div className="detail-card">
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0", fontSize: 14, fontWeight: 700, color: "#111827", letterSpacing: -0.2 }}>
                  Today's Details
                </div>
                {[
                  { label: "Date",        value: new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
                  { label: "Status",      value: todayRecord?.status ? STATUS_META[todayRecord.status]?.label : "Not marked", isStatus: true, status: todayRecord?.status },
                  // ✅ Show "Auto" label when checkIn is missing but auto-marked
                  { label: "Check In",    value: todayRecord?.checkIn ? fmt(todayRecord.checkIn) : autoMarked ? "Auto (no timestamp)" : "—" },
                  { label: "Check Out",   value: fmt(todayRecord?.checkOut) },
                  { label: "Break Start", value: fmt(todayRecord?.breakStart) },
                  { label: "Break End",   value: fmt(todayRecord?.breakEnd) },
                  { label: "Break Dur.",  value: todayRecord?.break_minutes ? `${todayRecord.break_minutes} min` : "—" },
                  { label: "Work Hours",  value: workHours },
                  { label: "Method",      value: methodLabel },
                  { label: "Shift",       value: todayRecord?.shift || "General" },
                  { label: "HR Remark",   value: todayRecord?.remark || "—" },
                ].map(({ label, value, isStatus, status }) => (
                  <div key={label} className="detail-row">
                    <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, flexShrink: 0 }}>{label}</span>
                    {isStatus && status ? (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: STATUS_META[status]?.bg, color: STATUS_META[status]?.color, border: `1px solid ${STATUS_META[status]?.border}` }}>
                        {STATUS_META[status]?.label}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", textAlign: "right" }}>{value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════ CALENDAR TAB ════════════ */}
          {activeTab === "calendar" && (
            <div className="calendar-grid">
              <div className="ea-card" style={{ padding: 20 }}>
                <AttendanceCalendar records={records} year={calYear} month={calMonth} onMonthChange={handleMonthChange} />
              </div>
              <div className="ea-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16, letterSpacing: -0.2 }}>
                  {new Date(calYear, calMonth).toLocaleString("en-IN", { month: "long" })} Summary
                </div>
                {(() => {
                  const counts = {};
                  records.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
                  return Object.entries(STATUS_META).map(([key, meta]) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f9fafb" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: meta.color }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{meta.label}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: meta.color, fontFamily: "'DM Mono', monospace" }}>{counts[key] || 0}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* ════════════ HISTORY TAB ════════════ */}
          {activeTab === "history" && (
            <div className="ea-card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Attendance History</div>
                <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{records.length} records</span>
              </div>

              {records.length === 0 ? (
                <div style={{ textAlign: "center", padding: "52px 0", color: "#d1d5db" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>No records for this month</p>
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="history-cards" style={{ padding: "12px 14px" }}>
                    {[...records].sort((a, b) => new Date(b.date) - new Date(a.date)).map((r, i) => {
                      const meta = STATUS_META[r.status];
                      const hrs = r.checkIn && r.checkOut
                        ? (() => { const d = (new Date(r.checkOut) - new Date(r.checkIn)) / 3600000; return `${Math.floor(d)}h ${pad(Math.round((d % 1) * 60))}m`; })()
                        : "—";
                      return (
                        <div key={i} style={{ border: "1px solid #f0f0f0", borderRadius: 12, padding: "14px", background: "#fafafa" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{fmtD(r.date)}</div>
                              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{new Date(r.date).toLocaleString("en-IN", { weekday: "long" })}</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                              {meta && (
                                <span style={{ background: meta.bg, color: meta.color, padding: "3px 10px", borderRadius: 20, fontWeight: 700, fontSize: 11, border: `1px solid ${meta.border}` }}>
                                  {meta.label}
                                </span>
                              )}
                              {/* ✅ Method badge in history */}
                              {r.method && (
                                <span style={{ fontSize: 9, color: r.method === "auto" ? "#818cf8" : "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                  {r.method === "auto" ? "🤖 Auto" : r.method === "hr_manual" ? "HR" : "Manual"}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
                            {[
                              { label: "In",    value: r.checkIn ? fmt(r.checkIn) : r.status === "present" ? "Auto" : "—", color: "#16a34a" },
                              { label: "Out",   value: fmt(r.checkOut), color: "#dc2626" },
                              { label: "Hours", value: hrs,             color: "#111827" },
                            ].map((s) => (
                              <div key={s.label} style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                              </div>
                            ))}
                          </div>
                          {r.remark && <div style={{ marginTop: 8, fontSize: 11, color: "#6b7280", fontStyle: "italic" }}>"{r.remark}"</div>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop table */}
                  <div className="history-table-wrap">
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f9fafb" }}>
                          {["Date", "Day", "Status", "Check In", "Check Out", "Break", "Work Hours", "Method", "Remark"].map((h) => (
                            <th key={h} style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, letterSpacing: 0.6, padding: "10px 16px", textAlign: "left", whiteSpace: "nowrap", textTransform: "uppercase", borderBottom: "1px solid #f0f0f0" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...records].sort((a, b) => new Date(b.date) - new Date(a.date)).map((r, i) => {
                          const meta = STATUS_META[r.status];
                          const hrs = r.checkIn && r.checkOut
                            ? (() => { const d = (new Date(r.checkOut) - new Date(r.checkIn)) / 3600000; return `${Math.floor(d)}h ${pad(Math.round((d % 1) * 60))}m`; })()
                            : "—";
                          return (
                            <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}>
                              <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>{fmtD(r.date)}</td>
                              <td style={{ padding: "12px 16px", color: "#9ca3af", fontWeight: 500 }}>{new Date(r.date).toLocaleString("en-IN", { weekday: "short" })}</td>
                              <td style={{ padding: "12px 16px" }}>
                                {meta && <span style={{ background: meta.bg, color: meta.color, padding: "3px 10px", borderRadius: 20, fontWeight: 700, fontSize: 11, border: `1px solid ${meta.border}` }}>{meta.label}</span>}
                              </td>
                              {/* ✅ Show "Auto" in history table when checkIn missing */}
                              <td style={{ padding: "12px 16px", color: "#16a34a", fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
                                {r.checkIn ? fmt(r.checkIn) : r.status === "present" || r.status === "late" ? <span style={{ color: "#818cf8", fontSize: 11 }}>Auto</span> : "—"}
                              </td>
                              <td style={{ padding: "12px 16px", color: "#dc2626", fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{fmt(r.checkOut)}</td>
                              <td style={{ padding: "12px 16px", color: "#b45309", fontWeight: 600 }}>{r.break_minutes ? `${r.break_minutes}m` : "—"}</td>
                              <td style={{ padding: "12px 16px", color: "#111827", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{hrs}</td>
                              <td style={{ padding: "12px 16px", color: r.method === "auto" ? "#818cf8" : "#9ca3af", fontWeight: r.method === "auto" ? 700 : 400, textTransform: "capitalize" }}>
                                {r.method === "auto" ? "🤖 Auto" : r.method || "—"}
                              </td>
                              <td style={{ padding: "12px 16px", color: "#9ca3af", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.remark || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════════════ LEAVES TAB ════════════ */}
          {activeTab === "leaves" && (
            <div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                <button onClick={() => setShowLeaveForm(true)} style={{ ...primaryBtn, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  + Apply for Leave
                </button>
              </div>

              {leaves.length === 0 ? (
                <div className="ea-card" style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🗓️</div>
                  <div style={{ fontSize: 14, color: "#d1d5db", fontWeight: 600 }}>No leave requests yet</div>
                  <div style={{ fontSize: 12, color: "#e5e7eb", marginTop: 4 }}>Your leave history will appear here</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...leaves].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((l, i) => {
                    const isApproved = l.status === "approved";
                    const isRejected = l.status === "rejected";
                    const sc = isApproved ? "#16a34a" : isRejected ? "#dc2626" : "#b45309";
                    const sb = isApproved ? "#f0fdf4" : isRejected ? "#fef2f2" : "#fffbeb";
                    const sborder = isApproved ? "#bbf7d0" : isRejected ? "#fecaca" : "#fde68a";
                    const days = Math.floor((new Date(l.to_date) - new Date(l.from_date)) / 86400000) + 1;
                    return (
                      <div key={i} className="ea-card" style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{l.leave_type}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sb, color: sc, border: `1px solid ${sborder}`, letterSpacing: 0.5 }}>
                                {(l.status || "pending").toUpperCase()}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>
                              <span>{fmtD(l.from_date)} → {fmtD(l.to_date)}</span>
                              <span style={{ fontWeight: 600, color: "#374151" }}>{days} day{days > 1 ? "s" : ""}</span>
                            </div>
                            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 5 }}>{l.reason}</div>
                            {l.hr_remark && <div style={{ marginTop: 7, fontSize: 12, color: "#0369a1", fontWeight: 500 }}>HR Note: {l.hr_remark}</div>}
                          </div>
                          <span style={{ fontSize: 11, color: "#d1d5db", fontWeight: 500, flexShrink: 0 }}>Applied {fmtD(l.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </EmployeeLayout>
  );
}