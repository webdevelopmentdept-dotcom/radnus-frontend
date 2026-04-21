import { useState, useEffect } from "react";
import axios from "axios";
import {
  ClipboardList, CheckCircle2, Flag, Inbox, AlertTriangle,
  Trash2, ClipboardCheck, BarChart2
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const PERIOD_TYPES = ["monthly", "quarterly", "annual"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS = ["2025", "2026", "2027"];
const QUARTERS = ["Q1","Q2","Q3","Q4"];

const STYLES = `
  .ak-page { padding: 28px 32px; }
  .ak-header { flex-direction: row; align-items: center; }
  .ak-header-btn { white-space: nowrap; }
  .ak-stats { grid-template-columns: repeat(3, 1fr); }
  .ak-period-btns { flex-direction: row; }
  .ak-period-grid { grid-template-columns: 1fr 1fr; }
  .ak-modal-footer { flex-direction: row; justify-content: flex-end; }
  .ak-modal-footer button { width: auto; }
  .ak-tpl-row { flex-direction: row; justify-content: space-between; }
  .ak-tpl-row-right { flex-direction: row; gap: 12px; }
  .ak-table-wrap { display: block !important; }
  .ak-card-list { display: none !important; }

  .ak-main-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    table-layout: fixed;
  }
  .ak-main-table th,
  .ak-main-table td {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 13px 14px;
    vertical-align: middle;
  }
  .ak-main-table thead tr { background: #f8fafc; }
  .ak-main-table th {
    text-align: left;
    font-weight: 700;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .ak-main-table td {
    border-bottom: 1px solid #f3f4f6;
    color: #1a1a2e;
  }
  .ak-main-table tbody tr:nth-child(even) td { background: #fafafa; }
  .ak-main-table tbody tr:hover td { background: #f0f6ff; }
  .ak-action-btns {
    display: flex;
    gap: 5px;
    flex-wrap: nowrap;
    align-items: center;
  }

  @media (max-width: 768px) {
    .ak-page { padding: 16px !important; }
    .ak-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px; }
    .ak-header-btn { width: 100% !important; text-align: center; justify-content: center; }
    .ak-stats { grid-template-columns: 1fr 1fr !important; }
    .ak-period-btns { flex-direction: row; flex-wrap: wrap; gap: 8px !important; }
    .ak-modal-footer { flex-direction: column !important; gap: 10px !important; }
    .ak-modal-footer button { width: 100% !important; }
    .ak-tpl-row { flex-direction: column !important; gap: 4px !important; }
    .ak-tpl-row-right { flex-direction: row; gap: 8px; }
    .ak-table-wrap { display: none !important; }
    .ak-card-list { display: flex !important; flex-direction: column; gap: 12px; padding: 12px 16px; }
  }

  @media (max-width: 480px) {
    .ak-stats { grid-template-columns: 1fr !important; }
    .ak-period-grid { grid-template-columns: 1fr !important; }
    .ak-period-btns button { flex: 1; }
  }
`;

export default function AssignKpi() {
  const [employees, setEmployees]           = useState([]);
  const [templates, setTemplates]           = useState([]);
  const [assignments, setAssignments]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showModal, setShowModal]           = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [toast, setToast]                   = useState(null);
  const [deleteConfirm, setDeleteConfirm]   = useState(null);
  const [cancelConfirm, setCancelConfirm]   = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);

  const [form, setForm] = useState({
    employee_id: "", template_id: "", period_type: "monthly",
    month: "March", year: "2026", quarter: "Q1", notes: ""
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [empRes, tplRes, assignRes] = await Promise.all([
        axios.get(`${API_BASE}/api/hr/employees`),
        axios.get(`${API_BASE}/api/kpi-templates`),
        axios.get(`${API_BASE}/api/kpi-assignments`)
      ]);
      if (Array.isArray(empRes.data))
        setEmployees(empRes.data.filter(emp => emp.status === "active"));
      if (tplRes.data.success) setTemplates(tplRes.data.data);
      if (assignRes.data.success) setAssignments(assignRes.data.data);
    } catch { showToast("Failed to load data", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getPeriodLabel = () => {
    if (form.period_type === "monthly")   return `${form.month} ${form.year}`;
    if (form.period_type === "quarterly") return `${form.quarter} ${form.year}`;
    return `Annual ${form.year}`;
  };

  const handleTemplateChange = (id) => {
    setForm(f => ({ ...f, template_id: id }));
    setSelectedTemplate(templates.find(t => t._id === id) || null);
  };

  const handleEdit = (a) => {
    setEditingAssignment(a);
    const period = a.period || "";
    let period_type = a.period_type || "monthly";
    let month = "March", year = "2026", quarter = "Q1";
    if (period_type === "monthly") {
      const parts = period.split(" ");
      month = parts[0] || "March";
      year  = parts[1] || "2026";
    } else if (period_type === "quarterly") {
      const parts = period.split(" ");
      quarter = parts[0] || "Q1";
      year    = parts[1] || "2026";
    } else {
      year = period.replace("Annual ", "") || "2026";
    }
    const tplId = a.template_id?._id || "";
    setForm({ employee_id: a.employee_id?._id || "", template_id: tplId, period_type, month, year, quarter, notes: a.notes || "" });
    setSelectedTemplate(templates.find(t => t._id === tplId) || null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.employee_id || !form.template_id)
      return showToast("Please select employee and template", "error");
    setSaving(true);
    try {
      const payload = { employee_id: form.employee_id, template_id: form.template_id, period: getPeriodLabel(), period_type: form.period_type, notes: form.notes };
      const res = editingAssignment
        ? await axios.put(`${API_BASE}/api/kpi-assignments/${editingAssignment._id}`, payload)
        : await axios.post(`${API_BASE}/api/kpi-assignments`, payload);
      if (res.data.success) {
        showToast(editingAssignment ? "Assignment updated!" : "KPI assigned successfully!");
        closeModal(); fetchAll();
      } else showToast(res.data.message || "Error", "error");
    } catch (err) { showToast(err.response?.data?.message || "Server error", "error"); }
    finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    try {
      const res = await axios.patch(`${API_BASE}/api/kpi-assignments/${id}/cancel`);
      if (res.data.success) { showToast("Assignment cancelled"); fetchAll(); }
    } catch { showToast("Failed to cancel", "error"); }
    setCancelConfirm(null);
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE}/api/kpi-assignments/${id}`);
      if (res.data.success) { showToast("Assignment deleted"); fetchAll(); }
    } catch { showToast("Failed to delete", "error"); }
    setDeleteConfirm(null);
  };

  const getStatusStyle = (status) => {
    if (status === "active")    return { color: "#16a34a", bg: "#f0fdf4" };
    if (status === "completed") return { color: "#2563eb", bg: "#eff6ff" };
    if (status === "cancelled") return { color: "#ef4444", bg: "#fef2f2" };
    return { color: "#ef4444", bg: "#fef2f2" };
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTemplate(null);
    setEditingAssignment(null);
    setForm({ employee_id: "", template_id: "", period_type: "monthly", month: "March", year: "2026", quarter: "Q1", notes: "" });
  };

  const STATS = [
    { label: "Total Assignments", value: assignments.length,                                    color: "#2563eb", bg: "#eff6ff", Icon: ClipboardList },
    { label: "Active",            value: assignments.filter(a => a.status === "active").length,    color: "#16a34a", bg: "#f0fdf4", Icon: CheckCircle2  },
    { label: "Completed",         value: assignments.filter(a => a.status === "completed").length, color: "#d97706", bg: "#fffbeb", Icon: Flag          },
  ];

  return (
    <div className="ak-page" style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f4f6fb" }}>
      <style>{STYLES}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 16, right: 16, left: 16, zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 16px", borderRadius: 8, fontWeight: 600, fontSize: 13, textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="ak-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>Assign KPIs</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Link KPI templates to employees</p>
        </div>
        <button className="ak-header-btn" onClick={() => setShowModal(true)}
          style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          + Assign KPI
        </button>
      </div>

      {/* Stats */}
      <div className="ak-stats" style={{ display: "grid", gap: 16, marginBottom: 24 }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.Icon size={22} color={s.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f3f4f6" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>All Assignments</h3>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>Loading...</div>
        ) : assignments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <Inbox size={40} color="#d1d5db" />
            </div>
            <p style={{ color: "#6b7280" }}>No KPIs assigned yet. Click "Assign KPI" to get started.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="ak-table-wrap" style={{ overflowX: "auto" }}>
              <table className="ak-main-table">
                <colgroup>
                  <col style={{ width: "52px" }} />
                  <col style={{ width: "210px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "180px" }} />
                  <col style={{ width: "115px" }} />
                  <col style={{ width: "115px" }} />
                  <col style={{ width: "105px" }} />
                  <col style={{ width: "170px" }} />
                </colgroup>
                <thead>
                  <tr>
                    {["S.No","Employee","Department","Template","Period","Assigned On","Status","Action"].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a, i) => {
                    const st = getStatusStyle(a.status);
                    return (
                      <tr key={a._id}>
                        <td style={{ color: "#6b7280", fontWeight: 600, fontSize: 13 }}>{i + 1}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#2563eb", fontSize: 13, flexShrink: 0 }}>
                              {a.employee_id?.name?.charAt(0) || "?"}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: 600, color: "#1a1a2e", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.employee_id?.name || "Unknown"}</p>
                              <p style={{ margin: 0, fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.employee_id?.email || ""}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "#374151" }}>{a.employee_id?.department || "—"}</td>
                        <td>
                          <p style={{ margin: 0, fontWeight: 600, color: "#1a1a2e", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.template_id?.template_name || "—"}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{a.template_id?.role || ""}</p>
                        </td>
                        <td>
                          <span style={{ background: "#f3f4f6", color: "#374151", fontWeight: 600, padding: "4px 10px", borderRadius: 6, fontSize: 12, whiteSpace: "nowrap" }}>{a.period}</span>
                        </td>
                        <td style={{ color: "#6b7280", fontSize: 12 }}>
                          {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td>
                          <span style={{ background: st.bg, color: st.color, fontWeight: 700, padding: "4px 12px", borderRadius: 20, fontSize: 11, textTransform: "capitalize", whiteSpace: "nowrap" }}>{a.status}</span>
                        </td>
                        <td>
                          <div className="ak-action-btns">
                            <button onClick={() => handleEdit(a)} style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 6, padding: "4px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Edit</button>
                            {a.status === "active" && (
                              <button onClick={() => setCancelConfirm(a._id)} style={{ background: "#fff7ed", color: "#d97706", border: "1px solid #fed7aa", borderRadius: 6, padding: "4px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Cancel</button>
                            )}
                            <button onClick={() => setDeleteConfirm(a._id)} style={{ background: "#fff5f5", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, padding: "4px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="ak-card-list">
              {assignments.map((a, i) => {
                const st = getStatusStyle(a.status);
                return (
                  <div key={a._id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px", background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#2563eb", fontSize: 14, flexShrink: 0 }}>
                          {a.employee_id?.name?.charAt(0) || "?"}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{a.employee_id?.name || "Unknown"}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{a.employee_id?.email || ""}</p>
                        </div>
                      </div>
                      <span style={{ background: st.bg, color: st.color, fontWeight: 700, padding: "4px 10px", borderRadius: 20, fontSize: 11, textTransform: "capitalize", flexShrink: 0 }}>{a.status}</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 13, marginBottom: 10 }}>
                      <div>
                        <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Department</span>
                        <p style={{ margin: "2px 0 0", color: "#374151", fontWeight: 500 }}>{a.employee_id?.department || "—"}</p>
                      </div>
                      <div>
                        <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Period</span>
                        <p style={{ margin: "2px 0 0" }}>
                          <span style={{ background: "#f3f4f6", color: "#374151", fontWeight: 600, padding: "2px 8px", borderRadius: 5, fontSize: 12 }}>{a.period}</span>
                        </p>
                      </div>
                      <div>
                        <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Template</span>
                        <p style={{ margin: "2px 0 0", color: "#1a1a2e", fontWeight: 600, fontSize: 13 }}>{a.template_id?.template_name || "—"}</p>
                        <p style={{ margin: "1px 0 0", fontSize: 11, color: "#6b7280" }}>{a.template_id?.role || ""}</p>
                      </div>
                      <div>
                        <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>Assigned On</span>
                        <p style={{ margin: "2px 0 0", color: "#6b7280", fontSize: 12 }}>
                          {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleEdit(a)} style={{ flex: 1, padding: "8px 0", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                      {a.status === "active" && (
                        <button onClick={() => setCancelConfirm(a._id)} style={{ flex: 1, padding: "8px 0", background: "#fff7ed", color: "#d97706", border: "1px solid #fed7aa", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                      )}
                      <button onClick={() => setDeleteConfirm(a._id)} style={{ flex: 1, padding: "8px 0", background: "#fff5f5", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Assign / Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
                {editingAssignment ? "Edit KPI Assignment" : "Assign KPI to Employee"}
              </h3>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>

            <div style={{ padding: "20px 24px" }}>
              {/* Step 1 */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>1. Select Employee *</label>
                <select value={form.employee_id} onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))} style={inputStyle}>
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} — {emp.designation} ({emp.department})</option>
                  ))}
                </select>
                <p style={{ margin: "5px 0 0", fontSize: 12, color: "#9ca3af" }}>Only active employees are shown</p>
              </div>

              {/* Step 2 */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>2. Select KPI Template *</label>
                <select value={form.template_id} onChange={e => handleTemplateChange(e.target.value)} style={inputStyle}>
                  <option value="">-- Choose Template --</option>
                  {templates.map(t => (
                    <option key={t._id} value={t._id}>{t.template_name} — {t.role} ({t.department})</option>
                  ))}
                </select>
              </div>

              {/* Template Preview */}
              {selectedTemplate && (
                <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                  <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#0369a1", display: "flex", alignItems: "center", gap: 6 }}>
                    <BarChart2 size={13} color="#0369a1" />
                    Template Preview — {selectedTemplate.kpi_items?.length} KPIs
                  </p>
                  {selectedTemplate.kpi_items?.map((item, i) => (
                    <div key={i} className="ak-tpl-row" style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e0f2fe", fontSize: 13, gap: 8 }}>
                      <span style={{ color: "#1e40af", fontWeight: 500, flex: 1, minWidth: 0, wordBreak: "break-word" }}>{item.kpi_name}</span>
                      <div className="ak-tpl-row-right" style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                        <span style={{ color: "#6b7280" }}>Target: {item.target} {item.unit}</span>
                        <span style={{ fontWeight: 700, color: "#0369a1" }}>{item.weight}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 3 */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>3. Review Period *</label>
                <div className="ak-period-btns" style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  {PERIOD_TYPES.map(pt => (
                    <button key={pt} onClick={() => setForm(f => ({ ...f, period_type: pt }))} style={{
                      padding: "7px 16px", border: "2px solid",
                      borderColor: form.period_type === pt ? "#2563eb" : "#e5e7eb",
                      borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
                      background: form.period_type === pt ? "#eff6ff" : "#fff",
                      color: form.period_type === pt ? "#2563eb" : "#6b7280",
                      textTransform: "capitalize"
                    }}>{pt}</button>
                  ))}
                </div>
                <div className="ak-period-grid" style={{ display: "grid", gap: 10 }}>
                  {form.period_type === "monthly" && (
                    <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} style={inputStyle}>
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  )}
                  {form.period_type === "quarterly" && (
                    <select value={form.quarter} onChange={e => setForm(f => ({ ...f, quarter: e.target.value }))} style={inputStyle}>
                      {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                  )}
                  {form.period_type === "annual" && (
                    <div style={{ ...inputStyle, background: "#f8fafc", color: "#6b7280", display: "flex", alignItems: "center" }}>Annual</div>
                  )}
                  <select value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} style={inputStyle}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div style={{ marginTop: 10, background: "#f8fafc", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>Period will be saved as:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{getPeriodLabel()}</span>
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>4. Notes (Optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any special instructions or targets for this employee..."
                  rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>

              {/* Footer */}
              <div className="ak-modal-footer" style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button onClick={closeModal} style={{ padding: "10px 24px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleSubmit} disabled={saving} style={{ padding: "10px 28px", border: "none", borderRadius: 8, background: saving ? "#93c5fd" : "#2563eb", color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 14 }}>
                  {saving ? (editingAssignment ? "Updating..." : "Assigning...") : (editingAssignment ? "Update Assignment" : "Assign KPI")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm Modal */}
      {cancelConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <AlertTriangle size={36} color="#d97706" />
            </div>
            <h3 style={{ margin: "0 0 8px", color: "#1a1a2e" }}>Cancel Assignment?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>The employee will no longer see this KPI assignment.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setCancelConfirm(null)} style={{ flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Keep It</button>
              <button onClick={() => handleCancel(cancelConfirm)} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: "#d97706", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <Trash2 size={36} color="#ef4444" />
            </div>
            <h3 style={{ margin: "0 0 8px", color: "#1a1a2e" }}>Delete Assignment?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>This action is permanent and cannot be undone.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Keep It</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 7 };
const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none" };