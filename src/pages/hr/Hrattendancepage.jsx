import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search, Filter, RefreshCw, Edit3, Save,
  Download, CalendarCheck, AlertTriangle, Clock,
  TrendingUp, TrendingDown, Users, Activity,
  X, Eye, ChevronRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const getToken  = () => localStorage.getItem("hrToken") || localStorage.getItem("token") || sessionStorage.getItem("hrToken");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });
const pad   = (n) => String(n).padStart(2, "0");
const fmt   = (d) => d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtD  = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const todayStr = () => new Date().toISOString().split("T")[0];

const SHIFT_END_HOUR   = 19;
const SHIFT_END_MINUTE = 0;
const SHIFT_END_TOTAL  = SHIFT_END_HOUR * 60 + SHIFT_END_MINUTE;

const STATUS_META = {
  present:  { label: "Present",  color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
  absent:   { label: "Absent",   color: "#dc2626", bg: "#fee2e2", border: "#fecaca" },
  late:     { label: "Late",     color: "#d97706", bg: "#fef9c3", border: "#fde68a" },
  half_day: { label: "Half Day", color: "#7c3aed", bg: "#f5f3ff", border: "#e9d5ff" },
  leave:    { label: "On Leave", color: "#0891b2", bg: "#e0f2fe", border: "#bae6fd" },
  holiday:  { label: "Holiday",  color: "#be185d", bg: "#fce7f3", border: "#f9a8d4" },
  weekend:  { label: "Weekend",  color: "#94a3b8", bg: "#f1f5f9", border: "#e2e8f0" },
};

// ─── Punch helpers ───────────────────────────────────────────────────────────
// Backend sends punches: [{ type: "in"|"out", time: ISOString }, ...]
// Falls back to legacy checkIn / checkOut if punches array is absent

const getFirstIn = (r) => {
  if (r.punches?.length) {
    const first = r.punches.find(p => p.type === "in");
    return first?.time || null;
  }
  return r.checkIn || r.first_in || null;
};

const getLastOut = (r) => {
  if (r.punches?.length) {
    const outs = r.punches.filter(p => p.type === "out");
    return outs.length ? outs[outs.length - 1].time : null;
  }
  return r.checkOut || r.last_out || null;
};

const hasMissingOut = (r, dateStr) => {
  const firstIn  = getFirstIn(r);
  const lastOut  = getLastOut(r);
  if (!firstIn) return false;
  if (lastOut)  return false;

  // If it's today and before 8 PM, still working — not flagged yet
  const today = new Date().toISOString().split("T")[0];
  if (dateStr === today) {
    return new Date().getHours() >= 20;
  }
  return true;
};

// ─── Time calculations ───────────────────────────────────────────────────────

const calcLateMinutes = (checkIn) => {
  if (!checkIn) return 0;
  const d = new Date(checkIn);
  const total = d.getHours() * 60 + d.getMinutes();
  const grace = 9 * 60 + 60;
  return Math.max(total - grace, 0);
};

const calcEarlyOut = (checkOut) => {
  if (!checkOut) return 0;
  const d = new Date(checkOut);
  const total = d.getHours() * 60 + d.getMinutes();
  return Math.max(SHIFT_END_TOTAL - total, 0);
};

const calcOvertime = (checkOut) => {
  if (!checkOut) return 0;
  const d = new Date(checkOut);
  const total = d.getHours() * 60 + d.getMinutes();
  return Math.max(total - SHIFT_END_TOTAL, 0);
};

const fmtMins = (mins) => {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`;
};

const workHrsFromPunches = (r) => {
  const firstIn = getFirstIn(r);
  const lastOut = getLastOut(r);

  if (!firstIn) return "—";
  if (!lastOut) return <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 11 }}>🟡 No Out</span>;

  // If backend sends work_hours as string (e.g. "8h 15m"), prefer it
  if (r.work_hours && typeof r.work_hours === "string") return r.work_hours;

  const d = (new Date(lastOut) - new Date(firstIn)) / 3600000;
  return `${Math.floor(d)}h ${pad(Math.round((d % 1) * 60))}m`;
};

// ═══════════════════════════════════════════
//  PUNCH TIMELINE (used inside drawer)
// ═══════════════════════════════════════════
function PunchTimeline({ punches }) {
  if (!punches?.length) {
    return (
      <div style={{ textAlign: "center", padding: "16px 0", color: "#9ca3af", fontSize: 13 }}>
        No punch records found
      </div>
    );
  }

  return (
    <div style={{ position: "relative", paddingLeft: 28 }}>
      {/* Vertical line */}
      <div style={{
        position: "absolute", left: 10, top: 8, bottom: 8,
        width: 2, background: "#e5e7eb", borderRadius: 2,
      }} />

      {punches.map((p, idx) => {
        const isIn  = p.type === "in";
        const color = isIn ? "#16a34a" : "#dc2626";
        const bg    = isIn ? "#dcfce7" : "#fee2e2";

        return (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: idx < punches.length - 1 ? 12 : 0 }}>
            {/* Dot */}
            <div style={{
              position: "absolute", left: 5,
              width: 12, height: 12, borderRadius: "50%",
              background: color, border: "2px solid #fff",
              boxShadow: `0 0 0 2px ${color}33`,
            }} />

            {/* Card */}
            <div style={{
              background: bg, border: `1px solid ${color}33`,
              borderRadius: 10, padding: "8px 14px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flex: 1,
            }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color, textTransform: "uppercase" }}>
                  {isIn ? "🟢 Punch In" : "🔴 Punch Out"}
                </span>
                {p.method && (
                  <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 8 }}>· {p.method}</span>
                )}
              </div>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#111827", fontFamily: "monospace" }}>
                {fmt(p.time)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
//  EMPLOYEE DETAIL DRAWER
// ═══════════════════════════════════════════
function EmployeeDrawer({ record, date, onClose, onEdit }) {
  const [monthSummary, setMonthSummary] = useState(null);
  const [loadingMonth, setLoadingMonth] = useState(false);

  const emp      = record?.employee;
  const meta     = STATUS_META[record?.status] || STATUS_META.absent;

  // Resolve times from punches[] or legacy fields
  const firstIn  = getFirstIn(record);
  const lastOut  = getLastOut(record);
  const punches  = record?.punches || (
    // Build synthetic punches array from legacy checkIn/checkOut for display
    [
      record?.checkIn  ? { type: "in",  time: record.checkIn,  method: record.method || "Manual" } : null,
      record?.checkOut ? { type: "out", time: record.checkOut, method: record.method || "Manual" } : null,
    ].filter(Boolean)
  );

  const lateMinutes  = calcLateMinutes(firstIn);
  const earlyOutMins = firstIn && !lastOut ? 0 : calcEarlyOut(lastOut);
  const overtimeMins = calcOvertime(lastOut);
  const missingPunch = hasMissingOut(record, date);

  const workHrs = () => {
    if (!firstIn) return "—";
    if (!lastOut) return "Ongoing";
    if (record.work_hours) return record.work_hours;
    const d = (new Date(lastOut) - new Date(firstIn)) / 3600000;
    return `${Math.floor(d)}h ${pad(Math.round((d % 1) * 60))}m`;
  };

  // Fetch this month's summary for the employee
  useEffect(() => {
    if (!emp?._id) return;
    const d = new Date(date);
    const year  = d.getFullYear();
    const month = d.getMonth() + 1;
    setLoadingMonth(true);
    axios.get(
      `${API_BASE}/api/attendance/monthly-report?year=${year}&month=${month}`,
      { headers: authHeader() }
    )
      .then(res => {
        const allData = res.data?.data || [];
        const found = allData.find(r =>
          r._id === emp._id ||
          r.employee_id === emp._id ||
          r.employeeId === (emp.employeeId || emp.employee_code)
        );
        setMonthSummary(found || null);
      })
      .catch(() => setMonthSummary(null))
      .finally(() => setLoadingMonth(false));
  }, [emp?._id, date]);

  const monthName = new Date(date).toLocaleString("en-IN", { month: "long" });

  const Row = ({ label, value, valueColor }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: valueColor || "#111827" }}>{value}</span>
    </div>
  );

  const StatBox = ({ label, value, color, bg }) => (
    <div style={{ background: bg || "#f8fafc", borderRadius: 10, padding: "12px 10px", textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: color || "#111827" }}>{value ?? "—"}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: color || "#6b7280", opacity: 0.85, marginTop: 3 }}>{label}</div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 9998 }} />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(440px, 95vw)",
        background: "#fff", zIndex: 9999,
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column",
        borderRadius: "16px 0 0 16px", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ background: "#111827", padding: "20px 20px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 46, height: 46, background: "#374151", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
                {(emp?.name || "?").charAt(0)}
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>{emp?.name || "—"}</div>
                <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 3 }}>
                  {emp?.employeeId || emp?.employee_code || "—"} · {emp?.department || "—"}
                </div>
                <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{emp?.designation || ""}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "#374151", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} />
            </button>
          </div>

          {/* Status + Date */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
            <span style={{ background: meta.bg, color: meta.color, padding: "4px 12px", borderRadius: 20, fontWeight: 800, fontSize: 12 }}>{meta.label}</span>
            <span style={{ color: "#6b7280", fontSize: 12 }}>{fmtD(date)}</span>
            {record?.shift && (
              <span style={{ color: "#6b7280", fontSize: 11, marginLeft: "auto" }}>🕐 {record.shift}</span>
            )}
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {/* ── Today's Time Summary ── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
              ⏰ Time Summary
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "4px 14px" }}>
              <Row label="First In"   value={fmt(firstIn)  || "—"} valueColor="#16a34a" />
              <Row label="Last Out"   value={lastOut ? fmt(lastOut) : missingPunch ? "⚠ Pending" : "—"} valueColor={lastOut ? "#dc2626" : "#f59e0b"} />
              <Row label="Work Hours" value={workHrs()} valueColor="#2563eb" />
              {punches.length > 0 && (
                <Row label="Total Punches" value={`${punches.length} punches`} valueColor="#6b7280" />
              )}
              {record?.remark && (
                <div style={{ padding: "9px 0", fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
                  Remark: {record.remark}
                </div>
              )}
            </div>
          </div>

          {/* ── Punch History Timeline ── */}
          {punches.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
                🕐 Punch History ({punches.length})
              </div>
              <PunchTimeline punches={punches} />
            </div>
          )}

          {/* ── Flags ── */}
          {(lateMinutes > 0 || earlyOutMins > 0 || overtimeMins > 0 || missingPunch) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
                🚩 Flags
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lateMinutes > 0 && (
                  <div style={{ background: "#fef9c3", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#92400e", fontWeight: 600 }}>Late Arrival</span>
                    <span style={{ fontSize: 13, color: "#d97706", fontWeight: 800 }}>{fmtMins(lateMinutes)}</span>
                  </div>
                )}
                {earlyOutMins > 0 && (
                  <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#6b21a8", fontWeight: 600 }}>Early Out</span>
                    <span style={{ fontSize: 13, color: "#9333ea", fontWeight: 800 }}>{fmtMins(earlyOutMins)}</span>
                  </div>
                )}
                {overtimeMins > 0 && (
                  <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}>Overtime</span>
                    <span style={{ fontSize: 13, color: "#047857", fontWeight: 800 }}>{fmtMins(overtimeMins)}</span>
                  </div>
                )}
                {missingPunch && (
                  <div style={{ background: "#fff1f2", border: "1px solid #fda4af", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "#9f1239", fontWeight: 600 }}>Missing Punch Out</span>
                    <span style={{ fontSize: 13, color: "#b91c1c", fontWeight: 800 }}>No Out</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Monthly Summary ── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
              📅 {monthName} Summary
            </div>
            {loadingMonth ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af", fontSize: 13 }}>Loading...</div>
            ) : monthSummary ? (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <StatBox label="Present"  value={monthSummary.present}  color="#16a34a" bg="#dcfce7" />
                  <StatBox label="Absent"   value={monthSummary.absent}   color="#dc2626" bg="#fee2e2" />
                  <StatBox label="Late"     value={monthSummary.late}     color="#d97706" bg="#fef9c3" />
                  <StatBox label="On Leave" value={monthSummary.on_leave} color="#0891b2" bg="#e0f2fe" />
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Attendance Rate</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: (monthSummary.attendance_pct || 0) >= 90 ? "#16a34a" : (monthSummary.attendance_pct || 0) >= 75 ? "#d97706" : "#dc2626" }}>
                      {monthSummary.attendance_pct || 0}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3 }}>
                    <div style={{ width: `${monthSummary.attendance_pct || 0}%`, height: "100%", borderRadius: 3, background: (monthSummary.attendance_pct || 0) >= 90 ? "#16a34a" : (monthSummary.attendance_pct || 0) >= 75 ? "#d97706" : "#dc2626", transition: "width 0.5s ease" }} />
                  </div>
                  {monthSummary.avg_work_hours && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
                      Avg work hours: <strong style={{ color: "#2563eb" }}>{monthSummary.avg_work_hours}</strong>
                    </div>
                  )}
                  {monthSummary.total_late_minutes > 0 && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                      Total late time: <strong style={{ color: "#d97706" }}>{fmtMins(monthSummary.total_late_minutes)}</strong>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "16px 0", color: "#9ca3af", fontSize: 13 }}>
                No monthly data available
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Close</button>
          <button onClick={() => { onClose(); onEdit(); }} style={{ flex: 2, padding: "10px 0", borderRadius: 10, background: "#111827", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <Edit3 size={14} />{firstIn ? "Edit Attendance" : "Mark Attendance"}
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════
//  HR MARK MODAL
// ═══════════════════════════════════════════
function HRMarkModal({ employee, date, existing, onSave, onClose }) {
  // For HR mark modal, we use first punch in / last punch out
  const existingFirstIn  = existing ? getFirstIn(existing)  : null;
  const existingLastOut  = existing ? getLastOut(existing)  : null;

  const [form, setForm] = useState({
    status:   existing?.status || "present",
    checkIn:  existingFirstIn  ? new Date(existingFirstIn).toTimeString().slice(0, 5)  : "09:45",
    checkOut: existingLastOut  ? new Date(existingLastOut).toTimeString().slice(0, 5) : "19:00",
    shift:    existing?.shift  || "General (9:45 AM – 7:00 PM)",
    remark:   existing?.remark || "",
  });
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/attendance/hr-mark`, {
        employee_id: employee._id,
        date,
        status:   form.status,
        checkIn:  form.checkIn  ? `${date}T${form.checkIn}:00`  : null,
        checkOut: form.checkOut ? `${date}T${form.checkOut}:00` : null,
        shift:    form.shift,
        remark:   form.remark,
      }, { headers: authHeader() });
      onSave("success", `✅ ${employee.name} — attendance marked!`);
    } catch (err) {
      onSave("error", err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  const inp = {
    width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb",
    borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "#f9fafb",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 28, width: "90%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 800 }}>Mark Attendance</h5>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              {employee.name} · {employee.employeeId || employee.employee_code} · {fmtD(date)}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18, color: "#6b7280" }}>×</button>
        </div>

        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>Status</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {Object.entries(STATUS_META).filter(([k]) => !["weekend", "holiday"].includes(k)).map(([k, m]) => (
            <button key={k} onClick={() => setForm(f => ({ ...f, status: k }))} style={{
              padding: "5px 13px", borderRadius: 20,
              border: `2px solid ${form.status === k ? m.color : "#e5e7eb"}`,
              background: form.status === k ? m.bg : "#fff",
              color: form.status === k ? m.color : "#6b7280",
              fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            }}>{m.label}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[["checkIn", "Check In (First)"], ["checkOut", "Check Out (Last)"]].map(([key, label]) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>{label}</label>
              <input type="time" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inp} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>Shift</label>
          <input value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))} style={inp} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>HR Remark</label>
          <textarea rows={2} placeholder="Optional..." value={form.remark}
            onChange={e => setForm(f => ({ ...f, remark: e.target.value }))}
            style={{ ...inp, resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handle} disabled={saving} style={{ flex: 2, padding: "10px 0", borderRadius: 10, background: "#111827", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <Save size={14} />{saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  DAILY TAB
// ═══════════════════════════════════════════
function DailyTab() {
  const [date,         setDate]         = useState(todayStr());
  const [data,         setData]         = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter,   setDeptFilter]   = useState("all");
  const [flagFilter,   setFlagFilter]   = useState("all");
  const [markModal,    setMarkModal]    = useState(null);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const [toast,        setToast]        = useState(null);

  useEffect(() => { fetchData(); }, [date]);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/attendance/daily?date=${date}`, { headers: authHeader() });
      setData(res.data?.data || []);
    } catch { showToast("error", "Failed to load"); }
    finally { setLoading(false); }
  };

  const departments = ["all", ...new Set(data.map(r => r.employee?.department).filter(Boolean))];

  // Enrich each row using punches[] (or legacy checkIn/checkOut)
  const enriched = data.map(r => ({
    ...r,
    _firstIn:     getFirstIn(r),
    _lastOut:     getLastOut(r),
    lateMinutes:  calcLateMinutes(getFirstIn(r)),
    earlyOutMins: getFirstIn(r) && !getLastOut(r) ? 0 : calcEarlyOut(getLastOut(r)),
    overtimeMins: calcOvertime(getLastOut(r)),
    missingPunch: hasMissingOut(r, date),
  }));

  const filtered = enriched.filter(r => {
    const matchS = !search || (r.employee?.name || "").toLowerCase().includes(search.toLowerCase()) || (r.employee?.employeeId || r.employee?.employee_code || "").toLowerCase().includes(search.toLowerCase());
    const matchF = statusFilter === "all" || r.status === statusFilter;
    const matchD = deptFilter   === "all" || r.employee?.department === deptFilter;
    const matchFlag =
      flagFilter === "all"           ? true :
      flagFilter === "late"          ? r.lateMinutes > 0 :
      flagFilter === "early_out"     ? r.earlyOutMins > 0 :
      flagFilter === "overtime"      ? r.overtimeMins > 0 :
      flagFilter === "missing_punch" ? r.missingPunch :
      true;
    return matchS && matchF && matchD && matchFlag;
  });

  const s = {
    total:        data.length,
    present:      data.filter(r => r.status === "present").length,
    late:         data.filter(r => r.status === "late").length,
    absent:       data.filter(r => r.status === "absent").length,
    leave:        data.filter(r => r.status === "leave").length,
    halfDay:      data.filter(r => r.status === "half_day").length,
    missingPunch: enriched.filter(r => r.missingPunch).length,
    overtime:     enriched.filter(r => r.overtimeMins > 0).length,
    earlyOut:     enriched.filter(r => r.earlyOutMins > 0).length,
  };

  const SUMMARY = [
    { label: "Total",         value: s.total,        color: "#111827", bg: "#f1f5f9", border: "#e2e8f0", flag: "all" },
    { label: "Present",       value: s.present,      color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", flag: "all" },
    { label: "Late",          value: s.late,         color: "#d97706", bg: "#fef9c3", border: "#fde68a", flag: "late" },
    { label: "Absent",        value: s.absent,       color: "#dc2626", bg: "#fee2e2", border: "#fecaca", flag: "all" },
    { label: "On Leave",      value: s.leave,        color: "#0891b2", bg: "#e0f2fe", border: "#bae6fd", flag: "all" },
    { label: "Half Day",      value: s.halfDay,      color: "#7c3aed", bg: "#f5f3ff", border: "#e9d5ff", flag: "all" },
    { label: "Missing Punch", value: s.missingPunch, color: "#b91c1c", bg: "#fff1f2", border: "#fda4af", flag: "missing_punch" },
    { label: "Overtime",      value: s.overtime,     color: "#047857", bg: "#ecfdf5", border: "#6ee7b7", flag: "overtime" },
    { label: "Early Out",     value: s.earlyOut,     color: "#9333ea", bg: "#faf5ff", border: "#d8b4fe", flag: "early_out" },
  ];

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 24, zIndex: 10001, background: toast.type === "error" ? "#ef4444" : "#16a34a", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          {toast.msg}
        </div>
      )}

      {drawerRecord && (
        <EmployeeDrawer
          record={drawerRecord}
          date={date}
          onClose={() => setDrawerRecord(null)}
          onEdit={() => setMarkModal({ employee: drawerRecord.employee, existing: drawerRecord._firstIn ? drawerRecord : null })}
        />
      )}

      {markModal && (
        <HRMarkModal
          employee={markModal.employee}
          date={date}
          existing={markModal.existing}
          onSave={(type, msg) => { setMarkModal(null); showToast(type, msg); fetchData(); }}
          onClose={() => setMarkModal(null)}
        />
      )}

      {/* ── Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px,1fr))", gap: 10, marginBottom: 20 }}>
        {SUMMARY.map(c => (
          <div key={c.label}
            onClick={() => setFlagFilter(prev => prev === c.flag && c.flag !== "all" ? "all" : c.flag)}
            style={{ background: c.bg, border: `1.5px solid ${(flagFilter === c.flag && c.flag !== "all") ? c.color : c.border}`, borderRadius: 12, padding: "13px 14px", textAlign: "center", cursor: c.flag !== "all" ? "pointer" : "default", transition: "all 0.15s", boxShadow: (flagFilter === c.flag && c.flag !== "all") ? `0 0 0 2px ${c.color}33` : "none" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: c.color, opacity: 0.8, marginTop: 4, lineHeight: 1.2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 14, border: "1px solid #e5e7eb", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 12px" }}>
          <CalendarCheck size={13} color="#111827" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ border: "none", background: "transparent", fontSize: 13, fontWeight: 700, outline: "none", fontFamily: "inherit", color: "#111827" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 12px", flex: 1, minWidth: 150 }}>
          <Search size={13} color="#9ca3af" />
          <input placeholder="Search name or code..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 12px" }}>
          <Filter size={13} color="#9ca3af" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", fontFamily: "inherit", fontWeight: 600 }}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 12px" }}>
          <Users size={13} color="#9ca3af" />
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", fontFamily: "inherit", fontWeight: 600 }}>
            {departments.map(d => <option key={d} value={d}>{d === "all" ? "All Depts" : d}</option>)}
          </select>
        </div>

        <button onClick={fetchData} style={{ background: "#111827", border: "none", borderRadius: 9, padding: "7px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 13, color: "#fff", fontFamily: "inherit" }}>
          <RefreshCw size={13} />Refresh
        </button>
      </div>

      {/* Flag filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { id: "all",           label: "All" },
          { id: "late",          label: "⏰ Late Arrivals" },
          { id: "early_out",     label: "🏃 Early Out" },
          { id: "overtime",      label: "💼 Overtime" },
          { id: "missing_punch", label: "🔴 Missing Punch" },
        ].map(f => (
          <button key={f.id} onClick={() => setFlagFilter(f.id)} style={{
            padding: "5px 13px", borderRadius: 20, border: `1.5px solid ${flagFilter === f.id ? "#111827" : "#e5e7eb"}`,
            background: flagFilter === f.id ? "#111827" : "#fff",
            color: flagFilter === f.id ? "#fff" : "#6b7280",
            fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>{f.label}</button>
        ))}
      </div>

      {/* ── Table ── */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "13px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>
            {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{filtered.length} employees</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}><div className="spinner-border text-dark" role="status" /></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["#", "Employee", "Dept", "Status", "First In", "Last Out", "Work Hrs", "Punches", "Flags", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap", borderBottom: "2px solid #e5e7eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: "center", padding: "44px 0", color: "#d1d5db" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>No records found
                  </td></tr>
                ) : filtered.map((r, i) => {
                  const meta    = STATUS_META[r.status] || STATUS_META.absent;
                  const hrs     = workHrsFromPunches(r);
                  const punchCount = r.punches?.length || (r.checkIn ? (r.checkOut ? 2 : 1) : 0);
                  const flags = [];
                  if (r.lateMinutes > 0)  flags.push({ label: `Late ${fmtMins(r.lateMinutes)}`,  color: "#d97706", bg: "#fef9c3" });
                  if (r.earlyOutMins > 0) flags.push({ label: `Early ${fmtMins(r.earlyOutMins)}`, color: "#9333ea", bg: "#faf5ff" });
                  if (r.overtimeMins > 0) flags.push({ label: `OT ${fmtMins(r.overtimeMins)}`,   color: "#047857", bg: "#ecfdf5" });
                  if (r.missingPunch)     flags.push({ label: "No Out",                            color: "#b91c1c", bg: "#fff1f2" });

                  return (
                    <tr key={i}
                      style={{ borderBottom: "1px solid #f1f5f9", background: r.missingPunch ? "#fff9f9" : "transparent" }}
                      onMouseEnter={e => e.currentTarget.style.background = r.missingPunch ? "#fff1f2" : "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = r.missingPunch ? "#fff9f9" : "transparent"}>

                      <td style={{ padding: "10px 14px", color: "#9ca3af", fontWeight: 600 }}>{i + 1}</td>

                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, background: "#111827", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                            {(r.employee?.name || "?").charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#111827" }}>{r.employee?.name || "—"}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>{r.employee?.employeeId || r.employee?.employee_code || ""}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "10px 14px", color: "#6b7280" }}>{r.employee?.department || "—"}</td>

                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ background: meta.bg, color: meta.color, padding: "3px 10px", borderRadius: 20, fontWeight: 800, fontSize: 11 }}>{meta.label}</span>
                      </td>

                      {/* First In */}
                      <td style={{ padding: "10px 14px", color: "#16a34a", fontWeight: 700, fontFamily: "monospace" }}>
                        {fmt(r._firstIn)}
                      </td>

                      {/* Last Out */}
                      <td style={{ padding: "10px 14px", fontWeight: 700, fontFamily: "monospace" }}>
                        {r._lastOut
                          ? <span style={{ color: "#dc2626" }}>{fmt(r._lastOut)}</span>
                          : r._firstIn
                            ? <span style={{ color: "#f59e0b", fontSize: 11 }}>⚠ Pending</span>
                            : "—"}
                      </td>

                      {/* Work Hrs */}
                      <td style={{ padding: "10px 14px", color: "#2563eb", fontWeight: 700 }}>
                        {typeof hrs === "string" ? hrs : hrs}
                      </td>

                      {/* Punch Count badge */}
                      <td style={{ padding: "10px 14px" }}>
                        {punchCount > 0 ? (
                          <span style={{
                            background: punchCount > 2 ? "#eff6ff" : "#f1f5f9",
                            color: punchCount > 2 ? "#2563eb" : "#6b7280",
                            border: `1px solid ${punchCount > 2 ? "#bfdbfe" : "#e2e8f0"}`,
                            padding: "2px 9px", borderRadius: 10, fontSize: 11, fontWeight: 800,
                          }}>
                            {punchCount} {punchCount > 2 ? "🔄" : ""}
                          </span>
                        ) : (
                          <span style={{ color: "#d1d5db", fontSize: 11 }}>—</span>
                        )}
                      </td>

                      {/* Flags */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {flags.length === 0
                            ? <span style={{ color: "#d1d5db", fontSize: 11 }}>—</span>
                            : flags.map((f, fi) => (
                              <span key={fi} style={{ background: f.bg, color: f.color, padding: "2px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{f.label}</span>
                            ))}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => setDrawerRecord(r)}
                            style={{ background: "#f1f5f9", color: "#374151", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Eye size={11} />View
                          </button>
                          <button
                            onClick={() => setMarkModal({ employee: r.employee, existing: r._firstIn ? r : null })}
                            style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Edit3 size={11} />{r._firstIn ? "Edit" : "Mark"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  MONTHLY TAB  (unchanged from original)
// ═══════════════════════════════════════════
function MonthlyTab() {
  const [year,      setYear]      = useState(new Date().getFullYear());
  const [month,     setMonth]     = useState(new Date().getMonth() + 1);
  const [data,      setData]      = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search,    setSearch]    = useState("");
  const [sortKey,   setSortKey]   = useState("name");
  const [sortDir,   setSortDir]   = useState("asc");
  const [toast,     setToast]     = useState(null);

  useEffect(() => { fetchData(); }, [year, month]);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/attendance/monthly-report?year=${year}&month=${month}`, { headers: authHeader() });
      setData(res.data?.data || []);
    } catch { showToast("error", "Failed to load"); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API_BASE}/api/attendance/export?year=${year}&month=${month}`,
        { headers: authHeader(), responseType: "blob" });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `Attendance_${month}_${year}.xlsx`);
      document.body.appendChild(link); link.click(); link.remove();
      showToast("success", "📥 Excel exported!");
    } catch { showToast("error", "Export failed"); }
    finally { setExporting(false); }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = data
    .filter(r => !search || r.name?.toLowerCase().includes(search.toLowerCase()) || (r.employeeId || r.employee_code || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const totalPresent  = data.reduce((s, r) => s + (r.present  || 0), 0);
  const totalAbsent   = data.reduce((s, r) => s + (r.absent   || 0), 0);
  const totalLate     = data.reduce((s, r) => s + (r.late     || 0), 0);
  const totalOT       = data.reduce((s, r) => s + (r.overtime_days || 0), 0);
  const avgAttendance = data.length ? Math.round(data.reduce((s, r) => s + (r.attendance_pct || 0), 0) / data.length) : 0;

  const SortTh = ({ label, k }) => (
    <th onClick={() => toggleSort(k)} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: sortKey === k ? "#111827" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px", whiteSpace: "nowrap", borderBottom: "2px solid #e5e7eb", cursor: "pointer", userSelect: "none" }}>
      {label} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 24, zIndex: 9999, background: toast.type === "error" ? "#ef4444" : "#16a34a", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Employees",      value: data.length,         color: "#111827", bg: "#f1f5f9", border: "#e2e8f0" },
          { label: "Total Present",  value: totalPresent,        color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
          { label: "Total Absent",   value: totalAbsent,         color: "#dc2626", bg: "#fee2e2", border: "#fecaca" },
          { label: "Total Late",     value: totalLate,           color: "#d97706", bg: "#fef9c3", border: "#fde68a" },
          { label: "OT Days",        value: totalOT,             color: "#047857", bg: "#ecfdf5", border: "#6ee7b7" },
          { label: "Avg Attendance", value: `${avgAttendance}%`, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: c.color, opacity: 0.8, marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 14, border: "1px solid #e5e7eb", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 12px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Month:</span>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            style={{ border: "none", background: "transparent", fontSize: 13, fontWeight: 600, outline: "none", fontFamily: "inherit" }}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString("en-IN", { month: "long" })}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 12px" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Year:</span>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ border: "none", background: "transparent", fontSize: 13, fontWeight: 600, outline: "none", fontFamily: "inherit" }}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 9, padding: "7px 12px", flex: 1, minWidth: 150 }}>
          <Search size={13} color="#9ca3af" />
          <input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%" }} />
        </div>

        <button onClick={fetchData} style={{ background: "#111827", border: "none", borderRadius: 9, padding: "7px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 13, color: "#fff", fontFamily: "inherit" }}>
          <RefreshCw size={13} />Refresh
        </button>

        <button onClick={handleExport} disabled={exporting} style={{ background: "#16a34a", border: "none", borderRadius: 9, padding: "7px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 13, color: "#fff", fontFamily: "inherit", marginLeft: "auto" }}>
          <Download size={13} />{exporting ? "Exporting..." : "Export Excel"}
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "13px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#111827" }}>
            {new Date(year, month - 1).toLocaleString("en-IN", { month: "long" })} {year} — Summary
          </span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{filtered.length} employees</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}><div className="spinner-border text-dark" role="status" /></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.4px", borderBottom: "2px solid #e5e7eb" }}>#</th>
                  <SortTh label="Employee"    k="name" />
                  <SortTh label="Code"        k="employeeId" />
                  <SortTh label="Dept"        k="department" />
                  <SortTh label="Work Days"   k="work_days" />
                  <SortTh label="Present"     k="present" />
                  <SortTh label="Late"        k="late" />
                  <SortTh label="Half Day"    k="half_day" />
                  <SortTh label="On Leave"    k="on_leave" />
                  <SortTh label="Absent"      k="absent" />
                  <SortTh label="OT Days"     k="overtime_days" />
                  <SortTh label="Avg Hrs"     k="avg_work_hours_num" />
                  <SortTh label="Attendance%" k="attendance_pct" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={13} style={{ textAlign: "center", padding: "44px 0", color: "#d1d5db" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>No data for this period
                  </td></tr>
                ) : filtered.map((r, i) => {
                  const pct    = r.attendance_pct || 0;
                  const pctClr = pct >= 90 ? "#16a34a" : pct >= 75 ? "#d97706" : "#dc2626";
                  const pctBg  = pct >= 90 ? "#dcfce7" : pct >= 75 ? "#fef9c3" : "#fee2e2";
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "10px 14px", color: "#9ca3af", fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, background: "#111827", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                            {(r.name || "?").charAt(0)}
                          </div>
                          <span style={{ fontWeight: 700, color: "#111827" }}>{r.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: 12 }}>{r.employeeId || r.employee_code || "—"}</td>
                      <td style={{ padding: "10px 14px", color: "#6b7280" }}>{r.department}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 700 }}>{r.work_days}</td>
                      <td style={{ padding: "10px 14px" }}><span style={{ color: "#16a34a", fontWeight: 800 }}>{r.present}</span></td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ color: "#d97706", fontWeight: 800 }}>{r.late}</span>
                        {r.total_late_minutes > 0 && (
                          <div style={{ fontSize: 10, color: "#9ca3af" }}>{fmtMins(r.total_late_minutes)} total</div>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px" }}><span style={{ color: "#7c3aed", fontWeight: 800 }}>{r.half_day}</span></td>
                      <td style={{ padding: "10px 14px" }}><span style={{ color: "#0891b2", fontWeight: 800 }}>{r.on_leave}</span></td>
                      <td style={{ padding: "10px 14px" }}><span style={{ color: "#dc2626", fontWeight: 800 }}>{r.absent}</span></td>
                      <td style={{ padding: "10px 14px" }}>
                        {r.overtime_days > 0
                          ? <span style={{ color: "#047857", fontWeight: 800 }}>{r.overtime_days} <span style={{ fontSize: 10, fontWeight: 500 }}>days</span></span>
                          : <span style={{ color: "#9ca3af" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#2563eb", fontWeight: 700 }}>{r.avg_work_hours}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ flex: 1, height: 5, background: "#e5e7eb", borderRadius: 3, minWidth: 50 }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: pctClr, borderRadius: 3 }} />
                          </div>
                          <span style={{ background: pctBg, color: pctClr, padding: "2px 9px", borderRadius: 20, fontWeight: 800, fontSize: 11, whiteSpace: "nowrap" }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════
export default function HRAttendancePage() {
  const [activeTab, setActiveTab] = useState("daily");

  const TABS = [
    { id: "daily",   label: "📅 Daily Attendance" },
    { id: "monthly", label: "📊 Monthly Report"   },
  ];

  return (
    <div style={{ padding: "20px 24px", background: "#f4f6fb", minHeight: "100vh" }}>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontWeight: 800, color: "#111827", margin: 0, fontSize: 18 }}>Attendance Management</h4>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 3 }}>View, manage and export employee attendance</p>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#fff", borderRadius: 10, padding: 4, border: "1px solid #e5e7eb", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "8px 20px", borderRadius: 8, border: "none", fontFamily: "inherit",
            fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s",
            background: activeTab === t.id ? "#111827" : "transparent",
            color:       activeTab === t.id ? "#fff"    : "#6b7280",
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab === "daily"   && <DailyTab />}
      {activeTab === "monthly" && <MonthlyTab />}
    </div>
  );
}