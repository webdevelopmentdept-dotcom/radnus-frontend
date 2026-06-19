import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const getToken = () =>
  localStorage.getItem("employeeToken") || sessionStorage.getItem("employeeToken");

const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtD = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const todayStr = () => new Date().toISOString().split("T")[0];

const DEFAULT_SHIFT_START = 10 * 60;
const DEFAULT_SHIFT_END = 19 * 60;

const parseShiftMins = (shift) => {
  if (shift?.start && shift?.end) {
    const [sh, sm] = shift.start.split(":").map(Number);
    const [eh, em] = shift.end.split(":").map(Number);
    return { startMins: sh * 60 + sm, endMins: eh * 60 + em };
  }
  return { startMins: DEFAULT_SHIFT_START, endMins: DEFAULT_SHIFT_END };
};

const fmtMins = (mins) => {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`;
};

const STATUS_META = {
  present: { label: "Present", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  absent: { label: "Absent", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  late: { label: "Late", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  half_day: { label: "Half Day", color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },
  leave: { label: "On Leave", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  holiday: { label: "Holiday", color: "#be185d", bg: "#fdf2f8", border: "#f9a8d4" },
  weekend: { label: "Weekend", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
  upcoming: { label: "Upcoming", color: "#9ca3af", bg: "#f9fafb", border: "#e5e7eb" },
};

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontSize: "clamp(36px, 8vw, 60px)", fontWeight: 200, color: "#fff",
        letterSpacing: -3, lineHeight: 1, fontFamily: "'DM Mono', 'Courier New', monospace",
      }}>
        {pad(time.getHours())}:{pad(time.getMinutes())}
        <span style={{ fontSize: "clamp(20px, 4vw, 30px)", opacity: 0.35 }}>:{pad(time.getSeconds())}</span>
      </div>
      <div style={{
        fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 8,
        fontWeight: 500, letterSpacing: 2, textTransform: "uppercase",
      }}>
        {time.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </div>
    </div>
  );
}

function AttendanceCalendar({ records, year, month, onMonthChange, selectedDate, onSelectDay }) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const recordMap = {};
  records.forEach((r) => { recordMap[new Date(r.date).toISOString().split("T")[0]] = r; });

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthName = new Date(year, month).toLocaleString("en-IN", { month: "long", year: "numeric" });
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button onClick={() => onMonthChange(-1)} style={calNavBtn}>‹</button>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#111827", letterSpacing: -0.3 }}>{monthName}</span>
        <button onClick={() => onMonthChange(1)} style={calNavBtn}>›</button>
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
          const rec = recordMap[dateStr];
          const dow = new Date(year, month, day).getDay();
          const isToday = dateStr === todayStr();
          const isSelected = dateStr === selectedDate;
          const status = rec?.status || (dow === 0 ? "weekend" : null);
          const meta = status ? STATUS_META[status] : null;
          const checkInPeek = rec?.checkIn ? fmt(rec.checkIn) : null;
          return (
            <div key={day} title={meta?.label} onClick={() => onSelectDay?.(dateStr)} style={{
              borderRadius: 8, padding: "7px 2px 5px", textAlign: "center", cursor: "pointer",
              background: isToday ? "#111827" : meta ? meta.bg : "transparent",
              border: `1.5px solid ${isSelected ? "#2563eb" : isToday ? "#111827" : meta ? meta.border : "#f3f4f6"}`,
              boxShadow: isSelected ? "0 0 0 2px rgba(37,99,235,0.15)" : "none",
              transition: "all 0.15s",
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? "#fff" : meta ? meta.color : "#d1d5db" }}>{day}</div>
              {checkInPeek && !isToday && (
                <div style={{ fontSize: 7, color: meta?.color, opacity: 0.75, marginTop: 1, fontFamily: "'DM Mono',monospace" }}>{checkInPeek}</div>
              )}
              {meta && !isToday && !checkInPeek && <div style={{ width: 4, height: 4, borderRadius: "50%", background: meta.color, margin: "3px auto 0", opacity: 0.7 }} />}
              {isToday && <div style={{ fontSize: 7, color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>TODAY</div>}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        {Object.entries(STATUS_META).filter(([k]) => k !== "weekend" && k !== "upcoming").map(([k, m]) => (
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
  background: "#f9fafb", border: "1px solid #e5e7eb", width: 28, height: 28,
  borderRadius: 7, cursor: "pointer", fontSize: 15, fontWeight: 700, color: "#374151",
  display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
};

function LeaveForm({ onSubmit, onClose, empId }) {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balance, setBalance] = useState({});
  const [form, setForm] = useState({ leave_type: "", from_date: todayStr(), to_date: todayStr(), reason: "", is_half_day: false, session: "morning" });
  const [saving, setSaving] = useState(false);
  const [typesLoading, setTypesLoading] = useState(true);

  const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const [typesRes, balRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/hr/settings/leave-types`, { headers: authHeader() }),
          axios.get(`${API_BASE}/api/leave-balance/${empId}`, { headers: authHeader() }),
        ]);
        if (typesRes.status === "fulfilled") {
          const types = typesRes.value.data?.data || [];
          setLeaveTypes(types);
          if (types.length > 0) setForm(f => ({ ...f, leave_type: types[0].name }));
        }
        if (balRes.status === "fulfilled") {
          setBalance(balRes.value.data?.data || {});
        }
      } catch (e) {
        console.error(e);
      } finally {
        setTypesLoading(false);
      }
    };
    fetchTypes();
  }, []);

  const fromDate = new Date(form.from_date);
  const toDate = new Date(form.to_date);
  const rawDays = Math.max(1, Math.floor((toDate - fromDate) / 86400000) + 1);
  const duration = form.is_half_day ? 0.5 : rawDays;

  const handle = async () => {
    if (!form.leave_type) return alert("Please select a leave type");
    if (!form.reason.trim()) return alert("Please enter a reason for your leave");
    setSaving(true);
    await onSubmit({
      leave_type: form.leave_type,
      from_date: form.from_date,
      to_date: form.is_half_day ? form.from_date : form.to_date,
      reason: form.reason,
      is_half_day: form.is_half_day,
      session: form.is_half_day ? form.session : null,
    });
    setSaving(false);
  };

  const S = {
    overlay: {
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9000, backdropFilter: "blur(6px)", padding: 16,
    },
    modal: {
      background: "#fff", borderRadius: 18, width: "100%", maxWidth: 460,
      boxShadow: "0 32px 80px rgba(0,0,0,0.18)", maxHeight: "92vh", overflowY: "auto",
      animation: "slideUp 0.22s cubic-bezier(0.16,1,0.3,1)",
    },
    label: {
      display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280",
      marginBottom: 6, letterSpacing: 0.4, textTransform: "uppercase",
    },
    input: {
      width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb",
      borderRadius: 10, fontSize: 13, outline: "none", fontFamily: "inherit",
      color: "#111827", background: "#fff", boxSizing: "border-box",
    },
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 22px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Apply for leave</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>Manager and HR will be notified</div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", fontSize: 18, color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
          </div>

          {!typesLoading && Object.keys(balance).length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <label style={S.label}>Leave balance</label>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(Object.keys(balance).length, 4)}, 1fr)`, gap: 8 }}>
                {Object.entries(balance).map(([type, days]) => {
                  const colors = {
                    "Casual Leave": { num: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
                    "Sick Leave": { num: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
                    "Annual Leave": { num: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },
                    "Loss of Pay": { num: "#b45309", bg: "#fffbeb", border: "#fde68a" },
                  };
                  const c = colors[type] || { num: "#374151", bg: "#f9fafb", border: "#e5e7eb" };
                  const shortName = type.replace(" Leave", "").replace("Loss of Pay", "LOP");
                  return (
                    <div key={type} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: c.num, lineHeight: 1 }}>{days}</div>
                      <div style={{ fontSize: 10, color: c.num, fontWeight: 500, marginTop: 3, opacity: 0.75 }}>{shortName}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Leave type</label>
            {typesLoading ? (
              <div style={{ padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 13, color: "#9ca3af" }}>Loading types…</div>
            ) : leaveTypes.length === 0 ? (
              <div style={{ padding: "10px 12px", border: "1.5px solid #fde68a", borderRadius: 10, fontSize: 13, color: "#92400e", background: "#fef9c3" }}>
                No leave types configured. Contact HR.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {leaveTypes.map(lt => (
                  <button
                    key={lt._id || lt.name}
                    onClick={() => setForm(f => ({ ...f, leave_type: lt.name }))}
                    style={{
                      padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", border: "1.5px solid",
                      fontFamily: "inherit", transition: "all 0.15s",
                      borderColor: form.leave_type === lt.name ? "#111827" : "#e5e7eb",
                      background: form.leave_type === lt.name ? "#111827" : "#fff",
                      color: form.leave_type === lt.name ? "#fff" : "#374151",
                    }}
                  >
                    {lt.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Duration</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>From</div>
                <input
                  type="date"
                  value={form.from_date}
                  min={todayStr()}
                  onChange={e => setForm(f => ({ ...f, from_date: e.target.value, to_date: e.target.value > f.to_date ? e.target.value : f.to_date }))}
                  style={S.input}
                />
              </div>
              <div style={{ opacity: form.is_half_day ? 0.4 : 1, pointerEvents: form.is_half_day ? "none" : "auto" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>To</div>
                <input
                  type="date"
                  value={form.to_date}
                  min={form.from_date}
                  onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))}
                  style={S.input}
                />
              </div>
            </div>
          </div>

          <div
            onClick={() => setForm(f => ({ ...f, is_half_day: !f.is_half_day }))}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
              borderRadius: 12, border: `1.5px solid ${form.is_half_day ? "#bae6fd" : "#e5e7eb"}`,
              background: form.is_half_day ? "#f0f9ff" : "#fff",
              cursor: "pointer", marginBottom: 16, transition: "all 0.15s",
            }}
          >
            <div style={{
              width: 38, height: 22, borderRadius: 11, flexShrink: 0, transition: "background 0.2s", position: "relative",
              background: form.is_half_day ? "#111827" : "#e5e7eb",
            }}>
              <div style={{
                position: "absolute", top: 3, left: form.is_half_day ? 19 : 3,
                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                transition: "left 0.2s",
              }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Half day</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                {form.is_half_day ? "Select morning or afternoon below" : "Toggle for half day leave"}
              </div>
            </div>
          </div>

          {form.is_half_day && (
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Session</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { key: "morning", label: "Morning", icon: "🌅", sub: "First half" },
                  { key: "afternoon", label: "Afternoon", icon: "🌤️", sub: "Second half" },
                ].map(s => (
                  <button
                    key={s.key}
                    onClick={() => setForm(f => ({ ...f, session: s.key }))}
                    style={{
                      padding: "12px 10px", borderRadius: 12, cursor: "pointer",
                      border: `1.5px solid ${form.session === s.key ? "#111827" : "#e5e7eb"}`,
                      background: form.session === s.key ? "#111827" : "#fff",
                      color: form.session === s.key ? "#fff" : "#374151",
                      fontFamily: "inherit", textAlign: "center", transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>{s.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>Duration</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                {fmtD(form.from_date)}{!form.is_half_day && form.from_date !== form.to_date ? ` → ${fmtD(form.to_date)}` : ""}
                {form.is_half_day ? ` · ${form.session === "morning" ? "Morning" : "Afternoon"}` : ""}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{duration} day{duration !== 1 ? "s" : ""}</div>
            </div>
          </div>

          <div style={{ marginBottom: 4 }}>
            <label style={S.label}>
              Reason <span style={{ fontSize: 10, fontWeight: 600, color: "#dc2626", textTransform: "none" }}>*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Brief reason for your leave..."
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              style={{ ...S.input, resize: "vertical", marginBottom: 0 }}
            />
          </div>
        </div>

        <div style={{ padding: "16px 22px 22px", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Cancel
          </button>
          <button onClick={handle} disabled={saving || typesLoading} style={{ flex: 2, padding: "12px 0", borderRadius: 10, border: "none", background: "#111827", color: "#fff", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Submitting…" : "Submit request"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeAttendance() {
  const [employee, setEmployee] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [breakStartLoading, setBreakStartLoading] = useState(false);
  const [breakEndLoading, setBreakEndLoading] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("today");
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("all");

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
        axios.get(`${API_BASE}/api/employee/me/${empId}`, { headers: authHeader() }),
        axios.get(`${API_BASE}/api/attendance/today/${empId}`, { headers: authHeader() }),
        axios.get(`${API_BASE}/api/attendance/summary/${empId}`, { headers: authHeader() }),
        axios.get(`${API_BASE}/api/leave-requests/employee/${empId}`, { headers: authHeader() }),
      ]);
      if (empRes.status === "fulfilled") setEmployee(empRes.value.data);
      if (todayRes.status === "fulfilled") setTodayRecord(todayRes.value.data?.data || null);
      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value.data?.data || {});
      if (leavesRes.status === "fulfilled") setLeaves(leavesRes.value.data?.data || []);
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
      showToast("Checked in successfully ✓");
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || "Check-in failed", "error"); }
    finally { setCheckInLoading(false); }
  };

  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/attendance/check-out`, { employee_id: empId, method: "manual" }, { headers: authHeader() });
      setTodayRecord(res.data?.data);
      showToast("Checked out successfully ✓");
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

  const handleCancelLeave = async (id) => {
    if (!window.confirm("Cancel this leave request?")) return;
    try {
      await axios.delete(`${API_BASE}/api/leave-requests/${id}`, { headers: authHeader() });
      showToast("Leave request cancelled ✓");
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to cancel", "error");
    }
  };

  const handleMonthChange = (dir) => {
    let m = calMonth + dir, y = calYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setCalMonth(m); setCalYear(y);
    setSelectedDate(null);
    setHistoryFilter("all");
  };

  const monthDetail = useMemo(() => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const { startMins, endMins } = parseShiftMins(employee?.shift);
    let presentCount = 0, lateCount = 0, absentCount = 0, leaveCount = 0, halfCount = 0;
    const filled = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${pad(calMonth + 1)}-${pad(d)}`;
      const dow = new Date(calYear, calMonth, d).getDay();
      const isWeekend = dow === 0;
      const isFuture = dateStr > todayStr();
      const rec = records.find(r => new Date(r.date).toISOString().split("T")[0] === dateStr);

      let firstIn = null, lastOut = null, workHrs = "—";
      let breakOut = null, breakIn = null, breakLate = 0;
      let lateMin = 0, earlyOutMin = 0, status = "absent", remark = "";

      if (isWeekend) {
        status = "weekend";
      } else if (isFuture) {
        // A day that hasn't happened yet should never be counted as absent.
        status = "upcoming";
      } else if (rec) {
        status = rec.status || "absent";
        breakOut = rec.breakOut || null;
        breakIn = rec.breakIn || null;
        breakLate = rec.breakLate || rec.break_late || 0;
        remark = rec.remark || "";

        firstIn = rec.first_in || rec.checkIn || null;
        if (!firstIn && rec.punches?.length) {
          const ins = rec.punches.filter(p => p.type === "in").sort((a, b) => new Date(a.time) - new Date(b.time));
          firstIn = ins[0]?.time || null;
        }
        lastOut = rec.last_out || rec.checkOut || null;
        if (!lastOut && rec.punches?.length) {
          const outs = rec.punches.filter(p => p.type === "out").sort((a, b) => new Date(b.time) - new Date(a.time));
          lastOut = outs[0]?.time || null;
        }

        lateMin = rec.late_minutes || 0;
        if (lateMin === 0 && firstIn) {
          const ist = new Date(new Date(firstIn).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
          lateMin = Math.max(ist.getHours() * 60 + ist.getMinutes() - startMins, 0);
        }

        earlyOutMin = rec.early_out_minutes || 0;
        if (earlyOutMin === 0 && lastOut) {
          const ist = new Date(new Date(lastOut).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
          earlyOutMin = Math.max(endMins - (ist.getHours() * 60 + ist.getMinutes()), 0);
        }

        if (rec.work_hours && typeof rec.work_hours === "number" && rec.work_hours > 0) {
          const h = Math.floor(rec.work_hours), m = Math.round((rec.work_hours - h) * 60);
          workHrs = `${h}h ${pad(m)}m`;
        } else if (firstIn && lastOut) {
          const diff = (new Date(lastOut) - new Date(firstIn)) / 3600000;
          workHrs = `${Math.floor(diff)}h ${pad(Math.round((diff % 1) * 60))}m`;
        } else if (firstIn && !lastOut) {
          workHrs = dateStr === todayStr() ? "Ongoing" : "No Out";
        }

        if (status === "present" || status === "late") presentCount++;
        if (status === "late") lateCount++;
        else if (status === "leave") leaveCount++;
        else if (status === "half_day") halfCount++;
        else if (status === "absent") absentCount++;
      } else {
        absentCount++;
      }

      filled.push({ date: dateStr, dayOfWeek: dow, status, firstIn, lastOut, workHrs, breakOut, breakIn, breakLate, lateMin, earlyOutMin, remark, isWeekend, isFuture });
    }

   const workingDays = filled.filter(r => !r.isWeekend).length;

    const countedPresent = presentCount + halfCount * 0.5;
    const pct = workingDays ? Math.round((countedPresent / workingDays) * 100) : 0;

    return { filled, presentCount, lateCount, absentCount, leaveCount, halfCount, pct, workingDays };
  }, [records, calYear, calMonth, employee]);

  const isCurrentMonthDisplayed = calYear === new Date().getFullYear() && calMonth === new Date().getMonth();
  const effectiveSelectedDate = selectedDate || (isCurrentMonthDisplayed ? todayStr() : null);
  const selectedDay = effectiveSelectedDate ? monthDetail.filled.find(r => r.date === effectiveSelectedDate) : null;

  const autoMarked = ["present", "late"].includes(todayRecord?.status);
  const hasCheckedIn = !!todayRecord?.checkIn || autoMarked;
  const hasCheckedOut = !!todayRecord?.checkOut;
  const isCheckedIn = hasCheckedIn && !hasCheckedOut;
  const isOnBreak = !!todayRecord?.breakStart && !todayRecord?.breakEnd;
  const canBreak = isCheckedIn;

  const workHours = (() => {
    if (todayRecord?.checkIn && todayRecord?.checkOut) {
      const d = (new Date(todayRecord.checkOut) - new Date(todayRecord.checkIn)) / 3600000;
      return `${Math.floor(d)}h ${pad(Math.round((d % 1) * 60))}m`;
    }
    if (isCheckedIn) return "In progress";
    return "—";
  })();

  const methodLabel = todayRecord?.method
    ? todayRecord.method === "auto" ? "Auto" : todayRecord.method === "hr_manual" ? "HR" : "Manual"
    : autoMarked ? "Auto" : "—";

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f9fafb" }}>
      <div style={{ width: 28, height: 28, border: "2px solid #e5e7eb", borderTopColor: "#111827", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const pctColor = monthDetail.pct >= 90 ? "#16a34a" : monthDetail.pct >= 75 ? "#b45309" : "#dc2626";
  const pctBg = monthDetail.pct >= 90 ? "#f0fdf4" : monthDetail.pct >= 75 ? "#fffbeb" : "#fef2f2";
  const pctBorder = monthDetail.pct >= 90 ? "#bbf7d0" : monthDetail.pct >= 75 ? "#fde68a" : "#fecaca";

  const SUMMARY_CARDS = [
    { label: "Present",   value: summary.present  || 0, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    { label: "Absent",    value: summary.absent   || 0, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
    { label: "Late",      value: summary.late     || 0, color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
    { label: "On Leave",  value: summary.onLeave  || 0, color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
    { label: "Half Day",  value: summary.halfDay  || 0, color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },
    { label: "Work Days", value: summary.totalDays|| 0, color: "#374151", bg: "#f9fafb", border: "#e5e7eb" },
    { label: "This Month",value: `${monthDetail.pct}%`, color: pctColor, bg: pctBg, border: pctBorder },
  ];

  const TABS = [
    { id: "today",    label: "Today" },
    { id: "calendar", label: "Calendar" },
    { id: "history",  label: "History" },
    { id: "leaves",   label: `Leaves${leaves.length ? ` (${leaves.length})` : ""}` },
  ];

  const primaryBtn = { padding: "12px 20px", borderRadius: 10, border: "none", background: "#111827", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" };

  return (
    <EmployeeLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        html, body { overflow-x: auto !important; }
        .ea-root { font-family:'DM Sans',sans-serif; background:#f8f9fb; min-height:100vh; overflow-x:auto; overflow-y:auto; }
        .ea-topbar { background:#fff; border-bottom:1px solid #f0f0f0; padding:10px 14px; position:sticky; top:0; z-index:50; display:flex; align-items:center; gap:12px; min-width:0; }
        @media (min-width:640px) { .ea-topbar { padding:14px 28px; } }
        .ea-page { padding:12px 12px 24px; overflow-x:auto; min-width:0; }
        @media (min-width:640px) { .ea-page { padding:20px 24px 32px; } }
        @media (min-width:1024px) { .ea-page { padding:24px 28px 40px; } }
        .stat-row { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:14px; }
        @media (min-width:640px) { .stat-row { grid-template-columns:repeat(auto-fit, minmax(110px,1fr)); gap:12px; margin-bottom:20px; } }
        .ea-tabs { display:flex; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; border-bottom:1px solid #f0f0f0; margin-bottom:16px; }
        .ea-tabs::-webkit-scrollbar { display:none; }
        .ea-tab { border:none; background:none; padding:9px 12px; font-weight:600; font-size:13px; cursor:pointer; font-family:'DM Sans',sans-serif; border-bottom:2px solid transparent; margin-bottom:-1px; white-space:nowrap; transition:color 0.15s,border-color 0.15s; color:#9ca3af; flex-shrink:0; }
        .ea-tab.active { color:#111827; border-bottom-color:#111827; }
        .today-grid { display:grid; grid-template-columns:1fr; gap:12px; }
        @media (min-width:768px) { .today-grid { grid-template-columns:minmax(0,2fr) minmax(0,3fr); gap:18px; } }
        .clock-panel { background:#0d1117; border-radius:16px; padding:22px 16px 18px; display:flex; flex-direction:column; align-items:center; gap:14px; position:relative; overflow:hidden; }
        @media (min-width:768px) { .clock-panel { padding:36px 28px 30px; gap:20px; } }
        .time-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; width:100%; }
        .ea-action-btn { width:100%; padding:11px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; border:none; text-align:center; }
        .ea-action-btn:disabled { opacity:0.45; cursor:not-allowed; }
        .detail-card { background:#fff; border:1px solid #f0f0f0; border-radius:16px; overflow:hidden; }
        .detail-row { display:flex; justify-content:space-between; align-items:center; padding:9px 16px; border-bottom:1px solid #f9fafb; gap:10px; }
        .detail-row:last-child { border-bottom:none; }
        .calendar-grid { display:grid; grid-template-columns:1fr; gap:12px; }
        @media (min-width:768px) { .calendar-grid { grid-template-columns:minmax(0,3fr) minmax(0,2fr); gap:18px; } }
        .history-cards { display:flex; flex-direction:column; gap:10px; }
        .history-table-wrap { display:none; }
        @media (min-width:768px) { .history-cards { display:none; } .history-table-wrap { display:block; overflow-x:auto; overflow-y:auto; -webkit-overflow-scrolling:touch; width:100%; } }
        .ea-card { background:#fff; border:1px solid #f0f0f0; border-radius:16px; }
        .ea-card.history-card { overflow:hidden; }
        .ea-card.history-card .history-table-wrap { overflow-x:auto; overflow-y:auto; -webkit-overflow-scrolling:touch; border-bottom-left-radius:16px; border-bottom-right-radius:16px; }
        .ea-toast { position:fixed; top:16px; left:50%; transform:translateX(-50%); z-index:9999; padding:11px 18px; border-radius:10px; font-weight:600; font-size:13px; display:flex; align-items:center; gap:8px; white-space:nowrap; box-shadow:0 8px 32px rgba(0,0,0,0.18); animation:toastIn 0.2s ease; }
        .method-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:20px; font-size:10px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; }

        /* ── History row hover: an overlay so it works regardless of the row's status tint ── */
        .hist-row:hover td { box-shadow: inset 0 0 0 9999px rgba(17,24,39,0.035); }
        .history-filter-chip:hover { filter: brightness(0.97); }
      `}</style>

      <div className="ea-root">

        <header className="ea-topbar">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Attendance</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          {employee && (
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {employee.name?.charAt(0)}
            </div>
          )}
        </header>

        {toast && (
          <div className="ea-toast" style={{ background: toast.type === "error" ? "#dc2626" : "#111827", color: "#fff" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: toast.type === "error" ? "#fca5a5" : "#6ee7b7" }} />
            {toast.msg}
          </div>
        )}

        {showLeaveForm && (
          <LeaveForm onSubmit={handleLeaveSubmit} onClose={() => setShowLeaveForm(false)} empId={empId} />
        )}

        <div className="ea-page">

          <div className="stat-row">
            {SUMMARY_CARDS.map((c) => (
              <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: "11px 10px" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1, fontFamily: "'DM Mono',monospace", letterSpacing: -1 }}>{c.value}</div>
                <div style={{ fontSize: 10, color: c.color, fontWeight: 500, marginTop: 4, opacity: 0.75 }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div className="ea-tabs">
            {TABS.map((t) => (
              <button key={t.id} className={`ea-tab${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ════ TODAY TAB ════ */}
          {activeTab === "today" && (
            <div className="today-grid">
              <div className="clock-panel">
                <LiveClock />
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  <div style={{
                    padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    letterSpacing: 0.8, textTransform: "uppercase",
                    background: hasCheckedOut ? "rgba(110,231,183,0.1)" : isCheckedIn ? "rgba(253,230,138,0.1)" : "rgba(252,165,165,0.1)",
                    color: hasCheckedOut ? "#6ee7b7" : isCheckedIn ? "#fde68a" : "#fca5a5",
                    border: `1px solid ${hasCheckedOut ? "rgba(110,231,183,0.2)" : isCheckedIn ? "rgba(253,230,138,0.2)" : "rgba(252,165,165,0.2)"}`,
                  }}>
                    {hasCheckedOut ? "Day Complete" : isCheckedIn ? "Checked In" : "Not Checked In"}
                  </div>
                  {todayRecord && (
                    <span className="method-badge" style={{
                      background: autoMarked && !todayRecord?.checkIn ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.07)",
                      color: autoMarked && !todayRecord?.checkIn ? "#818cf8" : "rgba(255,255,255,0.35)",
                      border: `1px solid ${autoMarked && !todayRecord?.checkIn ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.08)"}`,
                    }}>
                      {autoMarked && !todayRecord?.checkIn ? "🤖" : "✋"} {methodLabel}
                    </span>
                  )}
                </div>

                {autoMarked && !todayRecord?.checkIn && !hasCheckedOut && (
                  <div style={{ width: "100%", background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, padding: "10px 12px", fontSize: 11, color: "rgba(160,165,255,0.85)", fontWeight: 500, textAlign: "center", lineHeight: 1.5 }}>
                    Auto-marked Present · Use <strong>Check Out</strong> button when leaving
                  </div>
                )}

                {hasCheckedIn && (
                  <div className="time-stats">
                    {[
                      { label: "In",    value: todayRecord?.checkIn ? fmt(todayRecord.checkIn) : "Auto" },
                      { label: "Out",   value: fmt(todayRecord?.checkOut) },
                      { label: "Hours", value: workHours },
                    ].map((s) => (
                      <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 4px", textAlign: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "'DM Mono',monospace" }}>{s.value}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 4, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {hasCheckedIn && todayRecord?.breakStart && (
                  <div style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: "9px 12px", fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                    {isOnBreak
                      ? `Break started · ${fmt(todayRecord.breakStart)}`
                      : `Break · ${fmt(todayRecord.breakStart)} – ${fmt(todayRecord.breakEnd)} · ${todayRecord.break_minutes || 0} min`}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                    {!hasCheckedIn ? (
                      <button className="ea-action-btn" onClick={handleCheckIn} disabled={checkInLoading} style={{ background: "#fff", color: "#111827" }}>
                        {checkInLoading ? "Checking in…" : "Check In"}
                      </button>
                    ) : !hasCheckedOut ? (
                      <button className="ea-action-btn" onClick={handleCheckOut} disabled={checkOutLoading || isOnBreak}
                        title={isOnBreak ? "End your break first" : ""}
                        style={{ background: isOnBreak ? "rgba(255,255,255,0.06)" : "rgba(252,165,165,0.13)", color: isOnBreak ? "rgba(255,255,255,0.25)" : "#fca5a5", border: `1px solid ${isOnBreak ? "rgba(255,255,255,0.07)" : "rgba(252,165,165,0.2)"}` }}>
                        {checkOutLoading ? "Checking out…" : "Check Out"}
                      </button>
                    ) : (
                      <div className="ea-action-btn" style={{ background: "rgba(110,231,183,0.07)", color: "rgba(110,231,183,0.45)", border: "1px solid rgba(110,231,183,0.1)", cursor: "default" }}>
                        Day Completed ✓
                      </div>
                    )}
                    <button onClick={() => setShowLeaveForm(true)}
                      style={{ padding: "11px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.45)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 13, whiteSpace: "nowrap" }}>
                      Leave
                    </button>
                  </div>

                  {canBreak && !hasCheckedOut && (
                    !todayRecord?.breakStart ? (
                      <button className="ea-action-btn" onClick={handleBreakStart} disabled={breakStartLoading}
                        style={{ background: "rgba(253,230,138,0.07)", color: "rgba(253,230,138,0.65)", border: "1px solid rgba(253,230,138,0.14)", fontSize: 13 }}>
                        {breakStartLoading ? "Starting…" : "☕  Start Lunch Break"}
                      </button>
                    ) : isOnBreak ? (
                      <button className="ea-action-btn" onClick={handleBreakEnd} disabled={breakEndLoading}
                        style={{ background: "rgba(110,231,183,0.07)", color: "rgba(110,231,183,0.65)", border: "1px solid rgba(110,231,183,0.14)", fontSize: 13 }}>
                        {breakEndLoading ? "Ending…" : "End Lunch Break"}
                      </button>
                    ) : (
                      <div className="ea-action-btn" style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.05)", cursor: "default", fontSize: 13 }}>
                        Break done · {todayRecord.break_minutes || 0} min
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="detail-card">
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", fontSize: 14, fontWeight: 700, color: "#111827" }}>Today's Details</div>
                {[
                  { label: "Date",       value: new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
                  { label: "Status",     value: todayRecord?.status ? STATUS_META[todayRecord.status]?.label : "Not marked", isStatus: true, status: todayRecord?.status },
                  { label: "Check In",   value: todayRecord?.checkIn ? fmt(todayRecord.checkIn) : autoMarked ? "Auto (no timestamp)" : "—" },
                  { label: "Check Out",  value: fmt(todayRecord?.checkOut) },
                  { label: "Break Start",value: fmt(todayRecord?.breakStart) },
                  { label: "Break End",  value: fmt(todayRecord?.breakEnd) },
                  { label: "Break Dur.", value: todayRecord?.break_minutes ? `${todayRecord.break_minutes} min` : "—" },
                  { label: "Work Hours", value: workHours },
                  { label: "Method",     value: methodLabel },
                  { label: "Shift",      value: todayRecord?.shift || "General" },
                  { label: "HR Remark",  value: todayRecord?.remark || "—" },
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

          {/* ════ CALENDAR TAB ════ */}
          {activeTab === "calendar" && (
            <div className="calendar-grid">
              <div className="ea-card" style={{ padding: 16 }}>
                <AttendanceCalendar records={records} year={calYear} month={calMonth} onMonthChange={handleMonthChange} selectedDate={effectiveSelectedDate} onSelectDay={setSelectedDate} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="ea-card" style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>
                      {new Date(calYear, calMonth).toLocaleString("en-IN", { month: "long" })} Summary
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: pctColor, fontFamily: "'DM Mono',monospace" }}>{monthDetail.pct}%</span>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {[
                      { label: "Present", value: monthDetail.presentCount, color: "#16a34a", bg: "#f0fdf4" },
                      { label: "Late", value: monthDetail.lateCount, color: "#b45309", bg: "#fffbeb" },
                      { label: "Absent", value: monthDetail.absentCount, color: "#dc2626", bg: "#fef2f2" },
                      { label: "Leave", value: monthDetail.leaveCount, color: "#0369a1", bg: "#f0f9ff" },
                      { label: "Half Day", value: monthDetail.halfCount, color: "#7c3aed", bg: "#faf5ff" },
                    ].map(c => (
                      <span key={c.label} style={{ background: c.bg, color: c.color, padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{c.value} {c.label}</span>
                    ))}
                  </div>
                </div>

                <div className="ea-card" style={{ overflow: "hidden", flex: 1 }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                      {selectedDay ? new Date(selectedDay.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }) : "Day Detail"}
                    </span>
                    {selectedDay && (() => {
                      const m = STATUS_META[selectedDay.status] || STATUS_META.absent;
                      return <span style={{ background: m.bg, color: m.color, padding: "3px 10px", borderRadius: 20, fontWeight: 700, fontSize: 11, border: `1px solid ${m.border}` }}>{m.label}</span>;
                    })()}
                  </div>

                  {!selectedDay ? (
                    <div style={{ textAlign: "center", padding: "36px 16px", color: "#d1d5db" }}>
                      <div style={{ fontSize: 26, marginBottom: 8 }}>👆</div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500 }}>Tap a date on the calendar to see full check-in / check-out details</p>
                    </div>
                  ) : selectedDay.isWeekend ? (
                    <div style={{ textAlign: "center", padding: "36px 16px", color: "#d1d5db" }}>
                      <div style={{ fontSize: 26, marginBottom: 8 }}>🌤️</div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500 }}>Weekend — no attendance expected</p>
                    </div>
                  ) : selectedDay.status === "upcoming" ? (
                    <div style={{ textAlign: "center", padding: "36px 16px", color: "#d1d5db" }}>
                      <div style={{ fontSize: 26, marginBottom: 8 }}>⏳</div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500 }}>This day hasn't happened yet</p>
                    </div>
                  ) : (
                    [
                      { label: "Check In", value: selectedDay.firstIn ? fmt(selectedDay.firstIn) : ["present", "late"].includes(selectedDay.status) ? "Auto" : "—" },
                      { label: "Check Out", value: selectedDay.lastOut ? fmt(selectedDay.lastOut) : "—" },
                      { label: "Work Hours", value: selectedDay.workHrs },
                      { label: "Break Out", value: selectedDay.breakOut ? fmt(selectedDay.breakOut) : "—" },
                      { label: "Break In", value: selectedDay.breakIn ? fmt(selectedDay.breakIn) : "—" },
                      { label: "Break Late", value: selectedDay.breakLate > 0 ? fmtMins(selectedDay.breakLate) : "—" },
                      { label: "Late Arrival", value: selectedDay.lateMin > 0 ? fmtMins(selectedDay.lateMin) : "—" },
                      { label: "Early Out", value: selectedDay.earlyOutMin > 0 ? fmtMins(selectedDay.earlyOutMin) : "—" },
                      { label: "Remark", value: selectedDay.remark || "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="detail-row">
                        <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, flexShrink: 0 }}>{label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", textAlign: "right" }}>{value}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════ HISTORY TAB ════ */}
          {activeTab === "history" && (() => {
            // Days that haven't happened yet should never appear in a "history" log.
            const visibleRows = monthDetail.filled.filter(r => r.status !== "upcoming");

            const statusCounts = visibleRows.reduce((acc, r) => {
              if (!r.isWeekend) acc[r.status] = (acc[r.status] || 0) + 1;
              return acc;
            }, {});

            const FILTERS = [
              { key: "all",      label: "All" },
              { key: "present",  label: "Present" },
              { key: "late",     label: "Late" },
              { key: "half_day", label: "Half Day" },
              { key: "leave",    label: "On Leave" },
              { key: "absent",   label: "Absent" },
            ];

            const rows = visibleRows
              .filter(r => historyFilter === "all" || r.status === historyFilter)
              .slice()
              .reverse();

            const emptyLabel = historyFilter === "all" ? "" : `${FILTERS.find(f => f.key === historyFilter)?.label.toLowerCase()} `;

            const buildNotes = (r) => {
              const notes = [];
              if (r.lateMin > 0) notes.push({ text: `Late ${fmtMins(r.lateMin)}`, color: "#b45309", bg: "#fffbeb" });
              if (r.earlyOutMin > 0) notes.push({ text: `Early out ${fmtMins(r.earlyOutMin)}`, color: "#9333ea", bg: "#faf5ff" });
              if (r.breakOut) notes.push({ text: `Break ${fmt(r.breakOut)}${r.breakIn ? `–${fmt(r.breakIn)}` : ""}`, color: "#1d4ed8", bg: "#eff6ff" });
              if (r.breakLate > 0) notes.push({ text: `Break late ${fmtMins(r.breakLate)}`, color: "#b45309", bg: "#fffbeb" });
              return notes;
            };

            return (
              <div className="ea-card history-card">

                {/* ── Header ── */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Attendance history</div>
                  <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>
                    {new Date(calYear, calMonth).toLocaleString("en-IN", { month: "long", year: "numeric" })}
                  </span>
                </div>

                {/* ── Composition summary + filters ── */}
                <div style={{ padding: "16px 20px 18px", borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
                      Attendance rate · {monthDetail.workingDays} working day{monthDetail.workingDays !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: pctColor, fontFamily: "'DM Mono',monospace" }}>{monthDetail.pct}%</span>
                  </div>

                  <div style={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", background: "#f3f4f6", marginBottom: 14 }}>
                    {["present", "late", "half_day", "leave", "absent"].map((key) => {
                      const count = statusCounts[key] || 0;
                      if (!count || !monthDetail.workingDays) return null;
                      const width = (count / monthDetail.workingDays) * 100;
                      return (
                        <div key={key} title={`${STATUS_META[key].label}: ${count}`}
                          style={{ width: `${width}%`, background: STATUS_META[key].color }} />
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {FILTERS.map(f => {
                      const meta = f.key === "all" ? null : STATUS_META[f.key];
                      const count = f.key === "all" ? monthDetail.workingDays : (statusCounts[f.key] || 0);
                      const isActive = historyFilter === f.key;
                      const accent = meta ? meta.color : "#111827";
                      return (
                        <button
                          key={f.key}
                          className="history-filter-chip"
                          onClick={() => setHistoryFilter(f.key)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "5px 11px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                            border: `1.5px solid ${isActive ? accent : (meta ? meta.border : "#e5e7eb")}`,
                            background: isActive ? (meta ? meta.bg : "#111827") : "#fff",
                            color: isActive ? (meta ? accent : "#fff") : (meta ? meta.color : "#374151"),
                            opacity: historyFilter === "all" || isActive ? 1 : 0.5,
                          }}
                        >
                          {f.label}
                          <span style={{ opacity: 0.7 }}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Mobile cards ── */}
                <div className="history-cards" style={{ padding: "10px 12px" }}>
                  {rows.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 0", color: "#d1d5db", fontSize: 12, fontWeight: 500 }}>
                      No {emptyLabel}days this month
                    </div>
                  ) : rows.map((r, i) => {
                    const meta = STATUS_META[r.status] || STATUS_META.absent;
                    const notes = buildNotes(r);
                    return (
                      <div key={i} style={{
                        border: "1px solid #f0f0f0", borderLeft: `3px solid ${meta.color}`, borderRadius: 12, padding: 12,
                        background: r.isWeekend ? "#fcfcfd" : meta.bg,
                        opacity: r.isWeekend ? 0.65 : 1,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: r.isWeekend ? 0 : 10 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{fmtD(r.date)}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{new Date(r.date).toLocaleString("en-IN", { weekday: "long" })}</div>
                          </div>
                          <span style={{ background: "#fff", color: meta.color, padding: "3px 10px", borderRadius: 99, fontWeight: 700, fontSize: 11, border: `1px solid ${meta.border}` }}>
                            {meta.label}
                          </span>
                        </div>

                        {!r.isWeekend && (
                          <>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                              {[
                                { label: "In",    value: r.firstIn ? fmt(r.firstIn) : ["present","late"].includes(r.status) ? "Auto" : "—", color: "#15803d" },
                                { label: "Out",   value: r.lastOut ? fmt(r.lastOut) : "—", color: "#dc2626" },
                                { label: "Hours", value: r.workHrs, color: "#111827" },
                              ].map((s) => (
                                <div key={s.label} style={{ background: "#fff", border: "1px solid #f3f4f6", borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: s.color, fontFamily: "'DM Mono',monospace" }}>{s.value}</div>
                                  <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 3, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</div>
                                </div>
                              ))}
                            </div>
                            {notes.length > 0 && (
                              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                                {notes.map((n, ni) => (
                                  <span key={ni} style={{ background: n.bg, color: n.color, padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600 }}>{n.text}</span>
                                ))}
                              </div>
                            )}
                            {r.remark && <div style={{ marginTop: 8, fontSize: 11, color: "#6b7280", fontStyle: "italic" }}>"{r.remark}"</div>}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── Desktop table ── */}
                <div className="history-table-wrap">
                  <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#f9fafb" }}>
                        {[
                          { key: "Date",        w: 120 },
                          { key: "Day",         w: 56  },
                          { key: "Status",      w: 100 },
                          { key: "Check in",    w: 90  },
                          { key: "Check out",   w: 90  },
                          { key: "Work hours",  w: 100 },
                          { key: "Notes",       w: 300 },
                        ].map((h) => (
                          <th key={h.key} style={{
                            width: h.w, fontSize: 10, color: "#9ca3af", fontWeight: 600,
                            letterSpacing: 0.5, padding: "10px 16px", textAlign: "left",
                            whiteSpace: "nowrap", textTransform: "uppercase",
                            borderBottom: "1px solid #f0f0f0",
                          }}>{h.key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: "30px 16px", textAlign: "center", color: "#d1d5db", fontSize: 12, fontWeight: 500 }}>
                            No {emptyLabel}days this month
                          </td>
                        </tr>
                      ) : rows.map((r, i) => {
                        const meta = STATUS_META[r.status] || STATUS_META.absent;
                        const rowBg = r.isWeekend ? "#fcfcfd" : meta.bg;
                        const notes = buildNotes(r);
                        if (r.remark) notes.push({ text: `"${r.remark}"`, color: "#6b7280", bg: "#f9fafb", italic: true });

                        return (
                          <tr key={i} className="hist-row" style={{ borderBottom: "1px solid #f9fafb", opacity: r.isWeekend ? 0.6 : 1 }}>

                            <td style={{ padding: "11px 16px", fontWeight: 600, color: "#111827", whiteSpace: "nowrap", background: rowBg, borderLeft: `3px solid ${meta.color}` }}>
                              {fmtD(r.date)}
                            </td>

                            <td style={{ padding: "11px 16px", color: "#9ca3af", fontWeight: 500, whiteSpace: "nowrap", fontSize: 11, background: rowBg }}>
                              {new Date(r.date).toLocaleString("en-IN", { weekday: "short" })}
                            </td>

                            <td style={{ padding: "11px 16px", whiteSpace: "nowrap", background: rowBg }}>
                              <span style={{ background: "#fff", color: meta.color, padding: "3px 10px", borderRadius: 99, fontWeight: 700, fontSize: 11, border: `1px solid ${meta.border}` }}>
                                {meta.label}
                              </span>
                            </td>

                            <td style={{ padding: "11px 16px", whiteSpace: "nowrap", background: rowBg }}>
                              {r.firstIn
                                ? <span style={{ color: "#15803d", fontWeight: 600, fontFamily: "'DM Mono',monospace" }}>{fmt(r.firstIn)}</span>
                                : ["present","late"].includes(r.status)
                                  ? <span style={{ color: "#818cf8", fontSize: 11, fontWeight: 500 }}>Auto</span>
                                  : <span style={{ color: "#d1d5db" }}>—</span>}
                            </td>

                            <td style={{ padding: "11px 16px", whiteSpace: "nowrap", background: rowBg }}>
                              {r.lastOut
                                ? <span style={{ color: "#dc2626", fontWeight: 600, fontFamily: "'DM Mono',monospace" }}>{fmt(r.lastOut)}</span>
                                : <span style={{ color: "#d1d5db" }}>—</span>}
                            </td>

                            <td style={{ padding: "11px 16px", fontWeight: 700, fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap", background: rowBg, color: "#111827" }}>
                              {r.workHrs !== "—" ? r.workHrs : <span style={{ color: "#d1d5db", fontWeight: 400 }}>—</span>}
                            </td>

                            <td style={{ padding: "11px 16px", background: rowBg }}>
                              {notes.length > 0 ? (
                                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                  {notes.map((n, ni) => (
                                    <span key={ni} style={{ background: n.bg, color: n.color, padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600, fontStyle: n.italic ? "italic" : "normal" }}>{n.text}</span>
                                  ))}
                                </div>
                              ) : <span style={{ color: "#d1d5db" }}>—</span>}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            );
          })()}

          {/* ════ LEAVES TAB ════ */}
          {activeTab === "leaves" && (
            <div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
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
                    const days = l.is_half_day ? 0.5 : Math.floor((new Date(l.to_date) - new Date(l.from_date)) / 86400000) + 1;
                    return (
                      <div key={i} className="ea-card" style={{ padding: "14px 16px" }}>
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
                              <span style={{ fontWeight: 600, color: "#374151" }}>{days} day{days !== 1 ? "s" : ""}</span>
                            </div>
                            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 5 }}>{l.reason}</div>
                            {l.hr_remark && <div style={{ marginTop: 7, fontSize: 12, color: "#0369a1", fontWeight: 500 }}>HR Note: {l.hr_remark}</div>}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                            <span style={{ fontSize: 11, color: "#d1d5db", fontWeight: 500 }}>Applied {fmtD(l.createdAt)}</span>
                            {l.status === "pending" && (
                              <button
                                onClick={() => handleCancelLeave(l._id)}
                                style={{ padding: "5px 12px", borderRadius: 8, border: "1.5px solid #fecaca", background: "#fff", color: "#dc2626", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                              >
                                Cancel
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

        </div>
      </div>
    </EmployeeLayout>
  );
}