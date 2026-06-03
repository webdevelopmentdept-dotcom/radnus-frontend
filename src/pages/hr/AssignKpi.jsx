import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  ClipboardList, CheckCircle2, Flag, Inbox, AlertTriangle,
  Trash2, BarChart2, MoreHorizontal, Eye, Pencil, XCircle
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
  .ak-table-wrap { display: block !important; overflow-x: auto; }
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

  .ak-dots-btn {
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #6b7280;
    transition: background 0.15s, border-color 0.15s;
    flex-shrink: 0;
  }
  .ak-dots-btn:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #1a1a2e;
  }
  .ak-portal-dropdown {
    position: fixed;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.16);
    min-width: 160px;
    z-index: 99999;
    overflow: hidden;
    animation: ak-dropdown-in 0.13s ease;
  }
  @keyframes ak-dropdown-in {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .ak-dropdown-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 15px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    transition: background 0.1s;
  }
  .ak-dropdown-item:hover { background: #f8fafc; }
  .ak-dropdown-divider {
    border: none;
    border-top: 1px solid #f3f4f6;
    margin: 3px 0;
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

// ── Portal Dropdown ──────────────────────────────────────────────────────────
function ActionDropdown({ assignment, onView, onEdit, onCancel, onDelete }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const dropdownRef = useRef(null); 

//   useEffect(() => {
//     if (!open) return;
//     const close = (e) => {
//   if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
// };
// document.addEventListener("mousedown", close);
// return () => document.removeEventListener("mousedown", close);
//     return () => document.removeEventListener("mousedown", close);
//   }, [open]);

useEffect(() => {
  if (!open) return;
  const close = (e) => {
    if (
      btnRef.current && !btnRef.current.contains(e.target) &&
      dropdownRef.current && !dropdownRef.current.contains(e.target)
    ) {
      setOpen(false);
    }
  };
  setTimeout(() => document.addEventListener("mousedown", close), 0);
  return () => document.removeEventListener("mousedown", close);
}, [open]);

 const handleOpen = () => {
  if (btnRef.current) {
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.right - 160,
    });
  }
  setOpen(o => !o);
};
  const isActive = assignment.status === "active";

  const menu = open && createPortal(
    <div
  className="ak-portal-dropdown"
  ref={dropdownRef}
  style={{ top: pos.top, left: pos.left }}
  onMouseDown={e => e.stopPropagation()}
>
      <button className="ak-dropdown-item" style={{ color: "#2563eb" }}
        onClick={() => { setOpen(false); setTimeout(() => onView(assignment), 50); }}>
        <Eye size={14} color="#2563eb" /> View
      </button>
      <hr className="ak-dropdown-divider" />
      <button className="ak-dropdown-item" style={{ color: "#374151" }}
        onClick={() => { onEdit(assignment); setOpen(false); }}>
        <Pencil size={14} color="#374151" /> Edit
      </button>
      {isActive && (
        <button className="ak-dropdown-item" style={{ color: "#d97706" }}
          onClick={() => { onCancel(assignment._id); setOpen(false); }}>
          <XCircle size={14} color="#d97706" /> Cancel
        </button>
      )}
      <hr className="ak-dropdown-divider" />
      <button className="ak-dropdown-item" style={{ color: "#ef4444" }}
        onClick={() => { onDelete(assignment._id); setOpen(false); }}>
        <Trash2 size={14} color="#ef4444" /> Delete
      </button>
    </div>,
    document.body
  );

  return (
    <>
      <button className="ak-dots-btn" ref={btnRef} onClick={handleOpen} title="Actions">
        <MoreHorizontal size={16} />
      </button>
      {menu}
    </>
  );
}

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
  const [viewAssignment, setViewAssignment] = useState(null);
  const [viewMonthVersion, setViewMonthVersion] = useState(null);

  const [monthVersions, setMonthVersions] = useState([]);
  const [selectedMonthVersion, setSelectedMonthVersion] = useState(null);

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

  const handleTemplateChange = async (id) => {
    setForm(f => ({ ...f, template_id: id }));
    const tpl = templates.find(t => t._id === id) || null;
    setSelectedTemplate(tpl);
    setSelectedMonthVersion(null);
    setMonthVersions([]);
    if (tpl) {
      try {
        const res = await axios.get(`${API_BASE}/api/kpi-monthly-versions?template_id=${id}`);
        if (res.data.success) setMonthVersions(res.data.data);
      } catch (err) {
        console.error("Failed to fetch month versions", err);
        setMonthVersions([]);
      }
    }
  };

  const handleMonthVersionChange = (versionId) => {
    if (!versionId) {
      setSelectedMonthVersion(null);
      setForm(f => ({ ...f, monthly_version_id: "" }));
      return;
    }
    const version = monthVersions.find(v => v._id === versionId);
    setSelectedMonthVersion(version || null);
    setForm(f => ({ ...f, monthly_version_id: versionId }));
  };

const handleEdit = (a) => {
    setEditingAssignment(a);
    const period = a.period || "";
    let period_type = a.period_type || "monthly";
    let monthValue = "March", year = "2026", quarter = "Q1";
    if (period_type === "monthly") {
      const parts = period.split(" ");
      monthValue = parts[0] || "March";
      year = parts[1] || "2026";
    } else if (period_type === "quarterly") {
      const parts = period.split(" ");
      quarter = parts[0] || "Q1";
      year = parts[1] || "2026";
    } else {
      year = period.replace("Annual ", "") || "2026";
    }
    const tplId = a.template_id?._id || "";
    
    // ✅ FIX: Check both monthly_version_id and month_version_id
    const monthVersionId = a.monthly_version_id?._id || a.month_version_id?._id || "";
    
    setForm({
      employee_id: a.employee_id?._id || "",
      template_id: tplId,
      monthly_version_id: monthVersionId,
      period_type,
      month: monthValue,
      year,
      quarter,
      notes: a.notes || ""
    });
    const tpl = templates.find(t => t._id === tplId) || null;
    setSelectedTemplate(tpl);
    if (tplId) {
      axios.get(`${API_BASE}/api/kpi-monthly-versions?template_id=${tplId}`)
        .then(res => {
          if (res.data.success) {
            setMonthVersions(res.data.data);
            if (monthVersionId) {
              const v = res.data.data.find(v => v._id === monthVersionId);
              setSelectedMonthVersion(v || null);
            }
          }
        })
        .catch(() => setMonthVersions([]));
    }
    setShowModal(true);
};

  const handleSubmit = async () => {
    if (!form.employee_id || !form.template_id)
      return showToast("Please select employee and template", "error");
    if (!form.notes?.trim())
      return showToast("Notes / Instructions are required", "error");
    setSaving(true);
    const assignId = editingAssignment?._id;
    try {
      const payload = {
        employee_id: form.employee_id,
        template_id: form.template_id,
        monthly_version_id: form.monthly_version_id || null,
        period: getPeriodLabel(),
        period_type: form.period_type,
        notes: form.notes.trim()
      };
      const res = assignId
        ? await axios.put(`${API_BASE}/api/kpi-assignments/${assignId}`, payload)
        : await axios.post(`${API_BASE}/api/kpi-assignments`, payload);
      if (res.data.success) {
        showToast(assignId ? "Assignment updated!" : "KPI assigned successfully!");
        closeModal();
        fetchAll();
      } else {
        showToast(res.data.message || "Error", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Server error", "error");
    } finally {
      setSaving(false);
    }
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

  // ✅ NEW: View modal-க்கு month version fetch பண்ணுங்க
const openView = async (assignment) => {
  setViewAssignment(assignment);
  setViewMonthVersion(null); // reset
  
  // If assignment has month_version_id, fetch its data
  if (assignment.monthly_version_id?._id || assignment.month_version_id?._id) {
    try {
      const monthVerId = assignment.monthly_version_id?._id || assignment.month_version_id?._id;
      const templateId = assignment.template_id?._id || assignment.template_id;
      
      const res = await axios.get(`${API_BASE}/api/kpi-monthly-versions?template_id=${templateId}`);
      if (res.data.success) {
        const version = res.data.data.find(v => v._id === monthVerId);
        setViewMonthVersion(version || null);
      }
    } catch (err) {
      console.error("Failed to fetch month version for view", err);
    }
  }
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
    setForm({
      employee_id: "", template_id: "", period_type: "monthly",
      month: "March", year: "2026", quarter: "Q1", notes: ""
    });
  };

  const STATS = [
    { label: "Total Assignments", value: assignments.length,                                       color: "#2563eb", bg: "#eff6ff", Icon: ClipboardList },
    { label: "Active",            value: assignments.filter(a => a.status === "active").length,    color: "#16a34a", bg: "#f0fdf4", Icon: CheckCircle2  },
    { label: "Completed",         value: assignments.filter(a => a.status === "completed").length, color: "#d97706", bg: "#fffbeb", Icon: Flag          },
  ];

  const ownerBadge = (role) => {
    const map = {
      self:    { label: "Self",    color: "#16a34a", bg: "#f0fdf4" },
      manager: { label: "Manager", color: "#2563eb", bg: "#eff6ff" },
      md:      { label: "MD",      color: "#7c3aed", bg: "#f5f3ff" },
      hr:      { label: "HR",      color: "#d97706", bg: "#fffbeb" },
    };
    const s = map[role] || map.self;
    return (
      <span style={{ background: s.bg, color: s.color, fontWeight: 700, padding: "2px 7px", borderRadius: 4, fontSize: 10 }}>
        {s.label}
      </span>
    );
  };

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
            <div className="ak-table-wrap">
              <table className="ak-main-table">
                <colgroup>
                  <col style={{ width: "52px" }} />
                  <col style={{ width: "210px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "180px" }} />
                  <col style={{ width: "115px" }} />
                  <col style={{ width: "115px" }} />
                  <col style={{ width: "105px" }} />
                  <col style={{ width: "70px" }} />
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
                          {a.monthly_version_id && (
                            <span style={{ marginLeft: 6, background: "#dcfce7", color: "#16a34a", fontWeight: 600, padding: "2px 8px", borderRadius: 4, fontSize: 10, whiteSpace: "nowrap" }}>
                              📅 {a.monthly_version_id.month}
                            </span>
                          )}
                        </td>
                        <td style={{ color: "#6b7280", fontSize: 12 }}>
                          {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td>
                          <span style={{ background: st.bg, color: st.color, fontWeight: 700, padding: "4px 12px", borderRadius: 20, fontSize: 11, textTransform: "capitalize", whiteSpace: "nowrap" }}>{a.status}</span>
                        </td>
                        <td style={{ textAlign: "center", overflow: "visible" }}>
                          <ActionDropdown
                            assignment={a}
                            onView={openView} 
                            onEdit={handleEdit}
                            onCancel={setCancelConfirm}
                            onDelete={setDeleteConfirm}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="ak-card-list">
              {assignments.map((a) => {
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
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ background: st.bg, color: st.color, fontWeight: 700, padding: "4px 10px", borderRadius: 20, fontSize: 11, textTransform: "capitalize", flexShrink: 0 }}>{a.status}</span>
                        <ActionDropdown
                          assignment={a}
                          onView={openView} 
                          onEdit={handleEdit}
                          onCancel={setCancelConfirm}
                          onDelete={setDeleteConfirm}
                        />
                      </div>
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
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── View Modal ── */}
      {viewAssignment && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>Assignment Details</h3>
              <button onClick={() => { setViewAssignment(null); setViewMonthVersion(null); }}  style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, background: "#f8fafc", borderRadius: 10, padding: "14px" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#2563eb", fontSize: 18, flexShrink: 0 }}>
                  {viewAssignment.employee_id?.name?.charAt(0) || "?"}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 15 }}>{viewAssignment.employee_id?.name || "Unknown"}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{viewAssignment.employee_id?.email || ""}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>{viewAssignment.employee_id?.designation} — {viewAssignment.employee_id?.department}</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px", marginBottom: 20 }}>
                {[
                  { label: "Template",    value: viewAssignment.template_id?.template_name || "—" },
                  { label: "Role",        value: viewAssignment.template_id?.role || "—" },
                  { label: "Period",      value: viewAssignment.period },
                  { label: "Period Type", value: viewAssignment.period_type },
                  { label: "Status",      value: viewAssignment.status, badge: true },
                  { label: "Assigned On", value: new Date(viewAssignment.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                ].map((item, i) => {
                  const st = getStatusStyle(viewAssignment.status);
                  return (
                    <div key={i}>
                      <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>{item.label}</p>
                      {item.badge
                        ? <span style={{ background: st.bg, color: st.color, fontWeight: 700, padding: "3px 12px", borderRadius: 20, fontSize: 12, textTransform: "capitalize" }}>{item.value}</span>
                        : <p style={{ margin: 0, fontWeight: 600, color: "#1a1a2e", fontSize: 13, textTransform: item.label === "Period Type" ? "capitalize" : "none" }}>{item.value}</p>
                      }
                    </div>
                  );
                })}
              </div>
              {viewAssignment.notes && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#92400e", fontWeight: 700, textTransform: "uppercase" }}>Notes / Instructions</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>{viewAssignment.notes}</p>
                </div>
              )}
              {/* ✅ FIX: Use viewMonthVersion.kpi_items if available */}
{(viewMonthVersion?.kpi_items || viewAssignment.template_id?.kpi_items)?.length > 0 && (
  <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 14 }}>
    
    {/* Month version badge */}
    {viewMonthVersion && (
      <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 8, padding: "10px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <CheckCircle2 size={14} color="#16a34a" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>
          📅 Using {viewMonthVersion.month} Version — Specific Targets
        </span>
      </div>
    )}
    
    <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#0369a1" }}>
      KPI Items — {(viewMonthVersion?.kpi_items || viewAssignment.template_id?.kpi_items).length} total
    </p>
    
    {(viewMonthVersion?.kpi_items || viewAssignment.template_id?.kpi_items).map((item, i) => (
      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #e0f2fe", fontSize: 13, gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ color: "#1e40af", fontWeight: 500, display: "block", wordBreak: "break-word" }}>{item.kpi_name}</span>
          {item.owner_role && item.owner_role !== "self" && (
            <span style={{ marginTop: 2, display: "inline-block" }}>{ownerBadge(item.owner_role)}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <span style={{ color: "#6b7280" }}>Target: {item.target} {item.unit}</span>
          <span style={{ fontWeight: 700, color: "#0369a1" }}>{item.weight}%</span>
        </div>
      </div>
    ))}
  </div>
)}
              <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => { setViewAssignment(null); setViewMonthVersion(null); }} style={{ padding: "10px 28px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign / Edit Modal ── */}
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
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>2. Select KPI Template *</label>
                <select value={form.template_id} onChange={e => handleTemplateChange(e.target.value)} style={inputStyle}>
                  <option value="">-- Choose Template --</option>
                  {templates.map(t => (
                    <option key={t._id} value={t._id}>{t.template_name} — {t.role} ({t.department})</option>
                  ))}
                </select>
              </div>
              {selectedTemplate && (
                <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                  <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#0369a1", display: "flex", alignItems: "center", gap: 6 }}>
                    <BarChart2 size={13} color="#0369a1" />
                    Template Preview — {selectedTemplate.kpi_items?.length} KPIs
                  </p>
                  {selectedTemplate.kpi_items?.map((item, i) => (
                    <div key={i} className="ak-tpl-row" style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #e0f2fe", fontSize: 13, gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ color: "#1e40af", fontWeight: 500, display: "block", wordBreak: "break-word" }}>{item.kpi_name}</span>
                        {item.owner_role && item.owner_role !== "self" && (
                          <span style={{ marginTop: 2, display: "inline-block" }}>{ownerBadge(item.owner_role)}</span>
                        )}
                      </div>
                      <div className="ak-tpl-row-right" style={{ display: "flex", gap: 12, flexShrink: 0, alignItems: "center" }}>
                        <span style={{ color: "#6b7280" }}>Target: {item.target} {item.unit}</span>
                        <span style={{ fontWeight: 700, color: "#0369a1" }}>{item.weight}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedTemplate && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>Select Month Version (Optional)</label>
                    <select value={form.monthly_version_id || ""} onChange={e => handleMonthVersionChange(e.target.value)} style={inputStyle}>
                      <option value="">Use Template Default</option>
                      {monthVersions.map(v => (
                        <option key={v._id} value={v._id}>{v.month} — {v.month_status} ({v.kpi_items?.length} KPIs)</option>
                      ))}
                    </select>
                    <p style={{ margin: "5px 0 0", fontSize: 12, color: "#9ca3af" }}>
                      {monthVersions.length === 0
                        ? "No month versions created yet. Go to KPI Templates → 📅 Months to create one."
                        : "Select a month version to use its specific targets instead of template defaults."
                      }
                    </p>
                  </div>
                  {selectedMonthVersion && (
                    <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                      <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#16a34a", display: "flex", alignItems: "center", gap: 6 }}>
                        <CheckCircle2 size={14} color="#16a34a" />
                        Using {selectedMonthVersion.month} Version — Specific Targets
                      </p>
                      {selectedMonthVersion.kpi_items?.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #dcfce7", fontSize: 13 }}>
                          <span style={{ color: "#166534", fontWeight: 500 }}>{item.kpi_name}</span>
                          <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                            <span style={{ color: "#6b7280" }}>Target: {item.target} {item.unit}</span>
                            <span style={{ fontWeight: 700, color: "#16a34a" }}>{item.weight}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
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
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>
                  4. Notes / Instructions *
                  <span style={{ color: "#ef4444", marginLeft: 4 }}>Required</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Special instructions or targets for this employee (required)..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", borderColor: !form.notes?.trim() && form.notes !== undefined ? "#fca5a5" : "#d1d5db" }}
                />
                {!form.notes?.trim() && (
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#f59e0b" }}>⚠ Instructions are required before saving</p>
                )}
              </div>
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

      {/* Cancel Confirm */}
      {cancelConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><AlertTriangle size={36} color="#d97706" /></div>
            <h3 style={{ margin: "0 0 8px", color: "#1a1a2e" }}>Cancel Assignment?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>The employee will no longer see this KPI assignment.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setCancelConfirm(null)} style={{ flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Keep It</button>
              <button onClick={() => handleCancel(cancelConfirm)} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: "#d97706", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Trash2 size={36} color="#ef4444" /></div>
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