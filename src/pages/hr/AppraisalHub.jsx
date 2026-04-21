import { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus, Search, Eye, Edit2, Trash2,
  CheckCircle, Clock, TrendingUp, Users,
  X, Save, Send
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const COLORS = {
  blue:   "#2563eb",
  green:  "#16a34a",
  amber:  "#d97706",
  red:    "#dc2626",
  purple: "#7c3aed",
  gray:   "#6b7280",
};

const RATING_COLORS = {
  Excellent: COLORS.green,
  Good:      COLORS.blue,
  Average:   COLORS.amber,
  Poor:      COLORS.red,
  "":        COLORS.gray,
};

const TYPE_OPTIONS   = ["Annual", "Half-Yearly", "Quarterly", "Probation", "Special"];
const RATING_OPTIONS = ["Excellent", "Good", "Average", "Poor"];

const STYLES = `
  .ah-page { padding: 28px 32px; }
  .ah-header { flex-direction: row; align-items: flex-start; }
  .ah-stats { grid-template-columns: repeat(4, 1fr); }
  .ah-filters { flex-direction: row; align-items: center; }
  .ah-filter-btns { flex-wrap: nowrap; }
  .ah-table-wrap { display: block !important; }
  .ah-card-list  { display: none  !important; }
  .ah-form-grid  { grid-template-columns: 1fr 1fr; }
  .ah-view-grid  { grid-template-columns: 1fr 1fr; }

  @media (max-width: 768px) {
    .ah-page { padding: 16px; }
    .ah-header { flex-direction: column !important; gap: 12px; }
    .ah-header-btn { width: 100%; justify-content: center; }
    .ah-stats { grid-template-columns: repeat(2, 1fr) !important; }
    .ah-filters { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
    .ah-filter-btns { display: flex; flex-wrap: wrap; gap: 6px; }
    .ah-filter-btns button { flex: 1; min-width: 60px; }
    .ah-table-wrap { display: none  !important; }
    .ah-card-list  { display: flex  !important; flex-direction: column; gap: 12px; padding: 12px 16px; }
    .ah-form-grid  { grid-template-columns: 1fr !important; }
    .ah-view-grid  { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 480px) {
    .ah-stats { grid-template-columns: 1fr !important; }
  }
`;

const inputStyle = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
  fontSize: 13, color: "#111827", outline: "none", width: "100%",
  boxSizing: "border-box",
};
const selectStyle = { ...inputStyle, background: "#fff", cursor: "pointer" };

const Badge = ({ label, color }) => (
  <span style={{
    fontSize: 11, fontWeight: 600, padding: "3px 10px",
    borderRadius: 99, background: `${color}18`, color,
  }}>{label}</span>
);

const Modal = ({ children, onClose }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16,
  }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{
      background: "#fff", borderRadius: 16, width: "100%", maxWidth: 600,
      maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    }}>
      {children}
    </div>
  </div>
);

const Field = ({ label, children, required }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
      {label} {required && <span style={{ color: COLORS.red }}>*</span>}
    </label>
    {children}
  </div>
);

// Moved outside to prevent re-mount/focus-loss on every render
const FormBody = ({ form, setForm, employees }) => (
  <div className="ah-form-grid" style={{ display: "grid", gap: 16 }}>
    <div style={{ gridColumn: "1/-1" }}>
      <Field label="Appraisal Title" required>
        <input
          style={inputStyle}
          placeholder="e.g. Q1 2025 Annual Appraisal"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />
      </Field>
    </div>

    <Field label="Employee" required>
      <select
        style={selectStyle}
        value={form.employee_id}
        onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}>
        <option value="">— Select Employee —</option>
        {employees.map(emp => (
          <option key={emp._id} value={emp._id}>
            {emp.name} {emp.department ? `(${emp.department})` : ""}
          </option>
        ))}
        {employees.length === 0 && (
          <option disabled value="">No active employees found</option>
        )}
      </select>
    </Field>

    <Field label="Appraisal Type">
      <select
        style={selectStyle}
        value={form.appraisal_type}
        onChange={e => setForm(f => ({ ...f, appraisal_type: e.target.value }))}>
        {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </Field>

    <Field label="Period From" required>
      <input
        type="date" style={inputStyle}
        value={form.period_from}
        onChange={e => setForm(f => ({ ...f, period_from: e.target.value }))}
      />
    </Field>

    <Field label="Period To" required>
      <input
        type="date" style={inputStyle}
        value={form.period_to}
        onChange={e => setForm(f => ({ ...f, period_to: e.target.value }))}
      />
    </Field>

    <Field label="HR Rating">
      <select
        style={selectStyle}
        value={form.hr_rating}
        onChange={e => setForm(f => ({ ...f, hr_rating: e.target.value }))}>
        <option value="">— Select Rating —</option>
        {RATING_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    </Field>

    <Field label="Increment %">
      <input
        type="number" min={0} max={100} style={inputStyle}
        value={form.increment_percent}
        onChange={e => setForm(f => ({ ...f, increment_percent: Number(e.target.value) }))}
      />
    </Field>

    <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 10 }}>
      <input
        type="checkbox" id="promo" checked={form.promotion}
        onChange={e => setForm(f => ({ ...f, promotion: e.target.checked }))}
        style={{ width: 16, height: 16, cursor: "pointer" }}
      />
      <label htmlFor="promo" style={{ fontSize: 13, color: "#374151", cursor: "pointer" }}>
        Promotion Applicable?
      </label>
    </div>

    {form.promotion && (
      <div style={{ gridColumn: "1/-1" }}>
        <Field label="New Designation">
          <input
            style={inputStyle} placeholder="e.g. Senior Engineer"
            value={form.new_designation}
            onChange={e => setForm(f => ({ ...f, new_designation: e.target.value }))}
          />
        </Field>
      </div>
    )}

    <div style={{ gridColumn: "1/-1" }}>
      <Field label="Remarks">
        <textarea
          rows={3} style={{ ...inputStyle, resize: "vertical" }}
          placeholder="HR comments, notes..."
          value={form.remarks}
          onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
        />
      </Field>
    </div>

    <Field label="Status">
      <select
        style={selectStyle}
        value={form.status}
        onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
        <option value="Draft">Draft</option>
        <option value="Published">Published</option>
      </select>
    </Field>
  </div>
);

// Mobile appraisal card
const AppraisalCard = ({ a, onView, onEdit, onPublish, onDelete }) => (
  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
    {/* Top row: title + status */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, color: "#111827", fontSize: 14, wordBreak: "break-word" }}>{a.title}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>{a.appraisal_type}</p>
      </div>
      <Badge label={a.status} color={a.status === "Published" ? COLORS.green : COLORS.amber} />
    </div>

    {/* Employee row */}
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: COLORS.blue, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
        {(a.employee_id?.name || "?").charAt(0).toUpperCase()}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827" }}>{a.employee_id?.name || "—"}</p>
        <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{a.employee_id?.department || "—"}</p>
      </div>
    </div>

    {/* Info grid */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px 10px", marginBottom: 12 }}>
      <div>
        <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Rating</span>
        <p style={{ margin: "2px 0 0" }}>
          {a.hr_rating
            ? <Badge label={a.hr_rating} color={RATING_COLORS[a.hr_rating]} />
            : <span style={{ fontSize: 12, color: "#9ca3af" }}>—</span>}
        </p>
      </div>
      <div>
        <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Increment</span>
        <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: COLORS.green }}>
          {a.increment_percent > 0 ? `+${a.increment_percent}%` : "—"}
        </p>
      </div>
      <div>
        <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>Period</span>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#374151", fontWeight: 600 }}>
          {a.period_from ? new Date(a.period_from).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
          {" – "}
          {a.period_to   ? new Date(a.period_to).toLocaleDateString("en-IN",   { day: "numeric", month: "short", year: "2-digit" }) : "—"}
        </p>
      </div>
    </div>

    {/* Action buttons */}
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button onClick={() => onView(a)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 10px", background: "#f3f4f6", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#374151" }}>
        <Eye size={13}/> View
      </button>
      <button onClick={() => onEdit(a)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 10px", background: "#eff6ff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600, color: COLORS.blue }}>
        <Edit2 size={13}/> Edit
      </button>
      {a.status === "Draft" && (
        <button onClick={() => onPublish(a._id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 10px", background: "#f0fdf4", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600, color: COLORS.green }}>
          <Send size={13}/> Publish
        </button>
      )}
      <button onClick={() => onDelete(a._id)} style={{ flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "7px 10px", background: "#fef2f2", border: "none", borderRadius: 7, cursor: "pointer" }}>
        <Trash2 size={13} color={COLORS.red}/>
      </button>
    </div>
  </div>
);

export default function AppraisalHub() {
  const [appraisals,   setAppraisals]   = useState([]);
  const [employees,    setEmployees]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showCreate,   setShowCreate]   = useState(false);
  const [showView,     setShowView]     = useState(null);
  const [showEdit,     setShowEdit]     = useState(null);
  const [saving,       setSaving]       = useState(false);

  const emptyForm = {
    title: "", period_from: "", period_to: "",
    appraisal_type: "Annual", employee_id: "",
    hr_rating: "", increment_percent: 0,
    promotion: false, new_designation: "",
    remarks: "", status: "Draft",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchAppraisals();
    fetchActiveEmployees();
  }, []);

  const fetchActiveEmployees = async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/hr/employees`);
      const data = await res.json();
      const active = Array.isArray(data)
        ? data.filter(emp => emp.status === "active")
        : [];
      setEmployees(active);
    } catch (e) {
      console.error("Failed to load employees:", e);
    }
  };

  const fetchAppraisals = async () => {
    setLoading(true);
    try {
      const res  = await axios.get(`${API_BASE}/api/appraisals`);
      const data = res.data?.data || res.data || [];
      setAppraisals(data);
    } catch (e) {
      console.error("Failed to load appraisals:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.employee_id || !form.period_from || !form.period_to) {
      alert("Title, Employee, Period From, and Period To are required.");
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API_BASE}/api/appraisals`, form);
      setShowCreate(false);
      setForm(emptyForm);
      fetchAppraisals();
    } catch (e) {
      alert(e?.response?.data?.message || "Error creating appraisal");
    } finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/api/appraisals/${showEdit._id}`, form);
      setShowEdit(null);
      setForm(emptyForm);
      fetchAppraisals();
    } catch (e) {
      alert(e?.response?.data?.message || "Error updating appraisal");
    } finally { setSaving(false); }
  };

  const handlePublish = async (id) => {
    if (!window.confirm("Publish this appraisal? The employee will be able to view it.")) return;
    try {
      await axios.patch(`${API_BASE}/api/appraisals/${id}/publish`);
      fetchAppraisals();
    } catch { alert("Error publishing appraisal"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this appraisal?")) return;
    try {
      await axios.delete(`${API_BASE}/api/appraisals/${id}`);
      fetchAppraisals();
    } catch { alert("Error deleting appraisal"); }
  };

  const openEdit = (a) => {
    setForm({
      title:             a.title || "",
      period_from:       a.period_from ? a.period_from.substring(0, 10) : "",
      period_to:         a.period_to   ? a.period_to.substring(0, 10)   : "",
      appraisal_type:    a.appraisal_type || "Annual",
      employee_id:       a.employee_id?._id || a.employee_id || "",
      hr_rating:         a.hr_rating || "",
      increment_percent: a.increment_percent || 0,
      promotion:         a.promotion || false,
      new_designation:   a.new_designation || "",
      remarks:           a.remarks || "",
      status:            a.status || "Draft",
    });
    setShowEdit(a);
  };

  const filtered = appraisals.filter(a => {
    const name = a.employee_id?.name || "";
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const total     = appraisals.length;
  const published = appraisals.filter(a => a.status === "Published").length;
  const draft     = appraisals.filter(a => a.status === "Draft").length;
  const excellent = appraisals.filter(a => a.hr_rating === "Excellent").length;

  return (
    <div className="ah-page" style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLES}</style>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="ah-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827" }}>Appraisal Hub</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>
            Create, manage and publish employee appraisals
          </p>
        </div>
        <button className="ah-header-btn" onClick={() => { setForm(emptyForm); setShowCreate(true); }} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: COLORS.blue, color: "#fff",
          border: "none", borderRadius: 10, padding: "10px 18px",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          <Plus size={16} /> New Appraisal
        </button>
      </div>

      {/* Stats */}
      <div className="ah-stats" style={{ display: "grid", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Appraisals", value: total,     Icon: Users,       color: COLORS.blue   },
          { label: "Published",        value: published, Icon: CheckCircle, color: COLORS.green  },
          { label: "Drafts",           value: draft,     Icon: Clock,       color: COLORS.amber  },
          { label: "Excellent Rating", value: excellent, Icon: TrendingUp,  color: COLORS.purple },
        ].map((s, i) => (
          <div key={i} style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
            padding: "16px 18px", borderTop: `3px solid ${s.color}`,
          }}>
            <div style={{ background: `${s.color}15`, borderRadius: 8, padding: 8, width: "fit-content", marginBottom: 8 }}>
              <s.Icon size={18} color={s.color} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="ah-filters" style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: "14px 18px", marginBottom: 20,
        display: "flex", gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <Search size={14} color="#9ca3af" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            style={{ ...inputStyle, paddingLeft: 32 }}
            placeholder="Search by title or employee..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="ah-filter-btns" style={{ display: "flex", gap: 8 }}>
          {["All", "Draft", "Published"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e7eb",
              background: filterStatus === s ? COLORS.blue : "#fff",
              color: filterStatus === s ? "#fff" : "#374151",
              fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table + Card list container */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#9ca3af" }}>
            <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: COLORS.blue, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#9ca3af" }}>
            <TrendingUp size={36} color="#e5e7eb" style={{ display: "block", margin: "0 auto 10px" }} />
            No appraisals found
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="ah-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                    {["Title", "Employee", "Type", "Period", "Rating", "Increment", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#6b7280", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a._id} style={{ borderBottom: "1px solid #f3f4f6" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{a.title}</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: "50%",
                            background: COLORS.blue, color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 700, flexShrink: 0,
                          }}>
                            {(a.employee_id?.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{a.employee_id?.name || "—"}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>{a.employee_id?.department || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151" }}>{a.appraisal_type}</td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                        {a.period_from ? new Date(a.period_from).toLocaleDateString("en-IN") : "—"}
                        {" → "}
                        {a.period_to   ? new Date(a.period_to).toLocaleDateString("en-IN")   : "—"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {a.hr_rating
                          ? <Badge label={a.hr_rating} color={RATING_COLORS[a.hr_rating]} />
                          : <span style={{ fontSize: 12, color: "#9ca3af" }}>—</span>}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: COLORS.green }}>
                        {a.increment_percent > 0 ? `+${a.increment_percent}%` : "—"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <Badge label={a.status} color={a.status === "Published" ? COLORS.green : COLORS.amber} />
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setShowView(a)} title="View" style={{ background: "#f3f4f6", border: "none", borderRadius: 7, padding: "6px 8px", cursor: "pointer" }}>
                            <Eye size={14} color="#374151" />
                          </button>
                          <button onClick={() => openEdit(a)} title="Edit" style={{ background: "#eff6ff", border: "none", borderRadius: 7, padding: "6px 8px", cursor: "pointer" }}>
                            <Edit2 size={14} color={COLORS.blue} />
                          </button>
                          {a.status === "Draft" && (
                            <button onClick={() => handlePublish(a._id)} title="Publish" style={{ background: "#f0fdf4", border: "none", borderRadius: 7, padding: "6px 8px", cursor: "pointer" }}>
                              <Send size={14} color={COLORS.green} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(a._id)} title="Delete" style={{ background: "#fef2f2", border: "none", borderRadius: 7, padding: "6px 8px", cursor: "pointer" }}>
                            <Trash2 size={14} color={COLORS.red} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="ah-card-list">
              {filtered.map(a => (
                <AppraisalCard
                  key={a._id} a={a}
                  onView={setShowView}
                  onEdit={openEdit}
                  onPublish={handlePublish}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>New Appraisal</h2>
            <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#6b7280" /></button>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <FormBody form={form} setForm={setForm} employees={employees} />
          </div>
          <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => setShowCreate(false)} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: COLORS.blue, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Save size={14} /> {saving ? "Saving..." : "Create Appraisal"}
            </button>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {showEdit && (
        <Modal onClose={() => setShowEdit(null)}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>Edit Appraisal</h2>
            <button onClick={() => setShowEdit(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#6b7280" /></button>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <FormBody form={form} setForm={setForm} employees={employees} />
          </div>
          <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => setShowEdit(null)} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleUpdate} disabled={saving} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: COLORS.blue, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Save size={14} /> {saving ? "Saving..." : "Update"}
            </button>
          </div>
        </Modal>
      )}

      {/* VIEW MODAL */}
      {showView && (
        <Modal onClose={() => setShowView(null)}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{showView.title}</h2>
            <button onClick={() => setShowView(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color="#6b7280" /></button>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <div className="ah-view-grid" style={{ display: "grid", gap: 16 }}>
              {[
                { label: "Employee",         value: showView.employee_id?.name || "—" },
                { label: "Department",        value: showView.employee_id?.department || "—" },
                { label: "Type",              value: showView.appraisal_type || "—" },
                { label: "Status",            value: showView.status || "—" },
                { label: "Period From",       value: showView.period_from ? new Date(showView.period_from).toLocaleDateString("en-IN") : "—" },
                { label: "Period To",         value: showView.period_to   ? new Date(showView.period_to).toLocaleDateString("en-IN")   : "—" },
                { label: "Performance Score", value: showView.performance_score ? `${showView.performance_score}%` : "—" },
                { label: "HR Rating",         value: showView.hr_rating || "—" },
                { label: "Increment",         value: showView.increment_percent > 0 ? `+${showView.increment_percent}%` : "—" },
                { label: "Promotion",         value: showView.promotion ? `Yes — ${showView.new_designation || ""}` : "No" },
              ].map((item, i) => (
                <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{item.value}</div>
                </div>
              ))}
              {showView.remarks && (
                <div style={{ gridColumn: "1/-1", background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Remarks</div>
                  <div style={{ fontSize: 13, color: "#374151" }}>{showView.remarks}</div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}