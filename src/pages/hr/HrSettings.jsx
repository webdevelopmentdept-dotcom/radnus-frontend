import { useState, useEffect } from "react";
import axios from "axios";
import { Save, Plus, Trash2, RefreshCw, Clock, Calendar, Palmtree } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const getToken = () => localStorage.getItem("hrToken") || localStorage.getItem("token") || sessionStorage.getItem("hrToken");
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Toast ──
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", top: 20, right: 24, zIndex: 9999,
      background: toast.type === "error" ? "#ef4444" : "#16a34a",
      color: "#fff", padding: "12px 20px", borderRadius: 10,
      fontWeight: 700, fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
    }}>{toast.msg}</div>
  );
}

/* ════════════════════════════
   TAB 1 — SHIFT CONFIG
════════════════════════════ */
function ShiftTab({ showToast }) {
  const [form, setForm] = useState({
    shift_name:        "General Shift",
    start_time:        "09:45",
    grace_minutes:     15,
    end_time:          "19:00",
    lunch_duration:    60,
    half_day_hours:    4,
    work_days:         ["Mon","Tue","Wed","Thu","Fri","Sat"],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/api/hr/settings/shift`, { headers: authHeader() })
      .then(r => { if (r.data?.data) setForm(r.data.data); })
      .catch(() => {});
  }, []);

  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      work_days: f.work_days.includes(day)
        ? f.work_days.filter(d => d !== day)
        : [...f.work_days, day]
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/hr/settings/shift`, form, { headers: authHeader() });
      showToast("success", "✅ Shift settings saved!");
    } catch { showToast("error", "Failed to save"); }
    finally { setSaving(false); }
  };

  const inp = {
    width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb",
    borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit",
    background: "#f9fafb", color: "#111827", boxSizing: "border-box",
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <label style={lbl}>Shift Name</label>
          <input value={form.shift_name} onChange={e => setForm(f => ({ ...f, shift_name: e.target.value }))} style={inp} placeholder="e.g. General Shift" />
        </div>
        <div>
          <label style={lbl}>Start Time</label>
          <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} style={inp} />
        </div>
        <div>
          <label style={lbl}>Grace Period (minutes)</label>
          <input type="number" value={form.grace_minutes} onChange={e => setForm(f => ({ ...f, grace_minutes: Number(e.target.value) }))} style={inp} min={0} max={60} />
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9ca3af" }}>Late after: {(() => { const [h,m] = form.start_time.split(":").map(Number); const total = h*60+m+Number(form.grace_minutes); return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`; })()} AM</p>
        </div>
        <div>
          <label style={lbl}>End Time</label>
          <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} style={inp} />
        </div>
        <div>
          <label style={lbl}>Lunch Duration (minutes)</label>
          <input type="number" value={form.lunch_duration} onChange={e => setForm(f => ({ ...f, lunch_duration: Number(e.target.value) }))} style={inp} min={0} max={120} />
        </div>
        <div>
          <label style={lbl}>Half Day Threshold (hours)</label>
          <input type="number" value={form.half_day_hours} onChange={e => setForm(f => ({ ...f, half_day_hours: Number(e.target.value) }))} style={inp} min={1} max={8} />
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9ca3af" }}>Work hrs below this = Half Day</p>
        </div>
      </div>

      {/* Work Days */}
      <div style={{ marginBottom: 24 }}>
        <label style={lbl}>Working Days</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DAYS.map(day => (
            <button key={day} onClick={() => toggleDay(day)} style={{
              padding: "8px 16px", borderRadius: 8, fontFamily: "inherit",
              fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
              border: `2px solid ${form.work_days.includes(day) ? "#111827" : "#e5e7eb"}`,
              background: form.work_days.includes(day) ? "#111827" : "#fff",
              color: form.work_days.includes(day) ? "#fff" : "#6b7280",
            }}>{day}</button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div style={{ background: "#f0f9ff", border: "1.5px solid #bae6fd", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <p style={{ margin: "0 0 10px", fontWeight: 800, fontSize: 13, color: "#0369a1" }}>📋 Shift Preview</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {[
            { label: "Shift",       value: form.shift_name },
            { label: "Start",       value: form.start_time },
            { label: "End",         value: form.end_time },
            { label: "Late After",  value: (() => { const [h,m] = form.start_time.split(":").map(Number); const total = h*60+m+Number(form.grace_minutes); return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`; })() },
            { label: "Lunch Break", value: `${form.lunch_duration} mins` },
            { label: "Working Days",value: form.work_days.join(", ") },
          ].map((s,i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #bae6fd" }}>
              <p style={{ margin: "0 0 2px", fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#0369a1" }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={save} disabled={saving} style={btnPrimary}>
          <Save size={14}/>{saving ? "Saving..." : "Save Shift Settings"}
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════
   TAB 2 — LEAVE TYPES
════════════════════════════ */
function LeaveTypesTab({ showToast }) {
  const [types, setTypes]   = useState([]);
  const [newType, setNewType] = useState({ name: "", days_allowed: 12, paid: true, color: "#16a34a" });
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/api/hr/settings/leave-types`, { headers: authHeader() })
      .then(r => setTypes(r.data?.data || []))
      .catch(() => {});
  }, []);

  const addType = async () => {
    if (!newType.name.trim()) return showToast("error", "Leave type name required!");
    setAdding(true);
    try {
      const res = await axios.post(`${API_BASE}/api/hr/settings/leave-types`, newType, { headers: authHeader() });
      setTypes(prev => [...prev, res.data.data]);
      setNewType({ name: "", days_allowed: 12, paid: true, color: "#16a34a" });
      showToast("success", "✅ Leave type added!");
    } catch { showToast("error", "Failed to add"); }
    finally { setAdding(false); }
  };

  const deleteType = async (id) => {
    if (!window.confirm("Delete this leave type?")) return;
    try {
      await axios.delete(`${API_BASE}/api/hr/settings/leave-types/${id}`, { headers: authHeader() });
      setTypes(prev => prev.filter(t => t._id !== id));
      showToast("success", "Deleted!");
    } catch { showToast("error", "Failed to delete"); }
  };

  const updateType = async (id, field, value) => {
    setTypes(prev => prev.map(t => t._id === id ? { ...t, [field]: value } : t));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/api/hr/settings/leave-types`, { types }, { headers: authHeader() });
      showToast("success", "✅ Leave types saved!");
    } catch { showToast("error", "Failed to save"); }
    finally { setSaving(false); }
  };

  const inp = { padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 7, fontSize: 13, outline: "none", fontFamily: "inherit", background: "#f9fafb" };

  return (
    <div>
      {/* Existing types */}
      <div style={{ marginBottom: 20 }}>
        {types.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", background: "#f8fafc", borderRadius: 10, border: "1px dashed #e5e7eb" }}>
            <p style={{ margin: 0, fontSize: 14 }}>No leave types added yet. Add one below!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {types.map(t => (
              <div key={t._id} style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: t.color, flexShrink: 0, border: "2px solid #e5e7eb" }} />
                <input value={t.name} onChange={e => updateType(t._id, "name", e.target.value)}
                  style={{ ...inp, flex: 1, minWidth: 120, fontWeight: 700 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Days/Year:</span>
                  <input type="number" value={t.days_allowed} onChange={e => updateType(t._id, "days_allowed", Number(e.target.value))}
                    style={{ ...inp, width: 64, textAlign: "center" }} min={1} max={365} />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <input type="checkbox" checked={t.paid} onChange={e => updateType(t._id, "paid", e.target.checked)}
                    style={{ width: 15, height: 15, accentColor: "#16a34a" }} />
                  Paid
                </label>
                <input type="color" value={t.color} onChange={e => updateType(t._id, "color", e.target.value)}
                  style={{ width: 36, height: 32, border: "1.5px solid #e5e7eb", borderRadius: 6, cursor: "pointer", padding: 2 }} />
                <button onClick={() => deleteType(t._id)} style={{ background: "#fee2e2", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer", color: "#dc2626" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new */}
      <div style={{ background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 13, color: "#374151" }}>➕ Add New Leave Type</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="Leave type name (e.g. Sick Leave)" value={newType.name}
            onChange={e => setNewType(f => ({ ...f, name: e.target.value }))}
            style={{ ...inp, flex: 1, minWidth: 160 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Days:</span>
            <input type="number" value={newType.days_allowed}
              onChange={e => setNewType(f => ({ ...f, days_allowed: Number(e.target.value) }))}
              style={{ ...inp, width: 64, textAlign: "center" }} min={1} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <input type="checkbox" checked={newType.paid} onChange={e => setNewType(f => ({ ...f, paid: e.target.checked }))}
              style={{ width: 15, height: 15, accentColor: "#16a34a" }} />
            Paid
          </label>
          <input type="color" value={newType.color} onChange={e => setNewType(f => ({ ...f, color: e.target.value }))}
            style={{ width: 36, height: 32, border: "1.5px solid #e5e7eb", borderRadius: 6, cursor: "pointer", padding: 2 }} />
          <button onClick={addType} disabled={adding} style={{ ...btnPrimary, padding: "8px 16px" }}>
            <Plus size={13}/>{adding ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={saveAll} disabled={saving} style={btnPrimary}>
          <Save size={14}/>{saving ? "Saving..." : "Save All Leave Types"}
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════
   TAB 3 — HOLIDAYS
════════════════════════════ */
function HolidaysTab({ showToast }) {
  const [holidays, setHolidays] = useState([]);
  const [year, setYear]         = useState(new Date().getFullYear());
  const [newH, setNewH]         = useState({ name: "", date: "", type: "public" });
  const [saving, setSaving]     = useState(false);
  const [adding, setAdding]     = useState(false);

  const fetchHolidays = () => {
    axios.get(`${API_BASE}/api/hr/settings/holidays?year=${year}`, { headers: authHeader() })
      .then(r => setHolidays(r.data?.data || []))
      .catch(() => {});
  };

  useEffect(() => { fetchHolidays(); }, [year]);

  const addHoliday = async () => {
    if (!newH.name.trim() || !newH.date) return showToast("error", "Name and date required!");
    setAdding(true);
    try {
      const res = await axios.post(`${API_BASE}/api/hr/settings/holidays`, newH, { headers: authHeader() });
      setHolidays(prev => [...prev, res.data.data].sort((a,b) => new Date(a.date) - new Date(b.date)));
      setNewH({ name: "", date: "", type: "public" });
      showToast("success", "✅ Holiday added!");
    } catch { showToast("error", "Failed to add"); }
    finally { setAdding(false); }
  };

  const deleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;
    try {
      await axios.delete(`${API_BASE}/api/hr/settings/holidays/${id}`, { headers: authHeader() });
      setHolidays(prev => prev.filter(h => h._id !== id));
      showToast("success", "Deleted!");
    } catch { showToast("error", "Failed to delete"); }
  };

  const TYPE_META = {
    public:    { label: "Public Holiday", color: "#dc2626", bg: "#fee2e2" },
    optional:  { label: "Optional",       color: "#d97706", bg: "#fef9c3" },
    company:   { label: "Company Holiday", color: "#2563eb", bg: "#eff6ff" },
  };

  const inp = { padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 7, fontSize: 13, outline: "none", fontFamily: "inherit", background: "#f9fafb" };

  // Group by month
  const grouped = {};
  holidays.forEach(h => {
    const mo = new Date(h.date).getMonth();
    if (!grouped[mo]) grouped[mo] = [];
    grouped[mo].push(h);
  });

  return (
    <div>
      {/* Year selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>Year:</span>
        {[2025, 2026, 2027].map(y => (
          <button key={y} onClick={() => setYear(y)} style={{
            padding: "7px 18px", borderRadius: 8, fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: "pointer",
            border: `2px solid ${year === y ? "#111827" : "#e5e7eb"}`,
            background: year === y ? "#111827" : "#fff",
            color: year === y ? "#fff" : "#6b7280",
          }}>{y}</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{holidays.length} holidays</span>
      </div>

      {/* Holiday list grouped by month */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", background: "#f8fafc", borderRadius: 10, border: "1px dashed #e5e7eb", marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 14 }}>No holidays for {year}. Add below!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
          {Object.entries(grouped).sort(([a],[b]) => a-b).map(([mo, list]) => (
            <div key={mo}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>{MONTHS[mo]}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {list.map(h => {
                  const meta = TYPE_META[h.type] || TYPE_META.public;
                  return (
                    <div key={h._id} style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "11px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ background: meta.bg, color: meta.color, borderRadius: 8, padding: "6px 10px", fontWeight: 800, fontSize: 12, minWidth: 48, textAlign: "center" }}>
                        {new Date(h.date).getDate()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: 13 }}>{h.name}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(h.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</div>
                      </div>
                      <span style={{ background: meta.bg, color: meta.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{meta.label}</span>
                      <button onClick={() => deleteHoliday(h._id)} style={{ background: "#fee2e2", border: "none", borderRadius: 7, padding: "6px 10px", cursor: "pointer", color: "#dc2626" }}>
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new holiday */}
      <div style={{ background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: 12, padding: 16 }}>
        <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 13, color: "#374151" }}>➕ Add Holiday</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="Holiday name (e.g. Pongal)" value={newH.name}
            onChange={e => setNewH(f => ({ ...f, name: e.target.value }))}
            style={{ ...inp, flex: 1, minWidth: 160 }} />
          <input type="date" value={newH.date}
            onChange={e => setNewH(f => ({ ...f, date: e.target.value }))}
            style={{ ...inp }} />
          <select value={newH.type} onChange={e => setNewH(f => ({ ...f, type: e.target.value }))}
            style={{ ...inp }}>
            <option value="public">Public Holiday</option>
            <option value="optional">Optional</option>
            <option value="company">Company Holiday</option>
          </select>
          <button onClick={addHoliday} disabled={adding} style={{ ...btnPrimary, padding: "8px 16px" }}>
            <Plus size={13}/>{adding ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════
   MAIN PAGE
════════════════════════════ */
const TABS = [
  { id: "shift",    label: "⏰ Shift Config",   icon: Clock    },
  { id: "leaves",  label: "🏖️ Leave Types",    icon: Palmtree },
  { id: "holidays",label: "📅 Holidays",        icon: Calendar },
];

export default function HrSettings() {
  const [activeTab, setActiveTab] = useState("shift");
  const [toast, setToast]         = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div style={{ padding: "20px 24px", background: "#f4f6fb", minHeight: "100vh" }}>
      <Toast toast={toast} />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontWeight: 800, color: "#111827", margin: 0, fontSize: 18 }}>⚙️ HR Settings</h4>
        <p style={{ color: "#6b7280", fontSize: 13, marginTop: 3 }}>Configure shift timings, leave types and company holidays</p>
      </div>

      {/* Tab buttons */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#fff", borderRadius: 12, padding: 5, border: "1px solid #e5e7eb", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "9px 22px", borderRadius: 9, border: "none", fontFamily: "inherit",
            fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.2s",
            background: activeTab === t.id ? "#111827" : "transparent",
            color:      activeTab === t.id ? "#fff"    : "#6b7280",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content card */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 28 }}>
        {activeTab === "shift"    && <ShiftTab     showToast={showToast} />}
        {activeTab === "leaves"   && <LeaveTypesTab showToast={showToast} />}
        {activeTab === "holidays" && <HolidaysTab  showToast={showToast} />}
      </div>
    </div>
  );
}

// ── Shared styles ──
const lbl = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 };
const btnPrimary = {
  padding: "9px 20px", border: "none", borderRadius: 9,
  background: "#111827", color: "#fff", fontWeight: 700,
  fontSize: 13, cursor: "pointer", fontFamily: "inherit",
  display: "inline-flex", alignItems: "center", gap: 6,
};