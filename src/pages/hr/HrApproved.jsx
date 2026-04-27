import { useEffect, useState } from "react";
import {
  CheckCircle,
  Clock,
  User,
  DollarSign,
  FileText,
  Rocket,
  Paperclip,
  Link,
  Upload,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const DEPARTMENTS = ["IT", "Sales", "HR", "Finance", "Operations", "Marketing", "Support", "Admin"];

// ✅ Build dynamic dept list — always include employee's actual backend value
// e.g. "IT / System Department" will appear as first option and be pre-selected
const buildDeptOptions = (empRawDept) => {
  if (!empRawDept) return DEPARTMENTS;
  const already = DEPARTMENTS.some(d => d.toLowerCase() === empRawDept.toLowerCase());
  return already ? DEPARTMENTS : [empRawDept, ...DEPARTMENTS];
};

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

// ✅ Get employee ID from backend field (same as All Employees page shows)
// Falls back to index-based if backend field missing
const getEmpId = (emp, index) =>
  emp?.employeeId || emp?.employee_id || emp?.empId || `EMP-${String(index + 1).padStart(3, "0")}`;

// ✅ Helper: extract designation from emp object safely
// Handles different possible field names from backend
const getDesignation = (emp) =>
  emp?.designation || emp?.role || emp?.position || emp?.job_title || emp?.jobTitle || "";

// ✅ Helper: extract department from emp object safely
const getDepartment = (emp) =>
  emp?.department || emp?.dept || emp?.department_name || emp?.departmentName || "";

// ✅ matchDepartment: pass raw value through directly
// buildDeptOptions() adds it to the dropdown list if it's not in DEPARTMENTS
const matchDepartment = (rawDept) => rawDept?.trim() || "";

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

const responsiveStyles = `
  .hr-approved-wrap {
    padding: 28px 32px;
  }
  .hr-table-wrap {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .hr-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    min-width: 700px;
  }
  .modal-inner {
    background: #fff;
    border-radius: 16px;
    width: 100%;
    max-width: 860px;
    max-height: 94vh;
    overflow-y: auto;
    box-shadow: 0 24px 64px rgba(0,0,0,0.25);
  }
  .modal-header {
    padding: 20px 28px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 10;
  }
  .modal-stepper {
    padding: 16px 28px;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    gap: 8px;
  }
  .modal-body {
    padding: 24px 28px;
  }
  .form-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .salary-preview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .docs-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .stepper-label {
    display: inline;
  }
  @media (max-width: 768px) {
    .hr-approved-wrap {
      padding: 16px;
    }
    .modal-header {
      padding: 14px 16px;
    }
    .modal-stepper {
      padding: 12px 16px;
      gap: 6px;
    }
    .modal-body {
      padding: 16px;
    }
    .form-grid-2 {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .salary-preview-grid {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .summary-grid {
      grid-template-columns: 1fr;
      gap: 8px;
    }
    .docs-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
  @media (max-width: 480px) {
    .salary-preview-grid {
      grid-template-columns: 1fr;
    }
    .stepper-label {
      display: none;
    }
    .modal-stepper {
      gap: 4px;
    }
  }
`;

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
  // ✅ Tracks the raw department string from backend for dynamic dropdown options
  const [empRawDept, setEmpRawDept] = useState("");

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

  // ✅ FIXED: Properly extract designation & department from employee registration data
  const openActivation = async (emp, index) => {
    setSelected(emp);
    setSelectedIndex(index);
    setActiveSection(1);
    setFiles({});
    setUploadedDocs({});
    setUploading({});
    setExistingActivation(null);

    const code = getEmpId(emp, index);

    // ✅ Extract designation & raw department from employee registration data
    const empDesignation = getDesignation(emp);
    const rawDept        = getDepartment(emp);       // e.g. "IT / System Department"
    const empDepartment  = matchDepartment(rawDept); // pass-through trimmed value

    // ✅ Store raw dept so dropdown can include it as an option
    setEmpRawDept(rawDept);

    // ✅ Pre-fill both designation and department from employee registration data
    setEmployment({
      ...initialEmployment,
      employee_code: code,
      department:    empDepartment,
      designation:   empDesignation,
    });
    setSalary(initialSalary);

    // ✅ If activation already saved, load it and merge — registration data as fallback
    try {
      const res = await fetch(`${API_BASE}/api/hr/activation/${emp._id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setExistingActivation(data.data);
        if (data.data.employment) {
          setEmployment({
            ...initialEmployment,
            // ✅ Always keep registration designation & department as base
            designation:   empDesignation,
            department:    empDepartment,
            // ✅ Saved activation data overrides base (saved data is more authoritative)
            ...data.data.employment,
            // ✅ Re-match department from saved data too (in case saved value differs)
            department: matchDepartment(data.data.employment.department) || empDepartment,
            // ✅ Use saved code if valid, else use current employee's ID
            employee_code: data.data.employment.employee_code || code,
          });
        }
        if (data.data.salary) setSalary({ ...initialSalary, ...data.data.salary });
      }
    } catch (e) {
      // Activation not saved yet — registration pre-fill already set above, no problem
    }

    // ✅ Load uploaded docs
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
    setEmpRawDept("");
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
        showToast("Employment & Salary saved!");
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
        showToast(`${docType} uploaded!`);
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
        showToast("Employee Activated Successfully!");
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
    { id: 1, label: "Employment", icon: <User size={15} /> },
    { id: 2, label: "Salary",     icon: <DollarSign size={15} /> },
    { id: 3, label: "Documents",  icon: <FileText size={15} /> },
    { id: 4, label: "Activate",   icon: <CheckCircle size={15} /> },
  ];

  const uploadedCount = HR_DOCS.filter(d => uploadedDocs[d]).length;

  return (
    <div className="hr-approved-wrap" style={{ fontFamily: "'Segoe UI', sans-serif", background: "#f4f6fb", minHeight: "100vh" }}>
      <style>{responsiveStyles}</style>

      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 9999,
          background: toast.type === "error" ? "#ff4d4f" : "#52c41a",
          color: "#fff", padding: "12px 20px", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)", fontWeight: 500, fontSize: 14,
          maxWidth: "calc(100vw - 48px)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {toast.type === "error"
            ? <AlertTriangle size={16} />
            : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={22} color="#2563eb" />
          Approved Employees
        </h2>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Setup employment package and activate employees</p>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {employees.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <CheckCircle size={40} color="#d1d5db" style={{ marginBottom: 10 }} />
            <p style={{ color: "#6b7280" }}>No approved employees yet</p>
          </div>
        ) : (
          <div className="hr-table-wrap">
            <table className="hr-table">
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["#", "Employee Code", "Name", "Email", "Department", "Designation", "Status", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <tr key={emp._id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "14px 20px", color: "#9ca3af", fontWeight: 700 }}>
                      {String(i + 1).padStart(3, "0")}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        background: "#eff6ff", color: "#2563eb",
                        padding: "4px 10px", borderRadius: 6,
                        fontSize: 12, fontWeight: 700, fontFamily: "monospace", whiteSpace: "nowrap",
                      }}>
                        {getEmpId(emp, i)}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#2563eb", flexShrink: 0 }}>
                          {emp.name?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, color: "#1a1a2e", whiteSpace: "nowrap" }}>{emp.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", color: "#6b7280", whiteSpace: "nowrap" }}>{emp.email}</td>
                    <td style={{ padding: "14px 20px", color: "#374151", whiteSpace: "nowrap" }}>{getDepartment(emp) || "—"}</td>
                    {/* ✅ Designation column now uses helper function */}
                    <td style={{ padding: "14px 20px", color: "#374151", whiteSpace: "nowrap" }}>{getDesignation(emp) || "—"}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        background: emp.status === "active" ? "#f0fdf4" : "#fffbeb",
                        color: emp.status === "active" ? "#16a34a" : "#d97706",
                        fontWeight: 700, padding: "4px 12px", borderRadius: 20, fontSize: 12, whiteSpace: "nowrap",
                        display: "inline-flex", alignItems: "center", gap: 5,
                      }}>
                        {emp.status === "active"
                          ? <><CheckCircle size={12} /> Active</>
                          : <><Clock size={12} /> Pending Setup</>}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <button onClick={() => openActivation(emp, i)} style={{
                        background: emp.status === "active" ? "#f3f4f6" : "#2563eb",
                        color: emp.status === "active" ? "#374151" : "#fff",
                        border: "none", borderRadius: 7, padding: "8px 16px",
                        fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                        display: "inline-flex", alignItems: "center", gap: 6,
                      }}>
                        {emp.status === "active"
                          ? <><Eye size={14} /> View Setup</>
                          : <><Rocket size={14} /> Setup & Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══ MODAL ══ */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="modal-inner">

            {/* Header */}
            <div className="modal-header">
              <div style={{ minWidth: 0, paddingRight: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <User size={18} color="#2563eb" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    Employee Activation — {selected.name}
                  </h3>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selected.email} · {getDepartment(selected)} · {getDesignation(selected) && <span style={{ color: "#7c3aed" }}>{getDesignation(selected)} · </span>}
                    <span style={{ color: "#2563eb", fontWeight: 700, fontFamily: "monospace" }}>{getEmpId(selected, selectedIndex)}</span>
                  </p>
                </div>
              </div>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 4 }}>
                <X size={22} />
              </button>
            </div>

            {/* Stepper */}
            <div className="modal-stepper">
              {sections.map(s => {
                const isDone = (existingActivation && s.id <= 2) || (s.id === 3 && uploadedCount > 0);
                const isActive = activeSection === s.id;
                return (
                  <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                    flex: 1, padding: "9px 6px", border: "none", borderRadius: 9, cursor: "pointer",
                    background: isActive ? "#2563eb" : isDone ? "#f0fdf4" : "#f8fafc",
                    color: isActive ? "#fff" : isDone ? "#16a34a" : "#6b7280",
                    fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    minWidth: 0,
                  }}>
                    {s.icon}
                    <span className="stepper-label">{s.label}</span>
                    {s.id === 3 && uploadedCount > 0 && !isActive && (
                      <span style={{ fontSize: 10 }}>({uploadedCount}/{HR_DOCS.length})</span>
                    )}
                    {existingActivation && s.id <= 2 && !isActive && (
                      <CheckCircle size={11} />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="modal-body">

              {/* ── SECTION 1: EMPLOYMENT ── */}
              {activeSection === 1 && (
                <div>
                  <h4 style={sectionTitle}>
                    <User size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                    Employment Details
                  </h4>
                  <div className="form-grid-2">
                    <div>
                      <label style={labelStyle}>Employee Code</label>
                      <input
                        value={employment.employee_code}
                        onChange={e => handleEmploymentChange("employee_code", e.target.value)}
                        style={{ ...inputStyle, background: "#f0f9ff", fontWeight: 700, color: "#1d4ed8", fontFamily: "monospace" }}
                        placeholder="RAD-2026-001"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Designation *</label>
                      <input
                        value={employment.designation}
                        onChange={e => handleEmploymentChange("designation", e.target.value)}
                        style={inputStyle}
                        placeholder="e.g. Software Engineer"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Department</label>
                      <select value={employment.department} onChange={e => handleEmploymentChange("department", e.target.value)} style={inputStyle}>
                        <option value="">Select Department</option>
                        {buildDeptOptions(empRawDept).map(d => <option key={d} value={d}>{d}</option>)}
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
                    <button onClick={() => setActiveSection(2)} style={{ ...btnSecondary, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      Next: Salary <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── SECTION 2: SALARY ── */}
              {activeSection === 2 && (
                <div>
                  <h4 style={sectionTitle}>
                    <DollarSign size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                    Salary Structure
                  </h4>
                  <div className="form-grid-2">
                    {[
                      { field: "ctc",                  label: "CTC (Annual) ₹",         placeholder: "e.g. 360000" },
                      { field: "basic",                label: "Basic Salary ₹",         placeholder: "e.g. 15000"  },
                      { field: "hra",                  label: "HRA ₹",                  placeholder: "e.g. 6000"   },
                      { field: "special_allowance",    label: "Special Allowance ₹",    placeholder: "e.g. 3000"   },
                      { field: "conveyance_allowance", label: "Conveyance Allowance ₹", placeholder: "e.g. 1000"   },
                      { field: "gross_salary",         label: "Gross Salary ₹",         placeholder: "e.g. 25000"  },
                      { field: "net_salary",           label: "Net Salary ₹",           placeholder: "e.g. 22000"  },
                      { field: "professional_tax",     label: "Professional Tax ₹",     placeholder: "e.g. 200"    },
                    ].map(f => (
                      <div key={f.field}>
                        <label style={labelStyle}>{f.label}</label>
                        <input type="number" value={salary[f.field]} onChange={e => setSalary(s => ({ ...s, [f.field]: e.target.value }))} style={inputStyle} placeholder={f.placeholder} />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 20, background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #e5e7eb" }}>
                    <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 13, color: "#374151" }}>Statutory Deductions</p>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
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
                      <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13, color: "#1e40af", display: "flex", alignItems: "center", gap: 6 }}>
                        <DollarSign size={13} /> Salary Preview
                      </p>
                      <div className="salary-preview-grid">
                        {[
                          { label: "CTC (Annual)",  value: salary.ctc          ? `₹${Number(salary.ctc).toLocaleString("en-IN")}`          : "—" },
                          { label: "Gross / Month", value: salary.gross_salary ? `₹${Number(salary.gross_salary).toLocaleString("en-IN")}` : "—" },
                          { label: "Net / Month",   value: salary.net_salary   ? `₹${Number(salary.net_salary).toLocaleString("en-IN")}`   : "—" },
                        ].map((s, i) => (
                          <div key={i} style={{ background: "#fff", borderRadius: 8, padding: "10px 14px", border: "1px solid #bfdbfe" }}>
                            <p style={{ margin: "0 0 2px", fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{s.label}</p>
                            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1d4ed8" }}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <button onClick={() => setActiveSection(1)} style={{ ...btnSecondary, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <ChevronLeft size={15} /> Back
                    </button>
                    <button onClick={handleSaveDetails} disabled={saving} style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <FileText size={15} />
                      {saving ? "Saving..." : "Save Employment & Salary"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── SECTION 3: DOCUMENTS ── */}
              {activeSection === 3 && (
                <div>
                  <h4 style={sectionTitle}>
                    <FileText size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                    Upload Documents
                  </h4>
                  <div style={{ marginBottom: 20, background: "#f0fdf4", borderRadius: 10, padding: "12px 16px", border: "1px solid #bbf7d0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>Documents Uploaded</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>{uploadedCount} / {HR_DOCS.length}</span>
                    </div>
                    <div style={{ background: "#dcfce7", borderRadius: 99, height: 8 }}>
                      <div style={{ background: "#16a34a", borderRadius: 99, height: 8, width: `${(uploadedCount / HR_DOCS.length) * 100}%`, transition: "width 0.4s" }} />
                    </div>
                  </div>

                  <div className="docs-grid">
                    {HR_DOCS.map(label => {
                      const isUploaded  = !!uploadedDocs[label];
                      const isUploading = uploading[label];
                      const hasFile     = !!files[label];
                      return (
                        <div key={label} style={{ border: `2px solid ${isUploaded ? "#86efac" : "#e5e7eb"}`, borderRadius: 10, padding: 14, background: isUploaded ? "#f0fdf4" : "#fafafa" }}>
                          <label style={{ ...labelStyle, color: isUploaded ? "#16a34a" : "#374151", display: "flex", alignItems: "center", gap: 6 }}>
                            {isUploaded
                              ? <CheckCircle size={13} color="#16a34a" />
                              : <Paperclip size={13} color="#6b7280" />}
                            {label}
                          </label>
                          {isUploaded ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                              <a href={uploadedDocs[label]} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <Link size={12} /> View File
                              </a>
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
                                style={{ fontSize: 12, cursor: "pointer", maxWidth: "100%" }} />
                              {hasFile && (
                                <p style={{ margin: 0, fontSize: 11, color: "#6b7280", wordBreak: "break-all", display: "flex", alignItems: "center", gap: 4 }}>
                                  <Paperclip size={11} /> {files[label].name}
                                </p>
                              )}
                            </div>
                          )}
                          {files[label] && (
                            <button onClick={() => handleUploadDoc(label)} disabled={isUploading} style={{
                              marginTop: 8, width: "100%", padding: "7px 0",
                              background: isUploading ? "#93c5fd" : "#2563eb",
                              color: "#fff", border: "none", borderRadius: 7,
                              fontSize: 12, fontWeight: 700, cursor: "pointer",
                              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                            }}>
                              <Upload size={13} />
                              {isUploading ? "Uploading..." : "Upload to Cloud"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <button onClick={() => setActiveSection(2)} style={{ ...btnSecondary, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <ChevronLeft size={15} /> Back
                    </button>
                    <button onClick={() => setActiveSection(4)} style={{ ...btnSecondary, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      Next: Activate <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── SECTION 4: ACTIVATE ── */}
              {activeSection === 4 && (
                <div>
                  <h4 style={sectionTitle}>
                    <CheckCircle size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                    Activate Employee
                  </h4>
                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, border: "1px solid #e5e7eb", marginBottom: 20 }}>
                    <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>Activation Summary</p>
                    <div className="summary-grid">
                      {[
                        { label: "Employee",        value: selected.name },
                        { label: "Employee Code",   value: employment.employee_code || getEmpId(selected, selectedIndex) },
                        { label: "Designation",     value: employment.designation   || "—" },
                        { label: "Department",      value: employment.department    || getDepartment(selected) || "—" },
                        { label: "Employment Type", value: employment.employment_type },
                        { label: "Date of Joining", value: employment.date_of_joining || "—" },
                        { label: "CTC (Annual)",    value: salary.ctc        ? `₹${Number(salary.ctc).toLocaleString("en-IN")}`        : "—" },
                        { label: "Net Salary",      value: salary.net_salary ? `₹${Number(salary.net_salary).toLocaleString("en-IN")}/mo` : "—" },
                        { label: "Documents",       value: `${uploadedCount} / ${HR_DOCS.length} uploaded` },
                      ].map((d, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, gap: 8, flexWrap: "wrap" }}>
                          <span style={{ color: "#6b7280" }}>{d.label}</span>
                          <span style={{ fontWeight: 700, color: "#1a1a2e", textAlign: "right" }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!existingActivation && (
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 14, marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <AlertTriangle size={16} color="#92400e" style={{ flexShrink: 0, marginTop: 1 }} />
                      <p style={{ margin: 0, fontSize: 13, color: "#92400e", fontWeight: 600 }}>Employment & Salary not saved yet. Please complete Sections 1 & 2 first.</p>
                    </div>
                  )}
                  {existingActivation && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircle size={16} color="#166534" />
                      <p style={{ margin: 0, fontSize: 13, color: "#166534", fontWeight: 600 }}>Employment & Salary saved. Ready to activate!</p>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <button onClick={() => setActiveSection(3)} style={{ ...btnSecondary, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <ChevronLeft size={15} /> Back
                    </button>
                    <button onClick={handleActivate} disabled={activating || !existingActivation} style={{
                      ...btnPrimary,
                      background: existingActivation ? "#16a34a" : "#86efac",
                      padding: "12px 32px", fontSize: 15,
                      display: "inline-flex", alignItems: "center", gap: 8,
                    }}>
                      <Rocket size={16} />
                      {activating ? "Activating..." : "Activate Employee"}
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

const sectionTitle = { margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 8 };
const labelStyle = { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, color: "#1a1a2e", background: "#fff", boxSizing: "border-box", outline: "none" };
const btnPrimary = { padding: "10px 24px", border: "none", borderRadius: 8, background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const btnSecondary = { padding: "10px 20px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer" };