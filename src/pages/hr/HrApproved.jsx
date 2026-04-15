import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const DEPARTMENTS = ["IT", "Sales", "HR", "Finance", "Operations", "Marketing", "Support", "Admin"];
const EMP_TYPES = ["Full-time", "Part-time", "Contract", "Intern"];
const SHIFTS = ["General Shift", "Field Employee", "Rotational"];
const PROBATION_OPTIONS = ["1 month", "2 months", "3 months", "6 months", "no probation"];

const HR_DOCS = [
  "Offer Letter",
  "Appointment Letter",
  "NDA Agreement",
  "Employment Contract",
  "Salary Structure Document",
  "HR Policy Document",
];

// ✅ FIX: Index-based sequential code — RAD-2026-001, 002, 003...
const genEmpCode = (index) => {
  const year = new Date().getFullYear();
  return `RAD-${year}-${String(index + 1).padStart(3, "0")}`;
};

const initialEmployment = {
  employee_code: "",
  department: "",
  designation: "",
  employment_type: "Full-time",
  work_location: "",
  date_of_joining: "",
  probation_period: "3 months",
  confirmation_date: "",
  work_shift: "General Shift",
  reporting_manager: "",
};

const initialSalary = {
  ctc: "",
  basic: "",
  hra: "",
  special_allowance: "",
  conveyance_allowance: "",
  gross_salary: "",
  net_salary: "",
  pf_applicable: false,
  esi_applicable: false,
  tds_applicable: false,
  professional_tax: "",
};

export default function HrApproved() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeSection, setActiveSection] = useState(1);
  const [employment, setEmployment] = useState(initialEmployment);
  const [salary, setSalary] = useState(initialSalary);

  const [files, setFiles] = useState({});
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [uploading, setUploading] = useState({});

  const [activating, setActivating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [existingActivation, setExistingActivation] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/hr/approved`)
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.log(err));
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ✅ Pass index when opening activation modal
  const openActivation = async (emp, index) => {
    setSelected(emp);
    setSelectedIndex(index);
    setActiveSection(1);
    setFiles({});
    setUploadedDocs({});
    setUploading({});
    setExistingActivation(null);

    // ✅ Generate sequential code from list index
    const code = genEmpCode(index);
    setEmployment({ ...initialEmployment, employee_code: code, department: emp.department || "" });
    setSalary(initialSalary);

    try {
      const res = await fetch(`${API_BASE}/api/hr/activation/${emp._id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setExistingActivation(data.data);
        if (data.data.employment) {
          setEmployment(prev => ({
            ...initialEmployment,
            ...data.data.employment,
            // ✅ If saved code looks like old hex format, replace with sequential
            employee_code: /RAD-\d{4}-[a-f0-9]{3}$/i.test(data.data.employment.employee_code)
              ? code
              : (data.data.employment.employee_code || code),
          }));
        }
        if (data.data.salary) setSalary({ ...initialSalary, ...data.data.salary });
      }
    } catch (e) {}

    try {
      const res = await fetch(`${API_BASE}/api/hr/activation/docs/${emp._id}`);
      const data = await res.json();
      if (data.success && data.data.length) {
        const map = {};
        data.data.forEach(d => { map[d.docType] = d.fileUrl; });
        setUploadedDocs(map);
      }
    } catch (e) {}
  };

  const closeModal = () => {
    setSelected(null);
    setActiveSection(1);
    setFiles({});
    setUploadedDocs({});
    setUploading({});
    setExistingActivation(null);
  };

  const handleEmploymentChange = (field, value) => {
    setEmployment(prev => {
      const updated = { ...prev, [field]: value };
      if (field === "date_of_joining" || field === "probation_period") {
        const doj  = field === "date_of_joining"  ? value : prev.date_of_joining;
        const prob = field === "probation_period" ? value : prev.probation_period;
        if (doj && prob) {
          if (prob === "no probation") {
            updated.confirmation_date = doj;
          } else {
            const months = parseInt(prob);
            const d = new Date(doj);
            d.setMonth(d.getMonth() + months);
            updated.confirmation_date = d.toISOString().split("T")[0];
          }
        }
      }
      return updated;
    });
  };

  const handleSaveDetails = async () => {
    if (!employment.designation || !employment.date_of_joining) {
      return showToast("Please fill Designation and Date of Joining", "error");
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/hr/activation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: selected._id, employment, salary }),
      });
      const data = await res.json();
      if (data.success) {
        setExistingActivation(data.data);
        showToast("Employment & Salary saved! ✅");
        setActiveSection(3);
      } else {
        showToast(data.message || "Save failed", "error");
      }
    } catch {
      showToast("Server error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDoc = async (docType) => {
    const file = files[docType];
    if (!file) return showToast("Select a file first", "error");
    setUploading(prev => ({ ...prev, [docType]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("employeeId", selected._id);
      formData.append("docType", docType);
      const res = await fetch(`${API_BASE}/api/hr/activation/upload-doc`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setUploadedDocs(prev => ({ ...prev, [docType]: data.fileUrl }));
        setFiles(prev => ({ ...prev, [docType]: null }));
        showToast(`${docType} uploaded! ✅`);
      } else {
        showToast(data.message || "Upload failed", "error");
      }
    } catch {
      showToast("Upload failed", "error");
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }));
    }
  };

  const handleActivate = async () => {
    if (!existingActivation) return showToast("Please save Employment & Salary first", "error");
    setActivating(true);
    try {
      const res = await fetch(`${API_BASE}/api/hr/activation/activate`, {
        method: "POST",  
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: selected._id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Employee Activated Successfully! 🎉");
        const updated = await fetch(`${API_BASE}/api/hr/approved`).then(r => r.json());
        setEmployees(updated);
        setTimeout(() => closeModal(), 1500);
      } else {
        showToast(data.message || "Activation failed", "error");
      }
    } catch {
      showToast("Server error", "error");
    } finally {
      setActivating(false);
    }
  };

  const sections = [
    { id: 1, label: "Employment", icon: "👤" },
    { id: 2, label: "Salary",     icon: "💰" },
    { id: 3, label: "Documents",  icon: "📄" },
    { id: 4, label: "Activate",   icon: "✅" },
  ];

  const uploadedCount = HR_DOCS.filter(d => uploadedDocs[d]).length;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", padding: "28px 32px", background: "#f4f6fb", minHeight: "100vh" }}>

      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 9999,
          background: toast.type === "error" ? "#ff4d4f" : "#52c41a",
          color: "#fff", padding: "12px 20px", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)", fontWeight: 500, fontSize: 14
        }}>{toast.msg}</div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e" }}>Approved Employees</h2>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Setup employment package and activate employees</p>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {employees.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <p style={{ color: "#6b7280" }}>No approved employees yet</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["#", "Employee Code", "Name", "Email", "Department", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp._id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  {/* ✅ Row number */}
                  <td style={{ padding: "14px 20px", color: "#9ca3af", fontWeight: 700 }}>
                    {String(i + 1).padStart(3, "0")}
                  </td>
                  {/* ✅ Sequential employee code badge */}
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      background: "#eff6ff", color: "#2563eb",
                      padding: "4px 10px", borderRadius: 6,
                      fontSize: 12, fontWeight: 700, fontFamily: "monospace"
                    }}>
                      {genEmpCode(i)}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#2563eb" }}>
                        {emp.name?.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, color: "#1a1a2e" }}>{emp.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px", color: "#6b7280" }}>{emp.email}</td>
                  <td style={{ padding: "14px 20px", color: "#374151" }}>{emp.department || "—"}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      background: emp.status === "active" ? "#f0fdf4" : "#fffbeb",
                      color: emp.status === "active" ? "#16a34a" : "#d97706",
                      fontWeight: 700, padding: "4px 12px", borderRadius: 20, fontSize: 12
                    }}>
                      {emp.status === "active" ? "✅ Active" : "⏳ Pending Setup"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    {/* ✅ Pass index here */}
                    <button onClick={() => openActivation(emp, i)} style={{
                      background: emp.status === "active" ? "#f3f4f6" : "#2563eb",
                      color: emp.status === "active" ? "#374151" : "#fff",
                      border: "none", borderRadius: 7, padding: "8px 16px",
                      fontSize: 13, fontWeight: 600, cursor: "pointer"
                    }}>
                      {emp.status === "active" ? "View Setup" : "Setup & Activate →"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ══ MODAL ══ */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 860, maxHeight: "94vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>

            {/* Header */}
            <div style={{ padding: "20px 28px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a1a2e" }}>Employee Activation — {selected.name}</h3>
                <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b7280" }}>
                  {selected.email} · {selected.department} ·{" "}
                  <span style={{ color: "#2563eb", fontWeight: 700, fontFamily: "monospace" }}>{genEmpCode(selectedIndex)}</span>
                </p>
              </div>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>

            {/* Stepper */}
            <div style={{ padding: "16px 28px", borderBottom: "1px solid #f3f4f6", display: "flex", gap: 8 }}>
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                  flex: 1, padding: "10px 8px", border: "none", borderRadius: 9, cursor: "pointer",
                  background: activeSection === s.id ? "#2563eb" : existingActivation && s.id <= 2 ? "#f0fdf4" : s.id === 3 && uploadedCount > 0 ? "#f0fdf4" : "#f8fafc",
                  color: activeSection === s.id ? "#fff" : (existingActivation && s.id <= 2) || (s.id === 3 && uploadedCount > 0) ? "#16a34a" : "#6b7280",
                  fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}>
                  <span>{s.icon}</span> {s.label}
                  {s.id === 3 && uploadedCount > 0 && activeSection !== 3 && <span style={{ fontSize: 11 }}>({uploadedCount}/{HR_DOCS.length})</span>}
                  {existingActivation && s.id <= 2 && activeSection !== s.id && <span style={{ fontSize: 11 }}>✓</span>}
                </button>
              ))}
            </div>

            <div style={{ padding: "24px 28px" }}>

              {/* ── SECTION 1: EMPLOYMENT ── */}
              {activeSection === 1 && (
                <div>
                  <h4 style={sectionTitle}>👤 Employment Details</h4>
                  <div style={grid2}>
                    <div>
                      <label style={labelStyle}>Employee Code</label>
                      {/* ✅ Pre-filled with sequential code, editable if needed */}
                      <input
                        value={employment.employee_code}
                        onChange={e => handleEmploymentChange("employee_code", e.target.value)}
                        style={{ ...inputStyle, background: "#f0f9ff", fontWeight: 700, color: "#1d4ed8", fontFamily: "monospace" }}
                        placeholder="RAD-2026-001"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Designation *</label>
                      <input value={employment.designation} onChange={e => handleEmploymentChange("designation", e.target.value)} style={inputStyle} placeholder="e.g. Software Engineer" />
                    </div>
                    <div>
                      <label style={labelStyle}>Department</label>
                      <select value={employment.department} onChange={e => handleEmploymentChange("department", e.target.value)} style={inputStyle}>
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Employment Type</label>
                      <select value={employment.employment_type} onChange={e => handleEmploymentChange("employment_type", e.target.value)} style={inputStyle}>
                        {EMP_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Work Location / Branch</label>
                      <input value={employment.work_location} onChange={e => handleEmploymentChange("work_location", e.target.value)} style={inputStyle} placeholder="e.g. Chennai HQ" />
                    </div>
                    <div>
                      <label style={labelStyle}>Work Shift</label>
                      <select value={employment.work_shift} onChange={e => handleEmploymentChange("work_shift", e.target.value)} style={inputStyle}>
                        {SHIFTS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Date of Joining *</label>
                      <input type="date" value={employment.date_of_joining} onChange={e => handleEmploymentChange("date_of_joining", e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Probation Period</label>
                      <select value={employment.probation_period} onChange={e => handleEmploymentChange("probation_period", e.target.value)} style={inputStyle}>
                        {PROBATION_OPTIONS.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Confirmation Date (auto)</label>
                      <input type="date" value={employment.confirmation_date} readOnly style={{ ...inputStyle, background: "#f8fafc", color: "#6b7280" }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Reporting Manager</label>
                      <input value={employment.reporting_manager} onChange={e => handleEmploymentChange("reporting_manager", e.target.value)} style={inputStyle} placeholder="Manager name" />
                    </div>
                  </div>
                  <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => setActiveSection(2)} style={btnSecondary}>Next: Salary →</button>
                  </div>
                </div>
              )}

              {/* ── SECTION 2: SALARY ── */}
              {activeSection === 2 && (
                <div>
                  <h4 style={sectionTitle}>💰 Salary Structure</h4>
                  <div style={grid2}>
                    {[
                      { field: "ctc",                  label: "CTC (Annual) ₹",        placeholder: "e.g. 360000" },
                      { field: "basic",                label: "Basic Salary ₹",        placeholder: "e.g. 15000"  },
                      { field: "hra",                  label: "HRA ₹",                 placeholder: "e.g. 6000"   },
                      { field: "special_allowance",    label: "Special Allowance ₹",   placeholder: "e.g. 3000"   },
                      { field: "conveyance_allowance", label: "Conveyance Allowance ₹",placeholder: "e.g. 1000"   },
                      { field: "gross_salary",         label: "Gross Salary ₹",        placeholder: "e.g. 25000"  },
                      { field: "net_salary",           label: "Net Salary ₹",          placeholder: "e.g. 22000"  },
                      { field: "professional_tax",     label: "Professional Tax ₹",    placeholder: "e.g. 200"    },
                    ].map(f => (
                      <div key={f.field}>
                        <label style={labelStyle}>{f.label}</label>
                        <input type="number" value={salary[f.field]} onChange={e => setSalary(s => ({ ...s, [f.field]: e.target.value }))} style={inputStyle} placeholder={f.placeholder} />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 20, background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #e5e7eb" }}>
                    <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 13, color: "#374151" }}>Statutory Deductions</p>
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                      {[
                        { field: "pf_applicable",  label: "PF Applicable"  },
                        { field: "esi_applicable", label: "ESI Applicable" },
                        { field: "tds_applicable", label: "TDS Applicable" },
                      ].map(s => (
                        <label key={s.field} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#374151" }}>
                          <input type="checkbox" checked={salary[s.field]} onChange={e => setSalary(prev => ({ ...prev, [s.field]: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#2563eb" }} />
                          {s.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {(salary.gross_salary || salary.net_salary) && (
                    <div style={{ marginTop: 20, background: "#eff6ff", borderRadius: 12, padding: 16, border: "1px solid #bfdbfe" }}>
                      <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#1e40af" }}>Salary Preview</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                        {[
                          { label: "CTC (Annual)",  value: salary.ctc          ? `₹${Number(salary.ctc).toLocaleString("en-IN")}`          : "—" },
                          { label: "Gross / Month", value: salary.gross_salary ? `₹${Number(salary.gross_salary).toLocaleString("en-IN")}` : "—" },
                          { label: "Net / Month",   value: salary.net_salary   ? `₹${Number(salary.net_salary).toLocaleString("en-IN")}`   : "—" },
                        ].map((s, i) => (
                          <div key={i} style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #bfdbfe" }}>
                            <p style={{ margin: "0 0 2px", fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{s.label}</p>
                            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1d4ed8" }}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
                    <button onClick={() => setActiveSection(1)} style={btnSecondary}>← Back</button>
                    <button onClick={handleSaveDetails} disabled={saving} style={btnPrimary}>
                      {saving ? "Saving..." : "💾 Save Employment & Salary"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── SECTION 3: DOCUMENTS ── */}
              {activeSection === 3 && (
                <div>
                  <h4 style={sectionTitle}>📄 Upload Documents</h4>
                  <div style={{ marginBottom: 20, background: "#f0fdf4", borderRadius: 10, padding: "12px 16px", border: "1px solid #bbf7d0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>Documents Uploaded</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>{uploadedCount} / {HR_DOCS.length}</span>
                    </div>
                    <div style={{ background: "#dcfce7", borderRadius: 99, height: 8 }}>
                      <div style={{ background: "#16a34a", borderRadius: 99, height: 8, width: `${(uploadedCount / HR_DOCS.length) * 100}%`, transition: "width 0.4s" }} />
                    </div>
                  </div>

                  <div style={grid2}>
                    {HR_DOCS.map(label => {
                      const isUploaded  = !!uploadedDocs[label];
                      const isUploading = uploading[label];
                      const hasFile     = !!files[label];
                      return (
                        <div key={label} style={{ border: `2px solid ${isUploaded ? "#86efac" : "#e5e7eb"}`, borderRadius: 10, padding: 14, background: isUploaded ? "#f0fdf4" : "#fafafa" }}>
                          <label style={{ ...labelStyle, color: isUploaded ? "#16a34a" : "#374151" }}>
                            {isUploaded ? "✅ " : "📎 "}{label}
                          </label>
                          {isUploaded ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                              <a href={uploadedDocs[label]} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>🔗 View File</a>
                              <label style={{ fontSize: 12, color: "#6b7280", cursor: "pointer", textDecoration: "underline" }}>
                                Replace
                                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style={{ display: "none" }}
                                  onChange={e => setFiles(prev => ({ ...prev, [label]: e.target.files[0] }))} />
                              </label>
                            </div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={e => setFiles(prev => ({ ...prev, [label]: e.target.files[0] }))}
                                style={{ fontSize: 12, cursor: "pointer" }} />
                              {hasFile && <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>📎 {files[label].name}</p>}
                            </div>
                          )}
                          {files[label] && (
                            <button onClick={() => handleUploadDoc(label)} disabled={isUploading} style={{
                              marginTop: 8, width: "100%", padding: "7px 0",
                              background: isUploading ? "#93c5fd" : "#2563eb",
                              color: "#fff", border: "none", borderRadius: 7,
                              fontSize: 12, fontWeight: 700, cursor: "pointer"
                            }}>
                              {isUploading ? "Uploading..." : "📤 Upload to Cloud"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
                    <button onClick={() => setActiveSection(2)} style={btnSecondary}>← Back</button>
                    <button onClick={() => setActiveSection(4)} style={{ ...btnSecondary, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                      Next: Activate →
                    </button>
                  </div>
                </div>
              )}

              {/* ── SECTION 4: ACTIVATE ── */}
              {activeSection === 4 && (
                <div>
                  <h4 style={sectionTitle}>✅ Activate Employee</h4>
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, border: "1px solid #e5e7eb", marginBottom: 20 }}>
                    <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>Activation Summary</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Employee",       value: selected.name },
                        { label: "Employee Code",  value: employment.employee_code || genEmpCode(selectedIndex) },
                        { label: "Designation",    value: employment.designation   || "—" },
                        { label: "Department",     value: employment.department    || selected.department || "—" },
                        { label: "Employment Type",value: employment.employment_type },
                        { label: "Date of Joining",value: employment.date_of_joining || "—" },
                        { label: "CTC (Annual)",   value: salary.ctc        ? `₹${Number(salary.ctc).toLocaleString("en-IN")}`        : "—" },
                        { label: "Net Salary",     value: salary.net_salary ? `₹${Number(salary.net_salary).toLocaleString("en-IN")}/mo` : "—" },
                        { label: "Documents",      value: `${uploadedCount} / ${HR_DOCS.length} uploaded` },
                      ].map((d, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}>
                          <span style={{ color: "#6b7280" }}>{d.label}</span>
                          <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!existingActivation && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 14, marginBottom: 20 }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#92400e", fontWeight: 600 }}>⚠️ Employment & Salary not saved yet. Please complete Sections 1 & 2 first.</p>
                    </div>
                  )}
                  {existingActivation && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 14, marginBottom: 20 }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#166534", fontWeight: 600 }}>✅ Employment & Salary saved. Ready to activate!</p>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button onClick={() => setActiveSection(3)} style={btnSecondary}>← Back</button>
                    <button onClick={handleActivate} disabled={activating || !existingActivation} style={{
                      ...btnPrimary,
                      background: existingActivation ? "#16a34a" : "#86efac",
                      padding: "12px 32px", fontSize: 15
                    }}>
                      {activating ? "Activating..." : "🚀 Activate Employee"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const sectionTitle = { margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: "#1a1a2e" };
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none" };
const btnPrimary = { padding: "10px 24px", border: "none", borderRadius: 8, background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const btnSecondary = { padding: "10px 20px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer" };