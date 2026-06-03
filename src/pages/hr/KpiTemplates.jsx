import { useState, useEffect } from "react";

const API_BASE    = import.meta.env.VITE_API_BASE_URL;
const KPI_API     = `${API_BASE}/api/kpi-templates`;
const DEPT_API    = `${API_BASE}/api/departments`;
const PROGRAM_API = `${API_BASE}/api/programs`;
const MONTH_VERSION_API = `${API_BASE}/api/kpi-monthly-versions`;

const UNITS       = ["tasks", "count", "value", "₹", "%", "hours", "tickets", "calls", "deals", "score", "admissions"];
const FREQUENCIES = ["daily", "weekly", "monthly", "quarterly"];
const MONTHS      = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS       = [2024,2025,2026,2027,2028];

const KPI_OWNERS = [
  { value: "self",    label: "Self (Employee)" },
  { value: "manager", label: "Manager" },
  { value: "md",      label: "MD / Director" },
  { value: "hr",      label: "HR" },
];

const defaultItem = {
  kpi_name: "", target: "", unit: "tasks", weight: "", frequency: "monthly",
  owner_role: "self", is_admission_kpi: false, program_targets: []
};
const defaultForm = {
  template_name: "", role: "", department: "", description: "",
  kpi_items: [{ ...defaultItem }]
};

const STYLES = `
  .kpi-page { padding: 28px 32px; }
  .kpi-header { flex-direction: row; align-items: center; }
  .kpi-header-btn { white-space: nowrap; }
  .kpi-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
  .kpi-card-actions { flex-direction: row; }
  .modal-grid { grid-template-columns: 1fr 1fr; }
  .kpi-item-grid { grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr; }
  .view-table { display: table; }
  .view-table-mobile { display: none; }

  .owner-badge {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    font-size: 10px; font-weight: 700; margin-left: 6px;
  }
  .admission-toggle {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; background: #f8fafc;
    border: 1.5px solid #e5e7eb; border-radius: 10px;
    cursor: pointer; transition: all 0.2s;
  }
  .admission-toggle.active { background: #f0f9ff; border-color: #0369a1; }
  .admission-toggle input[type="radio"] { width:16px; height:16px; accent-color:#0369a1; cursor:pointer; }

  .prog-target-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; background: #fff;
    border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px;
  }

  .adm-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; background: #f0f9ff; border: 1px solid #bae6fd;
    border-radius: 99px; font-size: 10px; font-weight: 700; color: #0369a1;
  }

  @media (max-width: 768px) {
    .kpi-page { padding: 16px; }
    .kpi-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px; }
    .kpi-header-btn { width: 100%; text-align: center; justify-content: center; }
    .kpi-grid { grid-template-columns: 1fr !important; }
    .kpi-card-kpi-row { flex-direction: column !important; align-items: flex-start !important; gap: 4px; }
    .kpi-card-kpi-row-right { flex-wrap: wrap; }
    .modal-inner { padding: 16px !important; }
    .modal-grid { grid-template-columns: 1fr !important; }
    .kpi-item-grid { grid-template-columns: 1fr 1fr !important; }
    .kpi-item-grid > div:first-child { grid-column: 1 / -1; }
    .modal-footer { flex-direction: column !important; }
    .modal-footer button { width: 100%; }
    .view-table { display: none !important; }
    .view-table-mobile { display: block !important; }
    .kpi-card-actions button { padding: 10px 0 !important; font-size: 14px !important; }
    .kpi-item-grid { grid-template-columns: 1fr !important; }
    .prog-target-row { flex-wrap: wrap; }
  }
`;

const ownerStyles = {
  self:    { bg: "#f0fdf4", color: "#16a34a" },
  manager: { bg: "#eff6ff", color: "#2563eb" },
  md:      { bg: "#f5f3ff", color: "#7c3aed" },
  hr:      { bg: "#fffbeb", color: "#d97706" },
};

function OwnerBadge({ role }) {
  const s = ownerStyles[role] || ownerStyles.self;
  const label = KPI_OWNERS.find(o => o.value === role)?.label || role;
  return <span className="owner-badge" style={{ background: s.bg, color: s.color }}>{label}</span>;
}

export default function KpiTemplates() {
  const [templates,     setTemplates]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editingId,     setEditingId]     = useState(null);
  const [form,          setForm]          = useState(defaultForm);
  const [viewTemplate,  setViewTemplate]  = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast,         setToast]         = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [departments,   setDepartments]   = useState([]);
  const [roles,         setRoles]         = useState([]);
  const [programs,      setPrograms]      = useState([]);
  const [newProgName,   setNewProgName]   = useState("");
  const [addingProg,    setAddingProg]    = useState(false);
  const [showAddProg,   setShowAddProg]   = useState(false);

  // Month Management states
  const [monthVersions, setMonthVersions] = useState([]);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [selectedTemplateForMonths, setSelectedTemplateForMonths] = useState(null);
  const [newMonthForm, setNewMonthForm] = useState({ month: "", year: "2026", copy_from: "" });
  const [showMonthEditModal, setShowMonthEditModal] = useState(false);
  const [editingMonthVersion, setEditingMonthVersion] = useState(null);
  const [savingMonthVersion, setSavingMonthVersion] = useState(false);

  useEffect(() => { fetchTemplates(); fetchPrograms(); }, []);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res  = await fetch(DEPT_API);
        const data = await res.json();
        const all  = data.data || data || [];
        setDepartments(all.filter(d => d.status === "active"));
      } catch { setDepartments([]); }
    };
    fetchDepts();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch(KPI_API);
      const data = await res.json();
      if (data.success) {
        const allPrograms = [];
        const seenNames = new Set();
        data.data.forEach(template => {
          template.kpi_items?.forEach(item => {
            item.program_targets?.forEach(pt => {
              if (pt.program_name && !seenNames.has(pt.program_name.toLowerCase())) {
                seenNames.add(pt.program_name.toLowerCase());
                allPrograms.push({
                  _id: pt.program_id || `prog_${pt.program_name}`,
                  name: pt.program_name
                });
              }
            });
          });
        });
        setPrograms(allPrograms);
      }
    } catch (err) {
      console.error("Programs fetch error:", err);
      setPrograms([]);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res  = await fetch(KPI_API);
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch { showToast("Failed to load templates", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddProgram = async () => {
    if (!newProgName.trim()) return;
    setAddingProg(true);
    try {
      const res  = await fetch(PROGRAM_API, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProgName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Program added!");
        setNewProgName(""); setShowAddProg(false);
        fetchPrograms();
      } else { showToast(data.message || "Error", "error"); }
    } catch { showToast("Failed to add program", "error"); }
    finally { setAddingProg(false); }
  };

  const handleDeptChange = (deptName) => {
    handleFormChange("department", deptName);
    handleFormChange("role", "");
    if (!deptName) { setRoles([]); return; }
    const found = departments.find(d => d.name === deptName);
    if (found) setRoles((found.designations || []).filter(dg => dg.status === "active"));
    else setRoles([]);
  };

  const preloadRoles = (deptName) => {
    if (!deptName) { setRoles([]); return; }
    const found = departments.find(d => d.name === deptName);
    if (found) setRoles((found.designations || []).filter(dg => dg.status === "active"));
    else setRoles([]);
  };

  const openCreate = () => {
    setForm(defaultForm); setRoles([]); setEditingId(null);
    setShowAddProg(false); setNewProgName(""); setShowModal(true);
  };

  const openEdit = (t) => {
    setForm({
      template_name: t.template_name, role: t.role,
      department:    t.department,    description: t.description || "",
      kpi_items: t.kpi_items.map(i => ({
        ...defaultItem, ...i,
        program_targets: i.program_targets || []
      }))
    });
    setEditingId(t._id); preloadRoles(t.department);
    setShowAddProg(false); setNewProgName(""); setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setEditingId(null); setForm(defaultForm);
    setRoles([]); setShowAddProg(false); setNewProgName("");
  };

  const handleFormChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleItemChange = (idx, field, value) => {
    setForm(f => {
      const items = [...f.kpi_items];
      items[idx]  = { ...items[idx], [field]: value };
      if (field === "is_admission_kpi" && value === true) {
        items[idx].owner_role = "manager";
        items[idx].unit       = "admissions";
        items[idx].program_targets = programs.map(p => ({
          program_id: p._id, program_name: p.name, target: 0
        }));
      }
      if (field === "is_admission_kpi" && value === false) {
        items[idx].program_targets = [];
        items[idx].unit   = "tasks";
        items[idx].target = "";
      }
      return { ...f, kpi_items: items };
    });
  };

  const handleProgTargetChange = (itemIdx, progId, value) => {
    setForm(f => {
      const items = [...f.kpi_items];
      const pt    = [...(items[itemIdx].program_targets || [])];
      const found = pt.findIndex(p => p.program_id === progId);
      if (found >= 0) {
        pt[found] = { ...pt[found], target: Number(value) };
      } else {
        const prog = programs.find(p => p._id === progId);
        pt.push({ program_id: progId, program_name: prog?.name || "", target: Number(value) });
      }
      items[itemIdx] = {
        ...items[itemIdx],
        program_targets: pt,
        target: pt.reduce((s, p) => s + (Number(p.target) || 0), 0)
      };
      return { ...f, kpi_items: items };
    });
  };

  const toggleProgram = (itemIdx, prog) => {
    setForm(f => {
      const items = [...f.kpi_items];
      const pt    = [...(items[itemIdx].program_targets || [])];
      const found = pt.findIndex(p => p.program_id === prog._id);
      if (found >= 0) { pt.splice(found, 1); }
      else { pt.push({ program_id: prog._id, program_name: prog.name, target: 0 }); }
      items[itemIdx] = {
        ...items[itemIdx],
        program_targets: pt,
        target: pt.reduce((s, p) => s + (Number(p.target) || 0), 0)
      };
      return { ...f, kpi_items: items };
    });
  };

  const addItem    = () => setForm(f => ({ ...f, kpi_items: [...f.kpi_items, { ...defaultItem }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, kpi_items: f.kpi_items.filter((_, i) => i !== idx) }));
  const totalWeight = form.kpi_items.reduce((s, i) => s + (parseFloat(i.weight) || 0), 0);

  const handleSubmit = async () => {
    if (!form.template_name || !form.role || !form.department)
      return showToast("Fill all required fields", "error");
    if (!form.description?.trim())
      return showToast("Description is required", "error");
    if (form.kpi_items.length === 0)
      return showToast("Add at least one KPI", "error");
    for (let i = 0; i < form.kpi_items.length; i++) {
      const item = form.kpi_items[i];
      if (item.is_admission_kpi) {
        if (!item.program_targets || item.program_targets.length === 0)
          return showToast(`KPI #${i+1}: Select at least one program`, "error");
        if (!item.program_targets.some(p => Number(p.target) > 0))
          return showToast(`KPI #${i+1}: Set target for at least one program`, "error");
      }
    }
    if (totalWeight !== 100)
      return showToast(`Total weight must be 100%. Currently: ${totalWeight}%`, "error");

    setSaving(true);
    try {
      const url    = editingId ? `${KPI_API}/${editingId}` : KPI_API;
      const method = editingId ? "PUT" : "POST";
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        showToast(editingId ? "Template updated!" : "Template created!");
        fetchTemplates(); closeModal();
      } else { showToast(data.message || "Error", "error"); }
    } catch { showToast("Server error", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      const res  = await fetch(`${KPI_API}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showToast("Template deleted"); fetchTemplates(); }
    } catch { showToast("Delete failed", "error"); }
    setDeleteConfirm(null);
  };

  // ===== MONTH MANAGEMENT FUNCTIONS =====
  const fetchMonthVersions = async (templateId) => {
    try {
      const res = await fetch(`${MONTH_VERSION_API}?template_id=${templateId}`);
      const data = await res.json();
      if (data.success) setMonthVersions(data.data);
    } catch {
      setMonthVersions([]);
    }
  };

  const openMonthManagement = (template) => {
    setSelectedTemplateForMonths(template);
    fetchMonthVersions(template._id);
    setNewMonthForm({ month: "", year: "2026", copy_from: "" });
    setShowMonthModal(true);
  };

  const closeMonthModal = () => {
    setShowMonthModal(false);
    setSelectedTemplateForMonths(null);
    setMonthVersions([]);
    setNewMonthForm({ month: "", year: "2026", copy_from: "" });
  };

  const handleCreateMonthVersion = async () => {
    const month = `${newMonthForm.month} ${newMonthForm.year}`;
    try {
      const res = await fetch(MONTH_VERSION_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplateForMonths._id,
          month,
          copy_from_month: newMonthForm.copy_from || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Month version created!");
        fetchMonthVersions(selectedTemplateForMonths._id);
        setNewMonthForm({ month: "", year: "2026", copy_from: "" });
      } else {
        showToast(data.message, "error");
      }
    } catch {
      showToast("Failed to create month version", "error");
    }
  };

  const handleDeleteMonthVersion = async (versionId) => {
    if (!window.confirm("Delete this month version?")) return;
    try {
      const res = await fetch(`${MONTH_VERSION_API}/${versionId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Month version deleted");
        fetchMonthVersions(selectedTemplateForMonths._id);
      } else {
        showToast(data.message, "error");
      }
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  const openEditMonthVersion = (version) => {
    setEditingMonthVersion(JSON.parse(JSON.stringify(version)));
    setShowMonthEditModal(true);
  };

  const closeMonthEditModal = () => {
    setShowMonthEditModal(false);
    setEditingMonthVersion(null);
  };

  const handleMonthItemChange = (idx, field, value) => {
  setEditingMonthVersion(v => {
    const items = [...v.kpi_items];
    items[idx] = { ...items[idx], [field]: value };
    
    // Auto-calculate total for admission KPI
    if (field === 'program_targets' || (items[idx].is_admission_kpi && field.startsWith('program'))) {
      items[idx].target = items[idx].program_targets?.reduce((s, p) => s + (Number(p.target) || 0), 0) || 0;
    }
    
    return { ...v, kpi_items: items };
  });
};

  const handleMonthProgTargetChange = (itemIdx, progIdx, value) => {
    setEditingMonthVersion(v => {
      const items = [...v.kpi_items];
      const pt = [...(items[itemIdx].program_targets || [])];
      if (pt[progIdx]) {
        pt[progIdx] = { ...pt[progIdx], target: Number(value) };
      }
      items[itemIdx] = {
        ...items[itemIdx],
        program_targets: pt,
        target: pt.reduce((s, p) => s + (Number(p.target) || 0), 0)
      };
      return { ...v, kpi_items: items };
    });
  };

  const saveMonthVersion = async () => {
    if (!editingMonthVersion) return;
    setSavingMonthVersion(true);
    try {
      const res = await fetch(`${MONTH_VERSION_API}/${editingMonthVersion._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kpi_items: editingMonthVersion.kpi_items,
          total_weight: editingMonthVersion.kpi_items.reduce((s, i) => s + (parseFloat(i.weight) || 0), 0)
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${editingMonthVersion.month} updated!`);
        fetchMonthVersions(selectedTemplateForMonths._id);
        closeMonthEditModal();
      } else {
        showToast(data.message, "error");
      }
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSavingMonthVersion(false);
    }
  };

  // ✅ NEW: Add KPI item to month version
const addMonthKpiItem = () => {
  setEditingMonthVersion(v => ({
    ...v,
    kpi_items: [
      ...v.kpi_items,
      {
        kpi_name: "",
        target: 0,
        unit: "tasks",
        weight: 0,
        frequency: "monthly",
        owner_role: "self",
        is_admission_kpi: false,
        program_targets: []
      }
    ]
  }));
};

// ✅ NEW: Remove KPI item from month version
const removeMonthKpiItem = (idx) => {
  setEditingMonthVersion(v => ({
    ...v,
    kpi_items: v.kpi_items.filter((_, i) => i !== idx)
  }));
};



  return (
    <div className="kpi-page" style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#f4f6fb" }}>
      <style>{STYLES}</style>

      {toast && (
        <div style={{ position: "fixed", top: 20, right: 16, zIndex: 9999, background: toast.type === "error" ? "#ff4d4f" : "#52c41a", color: "#fff", padding: "12px 20px", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", fontWeight: 500, fontSize: 14, maxWidth: "calc(100vw - 32px)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="kpi-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>KPI Templates</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Create and manage KPI templates for each role</p>
        </div>
        <button className="kpi-header-btn" onClick={openCreate} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          + Create Template
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading templates...</div>
      ) : templates.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: "60px 0", textAlign: "center", border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <p style={{ color: "#6b7280", fontSize: 15 }}>No KPI templates yet. Create your first one!</p>
          <button onClick={openCreate} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", marginTop: 8 }}>Create Template</button>
        </div>
      ) : (
        <div className="kpi-grid" style={{ display: "grid", gap: 20 }}>
          {templates.map(t => (
            <div key={t._id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ background: "#2563eb", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, color: "#fff", fontSize: 15, fontWeight: 700, wordBreak: "break-word" }}>{t.template_name}</h3>
                    <p style={{ margin: "4px 0 0", color: "#bfdbfe", fontSize: 13 }}>{t.role} · {t.department}</p>
                  </div>
                  <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {t.kpi_items?.length || 0} KPIs · v{t.version || 1}
                  </span>
                </div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                {t.description && <p style={{ margin: "0 0 12px", color: "#6b7280", fontSize: 13 }}>{t.description}</p>}
                {t.kpi_items?.slice(0, 3).map((item, i) => (
                  <div key={i} className="kpi-card-kpi-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #f3f4f6", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{item.kpi_name}</span>
                        {item.is_admission_kpi && <span className="adm-badge">🎓 Admission</span>}
                        {item.owner_role && item.owner_role !== "self" && <OwnerBadge role={item.owner_role} />}
                      </div>
                      {item.is_admission_kpi && item.program_targets?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                          {item.program_targets.map((pt, pi) => (
                            <span key={pi} style={{ fontSize: 10, background: "#f0f9ff", color: "#0369a1", padding: "1px 7px", borderRadius: 99, border: "1px solid #bae6fd", fontWeight: 600 }}>
                              {pt.program_name}: {pt.target}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="kpi-card-kpi-row-right" style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>Total: {item.target}</span>
                      <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{item.weight}%</span>
                    </div>
                  </div>
                ))}
                {t.kpi_items?.length > 3 && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#9ca3af" }}>+{t.kpi_items.length - 3} more KPIs</p>}
              </div>
              <div className="kpi-card-actions" style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 8 }}>
                <button onClick={() => setViewTemplate(t)} style={{ flex: 1, padding: "8px 0", border: "1px solid #e5e7eb", borderRadius: 7, background: "#fff", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>View</button>
                <button onClick={() => openEdit(t)} style={{ flex: 1, padding: "8px 0", border: "1px solid #2563eb", borderRadius: 7, background: "#eff6ff", color: "#2563eb", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Edit Info</button>
                <button onClick={() => openMonthManagement(t)} style={{ flex: 1, padding: "8px 0", border: "1px solid #16a34a", borderRadius: 7, background: "#f0fdf4", color: "#16a34a", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>📅 Months</button>
                <button onClick={() => setDeleteConfirm(t._id)} style={{ flex: 1, padding: "8px 0", border: "1px solid #fecaca", borderRadius: 7, background: "#fff5f5", color: "#ef4444", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Create/Edit Modal ===== */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 750, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
                {editingId ? "Edit KPI Template" : "Create KPI Template"}
              </h3>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>

            <div className="modal-inner" style={{ padding: "24px" }}>

              {/* Basic Info */}
              <div className="modal-grid" style={{ display: "grid", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Template Name *</label>
                  <input value={form.template_name} onChange={e => handleFormChange("template_name", e.target.value)} placeholder="e.g. Admission Counselor KPI" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Department *</label>
                  <select value={form.department} onChange={e => handleDeptChange(e.target.value)} style={inputStyle}>
                    <option value="">{departments.length === 0 ? "Loading…" : "Select Department"}</option>
                    {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Role *</label>
                  {roles.length > 0 ? (
                    <select value={form.role} onChange={e => handleFormChange("role", e.target.value)} style={inputStyle} disabled={!form.department}>
                      <option value="">Select Role</option>
                      {roles.map(r => <option key={r._id || r.title} value={r.title}>{r.title}</option>)}
                    </select>
                  ) : (
                    <input value={form.role} onChange={e => handleFormChange("role", e.target.value)} placeholder={!form.department ? "Select dept first" : "Type manually"} style={{ ...inputStyle, background: !form.department ? "#f9fafb" : "#fff" }} disabled={!form.department} />
                  )}
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Description * <span style={{ color: "#ef4444", fontWeight: 400 }}>Required</span></label>
                  <input value={form.description} onChange={e => handleFormChange("description", e.target.value)} placeholder="Describe the purpose of this template" style={{ ...inputStyle, borderColor: !form.description?.trim() ? "#fca5a5" : "#d1d5db" }} />
                </div>
              </div>

              {/* ===== MANAGE PROGRAMS ===== */}
              <div style={{ marginBottom: 20, padding: "14px 16px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#374151" }}>📚 Manage Programs</p>
                  {!showAddProg && (
                    <button onClick={() => setShowAddProg(true)} style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", background: "none", border: "1px dashed #93c5fd", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                      + Add Program
                    </button>
                  )}
                </div>
                {programs.length === 0 && !showAddProg && (
                  <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>No programs yet. Add programs to use in Admission KPIs.</p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {programs.map(p => (
                    <span key={p._id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 99, fontSize: 12, fontWeight: 600, color: "#2563eb" }}>
                      {p.name}
                      <span style={{ cursor: "pointer", fontSize: 10, opacity: 0.7 }} onClick={async () => { await fetch(`${PROGRAM_API}/${p._id}`, { method: "DELETE" }); fetchPrograms(); }}>✕</span>
                    </span>
                  ))}
                </div>
                {showAddProg && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <input value={newProgName} onChange={e => setNewProgName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddProgram()} placeholder="e.g. B.Tech, MBA, Diploma..." style={{ ...inputStyle, flex: 1 }} autoFocus />
                    <button onClick={handleAddProgram} disabled={addingProg || !newProgName.trim()} style={{ padding: "9px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: !newProgName.trim() ? 0.6 : 1 }}>
                      {addingProg ? "..." : "Add"}
                    </button>
                    <button onClick={() => { setShowAddProg(false); setNewProgName(""); }} style={{ padding: "9px 12px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 7, cursor: "pointer" }}>✕</button>
                  </div>
                )}
              </div>

              {/* ===== KPI ITEMS ===== */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <label style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>KPI Items</label>
                  <span style={{ fontSize: 13, fontWeight: 600, color: totalWeight === 100 ? "#16a34a" : totalWeight > 100 ? "#ef4444" : "#f59e0b" }}>
                    Total Weight: {totalWeight}% {totalWeight === 100 ? "✓" : totalWeight > 100 ? "(Over!)" : "(Need 100%)"}
                  </span>
                </div>

                {form.kpi_items.map((item, idx) => (
                  <div key={idx} style={{ background: "#f8fafc", border: `1.5px solid ${item.is_admission_kpi ? "#bae6fd" : "#e5e7eb"}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>

                    {/* Item Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>KPI #{idx + 1}</span>
                        {item.is_admission_kpi && <span className="adm-badge">🎓 Admission KPI</span>}
                        <OwnerBadge role={item.owner_role || "self"} />
                      </div>
                      {form.kpi_items.length > 1 && (
                        <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Remove</button>
                      )}
                    </div>

                    {/* Basic Fields */}
                    <div className="kpi-item-grid" style={{ display: "grid", gap: 10, marginBottom: 12 }}>
                      <div>
                        <label style={labelStyle}>KPI Name *</label>
                        <input value={item.kpi_name} onChange={e => handleItemChange(idx, "kpi_name", e.target.value)} placeholder="e.g. Total Admissions" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Total Target</label>
                        <input
                          type="number" value={item.target}
                          onChange={e => !item.is_admission_kpi && handleItemChange(idx, "target", e.target.value)}
                          placeholder={item.is_admission_kpi ? "Auto" : "20"}
                          style={{ ...inputStyle, background: item.is_admission_kpi ? "#f0f9ff" : "#fff", color: item.is_admission_kpi ? "#0369a1" : "#1a1a2e" }}
                          readOnly={item.is_admission_kpi}
                        />
                        {item.is_admission_kpi && <p style={{ margin: "3px 0 0", fontSize: 10, color: "#0369a1" }}>Auto = sum of programs</p>}
                      </div>
                      <div>
                        <label style={labelStyle}>Unit</label>
                        <select value={item.unit} onChange={e => handleItemChange(idx, "unit", e.target.value)} style={inputStyle}>
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Weight %</label>
                        <input type="number" value={item.weight} onChange={e => handleItemChange(idx, "weight", e.target.value)} placeholder="40" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Frequency</label>
                        <select value={item.frequency} onChange={e => handleItemChange(idx, "frequency", e.target.value)} style={inputStyle}>
                          {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Filled By</label>
                        <select value={item.owner_role || "self"} onChange={e => handleItemChange(idx, "owner_role", e.target.value)} style={inputStyle}>
                          {KPI_OWNERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* ===== ADMISSION KPI TOGGLE ===== */}
                    <div
                      className={`admission-toggle ${item.is_admission_kpi ? "active" : ""}`}
                      style={{ marginBottom: item.is_admission_kpi ? 12 : 0 }}
                      onClick={() => handleItemChange(idx, "is_admission_kpi", !item.is_admission_kpi)}
                    >
                      <input type="radio" checked={item.is_admission_kpi} onChange={() => {}} onClick={e => e.stopPropagation()} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: item.is_admission_kpi ? "#0369a1" : "#374151" }}>
                          🎓 Enable Admission KPI — Program-wise Breakdown
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>
                          Set separate targets per program. Total = sum of all program targets.
                        </p>
                      </div>
                      {item.is_admission_kpi && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", background: "#e0f2fe", padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>Active</span>
                      )}
                    </div>

                    {/* ===== PROGRAM-WISE TARGETS ===== */}
                    {item.is_admission_kpi && (
                      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: 14 }}>
                        <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#0369a1" }}>
                          Select Programs & Set Targets
                          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: "#6b7280" }}>click to add/remove</span>
                        </p>

                        {programs.length === 0 ? (
                          <p style={{ margin: 0, fontSize: 12, color: "#f59e0b" }}>⚠ No programs available. Add programs in the section above first.</p>
                        ) : (
                          <>
                            {/* Program chips */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                              {programs.map(p => {
                                const isSelected = item.program_targets?.some(pt => pt.program_id === p._id);
                                return (
                                  <span
                                    key={p._id}
                                    onClick={() => toggleProgram(idx, p)}
                                    style={{
                                      padding: "5px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                                      cursor: "pointer", transition: "all 0.15s",
                                      background: isSelected ? "#0369a1" : "#fff",
                                      color: isSelected ? "#fff" : "#374151",
                                      border: `1.5px solid ${isSelected ? "#0369a1" : "#d1d5db"}`
                                    }}
                                  >
                                    {isSelected ? "✓ " : "+ "}{p.name}
                                  </span>
                                );
                              })}
                            </div>

                            {/* Target inputs for selected programs */}
                            {item.program_targets?.length > 0 && (
                              <>
                                {item.program_targets.map((pt, pi) => (
                                  <div key={pi} className="prog-target-row">
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{pt.program_name}</p>
                                      <p style={{ margin: "1px 0 0", fontSize: 10, color: "#9ca3af" }}>HR / Manager fills actual value</p>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <label style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>Target:</label>
                                      <input
                                        type="number" value={pt.target} min="0"
                                        onChange={e => handleProgTargetChange(idx, pt.program_id, e.target.value)}
                                        style={{ ...inputStyle, width: 80, textAlign: "center" }}
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>
                                ))}

                                {/* Total */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#0369a1", borderRadius: 8, marginTop: 4 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>🎯 Total Target</span>
                                  <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
                                    {item.program_targets.reduce((s, p) => s + (Number(p.target) || 0), 0)}
                                  </span>
                                </div>
                              </>
                            )}

                            {(!item.program_targets || item.program_targets.length === 0) && (
                              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#f59e0b" }}>⚠ Select at least one program above</p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                  </div>
                ))}

                <button onClick={addItem} style={{ width: "100%", padding: "10px 0", border: "2px dashed #d1d5db", borderRadius: 8, background: "none", color: "#6b7280", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
                  + Add KPI Item
                </button>
              </div>

              <div className="modal-footer" style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
                <button onClick={closeModal} style={{ padding: "10px 24px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleSubmit} disabled={saving} style={{ padding: "10px 28px", border: "none", borderRadius: 8, background: saving ? "#93c5fd" : "#2563eb", color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 14 }}>
                  {saving ? "Saving..." : editingId ? "Update Template" : "Create Template"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== View Modal ===== */}
      {viewTemplate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ background: "#2563eb", padding: "20px 24px", borderRadius: "14px 14px 0 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 700 }}>{viewTemplate.template_name}</h3>
                  <p style={{ margin: "4px 0 0", color: "#bfdbfe", fontSize: 13 }}>{viewTemplate.role} · {viewTemplate.department}</p>
                </div>
                <button onClick={() => setViewTemplate(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>✕</button>
              </div>
            </div>
            <div style={{ padding: 24 }}>
              {viewTemplate.description && <p style={{ color: "#6b7280", marginBottom: 20 }}>{viewTemplate.description}</p>}

              {viewTemplate.kpi_items.map((item, i) => (
                <div key={i} style={{ marginBottom: 16, border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ background: "#f8fafc", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{item.kpi_name}</span>
                      {item.is_admission_kpi && <span className="adm-badge">🎓 Admission</span>}
                      <OwnerBadge role={item.owner_role || "self"} />
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>Total: <strong>{item.target} {item.unit}</strong></span>
                      <span style={{ background: "#eff6ff", color: "#2563eb", fontWeight: 700, padding: "3px 8px", borderRadius: 4, fontSize: 12 }}>{item.weight}%</span>
                      <span style={{ fontSize: 11, color: "#6b7280", textTransform: "capitalize" }}>{item.frequency}</span>
                    </div>
                  </div>

                  {/* Program-wise breakdown in view */}
                  {item.is_admission_kpi && item.program_targets?.length > 0 && (
                    <div style={{ padding: "14px 16px" }}>
                      <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#0369a1" }}>Program-wise Targets:</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                        {item.program_targets.map((pt, pi) => (
                          <div key={pi} style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "12px", textAlign: "center" }}>
                            <p style={{ margin: "0 0 6px", fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{pt.program_name}</p>
                            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0369a1", fontFamily: "monospace", lineHeight: 1 }}>{pt.target}</p>
                            <p style={{ margin: "3px 0 0", fontSize: 10, color: "#9ca3af" }}>admissions</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 10, padding: "8px 14px", background: "#0369a1", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>🎯 Total</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>{item.target}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div style={{ padding: "10px 12px", background: "#f0fdf4", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, color: "#16a34a" }}>Total Weight</span>
                <span style={{ fontWeight: 700, color: "#16a34a" }}>{viewTemplate.kpi_items.reduce((s, i) => s + (i.weight || 0), 0)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete Confirm ===== */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", color: "#1a1a2e" }}>Delete Template?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MONTH MANAGEMENT MODAL ===== */}
      {showMonthModal && selectedTemplateForMonths && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
                📅 Manage Months: {selectedTemplateForMonths.template_name}
              </h3>
              <button onClick={closeMonthModal} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>

            <div style={{ padding: "24px" }}>
              
              {/* Existing Month Versions */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#374151" }}>Existing Versions</h4>
                {monthVersions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 0", background: "#f9fafb", borderRadius: 10, border: "1px dashed #d1d5db" }}>
                    <p style={{ margin: 0, color: "#9ca3af", fontSize: 14 }}>No month versions yet.</p>
                    <p style={{ margin: "4px 0 0", color: "#9ca3af", fontSize: 12 }}>Create your first month version below.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {monthVersions.map(v => (
                      <div key={v._id} style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        padding: "12px 16px",
                        background: v.month_status === 'locked' ? '#f9fafb' : '#fff',
                        border: "1px solid #e5e7eb",
                        borderRadius: 8
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>{v.month}</span>
                          <span style={{ 
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            background: v.month_status === 'locked' ? '#fee2e2' : v.month_status === 'active' ? '#dcfce7' : '#fef3c7',
                            color: v.month_status === 'locked' ? '#ef4444' : v.month_status === 'active' ? '#16a34a' : '#d97706',
                            textTransform: "capitalize"
                          }}>
                            {v.month_status === 'locked' ? '🔒 Locked' : v.month_status === 'active' ? '✏️ Active' : '📝 Draft'}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button 
                            onClick={() => openEditMonthVersion(v)}
                            disabled={v.month_status === 'locked'}
                            style={{ 
                              padding: "5px 14px", 
                              border: "1px solid #bfdbfe", 
                              borderRadius: 6,
                              background: v.month_status === 'locked' ? '#f9fafb' : '#eff6ff',
                              color: v.month_status === 'locked' ? '#9ca3af' : '#2563eb',
                              cursor: v.month_status === 'locked' ? 'not-allowed' : 'pointer',
                              fontSize: 12,
                              fontWeight: 600
                            }}
                          >
                            {v.month_status === 'locked' ? '🔒 Locked' : 'Edit KPIs'}
                          </button>
                          {v.month_status !== 'locked' && (
                            <button 
                              onClick={() => handleDeleteMonthVersion(v._id)}
                              style={{ 
                                padding: "5px 12px", 
                                border: "1px solid #fecaca", 
                                borderRadius: 6,
                                background: '#fff5f5',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: 12,
                                fontWeight: 600
                              }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create New Month Version */}
              <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 10, border: "1.5px solid #e5e7eb" }}>
                <h4 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#374151" }}>+ Add New Month</h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ ...labelStyle, marginBottom: 4 }}>Month</label>
                    <select 
                      value={newMonthForm.month} 
                      onChange={e => setNewMonthForm(f => ({ ...f, month: e.target.value }))}
                      style={inputStyle}
                    >
                      <option value="">Select Month</option>
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, marginBottom: 4 }}>Year</label>
                    <select 
                      value={newMonthForm.year} 
                      onChange={e => setNewMonthForm(f => ({ ...f, year: e.target.value }))}
                      style={inputStyle}
                    >
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                
                <div style={{ marginBottom: 14 }}>
                  <label style={{ ...labelStyle, marginBottom: 4 }}>Copy KPIs from:</label>
                  <select 
                    value={newMonthForm.copy_from} 
                    onChange={e => setNewMonthForm(f => ({ ...f, copy_from: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Template Default</option>
                    {monthVersions.map(v => (
                      <option key={v._id} value={v.month}>{v.month} ({v.month_status})</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  onClick={handleCreateMonthVersion}
                  disabled={!newMonthForm.month}
                  style={{ 
                    width: "100%", 
                    padding: "11px", 
                    background: !newMonthForm.month ? '#93c5fd' : '#2563eb', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 8,
                    cursor: !newMonthForm.month ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: 14
                  }}
                >
                  {newMonthForm.month ? `Create ${newMonthForm.month} ${newMonthForm.year} Version` : 'Select a Month'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ===== MONTH VERSION EDIT MODAL ===== */}
{showMonthEditModal && editingMonthVersion && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 750, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
      
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>
              ✏️ Edit {editingMonthVersion.month} Version
            </h3>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
              Changes apply ONLY to this month. Template defaults won't change.
            </p>
          </div>
          <button onClick={closeMonthEditModal} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        
        {/* ✅ NEW: Total Weight Display */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          padding: "12px 16px",
          background: "#f8fafc",
          borderRadius: 8,
          marginBottom: 16,
          border: "1px solid #e5e7eb"
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
            Total Weight
          </span>
          <span style={{ 
            fontSize: 14, 
            fontWeight: 700,
            color: editingMonthVersion.kpi_items?.reduce((s, i) => s + (parseFloat(i.weight) || 0), 0) === 100 ? "#16a34a" : "#f59e0b"
          }}>
            {editingMonthVersion.kpi_items?.reduce((s, i) => s + (parseFloat(i.weight) || 0), 0)}% 
            {editingMonthVersion.kpi_items?.reduce((s, i) => s + (parseFloat(i.weight) || 0), 0) === 100 ? "✓" : "(Need 100%)"}
          </span>
        </div>

        {editingMonthVersion.kpi_items?.map((item, idx) => (
          <div key={idx} style={{ marginBottom: 20, padding: 16, background: "#f8fafc", border: `1.5px solid ${item.is_admission_kpi ? "#bae6fd" : "#e5e7eb"}`, borderRadius: 10 }}>
            
            {/* KPI Header with Delete Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{item.kpi_name || "Untitled KPI"}</span>
                {item.is_admission_kpi && <span className="adm-badge">🎓 Admission</span>}
                <OwnerBadge role={item.owner_role || "self"} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>
                  {item.weight || 0}%
                </span>
                {/* ✅ NEW: Delete KPI button */}
                {editingMonthVersion.kpi_items.length > 1 && (
                  <button 
                    onClick={() => removeMonthKpiItem(idx)}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: "#ef4444", 
                      cursor: "pointer",
                      fontSize: 13,
                      padding: "4px 8px"
                    }}
                    title="Remove this KPI"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>

            {/* ✅ NEW: KPI Name Edit */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>KPI Name</label>
              <input 
                type="text"
                value={item.kpi_name}
                onChange={e => handleMonthItemChange(idx, 'kpi_name', e.target.value)}
                style={{ ...inputStyle }}
                placeholder="Enter KPI name"
              />
            </div>

            {/* Target & Weight in row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Target</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input 
                    type="number"
                    value={item.target}
                    onChange={e => handleMonthItemChange(idx, 'target', Number(e.target.value))}
                    style={{ ...inputStyle, width: "100%" }}
                  />
                  <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>{item.unit}</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Weight %</label>
                <input 
                  type="number"
                  value={item.weight}
                  onChange={e => handleMonthItemChange(idx, 'weight', Number(e.target.value))}
                  style={{ ...inputStyle, width: "100%" }}
                  placeholder="e.g. 25"
                />
              </div>
            </div>

            {/* Unit & Frequency */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Unit</label>
                <select 
                  value={item.unit}
                  onChange={e => handleMonthItemChange(idx, 'unit', e.target.value)}
                  style={inputStyle}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Frequency</label>
                <select 
                  value={item.frequency}
                  onChange={e => handleMonthItemChange(idx, 'frequency', e.target.value)}
                  style={inputStyle}
                >
                  {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

                        {/* Owner Role */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Filled By</label>
              <select 
                value={item.owner_role || "self"}
                onChange={e => handleMonthItemChange(idx, 'owner_role', e.target.value)}
                style={inputStyle}
              >
                {KPI_OWNERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* ===== ADMISSION KPI TOGGLE ===== */}
            <div
              style={{
                marginTop: 12,
                marginBottom: item.is_admission_kpi ? 12 : 0,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                background: item.is_admission_kpi ? "#f0f9ff" : "#f8fafc",
                border: `1.5px solid ${item.is_admission_kpi ? "#0369a1" : "#e5e7eb"}`,
                borderRadius: 10,
                cursor: "pointer"
              }}
              onClick={() => {
                setEditingMonthVersion(v => {
                  const items = [...v.kpi_items];
                  const newVal = !items[idx].is_admission_kpi;
                  items[idx] = { 
                    ...items[idx], 
                    is_admission_kpi: newVal,
                    ...(newVal ? {
                      unit: "admissions",
                      owner_role: "manager",
                      program_targets: programs.map(p => ({
                        program_id: p._id, 
                        program_name: p.name, 
                        target: 0
                      }))
                    } : {
                      unit: "tasks",
                      program_targets: [],
                      target: 0
                    })
                  };
                  return { ...v, kpi_items: items };
                });
              }}
            >
              <input 
                type="radio" 
                checked={item.is_admission_kpi} 
                onChange={() => {}} 
                onClick={e => e.stopPropagation()}
                style={{ width: 16, height: 16, accentColor: "#0369a1", cursor: "pointer" }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: item.is_admission_kpi ? "#0369a1" : "#374151" }}>
                  🎓 Enable Admission KPI — Program-wise Breakdown
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>
                  Set separate targets per program. Total = sum of all program targets.
                </p>
              </div>
              {item.is_admission_kpi && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", background: "#e0f2fe", padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>
                  Active
                </span>
              )}
            </div>

            {/* ===== PROGRAM-WISE TARGETS (if admission enabled) ===== */}
            {item.is_admission_kpi && (
              <div style={{ marginTop: 12, padding: 14, background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10 }}>
                <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#0369a1" }}>
                  Select Programs & Set Targets
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: "#6b7280" }}>click to add/remove</span>
                </p>

                {programs.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: "#f59e0b" }}>
                    ⚠ No programs available. Add programs in template first.
                  </p>
                ) : (
                  <>
                    {/* Program chips */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                      {programs.map(p => {
                        const isSelected = item.program_targets?.some(pt => pt.program_id === p._id);
                        return (
                          <span
                            key={p._id}
                            onClick={() => {
                              setEditingMonthVersion(v => {
                                const items = [...v.kpi_items];
                                const pt = [...(items[idx].program_targets || [])];
                                const found = pt.findIndex(x => x.program_id === p._id);
                                if (found >= 0) {
                                  pt.splice(found, 1);
                                } else {
                                  pt.push({ program_id: p._id, program_name: p.name, target: 0 });
                                }
                                items[idx] = {
                                  ...items[idx],
                                  program_targets: pt,
                                  target: pt.reduce((s, p) => s + (Number(p.target) || 0), 0)
                                };
                                return { ...v, kpi_items: items };
                              });
                            }}
                            style={{
                              padding: "5px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                              cursor: "pointer", transition: "all 0.15s",
                              background: isSelected ? "#0369a1" : "#fff",
                              color: isSelected ? "#fff" : "#374151",
                              border: `1.5px solid ${isSelected ? "#0369a1" : "#d1d5db"}`
                            }}
                          >
                            {isSelected ? "✓ " : "+ "}{p.name}
                          </span>
                        );
                      })}
                    </div>

                    {/* Target inputs for selected programs */}
                    {item.program_targets?.length > 0 && (
                      <>
                        {item.program_targets.map((pt, pi) => (
                          <div key={pi} style={{ display: "flex", gap: 10, marginTop: 8, padding: "10px 14px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, alignItems: "center" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{pt.program_name}</p>
                              <p style={{ margin: "1px 0 0", fontSize: 10, color: "#9ca3af" }}>HR / Manager fills actual value</p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <label style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>Target:</label>
                              <input
                                type="number" value={pt.target} min="0"
                                onChange={e => {
                                  setEditingMonthVersion(v => {
                                    const items = [...v.kpi_items];
                                    const ptArr = [...(items[idx].program_targets || [])];
                                    const found = ptArr.findIndex(x => x.program_id === pt.program_id);
                                    if (found >= 0) {
                                      ptArr[found] = { ...ptArr[found], target: Number(e.target.value) };
                                    }
                                    items[idx] = {
                                      ...items[idx],
                                      program_targets: ptArr,
                                      target: ptArr.reduce((s, p) => s + (Number(p.target) || 0), 0)
                                    };
                                    return { ...v, kpi_items: items };
                                  });
                                }}
                                style={{ ...inputStyle, width: 80, textAlign: "center" }}
                                placeholder="0"
                              />
                            </div>
                          </div>
                        ))}

                        {/* Total */}
                        <div style={{ marginTop: 10, padding: "8px 14px", background: "#0369a1", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>🎯 Total Target</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
                            {item.program_targets.reduce((s, p) => s + (Number(p.target) || 0), 0)}
                          </span>
                        </div>
                      </>
                    )}

                    {(!item.program_targets || item.program_targets.length === 0) && (
                      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#f59e0b" }}>
                        ⚠ Select at least one program above
                      </p>
                    )}
                  </>
                )}
              </div>
            )}


            {/* Total for admission KPI */}
            {item.is_admission_kpi && (
              <div style={{ marginTop: 10, padding: "8px 14px", background: "#0369a1", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>🎯 Total Target</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
                  {item.program_targets?.reduce((s, p) => s + (Number(p.target) || 0), 0) || item.target}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* ✅ NEW: Add KPI Button */}
        <button 
          onClick={addMonthKpiItem}
          style={{ 
            width: "100%", 
            padding: "12px", 
            border: "2px dashed #d1d5db", 
            borderRadius: 8, 
            background: "none", 
            color: "#6b7280", 
            fontSize: 14, 
            cursor: "pointer", 
            fontWeight: 500,
            marginBottom: 20
          }}
        >
          + Add New KPI to {editingMonthVersion.month}
        </button>

        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button onClick={closeMonthEditModal} style={{ flex: 1, padding: "12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button 
            onClick={saveMonthVersion} 
            disabled={savingMonthVersion || editingMonthVersion.kpi_items?.reduce((s, i) => s + (parseFloat(i.weight) || 0), 0) !== 100}
            style={{ 
              flex: 2, 
              padding: "12px", 
              background: savingMonthVersion ? "#93c5fd" : "#2563eb", 
              color: "#fff", 
              border: "none", 
              borderRadius: 8, 
              fontWeight: 700,
              cursor: savingMonthVersion ? "not-allowed" : "pointer",
              fontSize: 14,
              opacity: editingMonthVersion.kpi_items?.reduce((s, i) => s + (parseFloat(i.weight) || 0), 0) !== 100 ? 0.6 : 1
            }}
          >
            {savingMonthVersion ? "Saving..." : `Save ${editingMonthVersion.month} Changes`}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 };
const inputStyle = { width: "100%", padding: "9px 11px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none" };