import { useEffect, useState, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ─── Icons ────────────────────────────────────────────────────────────────────
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const FileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// ─── HR doc types ─────────────────────────────────────────────────────────────
const HR_DOC_TYPES = [
  "Offer Letter",
  "Appointment Letter",
  "NDA Agreement",
  "Employment Contract",
  "Salary Structure Document",
  "HR Policy Document",
];

// ─── helpers ──────────────────────────────────────────────────────────────────
const getFileLabel = (url) => {
  if (!url) return "File";
  if (url.toLowerCase().includes("pdf")) return "PDF";
  if (/\.(jpg|jpeg|png)/i.test(url)) return "Image";
  return "Document";
};

const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)/i.test(url || "");
const isPDF   = (url) => /\.pdf/i.test(url || "") || (url || "").toLowerCase().includes("pdf");

const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || "document";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
};

// ─── Preview Modal ────────────────────────────────────────────────────────────
const PreviewModal = ({ url, name, onClose }) => (
  <div onClick={onClose} style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
    zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16,
  }}>
    <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: 860, width: "100%", maxHeight: "90vh" }}>
      <button onClick={onClose} style={{
        position: "absolute", top: -40, right: 0,
        background: "rgba(255,255,255,0.15)", border: "none",
        borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#fff",
        display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600,
      }}>
        <CloseIcon /> Close
      </button>
      {isImage(url) ? (
        <img src={url} alt={name} style={{ width: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: 12 }} />
      ) : isPDF(url) ? (
        <iframe src={url} title={name} style={{ width: "100%", height: "85vh", borderRadius: 12, border: "none" }} />
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <div style={{ marginBottom: 16 }}><FileIcon /></div>
          <p style={{ fontSize: 14, color: "#374151", marginBottom: 16 }}>Preview not available for this file type.</p>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#2563eb", color: "#fff", padding: "9px 18px",
            borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>
            <ExternalLinkIcon /> Open in New Tab
          </a>
        </div>
      )}
    </div>
  </div>
);

// ─── Document Row Card ────────────────────────────────────────────────────────
const DocRow = ({ docType, label, fileUrl, category, required, employeeId, onRefresh, isHrDoc }) => {
  const fileRef    = useRef(null);
  const [uploading,   setUploading]   = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [preview,     setPreview]     = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [downloading, setDownloading] = useState(false);

  const hasFile = !!fileUrl;

  const handleReplace = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("employeeId", employeeId);
      formData.append("docType", docType);

      if (isHrDoc) {
        await fetch(`${API_BASE}/api/hr/activation/upload-doc`, {
          method: "POST",
          body: formData,
        });
      } else {
        formData.append("docId", "replace");
        await fetch(`${API_BASE}/api/employee/replace-doc`, {
          method: "POST",
          body: formData,
        });
      }
      onRefresh();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/api/employee/delete-doc`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, docType }),
      });
      onRefresh();
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  const handleDownload = async () => {
    if (!fileUrl) return;
    setDownloading(true);
    await downloadFile(fileUrl, label || docType);
    setDownloading(false);
  };

  return (
    <>
      {preview && <PreviewModal url={fileUrl} name={label || docType} onClose={() => setPreview(false)} />}

      {confirmDel && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 1500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "24px 20px", maxWidth: 340, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><AlertIcon /></div>
            <h4 style={{ textAlign: "center", fontWeight: 800, color: "#1a1a2e", margin: "0 0 8px", fontSize: 15 }}>Delete Document?</h4>
            <p style={{ textAlign: "center", color: "#6b7280", fontSize: 13, margin: "0 0 20px" }}>
              This will permanently remove <strong>{label || docType}</strong>.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDel(false)} style={{ flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: deleting ? "#fca5a5" : "#dc2626", color: "#fff", fontWeight: 700, fontSize: 13, cursor: deleting ? "not-allowed" : "pointer" }}>
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileRef}
        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
        style={{ display: "none" }}
        onChange={e => handleReplace(e.target.files[0])}
      />

      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 14px",
        background: hasFile ? "#f0fdf4" : "#fafafa",
        border: `1.5px solid ${hasFile ? "#86efac" : "#e5e7eb"}`,
        borderRadius: 10,
        transition: "all 0.15s",
      }}>
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: hasFile ? "#dcfce7" : "#eff6ff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={hasFile ? "#16a34a" : "#2563eb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a2e" }}>{label || docType}</span>
            {required !== undefined && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99,
                background: required ? "#fee2e2" : "#f3f4f6",
                color: required ? "#dc2626" : "#6b7280",
              }}>{required ? "Required" : "Optional"}</span>
            )}
            {isHrDoc && (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99, background: "#eff6ff", color: "#2563eb" }}>HR</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: hasFile ? "#16a34a" : "#9ca3af", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
            {hasFile ? (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Uploaded · {getFileLabel(fileUrl)}</>
            ) : "Not uploaded yet"}
          </div>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: "flex", gap: 5, flexShrink: 0, flexWrap: "wrap" }}>
          {hasFile ? (
            <>
              <button onClick={() => setPreview(true)} title="Preview" style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", border: "1px solid #e5e7eb", borderRadius: 7, background: "#fff", color: "#374151", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                <EyeIcon /> View
              </button>
              <button onClick={handleDownload} disabled={downloading} title="Download" style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", border: "none", borderRadius: 7, background: "#2563eb", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                <DownloadIcon /> {downloading ? "..." : "Download"}
              </button>
              {isHrDoc && (
                <button onClick={() => fileRef.current?.click()} disabled={uploading} title="Replace" style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", border: "1px solid #d97706", borderRadius: 7, background: "#fffbeb", color: "#d97706", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  <RefreshIcon /> {uploading ? "..." : "Replace"}
                </button>
              )}
              <button onClick={() => setConfirmDel(true)} title="Delete" style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", border: "1px solid #fecaca", borderRadius: 7, background: "#fef2f2", color: "#dc2626", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                <TrashIcon />
              </button>
            </>
          ) : (
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", border: "none", borderRadius: 7, background: "#2563eb", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              <UploadIcon /> {uploading ? "Uploading..." : "Upload"}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Employee Documents Modal ─────────────────────────────────────────────────
const EmployeeDocsModal = ({ employee, onClose }) => {
  const [personalDocs, setPersonalDocs] = useState([]);
  const [hrDocs,       setHrDocs]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("personal");
  const [activation,   setActivation]   = useState(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const [empRes, hrRes, actRes] = await Promise.all([
        fetch(`${API_BASE}/api/employee/me/${employee._id}`).then(r => r.json()),
        fetch(`${API_BASE}/api/hr/activation/docs/${employee._id}`).then(r => r.json()),
        fetch(`${API_BASE}/api/hr/activation/${employee._id}`).then(r => r.json()).catch(() => null),
      ]);
      setPersonalDocs(empRes.documents || []);
      setHrDocs(hrRes.success ? (hrRes.data || []) : []);
      if (actRes && actRes.success && actRes.data) setActivation(actRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, [employee._id]);

  const getPersonalDoc = (type) =>
    personalDocs.find(d => d.docType?.trim().toLowerCase() === type?.trim().toLowerCase()) || null;

  const getHrDoc = (type) =>
    hrDocs.find(d => d.docType === type) || null;

  const allPersonalTypes = [
    { type: "Aadhaar",          required: true  },
    { type: "Ration Card",      required: false },
    { type: "PAN",              required: true  },
    { type: "Passport Photo",   required: true  },
    { type: "Resume",           required: true  },
    { type: "Bank Passbook",    required: true  },
    { type: "Cancelled Cheque", required: false },
    { type: "10th Marksheet",   required: true  },
    { type: "12th Marksheet",   required: true  },
    { type: "UG 1st Year",      required: true  },
    { type: "UG 2nd Year",      required: true  },
    { type: "UG 3rd Year",      required: true  },
    { type: "UG Provisional",   required: true  },
    { type: "PG Certificate",   required: false },
    { type: "Bank Statement",   required: false },
    { type: "Reference 1",      required: false },
    { type: "Reference 2",      required: false },
  ];

  const experienceDocs = personalDocs.filter(d =>
    d.docType?.startsWith("offer_") || d.docType?.startsWith("experience_")
  );

  const personalUploaded = allPersonalTypes.filter(d => getPersonalDoc(d.type)).length + experienceDocs.length;
  const hrUploaded = HR_DOC_TYPES.filter(t => getHrDoc(t)).length;

  // Derive employment info from activation data
  const emp = activation?.employment || {};
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

  // Status badge
  const isActive   = employee?.status === "active" || employee?.status === "approved";
  const isRejected = employee?.status === "rejected";
  const statusLabel = isActive ? "Active" : isRejected ? "Rejected" : employee?.status || "Pending";
  const statusColor = isActive ? "#16a34a" : isRejected ? "#dc2626" : "#d97706";
  const statusBg    = isActive ? "#f0fdf4" : isRejected ? "#fef2f2" : "#fffbeb";
  const statusBorder= isActive ? "#bbf7d0" : isRejected ? "#fecaca" : "#fde68a";

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 18, width: "100%", maxWidth: 780,
        maxHeight: "92vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
      }}>

        {/* ── Modal Header ── */}
        <div style={{
          padding: "18px 22px", borderBottom: "1px solid #e5e7eb",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 16, flexShrink: 0,
            }}>
              {employee.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1a1a2e" }}>{employee.name}</h3>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                {employee.employeeId && (
                  <span style={{ background: "#eff6ff", color: "#2563eb", padding: "1px 7px", borderRadius: 5, fontFamily: "monospace", fontWeight: 700, fontSize: 11, marginRight: 6 }}>
                    {employee.employeeId}
                  </span>
                )}
                {employee.department || "—"}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px", cursor: "pointer", display: "flex" }}>
            <CloseIcon />
          </button>
        </div>

        {/* ── Employee Details Section (like Pending page) ── */}
        <div style={{
          padding: "14px 22px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f8fafc",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Employee Details
            </p>
            {/* Status Badge */}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: statusBg, color: statusColor,
              border: `1px solid ${statusBorder}`,
              borderRadius: 99, padding: "4px 12px",
              fontSize: 11, fontWeight: 700,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, display: "inline-block" }} />
              {statusLabel}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px 20px" }}>
            {/* Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Name</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{employee.name || "—"}</span>
            </div>

            {/* Department */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Department</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{employee.department || emp.department || "—"}</span>
            </div>

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Email</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e", wordBreak: "break-all" }}>{employee.email || "—"}</span>
            </div>

            {/* Mobile */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Mobile</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{employee.mobile || "—"}</span>
            </div>

            {/* Date of Joining */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Date of Joining</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>
                {fmtDate(emp.date_of_joining || employee.date_of_joining)}
              </span>
            </div>

            {/* Today's Date */}
            {/* <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>Date</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{new Date().toLocaleDateString()}</span>
            </div> */}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e5e7eb", padding: "0 22px", flexShrink: 0 }}>
          {[
            { key: "personal", label: "Personal Documents", icon: <UserIcon />,   count: `${personalUploaded}/${allPersonalTypes.length + experienceDocs.length}` },
            { key: "hr",       label: "HR Documents",       icon: <ShieldIcon />, count: `${hrUploaded}/${HR_DOC_TYPES.length}` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display: "flex", alignItems: "center", gap: 6,
              border: "none", background: "none", padding: "12px 16px",
              fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: -2,
              borderBottom: activeTab === tab.key ? "3px solid #2563eb" : "3px solid transparent",
              color: activeTab === tab.key ? "#2563eb" : "#6b7280",
            }}>
              {tab.icon} {tab.label}
              <span style={{
                background: activeTab === tab.key ? "#2563eb" : "#e5e7eb",
                color: activeTab === tab.key ? "#fff" : "#374151",
                borderRadius: 99, padding: "2px 7px", fontSize: 11, fontWeight: 700,
              }}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div style={{ overflowY: "auto", padding: "18px 22px", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 30, height: 30, border: "3px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
              <p style={{ color: "#9ca3af", fontSize: 13 }}>Loading documents...</p>
            </div>
          ) : (
            <>
              {/* ── Personal Tab ── */}
              {activeTab === "personal" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Identity & Professional</p>
                  {allPersonalTypes.map(doc => {
                    const uploaded = getPersonalDoc(doc.type);
                    return (
                      <DocRow
                        key={doc.type}
                        docType={doc.type}
                        label={doc.type}
                        fileUrl={uploaded?.fileUrl || null}
                        required={doc.required}
                        employeeId={employee._id}
                        onRefresh={fetchDocs}
                        isHrDoc={false}
                      />
                    );
                  })}

                  {experienceDocs.length > 0 && (
                    <>
                      <p style={{ margin: "14px 0 8px", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Work Experience</p>
                      {experienceDocs.map(doc => (
                        <DocRow
                          key={doc.docType}
                          docType={doc.docType}
                          label={doc.docType.startsWith("offer_") ? "Offer Letter" : "Experience Letter"}
                          fileUrl={doc.fileUrl}
                          required={false}
                          employeeId={employee._id}
                          onRefresh={fetchDocs}
                          isHrDoc={false}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* ── HR Tab ── */}
              {activeTab === "hr" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>HR Issued Documents</p>
                  {HR_DOC_TYPES.map(type => {
                    const doc = getHrDoc(type);
                    return (
                      <DocRow
                        key={type}
                        docType={type}
                        label={type}
                        fileUrl={doc?.fileUrl || null}
                        required={false}
                        employeeId={employee._id}
                        onRefresh={fetchDocs}
                        isHrDoc={true}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HrActiveEmployees() {
  const [employees,  setEmployees]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [toast,      setToast]      = useState(null);
  const [confirmId,  setConfirmId]  = useState(null);
  const [deleting,   setDeleting]   = useState(false);
  const [docsModal,  setDocsModal]  = useState(null);

  useEffect(() => { fetchActive(); }, []);

  const fetchActive = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/hr/employees`)
      .then(res => res.json())
      .then(data => {
        const active = Array.isArray(data) ? data.filter(emp => emp.status === "active") : [];
        setEmployees(active);
      })
      .catch(err => console.log(err))
      .finally(() => setLoading(false));
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/employee/employees/${confirmId}`, { method: "DELETE" });
      if (res.ok) {
        setEmployees(prev => prev.filter(emp => emp._id !== confirmId));
        showToast("Employee removed successfully");
      } else {
        showToast("Failed to delete", "error");
      }
    } catch (err) {
      console.log(err);
      showToast("Something went wrong", "error");
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  const departments = ["All", ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))];

  const filtered = employees.filter(emp => {
    const matchSearch = !search ||
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || emp.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", padding: "20px 16px", background: "#f4f6fb", minHeight: "100vh", boxSizing: "border-box" }}>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 640px) {
          .page-padding { padding: 28px 32px !important; }
          .header-row { flex-wrap: nowrap !important; }
          .search-row { flex-wrap: nowrap !important; }
          .emp-table { display: table !important; }
          .emp-cards { display: none !important; }
          .stats-row { flex-wrap: nowrap !important; }
        }
        @media (max-width: 639px) {
          .emp-table { display: none !important; }
          .emp-cards { display: flex !important; flex-direction: column; gap: 10px; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, right: 16, left: 16, zIndex: 9999,
          background: toast.type === "error" ? "#dc2626" : "#16a34a",
          color: "#fff", padding: "12px 16px", borderRadius: 10,
          fontWeight: 600, fontSize: 13, textAlign: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        }}>{toast.msg}</div>
      )}

      {/* Employee Remove Confirm */}
      {confirmId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "24px 20px", maxWidth: 360, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><AlertIcon /></div>
            <h4 style={{ textAlign: "center", fontWeight: 800, color: "#1a1a2e", margin: "0 0 8px", fontSize: 16 }}>Remove Employee?</h4>
            <p style={{ textAlign: "center", color: "#6b7280", fontSize: 13, margin: "0 0 20px" }}>
              This will permanently delete the employee record.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmId(null)} style={{ flex: 1, padding: "10px 0", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: deleting ? "#fca5a5" : "#dc2626", color: "#fff", fontWeight: 700, fontSize: 13, cursor: deleting ? "not-allowed" : "pointer" }}>
                {deleting ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {docsModal && (
        <EmployeeDocsModal
          employee={docsModal}
          onClose={() => setDocsModal(null)}
        />
      )}

      {/* Header */}
      <div className="header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>Active Employees</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
            {loading ? "Loading..." : `${filtered.length} of ${employees.length} active employee${employees.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {!loading && (
          <div className="stats-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "Total Active", value: employees.length,       color: "#16a34a", bg: "#f0fdf4" },
              { label: "Departments",  value: departments.length - 1, color: "#2563eb", bg: "#eff6ff" },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 80 }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search + Filter */}
      <div className="search-row" style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 32px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" }}
          />
        </div>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          style={{ padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff", cursor: "pointer", minWidth: 130 }}
        >
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", textAlign: "center", padding: "48px 0" }}>
          <div style={{ width: 34, height: 34, border: "4px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ color: "#6b7280", fontSize: 13 }}>Loading employees...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", textAlign: "center", padding: "48px 0" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><UsersIcon /></div>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            {search || deptFilter !== "All" ? "No employees match your filter" : "No active employees yet"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="emp-table" style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden", width: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["#", "Emp ID", "Name", "Email", "Department", "Documents", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, i) => (
                  <tr key={emp._id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 12, fontWeight: 700 }}>
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: "#eff6ff", color: "#2563eb", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>
                        {emp.employeeId || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#16a34a", fontSize: 13, flexShrink: 0 }}>
                          {emp.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <p style={{ margin: 0, fontWeight: 600, color: "#1a1a2e", fontSize: 13 }}>{emp.name}</p>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: 12 }}>{emp.email}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {emp.department ? (
                        <span style={{ background: "#f3f4f6", color: "#374151", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {emp.department}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => setDocsModal(emp)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          background: "#eff6ff", color: "#2563eb",
                          border: "1px solid #bfdbfe", borderRadius: 7,
                          padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        <EyeIcon /> View Docs
                      </button>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => setConfirmId(emp._id)}
                        style={{ display: "flex", alignItems: "center", gap: 6, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        <TrashIcon /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="emp-cards">
            {filtered.map((emp) => (
              <div key={emp._id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#16a34a", fontSize: 15, flexShrink: 0 }}>
                      {emp.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: "#1a1a2e", fontSize: 14 }}>{emp.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{emp.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmId(emp._id)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, padding: "8px", cursor: "pointer" }}
                    title="Remove"
                  >
                    <TrashIcon />
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <span style={{ background: "#eff6ff", color: "#2563eb", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>
                    {emp.employeeId || "—"}
                  </span>
                  {emp.department && (
                    <span style={{ background: "#f3f4f6", color: "#374151", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      {emp.department}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setDocsModal(emp)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    background: "#eff6ff", color: "#2563eb",
                    border: "1px solid #bfdbfe", borderRadius: 8,
                    padding: "9px 0", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <EyeIcon /> View Documents
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}