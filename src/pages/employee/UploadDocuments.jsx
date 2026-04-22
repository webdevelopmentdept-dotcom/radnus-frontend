import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Upload, FileText, CheckCircle2, AlertCircle, X, FileCheck,
  ShieldCheck, User, Briefcase, GraduationCap, Link as LinkIcon,
  Plus, Trash2, ChevronDown, ChevronUp, Building2, CreditCard,
  BookOpen, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── MANDATORY DOCS (always shown) ──────────────────────────────────────────
const MANDATORY_DOCS = [
  { id: "Aadhaar",           label: "Aadhaar Card",      category: "Identity",     icon: <ShieldCheck size={18} />, required: true  },
  { id: "Ration Card",       label: "Ration Card",       category: "Identity",     icon: <ShieldCheck size={18} />, required: false },
  { id: "PAN",               label: "PAN Card",          category: "Identity",     icon: <CreditCard  size={18} />, required: true  },
  { id: "Passport Photo",    label: "Passport Photo",    category: "Identity",     icon: <User        size={18} />, required: true  },
  { id: "Resume",            label: "Resume",            category: "Professional", icon: <FileText    size={18} />, required: true  },
  { id: "Bank Passbook",     label: "Bank Passbook",     category: "Bank",         icon: <BookOpen    size={18} />, required: true  },
  { id: "Cancelled Cheque",  label: "Cancelled Cheque",  category: "Bank",         icon: <FileText    size={18} />, required: false },
  { id: "10th Marksheet",    label: "10th Marksheet",    category: "Education",    icon: <GraduationCap size={18} />, required: true },
  { id: "12th Marksheet",    label: "12th Marksheet",    category: "Education",    icon: <GraduationCap size={18} />, required: true },
];

// ─── OPTIONAL TEXT FIELDS ────────────────────────────────────────────────────
const OPTIONAL_TEXT_FIELDS = [
  { id: "PF Number",         label: "PF Number",         placeholder: "Enter PF Number (if available)",  required: false },
  { id: "ESI Number",        label: "ESI Number",        placeholder: "Enter ESI Number (if available)", required: false },
];

// ─── OPTIONAL FILE DOCS ──────────────────────────────────────────────────────
const OPTIONAL_FILE_DOCS = [
  { id: "Bank Statement",    label: "Bank Statement",    category: "Bank",         icon: <FileText    size={18} />, required: false },
];

// ─── UG YEAR DOCS ────────────────────────────────────────────────────────────
const UG_DOCS = [
  { id: "UG 1st Year",       label: "1st Year Marksheet",   required: true  },
  { id: "UG 2nd Year",       label: "2nd Year Marksheet",   required: true  },
  { id: "UG 3rd Year",       label: "3rd Year Marksheet",   required: true  },
  { id: "UG Provisional",    label: "Provisional Certificate", required: true },
  { id: "PG Certificate",    label: "PG Certificate",       required: false },
];

// ─── PER-COMPANY DOCS ────────────────────────────────────────────────────────
const COMPANY_DOCS = [
  { id: "offer",      label: "Offer Letter"      },
  { id: "experience", label: "Experience Letter" },
];

// ─── REFERENCE DOCS ──────────────────────────────────────────────────────────
const REFERENCE_COUNT = 2;

export default function UploadDocuments() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [files,        setFiles]        = useState({});
  const [previews,     setPreviews]     = useState({});
  const [statuses,     setStatuses]     = useState({});
  const [textFields,   setTextFields]   = useState({});
  const [dragActive,   setDragActive]   = useState(null);
  const [previewModal, setPreviewModal] = useState(null);
  const [showAlert,    setShowAlert]    = useState(true);

  // Conditional toggles
  const [hasUG,         setHasUG]         = useState(null); // null=not answered, true/false
  const [hasExperience, setHasExperience] = useState(null);

  // Work experience — array of companies
  const [companies, setCompanies] = useState([{ id: Date.now(), name: "" }]);

  // ── On Mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const employeeId = localStorage.getItem("employeeId");
    if (!employeeId) { window.location.href = "/employee/login"; return; }

    axios.get(`${API_BASE}/api/employee/me/${employeeId}`)
      .then(res => {
        if (res.data.documentsCompleted) {
          window.location.href = "/employee/dashboard";
          return;
        }
        const statusObj  = {};
        const previewObj = {};
        res.data.documents?.forEach(doc => {
          statusObj[doc.docType]  = "success";
          previewObj[doc.docType] = doc.fileUrl;
        });
        setStatuses(statusObj);
        setPreviews(previewObj);
      })
      .catch(() => { window.location.href = "/employee/login"; });
  }, []);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => {
        if (url && !url.startsWith("http")) URL.revokeObjectURL(url);
      });
    };
  }, []);

  // ── File Handlers ─────────────────────────────────────────────────────────
  const handleFileChange = (docId, file) => {
    if (!file || statuses[docId] === "success") return;
    if (previews[docId] && !previews[docId].startsWith("http")) URL.revokeObjectURL(previews[docId]);
    setFiles(p    => ({ ...p,    [docId]: file }));
    setPreviews(p => ({ ...p,    [docId]: URL.createObjectURL(file) }));
    setStatuses(p => ({ ...p,    [docId]: "idle" }));
  };

  const removeFile = (docId) => {
    if (previews[docId] && !previews[docId].startsWith("http")) URL.revokeObjectURL(previews[docId]);
    setFiles(p    => { const n = { ...p }; delete n[docId]; return n; });
    setPreviews(p => { const n = { ...p }; delete n[docId]; return n; });
    setStatuses(p => { const n = { ...p }; delete n[docId]; return n; });
  };

  const handleUpload = async (docId) => {
    const file = files[docId];
    if (!file) return;
    const employeeId = localStorage.getItem("employeeId");
    setStatuses(p => ({ ...p, [docId]: "uploading" }));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("employeeId", employeeId);
    formData.append("docType", docId);
    try {
      const res = await axios.post(`${API_BASE}/api/employee/upload-doc`, formData);
      setPreviews(p => ({ ...p, [docId]: res.data.fileUrl }));
      setStatuses(p => ({ ...p, [docId]: "success" }));
      setFiles(p    => { const n = { ...p }; delete n[docId]; return n; });
    } catch (err) {
      setStatuses(p => ({ ...p, [docId]: "error" }));
      alert(err.response?.data?.message || "Upload failed");
    }
  };

  // ── Text field save ───────────────────────────────────────────────────────
  const handleSaveText = async (fieldId) => {
    const value = textFields[fieldId]?.trim();
    if (!value) return;
    const employeeId = localStorage.getItem("employeeId");
    try {
      await axios.post(`${API_BASE}/api/employee/save-link`, {
        employeeId, docType: fieldId, url: value
      });
      setStatuses(p => ({ ...p, [fieldId]: "success" }));
    } catch (err) {
      alert(err.response?.data?.message || "Save failed");
    }
  };

  // ── Company management ────────────────────────────────────────────────────
  const addCompany = () => setCompanies(p => [...p, { id: Date.now(), name: "" }]);
  const removeCompany = (cid) => setCompanies(p => p.filter(c => c.id !== cid));
  const updateCompanyName = (cid, name) =>
    setCompanies(p => p.map(c => c.id === cid ? { ...c, name } : c));

  // ── Preview ───────────────────────────────────────────────────────────────
  const openPreview = (docId) => {
    const url = previews[docId];
    if (!url) return;
    const lower = url.toLowerCase();
    const type = lower.match(/\.(jpg|jpeg|png|webp)/) ? "image"
      : (lower.includes(".pdf") || lower.includes("pdf")) ? "pdf" : "other";
    setPreviewModal({ name: docId, url, type });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  // ✅ FIX: Only required:true docs check pannurom — Ration Card & Cancelled Cheque skip
  const mandatoryAllDone = MANDATORY_DOCS.filter(d => d.required === true).every(d => statuses[d.id] === "success");
  const ugAllDone = hasUG === false || (hasUG === true && UG_DOCS.filter(d => d.required).every(d => statuses[d.id] === "success"));
  const expAllDone = hasExperience === false || hasExperience === null ||
    (hasExperience === true && companies.every(c =>
      COMPANY_DOCS.every(cd => statuses[`${cd.id}_${c.id}`] === "success")
    ));
  const canSubmit = mandatoryAllDone && ugAllDone && expAllDone && hasUG !== null && hasExperience !== null;

  const handleSubmit = async () => {
    try {
      await axios.put(`${API_BASE}/api/employee/complete-documents`, {
        employeeId: localStorage.getItem("employeeId"),
      });
      alert("Documents Submitted ✅");
      window.location.href = "/employee/dashboard";
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed ❌");
    }
  };

  // ── Doc Card ──────────────────────────────────────────────────────────────
  const DocCard = ({ docId, label, category, icon, required = false, index = 0 }) => {
    const status = statuses[docId];
    const file   = files[docId];

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="col-12 col-md-6"
      >
        <div
          className={`card h-100 p-3 ${dragActive === docId ? "border-primary" : ""}`}
          style={{ borderRadius: 12, border: status === "success" ? "1.5px solid #86efac" : "1px solid #e5e7eb", background: status === "success" ? "#f0fdf4" : "#fff" }}
          onDragOver={e => { e.preventDefault(); setDragActive(docId); }}
          onDragLeave={() => setDragActive(null)}
          onDrop={e => { e.preventDefault(); setDragActive(null); handleFileChange(docId, e.dataTransfer.files?.[0]); }}
        >
          {/* Header */}
          <div className="d-flex align-items-start justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <div style={{ background: status === "success" ? "#dcfce7" : "#eff6ff", padding: 8, borderRadius: 8, color: status === "success" ? "#16a34a" : "#2563eb" }}>
                {icon || <FileText size={18} />}
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="fw-bold" style={{ fontSize: 13 }}>{label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: required ? "#fee2e2" : "#f3f4f6", color: required ? "#dc2626" : "#6b7280" }}>
                    {required ? "Required" : "Optional"}
                  </span>
                </div>
                {category && <small className="text-uppercase text-muted fw-semibold" style={{ fontSize: 10 }}>{category}</small>}
              </div>
            </div>
            <AnimatePresence mode="wait">
              {status === "success" && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-success"><CheckCircle2 size={18} /></motion.div>
              )}
              {status === "error" && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-danger"><AlertCircle size={18} /></motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Body */}
          {status === "success" ? (
            <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: "#dcfce7", border: "1px solid #86efac" }}>
              <span className="small text-success fw-semibold">✓ Uploaded</span>
              <button className="btn btn-sm btn-outline-secondary py-0" style={{ fontSize: 11 }} onClick={() => openPreview(docId)}>View</button>
            </div>
          ) : !file ? (
            <div
              onClick={() => document.getElementById(`fi-${docId}`)?.click()}
              style={{ border: "2px dashed #d1d5db", borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer", background: dragActive === docId ? "#eff6ff" : "#fafafa" }}
            >
              <Upload size={20} className="text-muted mb-1" />
              <p className="small text-muted m-0" style={{ fontSize: 12 }}><strong>Click to upload</strong> or drag and drop</p>
              <input id={`fi-${docId}`} type="file" className="d-none" accept="image/*,.doc,.docx"
                onChange={e => handleFileChange(docId, e.target.files?.[0])} />
            </div>
          ) : (
            <div>
              <div className="d-flex justify-content-between align-items-center p-2 rounded border mb-2" style={{ background: "#f8fafc" }}>
                <span className="small text-truncate me-2" style={{ fontSize: 12 }}>{file.name}</span>
                <button onClick={() => removeFile(docId)} className="btn btn-sm btn-light p-1"><X size={12} /></button>
              </div>
              <button onClick={() => handleUpload(docId)} disabled={status === "uploading"} className="btn btn-primary btn-sm w-100">
                {status === "uploading"
                  ? <><span className="spinner-border spinner-border-sm me-1" />Uploading...</>
                  : "Upload"
                }
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ── YES/NO Question ───────────────────────────────────────────────────────
  const YesNoQuestion = ({ question, value, onChange }) => (
    <div className="card p-4 mb-4" style={{ borderRadius: 14, border: "2px solid #e0e7ff", background: "linear-gradient(135deg,#f0f4ff,#fff)" }}>
      <div className="d-flex align-items-center gap-3 mb-3">
        <div style={{ background: "#e0e7ff", padding: 10, borderRadius: 10, color: "#4f46e5" }}>
          <HelpCircle size={20} />
        </div>
        <h6 className="mb-0 fw-bold" style={{ color: "#1e1b4b" }}>{question}</h6>
      </div>
      <div className="d-flex gap-3">
        {["Yes", "No"].map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt === "Yes")}
            style={{
              padding: "10px 32px", borderRadius: 10, fontWeight: 700, fontSize: 14,
              border: `2px solid ${value === (opt === "Yes") ? "#4f46e5" : "#e5e7eb"}`,
              background: value === (opt === "Yes") ? "#4f46e5" : "#fff",
              color: value === (opt === "Yes") ? "#fff" : "#374151",
              cursor: "pointer", transition: "all 0.15s"
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Section Header ────────────────────────────────────────────────────────
  const SectionHeader = ({ icon, title, subtitle, color = "#2563eb" }) => (
    <div className="d-flex align-items-center gap-3 mb-3">
      <div style={{ background: `${color}18`, padding: 10, borderRadius: 10, color }}>{icon}</div>
      <div>
        <h5 className="mb-0 fw-bold">{title}</h5>
        {subtitle && <small className="text-muted">{subtitle}</small>}
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Upload Notice Alert */}
      {showAlert && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5000 }}>
          <div style={{ background: "#fff", padding: 28, borderRadius: 14, maxWidth: 400, textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h5 className="fw-bold mb-2">Upload Notice</h5>
            <p className="text-muted mb-1">Only <b>Images & Word Documents</b> are allowed.</p>
            <p className="text-muted" style={{ fontSize: 13 }}>Supported: JPG, PNG, DOC, DOCX &nbsp;|&nbsp; Max 5MB</p>
            <p style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, marginTop: 8 }}>❌ PDF files are not supported</p>
            <button className="btn btn-primary mt-3 w-100 fw-bold" onClick={() => setShowAlert(false)}>Got it, Let's Start!</button>
          </div>
        </div>
      )}

      <div className="container py-5" style={{ maxWidth: 900 }}>

        {/* Page Header */}
        <header className="mb-5">
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="p-2 rounded text-white" style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}>
              <FileCheck size={24} />
            </div>
            <div>
              <h1 className="h3 fw-bold m-0">Document Verification</h1>
              <p className="text-muted m-0 small">Complete your onboarding by uploading all required documents</p>
            </div>
          </div>
        </header>

        {/* ══ SECTION 1: MANDATORY DOCS ══════════════════════════════════════ */}
        <div className="mb-5">
          <SectionHeader
            icon={<ShieldCheck size={20} />}
            title="Mandatory Documents"
            subtitle="All documents below are required"
            color="#2563eb"
          />
          <div className="row g-3">
            {MANDATORY_DOCS.map((doc, i) => (
              <DocCard key={doc.id} docId={doc.id} label={doc.label} category={doc.category} icon={doc.icon} required={doc.required} index={i} />
            ))}
          </div>
        </div>

        {/* ══ SECTION 2: PF / ESI TEXT FIELDS ═══════════════════════════════ */}
        <div className="mb-5">
          <SectionHeader
            icon={<CreditCard size={20} />}
            title="PF & ESI Details"
            subtitle="Enter if available — optional"
            color="#7c3aed"
          />
          <div className="row g-3">
            {OPTIONAL_TEXT_FIELDS.map((field, i) => (
              <motion.div key={field.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="col-12 col-md-6">
                <div className="card p-3" style={{ borderRadius: 12, border: statuses[field.id] === "success" ? "1.5px solid #86efac" : "1px solid #e5e7eb", background: statuses[field.id] === "success" ? "#f0fdf4" : "#fff" }}>
                  <label className="fw-bold mb-2" style={{ fontSize: 13 }}>{field.label} <span className="text-muted fw-normal">(Optional)</span></label>
                  {statuses[field.id] === "success" ? (
                    <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: "#dcfce7", border: "1px solid #86efac" }}>
                      <CheckCircle2 size={16} color="#16a34a" />
                      <span className="text-success small fw-semibold">Saved: {textFields[field.id]}</span>
                    </div>
                  ) : (
                    <div className="d-flex gap-2">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder={field.placeholder}
                        value={textFields[field.id] || ""}
                        onChange={e => setTextFields(p => ({ ...p, [field.id]: e.target.value }))}
                      />
                      <button
                        className="btn btn-sm btn-primary"
                        disabled={!textFields[field.id]?.trim()}
                        onClick={() => handleSaveText(field.id)}
                      >Save</button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Bank Statement — optional file */}
            {OPTIONAL_FILE_DOCS.map((doc, i) => (
              <DocCard key={doc.id} docId={doc.id} label={doc.label} category={doc.category} icon={doc.icon} required={false} index={i} />
            ))}
          </div>
        </div>

        {/* ══ SECTION 3: UG DEGREE ═══════════════════════════════════════════ */}
        <div className="mb-5">
          <SectionHeader
            icon={<GraduationCap size={20} />}
            title="Education — UG Degree"
            subtitle="Answer the question below"
            color="#059669"
          />
          <YesNoQuestion
            question="Do you have a UG (Under Graduate) Degree?"
            value={hasUG}
            onChange={setHasUG}
          />

          <AnimatePresence>
            {hasUG === true && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <div className="row g-3">
                  {UG_DOCS.map((doc, i) => (
                    <DocCard
                      key={doc.id}
                      docId={doc.id}
                      label={doc.label}
                      category="Education"
                      icon={<GraduationCap size={18} />}
                      required={doc.required}
                      index={i}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            {hasUG === false && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="alert alert-info" style={{ borderRadius: 10 }}>
                  ℹ️ No UG documents needed — skipped.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ══ SECTION 4: WORK EXPERIENCE ═════════════════════════════════════ */}
        <div className="mb-5">
          <SectionHeader
            icon={<Briefcase size={20} />}
            title="Work Experience"
            subtitle="Answer the question below"
            color="#d97706"
          />
          <YesNoQuestion
            question="Do you have prior work experience?"
            value={hasExperience}
            onChange={(val) => { setHasExperience(val); if (!val) setCompanies([{ id: Date.now(), name: "" }]); }}
          />

          <AnimatePresence>
            {hasExperience === true && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                {companies.map((company, ci) => (
                  <div key={company.id} className="card mb-4 p-4" style={{ borderRadius: 14, border: "1.5px solid #fde68a", background: "#fffbeb" }}>
                    {/* Company header */}
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ background: "#fef3c7", padding: 8, borderRadius: 8, color: "#d97706" }}>
                          <Building2 size={18} />
                        </div>
                        <h6 className="mb-0 fw-bold" style={{ color: "#92400e" }}>Company {ci + 1}</h6>
                      </div>
                      {companies.length > 1 && (
                        <button className="btn btn-sm btn-outline-danger py-0" style={{ fontSize: 12 }} onClick={() => removeCompany(company.id)}>
                          <Trash2 size={13} className="me-1" /> Remove
                        </button>
                      )}
                    </div>

                    {/* Company name */}
                    <div className="mb-3">
                      <label className="fw-semibold mb-1" style={{ fontSize: 13 }}>Company Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Infosys, TCS, Wipro..."
                        value={company.name}
                        onChange={e => updateCompanyName(company.id, e.target.value)}
                      />
                    </div>

                    {/* Offer + Experience Letter */}
                    <div className="row g-3">
                      {COMPANY_DOCS.map((cd, di) => {
                        const docId = `${cd.id}_${company.id}`;
                        return (
                          <DocCard
                            key={docId}
                            docId={docId}
                            label={cd.label}
                            category={company.name || `Company ${ci + 1}`}
                            icon={<Briefcase size={18} />}
                            required={true}
                            index={di}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Add another company */}
                <button className="btn btn-outline-warning fw-bold d-flex align-items-center gap-2" onClick={addCompany}>
                  <Plus size={16} /> Add Another Company
                </button>
              </motion.div>
            )}
            {hasExperience === false && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="alert alert-info" style={{ borderRadius: 10 }}>
                  ℹ️ No experience documents needed — skipped.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ══ SECTION 5: REFERENCE ═══════════════════════════════════════════ */}
        <div className="mb-5">
          <SectionHeader
            icon={<User size={20} />}
            title="Reference Documents"
            subtitle="Upload up to 2 reference letters (optional)"
            color="#6b7280"
          />
          <div className="row g-3">
            {[1, 2].map((n, i) => (
              <DocCard
                key={`Reference ${n}`}
                docId={`Reference ${n}`}
                label={`Reference Letter ${n}`}
                category="Reference"
                icon={<FileText size={18} />}
                required={false}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* ══ SUBMIT ══════════════════════════════════════════════════════════ */}
        <div className="text-center mt-4 pt-4" style={{ borderTop: "1px solid #e5e7eb" }}>
          {/* Progress hint */}
          {hasUG === null && (
            <p className="text-warning fw-semibold small mb-2">⚠️ Please answer the UG degree question above</p>
          )}
          {hasExperience === null && (
            <p className="text-warning fw-semibold small mb-2">⚠️ Please answer the work experience question above</p>
          )}
          {!mandatoryAllDone && (
            <p className="text-danger small mb-2">⚠️ Please upload all mandatory documents first</p>
          )}

          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="btn btn-success px-5 py-2 fw-bold"
            style={{ opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? "pointer" : "not-allowed", borderRadius: 10, fontSize: 15 }}
          >
            ✅ Submit Documents
          </button>
        </div>

        {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
        <footer className="mt-5 pt-4 border-top d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 text-muted small">
          <p className="m-0">© 2026 HR Systems Portal. All documents are encrypted and stored securely.</p>
          <div className="d-flex gap-4">
            <a href="#" className="text-decoration-none text-muted">Privacy Policy</a>
            <a href="#" className="text-decoration-none text-muted">Support</a>
          </div>
        </footer>
      </div>

      {/* ══ PREVIEW MODAL ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {previewModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="modal-dialog modal-lg modal-dialog-centered"
            >
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "1.2rem" }}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">{previewModal.name}</h5>
                  <button type="button" className="btn-close" onClick={() => setPreviewModal(null)} />
                </div>
                <div className="modal-body p-4 text-center">
                  {previewModal.type === "image" ? (
                    <img src={previewModal.url} alt="Preview" className="img-fluid rounded shadow-sm" style={{ maxHeight: "70vh" }} />
                  ) : previewModal.type === "pdf" ? (
                    <iframe src={previewModal.url} title="PDF" width="100%" height="500px" className="rounded border" />
                  ) : (
                    <a href={previewModal.url} target="_blank" rel="noreferrer" className="btn btn-primary">Download / View File</a>
                  )}
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button className="btn btn-light rounded-pill px-4" onClick={() => setPreviewModal(null)}>Close</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}