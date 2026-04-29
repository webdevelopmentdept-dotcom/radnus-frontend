import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Upload, FileText, CheckCircle2, AlertCircle, X, FileCheck,
  ShieldCheck, User, Briefcase, GraduationCap, Link as LinkIcon,
  Plus, Trash2, ChevronDown, ChevronUp, Building2, CreditCard,
  BookOpen, HelpCircle, Flame
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── MANDATORY DOCS ──────────────────────────────────────────────────────────
const MANDATORY_DOCS = [
  { id: "Aadhaar",          label: "Aadhaar Card",     category: "Identity",     icon: <ShieldCheck size={16} />, required: true  },
  { id: "PAN",              label: "PAN Card",         category: "Identity",     icon: <CreditCard  size={16} />, required: true  },
  { id: "Passport Photo",   label: "Passport Photo",   category: "Identity",     icon: <User        size={16} />, required: true  },
  { id: "Resume",           label: "Resume",           category: "Professional", icon: <FileText    size={16} />, required: true  },
  { id: "Bank Passbook",    label: "Bank Passbook",    category: "Bank",         icon: <BookOpen    size={16} />, required: true  },
  { id: "Cancelled Cheque", label: "Cancelled Cheque", category: "Bank",         icon: <FileText    size={16} />, required: false },
  { id: "10th Marksheet",   label: "10th Marksheet",   category: "Education",    icon: <GraduationCap size={16} />, required: true },
  { id: "12th Marksheet",   label: "12th Marksheet",   category: "Education",    icon: <GraduationCap size={16} />, required: true },
];

const RATION_CARD_SIDES = [
  { id: "Ration Card Front", label: "Ration Card - Front Side" },
  { id: "Ration Card Back",  label: "Ration Card - Back Side"  },
];

const OPTIONAL_TEXT_FIELDS = [
  { id: "PF Number",  label: "PF Number",  placeholder: "Enter PF Number (if available)",  required: false },
  { id: "ESI Number", label: "ESI Number", placeholder: "Enter ESI Number (if available)", required: false },
];

const OPTIONAL_FILE_DOCS = [
  { id: "Bank Statement", label: "Bank Statement", category: "Bank", icon: <FileText size={16} />, required: false },
];

const UG_DOCS = [
  { id: "UG Consolidated", label: "UG Consolidated Marksheet", required: true },
];

const COMPANY_DOCS = [
  { id: "offer",      label: "Offer Letter"      },
  { id: "experience", label: "Experience Letter" },
];

const IDENTITY_OPTIONS = [
  { id: "ration",    label: "Ration Card",      desc: "Upload Front & Back" },
  { id: "gasbook",   label: "Gas Book",         desc: "Upload Gas Book"     },
  { id: "refnumber", label: "Reference Number", desc: "Enter 2 Reference Numbers" },
];

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  // Layout
  page: {
    minHeight: "100vh",
    background: "#f8f9fa",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  container: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "32px 20px 60px",
  },

  // Header
  pageHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 36,
    paddingBottom: 24,
    borderBottom: "1px solid #e9ecef",
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: "#1a1a2e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1a1a2e",
    margin: 0,
    lineHeight: 1.2,
  },
  headerSub: {
    fontSize: 13,
    color: "#6c757d",
    margin: "3px 0 0",
  },

  // Section
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1a1a2e",
    margin: 0,
  },
  sectionSub: {
    fontSize: 12,
    color: "#6c757d",
    margin: "2px 0 0",
  },
  divider: {
    height: 1,
    background: "#e9ecef",
    marginBottom: 18,
    marginTop: 0,
  },

  // Doc Card
  card: {
    background: "#fff",
    border: "1px solid #e9ecef",
    borderRadius: 10,
    padding: "14px 16px",
    height: "100%",
    transition: "border-color 0.15s",
  },
  cardSuccess: {
    background: "#f6ffed",
    border: "1px solid #b7eb8f",
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1a1a2e",
  },
  badge: (required) => ({
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 4,
    background: required ? "#fff1f0" : "#f5f5f5",
    color: required ? "#cf1322" : "#595959",
    border: `1px solid ${required ? "#ffa39e" : "#d9d9d9"}`,
  }),
  categoryLabel: {
    fontSize: 10,
    color: "#8c8c8c",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: 600,
  },

  // Drop zone
  dropZone: (active) => ({
    border: `2px dashed ${active ? "#4096ff" : "#d9d9d9"}`,
    borderRadius: 8,
    padding: "18px 12px",
    textAlign: "center",
    cursor: "pointer",
    background: active ? "#e6f4ff" : "#fafafa",
    transition: "all 0.15s",
  }),
  dropZoneText: {
    fontSize: 12,
    color: "#8c8c8c",
    margin: "6px 0 0",
  },

  // File preview row
  fileRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    background: "#f8f9fa",
    border: "1px solid #e9ecef",
    borderRadius: 6,
    marginBottom: 8,
  },
  fileName: {
    fontSize: 12,
    color: "#495057",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "80%",
  },

  // Upload success row
  successRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    background: "#f6ffed",
    border: "1px solid #b7eb8f",
    borderRadius: 6,
  },

  // Buttons
  btnPrimary: {
    background: "#1a1a2e",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnOutline: {
    background: "transparent",
    color: "#1a1a2e",
    border: "1px solid #d9d9d9",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnDanger: {
    background: "transparent",
    color: "#cf1322",
    border: "1px solid #ffa39e",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  btnRemove: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#8c8c8c",
    padding: 2,
    display: "flex",
    alignItems: "center",
  },
  btnSuccess: {
    background: "#52c41a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
  },

  // Yes/No
  yesNoCard: {
    background: "#fff",
    border: "1px solid #e9ecef",
    borderRadius: 10,
    padding: "18px 20px",
    marginBottom: 16,
  },
  yesNoQuestion: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1a1a2e",
    marginBottom: 14,
  },
  yesNoBtn: (selected) => ({
    padding: "8px 28px",
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 13,
    border: `1.5px solid ${selected ? "#1a1a2e" : "#d9d9d9"}`,
    background: selected ? "#1a1a2e" : "#fff",
    color: selected ? "#fff" : "#495057",
    cursor: "pointer",
    transition: "all 0.15s",
  }),

  // Identity option cards
  identityOption: (selected) => ({
    cursor: "pointer",
    borderRadius: 8,
    border: `1.5px solid ${selected ? "#1a1a2e" : "#e9ecef"}`,
    background: selected ? "#1a1a2e" : "#fff",
    padding: "16px 14px",
    textAlign: "center",
    transition: "all 0.15s",
  }),
  identityOptionLabel: (selected) => ({
    fontSize: 13,
    fontWeight: 600,
    color: selected ? "#fff" : "#1a1a2e",
    marginBottom: 4,
  }),
  identityOptionDesc: (selected) => ({
    fontSize: 11,
    color: selected ? "#adb5bd" : "#8c8c8c",
  }),

  // Company block
  companyCard: {
    background: "#fff",
    border: "1px solid #e9ecef",
    borderRadius: 10,
    padding: "18px 20px",
    marginBottom: 16,
  },
  companyHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  // Text input
  input: {
    border: "1px solid #d9d9d9",
    borderRadius: 6,
    padding: "7px 10px",
    fontSize: 13,
    width: "100%",
    outline: "none",
    color: "#1a1a2e",
    background: "#fff",
  },

  // Alert
  alertWarning: {
    background: "#fffbe6",
    border: "1px solid #ffe58f",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    color: "#7c4a03",
    marginBottom: 8,
  },
  alertInfo: {
    background: "#e6f4ff",
    border: "1px solid #91caff",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    color: "#0958d9",
  },
  alertDanger: {
    background: "#fff1f0",
    border: "1px solid #ffa39e",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    color: "#a8071a",
    marginBottom: 8,
  },

  // Notice overlay
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5000,
  },
  noticeBox: {
    background: "#fff",
    padding: "28px 32px",
    borderRadius: 12,
    maxWidth: 380,
    width: "90%",
    boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
  },
  noticeTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "#1a1a2e",
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 13,
    color: "#495057",
    marginBottom: 6,
    lineHeight: 1.6,
  },

  // Submit section
  submitSection: {
    borderTop: "1px solid #e9ecef",
    paddingTop: 28,
    marginTop: 8,
    textAlign: "center",
  },
  submitBtn: (enabled) => ({
    background: enabled ? "#52c41a" : "#d9d9d9",
    color: enabled ? "#fff" : "#8c8c8c",
    border: "none",
    borderRadius: 8,
    padding: "12px 48px",
    fontSize: 15,
    fontWeight: 700,
    cursor: enabled ? "pointer" : "not-allowed",
    transition: "all 0.15s",
    minWidth: 220,
  }),

  // Footer
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: "1px solid #e9ecef",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  footerText: {
    fontSize: 12,
    color: "#adb5bd",
    margin: 0,
  },
  footerLink: {
    fontSize: 12,
    color: "#6c757d",
    textDecoration: "none",
  },

  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9000,
    padding: 20,
  },
  modalBox: {
    background: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 720,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #e9ecef",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1a1a2e",
    margin: 0,
  },
  modalBody: {
    padding: "20px",
    textAlign: "center",
  },

  // PG optional block
  pgBlock: {
    border: "1px dashed #d9d9d9",
    borderRadius: 10,
    padding: "16px 18px",
    background: "#fafafa",
    marginTop: 8,
  },
  pgBlockLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#495057",
    marginBottom: 14,
  },

  // Ration card block
  rationSide: (status, active) => ({
    border: `1px ${status === "success" ? "solid #b7eb8f" : "dashed #91caff"}`,
    borderRadius: 8,
    padding: "14px",
    background: status === "success" ? "#f6ffed" : active ? "#e6f4ff" : "#fafafa",
    transition: "all 0.15s",
  }),
};

export default function UploadDocuments() {
  const [files,        setFiles]        = useState({});
  const [previews,     setPreviews]     = useState({});
  const [statuses,     setStatuses]     = useState({});
  const [textFields,   setTextFields]   = useState({});
  const [dragActive,   setDragActive]   = useState(null);
  const [previewModal, setPreviewModal] = useState(null);
  const [showAlert,    setShowAlert]    = useState(true);

  const [hasUG,         setHasUG]         = useState(null);
  const [hasExperience, setHasExperience] = useState(null);
  const [identityChoice, setIdentityChoice] = useState(null);
  const [companies, setCompanies] = useState([{ id: Date.now(), name: "" }]);

  useEffect(() => {
    const employeeId = localStorage.getItem("employeeId");
    if (!employeeId) { window.location.href = "/employee/login"; return; }
    axios.get(`${API_BASE}/api/employee/me/${employeeId}`)
      .then(res => {
        if (res.data.documentsCompleted) { window.location.href = "/employee/dashboard"; return; }
        const statusObj = {};
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

  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => {
        if (url && !url.startsWith("http")) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handleFileChange = (docId, file) => {
    if (!file || statuses[docId] === "success") return;
    if (previews[docId] && !previews[docId].startsWith("http")) URL.revokeObjectURL(previews[docId]);
    setFiles(p    => ({ ...p, [docId]: file }));
    setPreviews(p => ({ ...p, [docId]: URL.createObjectURL(file) }));
    setStatuses(p => ({ ...p, [docId]: "idle" }));
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

  const handleSaveText = async (fieldId) => {
    const value = textFields[fieldId]?.trim();
    if (!value) return;
    const employeeId = localStorage.getItem("employeeId");
    try {
      await axios.post(`${API_BASE}/api/employee/save-link`, { employeeId, docType: fieldId, url: value });
      setStatuses(p => ({ ...p, [fieldId]: "success" }));
    } catch (err) {
      alert(err.response?.data?.message || "Save failed");
    }
  };

  const addCompany    = () => setCompanies(p => [...p, { id: Date.now(), name: "" }]);
  const removeCompany = (cid) => setCompanies(p => p.filter(c => c.id !== cid));
  const updateCompanyName = (cid, name) => setCompanies(p => p.map(c => c.id === cid ? { ...c, name } : c));

  const openPreview = (docId) => {
    const url = previews[docId];
    if (!url) return;
    const lower = url.toLowerCase();
    const type = lower.match(/\.(jpg|jpeg|png|webp)/) ? "image"
      : (lower.includes(".pdf") || lower.includes("pdf")) ? "pdf" : "other";
    setPreviewModal({ name: docId, url, type });
  };

  const identityProofDone = (() => {
    if (!identityChoice) return false;
    if (identityChoice === "ration")    return RATION_CARD_SIDES.every(s => statuses[s.id] === "success");
    if (identityChoice === "gasbook")   return statuses["Gas Book"] === "success";
    if (identityChoice === "refnumber") return statuses["Reference Number 1"] === "success" && statuses["Reference Number 2"] === "success";
    return false;
  })();

  const mandatoryAllDone = MANDATORY_DOCS.filter(d => d.required === true).every(d => statuses[d.id] === "success");
  const ugAllDone        = hasUG === false || (hasUG === true && UG_DOCS.filter(d => d.required).every(d => statuses[d.id] === "success") && statuses["CGPA"] === "success");
  const expAllDone       = hasExperience === false || hasExperience === null ||
    (hasExperience === true && companies.every(c => COMPANY_DOCS.every(cd => statuses[`${cd.id}_${c.id}`] === "success")));
  const canSubmit = mandatoryAllDone && ugAllDone && expAllDone && hasUG !== null && hasExperience !== null && identityProofDone;

  const handleSubmit = async () => {
    try {
      await axios.put(`${API_BASE}/api/employee/complete-documents`, { employeeId: localStorage.getItem("employeeId") });
      alert("Documents Submitted");
      window.location.href = "/employee/dashboard";
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed");
    }
  };

  // ── Doc Card ──────────────────────────────────────────────────────────────
  const DocCard = ({ docId, label, category, icon, required = false, index = 0 }) => {
    const status = statuses[docId];
    const file   = files[docId];
    const isSuccess = status === "success";

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="col-12 col-md-6"
      >
        <div
          style={{ ...styles.card, ...(isSuccess ? styles.cardSuccess : {}), cursor: "default" }}
          onDragOver={e => { e.preventDefault(); setDragActive(docId); }}
          onDragLeave={() => setDragActive(null)}
          onDrop={e => { e.preventDefault(); setDragActive(null); handleFileChange(docId, e.dataTransfer.files?.[0]); }}
        >
          {/* Card Top */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 7,
                background: isSuccess ? "#d9f7be" : "#f0f5ff",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isSuccess ? "#389e0d" : "#2f54eb", flexShrink: 0,
              }}>
                {icon || <FileText size={16} />}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={styles.cardLabel}>{label}</span>
                  <span style={styles.badge(required)}>{required ? "Required" : "Optional"}</span>
                </div>
                {category && <div style={styles.categoryLabel}>{category}</div>}
              </div>
            </div>
            {isSuccess && <CheckCircle2 size={16} color="#52c41a" />}
            {status === "error" && <AlertCircle size={16} color="#ff4d4f" />}
          </div>

          {/* Card Body */}
          {isSuccess ? (
            <div style={styles.successRow}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#389e0d" }}>Uploaded</span>
              <button style={styles.btnOutline} onClick={() => openPreview(docId)}>View</button>
            </div>
          ) : !file ? (
            <div
              style={styles.dropZone(dragActive === docId)}
              onClick={() => document.getElementById(`fi-${docId}`)?.click()}
            >
              <Upload size={18} color="#8c8c8c" />
              <p style={styles.dropZoneText}>Click to upload or drag and drop</p>
              <input
                id={`fi-${docId}`} type="file" style={{ display: "none" }}
                accept="image/*,.doc,.docx"
                onChange={e => handleFileChange(docId, e.target.files?.[0])}
              />
            </div>
          ) : (
            <>
              <div style={styles.fileRow}>
                <span style={styles.fileName}>{file.name}</span>
                <button style={styles.btnRemove} onClick={() => removeFile(docId)}><X size={13} /></button>
              </div>
              <button style={styles.btnPrimary} onClick={() => handleUpload(docId)} disabled={status === "uploading"}>
                {status === "uploading"
                  ? <><span className="spinner-border spinner-border-sm" style={{ width: 13, height: 13 }} /> Uploading...</>
                  : "Upload"
                }
              </button>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  // ── Ration Card Block ─────────────────────────────────────────────────────
  const RationCardBlock = () => (
    <div className="row g-3 mt-1">
      {RATION_CARD_SIDES.map((side) => {
        const status = statuses[side.id];
        const file   = files[side.id];
        return (
          <div key={side.id} className="col-12 col-md-6">
            <div
              style={styles.rationSide(status, dragActive === side.id)}
              onDragOver={e => { e.preventDefault(); setDragActive(side.id); }}
              onDragLeave={() => setDragActive(null)}
              onDrop={e => { e.preventDefault(); setDragActive(null); handleFileChange(side.id, e.dataTransfer.files?.[0]); }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e" }}>{side.label}</span>
                {status === "success" && <CheckCircle2 size={14} color="#52c41a" />}
                {status === "error"   && <AlertCircle  size={14} color="#ff4d4f" />}
              </div>
              {status === "success" ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#389e0d" }}>Uploaded</span>
                  <button style={styles.btnOutline} onClick={() => openPreview(side.id)}>View</button>
                </div>
              ) : !file ? (
                <div
                  style={{ textAlign: "center", cursor: "pointer", padding: "12px 0" }}
                  onClick={() => document.getElementById(`fi-${side.id}`)?.click()}
                >
                  <Upload size={16} color="#8c8c8c" />
                  <p style={{ ...styles.dropZoneText, margin: "4px 0 0" }}>Click or drag & drop</p>
                  <input
                    id={`fi-${side.id}`} type="file" style={{ display: "none" }}
                    accept="image/*"
                    onChange={e => handleFileChange(side.id, e.target.files?.[0])}
                  />
                </div>
              ) : (
                <>
                  <div style={{ ...styles.fileRow, marginBottom: 8 }}>
                    <span style={styles.fileName}>{file.name}</span>
                    <button style={styles.btnRemove} onClick={() => removeFile(side.id)}><X size={12} /></button>
                  </div>
                  <button style={styles.btnPrimary} onClick={() => handleUpload(side.id)} disabled={status === "uploading"}>
                    {status === "uploading"
                      ? <><span className="spinner-border spinner-border-sm" style={{ width: 13, height: 13 }} /> Uploading...</>
                      : "Upload"
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Yes/No Question ───────────────────────────────────────────────────────
  const YesNoQuestion = ({ question, value, onChange }) => (
    <div style={styles.yesNoCard}>
      <p style={styles.yesNoQuestion}>{question}</p>
      <div style={{ display: "flex", gap: 10 }}>
        {["Yes", "No"].map(opt => (
          <button key={opt} style={styles.yesNoBtn(value === (opt === "Yes"))} onClick={() => onChange(opt === "Yes")}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Section Header ────────────────────────────────────────────────────────
  const SectionHeader = ({ icon, title, subtitle, color = "#2f54eb" }) => (
    <div style={styles.sectionHeader}>
      <div style={{ ...styles.sectionIcon, background: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <p style={styles.sectionTitle}>{title}</p>
        {subtitle && <p style={styles.sectionSub}>{subtitle}</p>}
      </div>
    </div>
  );

  // ── Text Field Card ───────────────────────────────────────────────────────
  const TextFieldCard = ({ fieldId, label, placeholder, required, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="col-12 col-md-6"
    >
      <div style={{ ...styles.card, ...(statuses[fieldId] === "success" ? styles.cardSuccess : {}) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 6,
            background: statuses[fieldId] === "success" ? "#d9f7be" : "#f0f5ff",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: statuses[fieldId] === "success" ? "#389e0d" : "#2f54eb",
          }}>
            <FileText size={14} />
          </div>
          <div>
            <span style={styles.cardLabel}>{label}</span>
            {!required && <span style={{ ...styles.badge(false), marginLeft: 6 }}>Optional</span>}
          </div>
        </div>
        {statuses[fieldId] === "success" ? (
          <div style={styles.successRow}>
            <span style={{ fontSize: 12, color: "#389e0d", fontWeight: 600 }}>Saved: {textFields[fieldId]}</span>
            <CheckCircle2 size={14} color="#52c41a" />
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              style={styles.input}
              placeholder={placeholder}
              value={textFields[fieldId] || ""}
              onChange={e => setTextFields(p => ({ ...p, [fieldId]: e.target.value }))}
            />
            <button
              style={{ ...styles.btnPrimary, width: "auto", padding: "6px 14px", opacity: textFields[fieldId]?.trim() ? 1 : 0.5 }}
              disabled={!textFields[fieldId]?.trim()}
              onClick={() => handleSaveText(fieldId)}
            >
              Save
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  // ── Identity Proof Section ────────────────────────────────────────────────
  const IdentityProofSection = () => (
    <div style={styles.section}>
      <SectionHeader
        icon={<ShieldCheck size={16} />}
        title="Identity Proof"
        subtitle="Select one option — Ration Card, Gas Book, or Reference Numbers (mandatory)"
        color="#cf1322"
      />
      <div style={styles.divider} />

      <div className="row g-3 mb-4">
        {IDENTITY_OPTIONS.map(opt => (
          <div key={opt.id} className="col-12 col-md-4">
            <div style={styles.identityOption(identityChoice === opt.id)} onClick={() => setIdentityChoice(opt.id)}>
              <p style={styles.identityOptionLabel(identityChoice === opt.id)}>{opt.label}</p>
              <p style={{ ...styles.identityOptionDesc(identityChoice === opt.id), margin: 0 }}>{opt.desc}</p>
              {identityChoice === opt.id && (
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "rgba(255,255,255,0.2)", padding: "2px 10px", borderRadius: 4 }}>
                    Selected
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {identityChoice === "ration" && (
          <motion.div key="ration" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{
              ...styles.card,
              ...(RATION_CARD_SIDES.every(s => statuses[s.id] === "success") ? styles.cardSuccess : { border: "1px solid #91caff", background: "#e6f4ff" })
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={styles.cardLabel}>Ration Card</span>
                <span style={styles.badge(true)}>Required</span>
                {RATION_CARD_SIDES.every(s => statuses[s.id] === "success") && (
                  <CheckCircle2 size={14} color="#52c41a" style={{ marginLeft: "auto" }} />
                )}
              </div>
              <p style={{ fontSize: 11, color: "#6c757d", margin: "0 0 10px" }}>Upload both Front and Back sides</p>
              <RationCardBlock />
            </div>
          </motion.div>
        )}

        {identityChoice === "gasbook" && (
          <motion.div key="gasbook" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="row g-3">
              <DocCard docId="Gas Book" label="Gas Book" category="Identity" icon={<FileText size={16} />} required={true} index={0} />
            </div>
          </motion.div>
        )}

        {identityChoice === "refnumber" && (
          <motion.div key="refnumber" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ ...styles.card, border: "1px solid #d3adf7", background: "#f9f0ff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={styles.cardLabel}>Reference Numbers</span>
                <span style={styles.badge(true)}>Required</span>
              </div>
              <div className="row g-3">
                {[1, 2].map(n => {
                  const fieldId = `Reference Number ${n}`;
                  return (
                    <motion.div key={fieldId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: n * 0.05 }} className="col-12 col-md-6">
                      <div style={{ ...styles.card, ...(statuses[fieldId] === "success" ? styles.cardSuccess : {}) }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                          <span style={styles.cardLabel}>Reference Number {n}</span>
                          <span style={styles.badge(true)}>Required</span>
                        </div>
                        {statuses[fieldId] === "success" ? (
                          <div style={styles.successRow}>
                            <span style={{ fontSize: 12, color: "#389e0d", fontWeight: 600 }}>Saved: {textFields[fieldId]}</span>
                            <CheckCircle2 size={14} color="#52c41a" />
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              type="text"
                              style={styles.input}
                              placeholder={`Enter Reference Number ${n}`}
                              value={textFields[fieldId] || ""}
                              onChange={e => setTextFields(p => ({ ...p, [fieldId]: e.target.value }))}
                            />
                            <button
                              style={{ ...styles.btnPrimary, width: "auto", padding: "6px 14px", opacity: textFields[fieldId]?.trim() ? 1 : 0.5 }}
                              disabled={!textFields[fieldId]?.trim()}
                              onClick={() => handleSaveText(fieldId)}
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!identityChoice && (
        <div style={styles.alertWarning}>
          Please select one identity proof option above to continue.
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      {/* Upload Notice Overlay */}
      {showAlert && (
        <div style={styles.overlay}>
          <div style={styles.noticeBox}>
            <p style={styles.noticeTitle}>Upload Guidelines</p>
            <p style={styles.noticeText}>Only <strong>Images and Word Documents</strong> are accepted.</p>
            <p style={styles.noticeText}>Supported formats: JPG, PNG, DOC, DOCX — Max 5MB per file.</p>
            <p style={{ ...styles.noticeText, color: "#cf1322", fontWeight: 600 }}>PDF files are not supported.</p>
            {/* <p style={{ ...styles.noticeText, color: "#0958d9" }}>For Ration Card: upload Front and Back sides separately.</p> */}
            <button style={{ ...styles.btnPrimary, marginTop: 16, borderRadius: 8, padding: "10px 0" }} onClick={() => setShowAlert(false)}>
              Got it, Let's Start
            </button>
          </div>
        </div>
      )}

      <div style={styles.container}>
        {/* Page Header */}
        <div style={styles.pageHeader}>
          <div style={styles.headerIcon}>
            <FileCheck size={22} />
          </div>
          <div>
            <h1 style={styles.headerTitle}>Document Verification</h1>
            <p style={styles.headerSub}>Complete your onboarding by uploading all required documents</p>
          </div>
        </div>

        {/* Section 1 — Mandatory */}
        <div style={styles.section}>
          <SectionHeader
            icon={<ShieldCheck size={16} />}
            title="Mandatory Documents"
            subtitle="All marked required documents must be uploaded"
            color="#2f54eb"
          />
          <div style={styles.divider} />
          <div className="row g-3">
            {MANDATORY_DOCS.map((doc, i) => (
              <DocCard key={doc.id} docId={doc.id} label={doc.label} category={doc.category} icon={doc.icon} required={doc.required} index={i} />
            ))}
          </div>
        </div>

        {/* Section 2 — Identity Proof */}
        <IdentityProofSection />

        {/* Section 3 — PF & ESI */}
        <div style={styles.section}>
          <SectionHeader icon={<CreditCard size={16} />} title="PF & ESI Details" subtitle="Enter if available — optional" color="#7b2d8b" />
          <div style={styles.divider} />
          <div className="row g-3">
            {OPTIONAL_TEXT_FIELDS.map((field, i) => (
              <TextFieldCard
                key={field.id}
                fieldId={field.id}
                label={field.label}
                placeholder={field.placeholder}
                required={field.required}
                index={i}
              />
            ))}
            {OPTIONAL_FILE_DOCS.map((doc, i) => (
              <DocCard key={doc.id} docId={doc.id} label={doc.label} category={doc.category} icon={doc.icon} required={false} index={i} />
            ))}
          </div>
        </div>

        {/* Section 4 — UG Degree */}
        <div style={styles.section}>
          <SectionHeader icon={<GraduationCap size={16} />} title="Education — UG Degree" subtitle="Answer the question below" color="#389e0d" />
          <div style={styles.divider} />
          <YesNoQuestion question="Do you have a UG (Under Graduate) Degree?" value={hasUG} onChange={setHasUG} />

          <AnimatePresence>
            {hasUG === true && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <div className="row g-3">
                  {UG_DOCS.map((doc, i) => (
                    <DocCard key={doc.id} docId={doc.id} label={doc.label} category="Education" icon={<GraduationCap size={16} />} required={doc.required} index={i} />
                  ))}

                  {/* CGPA */}
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="col-12 col-md-6">
                    <div style={{ ...styles.card, ...(statuses["CGPA"] === "success" ? styles.cardSuccess : {}) }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 6,
                          background: statuses["CGPA"] === "success" ? "#d9f7be" : "#f0f5ff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: statuses["CGPA"] === "success" ? "#389e0d" : "#2f54eb",
                        }}>
                          <GraduationCap size={14} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={styles.cardLabel}>UG CGPA</span>
                            <span style={styles.badge(true)}>Required</span>
                          </div>
                          <div style={styles.categoryLabel}>Education</div>
                        </div>
                      </div>
                      {statuses["CGPA"] === "success" ? (
                        <div style={styles.successRow}>
                          <span style={{ fontSize: 12, color: "#389e0d", fontWeight: 600 }}>Saved: {textFields["CGPA"]}</span>
                          <CheckCircle2 size={14} color="#52c41a" />
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 8 }}>
                          <input type="number" step="0.01" min="0" max="10" style={styles.input} placeholder="e.g. 8.5"
                            value={textFields["CGPA"] || ""} onChange={e => setTextFields(p => ({ ...p, CGPA: e.target.value }))} />
                          <button style={{ ...styles.btnPrimary, width: "auto", padding: "6px 14px", opacity: textFields["CGPA"]?.trim() ? 1 : 0.5 }}
                            disabled={!textFields["CGPA"]?.trim()} onClick={() => handleSaveText("CGPA")}>Save</button>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* PG Optional */}
                  <div className="col-12">
                    <div style={styles.pgBlock}>
                      <p style={styles.pgBlockLabel}>PG (Post Graduate) — <span style={{ fontWeight: 400, color: "#8c8c8c" }}>Optional</span></p>
                      <div className="row g-3">
                        <DocCard docId="PG Consolidated" label="PG Consolidated Marksheet" category="Education" icon={<GraduationCap size={16} />} required={false} index={0} />
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="col-12 col-md-6">
                          <div style={{ ...styles.card, ...(statuses["PG CGPA"] === "success" ? styles.cardSuccess : {}) }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                              <div style={{
                                width: 30, height: 30, borderRadius: 6,
                                background: statuses["PG CGPA"] === "success" ? "#d9f7be" : "#f0f5ff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: statuses["PG CGPA"] === "success" ? "#389e0d" : "#2f54eb",
                              }}>
                                <GraduationCap size={14} />
                              </div>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={styles.cardLabel}>PG CGPA</span>
                                  <span style={styles.badge(false)}>Optional</span>
                                </div>
                                <div style={styles.categoryLabel}>Education</div>
                              </div>
                            </div>
                            {statuses["PG CGPA"] === "success" ? (
                              <div style={styles.successRow}>
                                <span style={{ fontSize: 12, color: "#389e0d", fontWeight: 600 }}>Saved: {textFields["PG CGPA"]}</span>
                                <CheckCircle2 size={14} color="#52c41a" />
                              </div>
                            ) : (
                              <div style={{ display: "flex", gap: 8 }}>
                                <input type="number" step="0.01" min="0" max="10" style={styles.input} placeholder="e.g. 8.5"
                                  value={textFields["PG CGPA"] || ""} onChange={e => setTextFields(p => ({ ...p, "PG CGPA": e.target.value }))} />
                                <button style={{ ...styles.btnPrimary, width: "auto", padding: "6px 14px", opacity: textFields["PG CGPA"]?.trim() ? 1 : 0.5 }}
                                  disabled={!textFields["PG CGPA"]?.trim()} onClick={() => handleSaveText("PG CGPA")}>Save</button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {hasUG === false && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={styles.alertInfo}>No UG documents needed — skipped.</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 5 — Work Experience */}
        <div style={styles.section}>
          <SectionHeader icon={<Briefcase size={16} />} title="Work Experience" subtitle="Answer the question below" color="#d46b08" />
          <div style={styles.divider} />
          <YesNoQuestion
            question="Do you have prior work experience?"
            value={hasExperience}
            onChange={(val) => { setHasExperience(val); if (!val) setCompanies([{ id: Date.now(), name: "" }]); }}
          />

          <AnimatePresence>
            {hasExperience === true && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                {companies.map((company, ci) => (
                  <div key={company.id} style={styles.companyCard}>
                    <div style={styles.companyHeader}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 6, background: "#fff7e6", display: "flex", alignItems: "center", justifyContent: "center", color: "#d46b08" }}>
                          <Building2 size={15} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>Company {ci + 1}</span>
                      </div>
                      {companies.length > 1 && (
                        <button style={styles.btnDanger} onClick={() => removeCompany(company.id)}>
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#495057", display: "block", marginBottom: 6 }}>Company Name</label>
                      <input type="text" style={styles.input} placeholder="e.g. Infosys, TCS, Wipro..."
                        value={company.name} onChange={e => updateCompanyName(company.id, e.target.value)} />
                    </div>
                    <div className="row g-3">
                      {COMPANY_DOCS.map((cd, di) => {
                        const docId = `${cd.id}_${company.id}`;
                        return <DocCard key={docId} docId={docId} label={cd.label} category={company.name || `Company ${ci + 1}`} icon={<Briefcase size={16} />} required={true} index={di} />;
                      })}
                    </div>
                  </div>
                ))}
                <button
                  style={{ ...styles.btnOutline, display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px dashed #d9d9d9", borderRadius: 8, background: "#fafafa", cursor: "pointer" }}
                  onClick={addCompany}
                >
                  <Plus size={14} /> Add Another Company
                </button>
              </motion.div>
            )}
            {hasExperience === false && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={styles.alertInfo}>No experience documents needed — skipped.</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 6 — Reference Letters */}
        <div style={styles.section}>
          <SectionHeader icon={<User size={16} />} title="Reference Documents" subtitle="Upload up to 2 reference letters — optional" color="#595959" />
          <div style={styles.divider} />
          <div className="row g-3">
            {[1, 2].map((n, i) => (
              <DocCard key={`Reference ${n}`} docId={`Reference ${n}`} label={`Reference Letter ${n}`} category="Reference" icon={<FileText size={16} />} required={false} index={i} />
            ))}
          </div>
        </div>

        {/* Submit */}
        <div style={styles.submitSection}>
          {!identityChoice && <p style={{ ...styles.alertDanger, display: "inline-block", marginBottom: 10 }}>Please select an identity proof option to continue.</p>}
          {identityChoice && !identityProofDone && <p style={{ ...styles.alertWarning, display: "inline-block", marginBottom: 10 }}>Please complete your selected identity proof.</p>}
          {hasUG === null && <p style={{ ...styles.alertWarning, display: "inline-block", marginBottom: 10 }}>Please answer the UG degree question.</p>}
          {hasExperience === null && <p style={{ ...styles.alertWarning, display: "inline-block", marginBottom: 10 }}>Please answer the work experience question.</p>}
          {!mandatoryAllDone && <p style={{ ...styles.alertDanger, display: "inline-block", marginBottom: 10 }}>Please upload all mandatory documents first.</p>}

          <div>
            <button style={styles.submitBtn(canSubmit)} disabled={!canSubmit} onClick={handleSubmit}>
              Submit Documents
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>© 2026 HR Systems Portal. All documents are encrypted and stored securely.</p>
          <div style={{ display: "flex", gap: 20 }}>
            <a href="#" style={styles.footerLink}>Privacy Policy</a>
            <a href="#" style={styles.footerLink}>Support</a>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewModal && (
          <div style={styles.modalOverlay} onClick={() => setPreviewModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              style={styles.modalBox}
              onClick={e => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <p style={styles.modalTitle}>{previewModal.name}</p>
                <button style={styles.btnRemove} onClick={() => setPreviewModal(null)}><X size={18} /></button>
              </div>
              <div style={styles.modalBody}>
                {previewModal.type === "image" ? (
                  <img src={previewModal.url} alt="Preview" style={{ maxWidth: "100%", maxHeight: "65vh", borderRadius: 8 }} />
                ) : previewModal.type === "pdf" ? (
                  <iframe src={previewModal.url} title="PDF" width="100%" height="500px" style={{ border: "none", borderRadius: 8 }} />
                ) : (
                  <a href={previewModal.url} target="_blank" rel="noreferrer" style={{ ...styles.btnPrimary, width: "auto", display: "inline-flex", padding: "10px 24px", borderRadius: 8, textDecoration: "none" }}>
                    Download / View File
                  </a>
                )}
              </div>
              <div style={{ padding: "12px 20px", borderTop: "1px solid #e9ecef", textAlign: "right" }}>
                <button style={{ ...styles.btnOutline, padding: "8px 20px" }} onClick={() => setPreviewModal(null)}>Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}