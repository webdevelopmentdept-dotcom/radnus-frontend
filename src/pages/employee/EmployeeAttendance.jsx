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
      <div style={{ fontSize: "clamp(36px, 8vw, 56px)", fontWeight: 300, color: "#fff", letterSpacing: -3, lineHeight: 1, fontFamily: "'DM Mono', 'Courier New', monospace" }}>
        {pad(time.getHours())}:{pad(time.getMinutes())}
        <span style={{ fontSize: "clamp(22px, 5vw, 32px)", opacity: 0.6 }}>:{pad(time.getSeconds())}</span>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase" }}>
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
        <span style={{ fontWeight: 700, fontSize: 15, color: "#111827", letterSpacing: -0.3 }}>{monthName}</span>
        <button onClick={() => onMonthChange(1)}  style={calNavBtn}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
        {dayNames.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9ca3af", padding: "3px 0", letterSpacing: 0.5 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const rec     = recordMap[dateStr];
          const dow     = new Date(year, month, day).getDay();
          const isToday = dateStr === todayStr();
          const status  = rec?.status || (dow === 0 || dow === 6 ? "weekend" : null);
          const meta    = status ? STATUS_META[status] : null;
          return (
            <div key={day} title={meta?.label} style={{
              borderRadius: 8, padding: "6px 2px", textAlign: "center",
              background: isToday ? "#111827" : meta ? meta.bg : "#fff",
              border: `1px solid ${isToday ? "#111827" : meta ? meta.border : "#f3f4f6"}`,
              transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? "#fff" : meta ? meta.color : "#d1d5db" }}>{day}</div>
              {meta && !isToday && <div style={{ width: 4, height: 4, borderRadius: "50%", background: meta.color, margin: "3px auto 0", opacity: 0.7 }} />}
              {isToday && <div style={{ fontSize: 7, color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>TODAY</div>}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
        {Object.entries(STATUS_META).filter(([k]) => k !== "weekend").map(([k, m]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280", fontWeight: 500 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: m.color }} />
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
}

const calNavBtn = {
  background: "#f9fafb", border: "1px solid #e5e7eb", width: 30, height: 30,
  borderRadius: 6, cursor: "pointer", fontSize: 16, fontWeight: 600, color: "#374151",
  display: "flex", alignItems: "center", justifyContent: "center",
};

/* ── Leave Form ── */
function LeaveForm({ onSubmit, onClose }) {
  const [form, setForm]     = useState({ leave_type: "Casual Leave", from_date: todayStr(), to_date: todayStr(), reason: "" });
  const [saving, setSaving] = useState(false);
  const days = Math.max(1, Math.floor((new Date(form.to_date) - new Date(form.from_date)) / 86400000) + 1);

  const handle = async () => {
    if (!form.reason.trim()) return alert("Please enter reason");
    setSaving(true); await onSubmit(form); setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000, backdropFilter: "blur(4px)", padding: "16px" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "24px 20px", width: "100%", maxWidth: 440, boxShadow: "0 24px 80px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#111827" }}>Apply for Leave</h5>
            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Submit a leave request</p>
          </div>
          <button onClick={onClose} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", width: 32, height: 32, borderRadius: 8, fontSize: 18, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {[
          { label: "Leave Type", node: (
            <select value={form.leave_type} onChange={(e) => setForm(f => ({ ...f, leave_type: e.target.value }))} style={inputStyle}>
              {LEAVE_TYPES.map(l => <option key={l}>{l}</option>)}
            </select>
          )},
          { label: "From Date", node: <input type="date" value={form.from_date} min={todayStr()} onChange={(e) => setForm(f => ({ ...f, from_date: e.target.value }))} style={inputStyle} /> },
          { label: "To Date",   node: <input type="date" value={form.to_date} min={form.from_date} onChange={(e) => setForm(f => ({ ...f, to_date: e.target.value }))} style={inputStyle} /> },
          { label: "Reason",    node: <textarea rows={3} placeholder="Brief reason for leave..." value={form.reason} onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))} style={{ ...inputStyle, resize: "vertical" }} /> },
        ].map(({ label, node }) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, letterSpacing: 0.3 }}>{label}</label>
            {node}
          </div>
        ))}

        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Duration</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{days} day{days > 1 ? "s" : ""}</span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...outlineBtn, flex: 1 }}>Cancel</button>
          <button onClick={handle} disabled={saving} style={{ ...primaryBtn, flex: 2 }}>
            {saving ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8,
  fontSize: 13, outline: "none", fontFamily: "inherit", color: "#111827", background: "#fff",
  boxSizing: "border-box",
};
const primaryBtn = {
  padding: "11px 20px", borderRadius: 8, border: "none", background: "#111827",
  color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
};
const outlineBtn = {
  padding: "11px 20px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff",
  color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
};

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
      const res = await axios.post(`${API_BASE}/api/attendance/check-in`, { employee_id: empId, method: "manual" }, { headers: authHeader() });
      setTodayRecord(res.data?.data);
      showToast("Checked in successfully");
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || "Check-in failed", "error"); }
    finally { setCheckInLoading(false); }
  };

  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/attendance/check-out`, { employee_id: empId }, { headers: authHeader() });
      setTodayRecord(res.data?.data);
      showToast("Checked out successfully");
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || "Check-out failed", "error"); }
    finally { setCheckOutLoading(false); }
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
      showToast("Break ended. Welcome back.");
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
      showToast("Leave request submitted");
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

  const hasCheckedIn  = !!todayRecord?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOut;
  const isCheckedIn   = hasCheckedIn && !hasCheckedOut;
  const isOnBreak     = !!todayRecord?.breakStart && !todayRecord?.breakEnd;
  const canBreak      = isCheckedIn;

  const workHours = todayRecord?.checkIn && todayRecord?.checkOut
    ? (() => {
        const d = (new Date(todayRecord.checkOut) - new Date(todayRecord.checkIn)) / 3600000;
        return `${Math.floor(d)}h ${pad(Math.round((d % 1) * 60))}m`;
      })()
    : isCheckedIn ? "In progress" : "—";

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f9fafb" }}>
      <div style={{ width: 32, height: 32, border: "2px solid #e5e7eb", borderTopColor: "#111827", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        .ea-card { background: #fff; border: 1px solid #f3f4f6; border-radius: 12px; }
        .ea-action-btn {
          width: 100%; padding: 13px; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; letter-spacing: -0.2px;
          transition: all 0.15s; border: none;
        }
        .ea-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ea-action-btn:hover:not(:disabled) { filter: brightness(0.93); transform: translateY(-1px); }

        .ea-tab {
          border: none; background: none; padding: 10px 12px;
          font-weight: 600; font-size: 13px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; margin-bottom: -1px;
          transition: all 0.15s; white-space: nowrap;
        }

        /* ✅ Stat cards — 3 col mobile, 6 col desktop */
        .stat-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        @media (min-width: 768px) {
          .stat-row { grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 24px; }
        }

        /* ✅ Today tab — stack on mobile */
        .today-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .today-grid { grid-template-columns: minmax(0,2fr) minmax(0,3fr); gap: 20px; }
        }

        /* ✅ Calendar tab — stack on mobile */
        .calendar-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .calendar-grid { grid-template-columns: minmax(0,2fr) minmax(0,1fr); gap: 20px; }
        }

        /* ✅ Page padding — smaller on mobile */
        .ea-page { padding: 16px; }
        @media (min-width: 768px) { .ea-page { padding: 24px 28px; } }

        /* ✅ Header padding */
        .ea-header { padding: 12px 16px; }
        @media (min-width: 768px) { .ea-header { padding: 14px 28px; } }

        /* ✅ Tabs scroll on mobile */
        .ea-tabs {
          display: flex;
          gap: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          border-bottom: 1px solid #f3f4f6;
          margin-bottom: 20px;
        }
        .ea-tabs::-webkit-scrollbar { display: none; }
        @media (min-width: 768px) { .ea-tabs { margin-bottom: 24px; gap: 4px; } }

        /* ✅ Time stats — 3 col always */
        .time-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          width: 100%;
        }

        /* ✅ Clock panel padding */
        .clock-panel {
          background: #111827;
          border-radius: 16px;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }
        @media (min-width: 768px) {
          .clock-panel { padding: 36px 28px; gap: 24px; }
        }

        /* ✅ History table mobile card view */
        .history-table { display: none; }
        .history-cards { display: flex; flex-direction: column; gap: 10px; }
        @media (min-width: 768px) {
          .history-table { display: block; }
          .history-cards { display: none; }
        }
      `}</style>

      {/* ── Topbar ── */}
      <header className="ea-header" style={{ background: "#fff", borderBottom: "1px solid #f3f4f6", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>Attendance</div>
            <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          {employee && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {employee.name?.charAt(0)}
              </div>
              <div style={{ display: "none" }} className="emp-name-desktop">
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{employee.name}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{employee.employeeId || employee._id?.slice(-6)}</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, right: 16, left: 16, zIndex: 9999,
          background: toast.type === "error" ? "#dc2626" : "#111827",
          color: "#fff", padding: "12px 16px", borderRadius: 10,
          fontWeight: 500, fontSize: 13, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: toast.type === "error" ? "#fca5a5" : "#6ee7b7", flexShrink: 0 }} />
          {toast.msg}
        </div>
      )}

      {showLeaveForm && <LeaveForm onSubmit={handleLeaveSubmit} onClose={() => setShowLeaveForm(false)} />}

      <div className="ea-page">

        {/* ── Summary Cards ── */}
        <div className="stat-row">
          {SUMMARY_CARDS.map((c) => (
            <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: "14px 12px" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: c.color, lineHeight: 1, fontFamily: "'DM Mono', monospace", letterSpacing: -1 }}>{c.value}</div>
              <div style={{ fontSize: 11, color: c.color, fontWeight: 500, marginTop: 5, opacity: 0.7 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="ea-tabs">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className="ea-tab" style={{
              borderBottom: activeTab === t.id ? "2px solid #111827" : "2px solid transparent",
              color: activeTab === t.id ? "#111827" : "#9ca3af",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ════ TODAY TAB ════ */}
        {activeTab === "today" && (
          <div className="today-grid">

            {/* Clock Panel */}
            <div className="clock-panel">
              <LiveClock />

              {/* Status badge */}
              <div style={{
                padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
                background: hasCheckedOut ? "rgba(110,231,183,0.12)" : isCheckedIn ? "rgba(253,230,138,0.12)" : "rgba(252,165,165,0.12)",
                color: hasCheckedOut ? "#6ee7b7" : isCheckedIn ? "#fde68a" : "#fca5a5",
                border: `1px solid ${hasCheckedOut ? "rgba(110,231,183,0.2)" : isCheckedIn ? "rgba(253,230,138,0.2)" : "rgba(252,165,165,0.2)"}`,
              }}>
                {hasCheckedOut ? "Day Complete" : isCheckedIn ? "Checked In" : "Not Checked In"}
              </div>

              {/* Time stats */}
              {hasCheckedIn && (
                <div className="time-stats">
                  {[
                    { label: "In",    value: fmt(todayRecord.checkIn)  },
                    { label: "Out",   value: fmt(todayRecord.checkOut) },
                    { label: "Hours", value: workHours                  },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4, fontWeight: 500, letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Break info */}
              {hasCheckedIn && todayRecord?.breakStart && (
                <div style={{ width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                  {isOnBreak
                    ? `Break started · ${fmt(todayRecord.breakStart)}`
                    : `Break · ${fmt(todayRecord.breakStart)} – ${fmt(todayRecord.breakEnd)} · ${todayRecord.break_minutes || 0} min`}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                  {!hasCheckedIn ? (
                    <button onClick={handleCheckIn} disabled={checkInLoading} className="ea-action-btn"
                      style={{ background: "#fff", color: "#111827" }}>
                      {checkInLoading ? "Checking in..." : "Check In"}
                    </button>
                  ) : !hasCheckedOut ? (
                    <button onClick={handleCheckOut} disabled={checkOutLoading || isOnBreak} className="ea-action-btn"
                      style={{ background: isOnBreak ? "rgba(255,255,255,0.1)" : "rgba(252,165,165,0.15)", color: isOnBreak ? "rgba(255,255,255,0.3)" : "#fca5a5", border: "1px solid rgba(252,165,165,0.2)" }}
                      title={isOnBreak ? "End break first" : ""}>
                      {checkOutLoading ? "Checking out..." : "Check Out"}
                    </button>
                  ) : (
                    <div className="ea-action-btn" style={{ background: "rgba(110,231,183,0.08)", color: "rgba(110,231,183,0.5)", textAlign: "center", border: "1px solid rgba(110,231,183,0.1)", cursor: "default" }}>
                      Day Completed
                    </div>
                  )}
                  <button onClick={() => setShowLeaveForm(true)} style={{ padding: "13px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", fontSize: 13, whiteSpace: "nowrap" }}>
                    Leave
                  </button>
                </div>

                {canBreak && !hasCheckedOut && (
                  !todayRecord?.breakStart ? (
                    <button onClick={handleBreakStart} disabled={breakStartLoading} className="ea-action-btn"
                      style={{ background: "rgba(253,230,138,0.08)", color: "rgba(253,230,138,0.7)", border: "1px solid rgba(253,230,138,0.15)", fontSize: 13 }}>
                      {breakStartLoading ? "Starting..." : "Start Lunch Break"}
                    </button>
                  ) : isOnBreak ? (
                    <button onClick={handleBreakEnd} disabled={breakEndLoading} className="ea-action-btn"
                      style={{ background: "rgba(110,231,183,0.08)", color: "rgba(110,231,183,0.7)", border: "1px solid rgba(110,231,183,0.15)", fontSize: 13 }}>
                      {breakEndLoading ? "Ending..." : "End Lunch Break"}
                    </button>
                  ) : (
                    <div className="ea-action-btn" style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)", cursor: "default", fontSize: 13 }}>
                      Break done · {todayRecord.break_minutes || 0} min
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Details Card */}
            <div className="ea-card">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f9fafb" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", letterSpacing: -0.2 }}>Today's Details</div>
              </div>
              <div style={{ padding: "4px 20px 16px" }}>
                {[
                  { label: "Date",        value: new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
                  { label: "Status",      value: todayRecord?.status ? STATUS_META[todayRecord.status]?.label : "Not marked", isStatus: true, status: todayRecord?.status },
                  { label: "Check In",    value: fmt(todayRecord?.checkIn)  },
                  { label: "Check Out",   value: fmt(todayRecord?.checkOut) },
                  { label: "Break Start", value: fmt(todayRecord?.breakStart) },
                  { label: "Break End",   value: fmt(todayRecord?.breakEnd)   },
                  { label: "Break Dur.",  value: todayRecord?.break_minutes ? `${todayRecord.break_minutes} min` : "—" },
                  { label: "Work Hours",  value: workHours },
                  { label: "Method",      value: todayRecord?.method || "—" },
                  { label: "Shift",       value: todayRecord?.shift  || "General" },
                  { label: "HR Remark",   value: todayRecord?.remark || "—" },
                ].map(({ label, value, isStatus, status }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f9fafb", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, flexShrink: 0 }}>{label}</span>
                    {isStatus && status
                      ? <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: STATUS_META[status]?.bg, color: STATUS_META[status]?.color, border: `1px solid ${STATUS_META[status]?.border}` }}>
                          {STATUS_META[status]?.label}
                        </span>
                      : <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", textAlign: "right" }}>{value}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ CALENDAR TAB ════ */}
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

        {/* ════ HISTORY TAB ════ */}
        {activeTab === "history" && (
          <div className="ea-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Attendance History</div>
              <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{records.length} records</span>
            </div>

            {records.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#d1d5db" }}>
                <p style={{ margin: 0, fontSize: 13 }}>No records for this month</p>
              </div>
            ) : (
              <>
                {/* ✅ Mobile: Card view */}
                <div className="history-cards" style={{ padding: "12px 16px" }}>
                  {[...records].sort((a, b) => new Date(b.date) - new Date(a.date)).map((r, i) => {
                    const meta = STATUS_META[r.status];
                    const hrs = r.checkIn && r.checkOut
                      ? (() => { const d = (new Date(r.checkOut) - new Date(r.checkIn)) / 3600000; return `${Math.floor(d)}h ${pad(Math.round((d % 1) * 60))}m`; })()
                      : "—";
                    return (
                      <div key={i} style={{ border: "1px solid #f3f4f6", borderRadius: 10, padding: "14px 16px", background: "#fafafa" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{fmtD(r.date)}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{new Date(r.date).toLocaleString("en-IN", { weekday: "long" })}</div>
                          </div>
                          {meta && <span style={{ background: meta.bg, color: meta.color, padding: "3px 10px", borderRadius: 20, fontWeight: 700, fontSize: 11, border: `1px solid ${meta.border}` }}>{meta.label}</span>}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                          {[
                            { label: "In",    value: fmt(r.checkIn),   color: "#16a34a" },
                            { label: "Out",   value: fmt(r.checkOut),  color: "#dc2626" },
                            { label: "Hours", value: hrs,              color: "#111827" },
                          ].map(s => (
                            <div key={s.label} style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 8, padding: "8px", textAlign: "center" }}>
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

                {/* ✅ Desktop: Table view */}
                <div className="history-table" style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f9fafb" }}>
                        {["Date", "Day", "Status", "Check In", "Check Out", "Break", "Work Hours", "Method", "Remark"].map(h => (
                          <th key={h} style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, letterSpacing: 0.5, padding: "10px 16px", textAlign: "left", whiteSpace: "nowrap", textTransform: "uppercase", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...records].sort((a, b) => new Date(b.date) - new Date(a.date)).map((r, i) => {
                        const meta = STATUS_META[r.status];
                        const hrs  = r.checkIn && r.checkOut
                          ? (() => { const d = (new Date(r.checkOut) - new Date(r.checkIn)) / 3600000; return `${Math.floor(d)}h ${pad(Math.round((d % 1) * 60))}m`; })()
                          : "—";
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}>
                            <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>{fmtD(r.date)}</td>
                            <td style={{ padding: "12px 16px", color: "#9ca3af", fontWeight: 500 }}>{new Date(r.date).toLocaleString("en-IN", { weekday: "short" })}</td>
                            <td style={{ padding: "12px 16px" }}>
                              {meta && <span style={{ background: meta.bg, color: meta.color, padding: "3px 10px", borderRadius: 20, fontWeight: 700, fontSize: 11, border: `1px solid ${meta.border}` }}>{meta.label}</span>}
                            </td>
                            <td style={{ padding: "12px 16px", color: "#16a34a", fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{fmt(r.checkIn)}</td>
                            <td style={{ padding: "12px 16px", color: "#dc2626", fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{fmt(r.checkOut)}</td>
                            <td style={{ padding: "12px 16px", color: "#b45309", fontWeight: 600 }}>{r.break_minutes ? `${r.break_minutes}m` : "—"}</td>
                            <td style={{ padding: "12px 16px", color: "#111827", fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{hrs}</td>
                            <td style={{ padding: "12px 16px", color: "#9ca3af", textTransform: "capitalize" }}>{r.method || "—"}</td>
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

        {/* ════ LEAVES TAB ════ */}
        {activeTab === "leaves" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
              <button onClick={() => setShowLeaveForm(true)} style={{ ...primaryBtn, display: "flex", alignItems: "center", gap: 6 }}>
                Apply for Leave
              </button>
            </div>

            {leaves.length === 0 ? (
              <div className="ea-card" style={{ textAlign: "center", padding: "56px 0" }}>
                <div style={{ fontSize: 14, color: "#d1d5db", fontWeight: 500 }}>No leave requests yet</div>
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
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sb, color: sc, border: `1px solid ${sborder}`, letterSpacing: 0.3 }}>
                              {(l.status || "pending").toUpperCase()}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>
                            <span>{fmtD(l.from_date)} → {fmtD(l.to_date)}</span>
                            <span>{days} day{days > 1 ? "s" : ""}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{l.reason}</div>
                          {l.hr_remark && (
                            <div style={{ marginTop: 6, fontSize: 12, color: "#0369a1", fontWeight: 500 }}>
                              HR Note: {l.hr_remark}
                            </div>
                          )}
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
    </EmployeeLayout>
  );
}