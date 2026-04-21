import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  FileText, Download, ExternalLink, CheckCircle, Clock,
  ShieldCheck, FileCheck, Upload,
  ClipboardList, FileIcon, Lock, PenLine, DollarSign, BookOpen,
  Building2, User, RefreshCw, Link
} from "lucide-react";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const HR_DOC_TYPES = [
  { type: "Offer Letter",              icon: <ClipboardList size={28} />, desc: "Your official offer letter from HR" },
  { type: "Appointment Letter",        icon: <FileIcon      size={28} />, desc: "Formal appointment confirmation" },
  { type: "NDA Agreement",             icon: <Lock          size={28} />, desc: "Non-disclosure agreement" },
  { type: "Employment Contract",       icon: <PenLine       size={28} />, desc: "Full employment contract" },
  { type: "Salary Structure Document", icon: <DollarSign    size={28} />, desc: "Detailed salary breakdown" },
  { type: "HR Policy Document",        icon: <BookOpen      size={28} />, desc: "Company HR policies & guidelines" },
];

// 🔥 SOCIAL_LINK_TYPES — these show a URL textbox instead of file upload
const SOCIAL_LINK_TYPES = ["Facebook Profile", "LinkedIn Profile"];

const REQUIRED_PERSONAL_DOCS = [
  { type: "Aadhaar",        category: "IDENTITY",     required: true },
  { type: "PAN",            category: "IDENTITY",     required: true },
  { type: "Passport Photo", category: "IDENTITY",     required: true },
  { type: "10th Marksheet", category: "EDUCATION",    required: true },
  { type: "12th Marksheet", category: "EDUCATION",    required: true },
  { type: "Resume",         category: "PROFESSIONAL", required: true },
];

const OPTIONAL_PERSONAL_DOCS = [
  { type: "Degree Certificate",  category: "EDUCATION",    required: false },
  { type: "Diploma",             category: "EDUCATION",    required: false },
  { type: "Skill Certification", category: "EDUCATION",    required: false },
  { type: "Experience Letter",   category: "PROFESSIONAL", required: false },
  { type: "Relieving Letter",    category: "PROFESSIONAL", required: false },
  { type: "Latest Payslip",      category: "PROFESSIONAL", required: false },
  { type: "Reference Letter",    category: "PROFESSIONAL", required: false },
  { type: "Facebook Profile",    category: "SOCIAL",       required: false },
  { type: "LinkedIn Profile",    category: "SOCIAL",       required: false },
];

const ALL_PERSONAL_DOCS = [...REQUIRED_PERSONAL_DOCS, ...OPTIONAL_PERSONAL_DOCS];

const handleDownload = async (url, filename) => {
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

const getFileLabel = (url) => {
  if (!url) return "File";
  if (url.toLowerCase().includes("pdf")) return "PDF";
  if (/\.(jpg|jpeg|png)/i.test(url)) return "Image";
  return "Document";
};

export default function MyDocuments() {
  const [employee, setEmployee]         = useState(null);
  const [hrDocs, setHrDocs]             = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState("hr");
  const [downloading, setDownloading]   = useState({});
  const [uploading, setUploading]       = useState({});
  const [uploadError, setUploadError]   = useState({});

  // 🔥 Link input state — { "Facebook Profile": "https://...", ... }
  const [linkInputs, setLinkInputs]     = useState({});
  const [savingLink, setSavingLink]     = useState({});
  const [linkError, setLinkError]       = useState({});
  const [linkSuccess, setLinkSuccess]   = useState({});

  const fileRefs = useRef({});

  const fetchAll = async (id) => {
    try {
      const empRes = await axios.get(`${API_BASE}/api/employee/me/${id}`);
      setEmployee(empRes.data);
      setUploadedDocs(empRes.data.documents || []);
      const hrRes = await axios.get(`${API_BASE}/api/hr/activation/docs/${id}`);
      if (hrRes.data.success) setHrDocs(hrRes.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = localStorage.getItem("employeeId");
    if (!id) { window.location.href = "/login"; return; }
    fetchAll(id);
  }, []);

  const getUploadedDoc = (type) =>
    uploadedDocs.find(d =>
      d.docType?.trim().toLowerCase() === type?.trim().toLowerCase()
    ) || null;

  const uploadedPersonalCount = ALL_PERSONAL_DOCS.filter(d => getUploadedDoc(d.type)).length;

  // ── File upload handler ──────────────────────────────────────────────────────
  const handleUpload = async (docType, file) => {
    if (!file) return;
    const employeeId = localStorage.getItem("employeeId");
    const existingDoc = uploadedDocs.find(
      d => d.docType?.trim().toLowerCase() === docType?.trim().toLowerCase()
    );

    setUploading(p => ({ ...p, [docType]: true }));
    setUploadError(p => ({ ...p, [docType]: null }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("employeeId", employeeId);
      formData.append("docType", docType);

      if (existingDoc) {
        formData.append("docId", existingDoc._id);
        await axios.post(`${API_BASE}/api/employee/replace-doc`, formData);
      } else {
        await axios.post(`${API_BASE}/api/employee/upload-doc`, formData);
      }
      await fetchAll(employeeId);
    } catch (err) {
      const msg = err?.response?.data?.message || "Upload failed";
      setUploadError(p => ({ ...p, [docType]: msg }));
    } finally {
      setUploading(p => ({ ...p, [docType]: false }));
      if (fileRefs.current[docType]) fileRefs.current[docType].value = "";
    }
  };

  // ── Social link save handler ─────────────────────────────────────────────────
  const handleSaveLink = async (docType) => {
    const url = linkInputs[docType]?.trim();
    if (!url) {
      setLinkError(p => ({ ...p, [docType]: "Please enter a URL" }));
      return;
    }
    const employeeId = localStorage.getItem("employeeId");
    setSavingLink(p => ({ ...p, [docType]: true }));
    setLinkError(p => ({ ...p, [docType]: null }));
    setLinkSuccess(p => ({ ...p, [docType]: false }));

    try {
      await axios.post(`${API_BASE}/api/employee/save-link`, {
        employeeId,
        docType,
        url
      });
      setLinkSuccess(p => ({ ...p, [docType]: true }));
      setLinkInputs(p => ({ ...p, [docType]: "" }));
      await fetchAll(employeeId);
      // Clear success after 3s
      setTimeout(() => setLinkSuccess(p => ({ ...p, [docType]: false })), 3000);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save link";
      setLinkError(p => ({ ...p, [docType]: msg }));
    } finally {
      setSavingLink(p => ({ ...p, [docType]: false }));
    }
  };

  const downloadFile = async (url, name) => {
    setDownloading(p => ({ ...p, [name]: true }));
    await handleDownload(url, name);
    setDownloading(p => ({ ...p, [name]: false }));
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status" />
    </div>
  );

  return (
    <EmployeeLayout>
      <div style={{ background: "#f4f6fb", minHeight: "100vh" }}>

        <header style={{ background: "#fff", padding: "14px 28px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div className="d-flex align-items-center gap-3">
            <span className="fw-bold text-primary d-none d-sm-inline">My Documents</span>
            <div className="ms-auto bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40, fontSize: 16, fontWeight: 700 }}>
              {employee?.name?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="container-fluid" style={{ padding: 28 }}>

          {/* Stats */}
          <div className="row g-3 mb-4">
            {[
              { label: "HR Documents",       value: `${hrDocs.length} / ${HR_DOC_TYPES.length}`,               icon: <ShieldCheck size={22} className="text-white" />, bg: "linear-gradient(135deg,#2563eb,#1e40af)" },
              { label: "Personal Documents", value: `${uploadedPersonalCount} / ${ALL_PERSONAL_DOCS.length}`,  icon: <FileCheck   size={22} className="text-white" />, bg: "linear-gradient(135deg,#7c3aed,#5b21b6)" },
              { label: "Total Documents",    value: hrDocs.length + uploadedPersonalCount,                     icon: <FileText    size={22} className="text-white" />, bg: "linear-gradient(135deg,#059669,#065f46)" },
            ].map((s, i) => (
              <div key={i} className="col-md-4">
                <div className="card border-0 text-white" style={{ background: s.bg }}>
                  <div className="card-body d-flex align-items-center justify-content-between py-3">
                    <div>
                      <p className="mb-0 small opacity-75 fw-bold text-uppercase">{s.label}</p>
                      <h3 className="mb-0 fw-bold">{s.value}</h3>
                    </div>
                    <div className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 48, height: 48, background: "rgba(255,255,255,0.2)" }}>
                      {s.icon}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-body">

              {/* Tabs */}
              <div className="d-flex gap-2 mb-4" style={{ borderBottom: "2px solid #e5e7eb" }}>
                {[
                  { key: "hr",       label: <span className="d-flex align-items-center gap-2"><Building2 size={15} />HR Documents</span>,     count: hrDocs.length },
                  { key: "personal", label: <span className="d-flex align-items-center gap-2"><User      size={15} />My Uploaded Docs</span>, count: `${uploadedPersonalCount}/${ALL_PERSONAL_DOCS.length}` },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                    border: "none", background: "none", padding: "10px 18px", fontWeight: 700,
                    fontSize: 14, cursor: "pointer", marginBottom: -2,
                    borderBottom: activeTab === tab.key ? "3px solid #2563eb" : "3px solid transparent",
                    color: activeTab === tab.key ? "#2563eb" : "#6b7280"
                  }}>
                    {tab.label}
                    <span style={{ marginLeft: 8, background: activeTab === tab.key ? "#2563eb" : "#e5e7eb", color: activeTab === tab.key ? "#fff" : "#374151", borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* HR Docs */}
              {activeTab === "hr" && (
                <div className="row g-3">
                  {HR_DOC_TYPES.map((docInfo, i) => {
                    const url = hrDocs.find(d => d.docType === docInfo.type)?.fileUrl || null;
                    const isAvailable = !!url;
                    return (
                      <div key={i} className="col-md-6 col-lg-4">
                        <div style={{ border: `2px solid ${isAvailable ? "#86efac" : "#e5e7eb"}`, borderRadius: 12, background: isAvailable ? "#f0fdf4" : "#fafafa", padding: 16, height: "100%" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                            <div style={{ color: "#6b7280" }}>{docInfo.icon}</div>
                            <div>
                              <h6 style={{ margin: 0, fontWeight: 700 }}>{docInfo.type}</h6>
                              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{docInfo.desc}</p>
                            </div>
                          </div>
                          {isAvailable ? (
                            <>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                                <CheckCircle size={13} color="#16a34a" />
                                <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>Available · {getFileLabel(url)}</span>
                              </div>
                              <div className="d-flex gap-2">
                                <a href={url} target="_blank" rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary flex-grow-1 d-flex align-items-center justify-content-center gap-1">
                                  <ExternalLink size={13} /> View
                                </a>
                                <button onClick={() => downloadFile(url, docInfo.type)} disabled={downloading[docInfo.type]}
                                  className="btn btn-sm btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-1">
                                  <Download size={13} /> {downloading[docInfo.type] ? "..." : "Download"}
                                </button>
                              </div>
                            </>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Clock size={13} color="#9ca3af" />
                              <span style={{ fontSize: 12, color: "#9ca3af" }}>Pending from HR</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Personal Docs */}
              {activeTab === "personal" && (
                <div className="row g-3">
                  {ALL_PERSONAL_DOCS.map((docInfo, i) => {
                    const uploaded    = getUploadedDoc(docInfo.type);
                    const isUploaded  = !!uploaded;
                    const isSocialLink = SOCIAL_LINK_TYPES.includes(docInfo.type);

                    // ── SOCIAL LINK CARD ──────────────────────────────────────
                    if (isSocialLink) {
                      const isUploading = savingLink[docInfo.type];
                      const error       = linkError[docInfo.type];
                      const success     = linkSuccess[docInfo.type];

                      return (
                        <div key={i} className="col-md-6">
                          <div style={{
                            border: `1.5px solid ${isUploaded ? "#86efac" : "#e5e7eb"}`,
                            borderRadius: 12,
                            background: isUploaded ? "#f0fdf4" : "#fff",
                            padding: "14px 16px",
                            height: "100%"
                          }}>
                            {/* Header */}
                            <div className="d-flex align-items-center gap-3 mb-3">
                              <div style={{ background: isUploaded ? "#dcfce7" : "#eff6ff", padding: 10, borderRadius: 8, flexShrink: 0 }}>
                                <Link size={20} color={isUploaded ? "#16a34a" : "#2563eb"} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  <h6 style={{ margin: 0, fontWeight: 700 }}>{docInfo.type}</h6>
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: "#f3f4f6", color: "#6b7280" }}>
                                    Optional
                                  </span>
                                  <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>{docInfo.category}</span>
                                </div>
                                {isUploaded ? (
                                  <span style={{ fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                    <CheckCircle size={12} /> Link saved
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                    <Clock size={12} /> Not added yet
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Saved link — show with edit option */}
                            {isUploaded && (
                              <div className="mb-2 d-flex align-items-center gap-2" style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 10px", border: "1px solid #86efac" }}>
                                <ExternalLink size={13} color="#16a34a" />
                                <a href={uploaded.fileUrl} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: 12, color: "#2563eb", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {uploaded.fileUrl}
                                </a>
                              </div>
                            )}

                            {/* URL Input */}
                            <div className="d-flex gap-2 mt-1">
                              <input
                                type="url"
                                placeholder={`Paste your ${docInfo.type} URL...`}
                                value={linkInputs[docInfo.type] || ""}
                                onChange={e => setLinkInputs(p => ({ ...p, [docInfo.type]: e.target.value }))}
                                style={{
                                  flex: 1, fontSize: 12, padding: "7px 10px",
                                  border: "1px solid #e5e7eb", borderRadius: 7,
                                  outline: "none", minWidth: 0
                                }}
                              />
                              <button
                                onClick={() => handleSaveLink(docInfo.type)}
                                disabled={isUploading || !linkInputs[docInfo.type]?.trim()}
                                className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {isUploading
                                  ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</>
                                  : isUploaded ? <><RefreshCw size={13} /> Update</> : <><CheckCircle size={13} /> Save</>
                                }
                              </button>
                            </div>

                            {error   && <p style={{ fontSize: 11, color: "#dc2626", margin: "4px 0 0" }}>{error}</p>}
                            {success && <p style={{ fontSize: 11, color: "#16a34a", margin: "4px 0 0" }}>✓ Saved successfully!</p>}
                          </div>
                        </div>
                      );
                    }

                    // ── FILE UPLOAD CARD ──────────────────────────────────────
                    const isUploading = uploading[docInfo.type];
                    const error       = uploadError[docInfo.type];

                    return (
                      <div key={i} className="col-md-6">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                          style={{ display: "none" }}
                          ref={el => (fileRefs.current[docInfo.type] = el)}
                          onChange={e => handleUpload(docInfo.type, e.target.files[0])}
                        />
                        <div style={{
                          border: `1.5px solid ${isUploaded ? "#86efac" : "#e5e7eb"}`,
                          borderRadius: 12,
                          background: isUploaded ? "#f0fdf4" : "#fff",
                          padding: "14px 16px",
                          height: "100%"
                        }}>
                          <div className="d-flex align-items-center gap-3 mb-2">
                            <div style={{ background: isUploaded ? "#dcfce7" : "#eff6ff", padding: 10, borderRadius: 8, flexShrink: 0 }}>
                              <FileText size={20} color={isUploaded ? "#16a34a" : "#2563eb"} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <h6 style={{ margin: 0, fontWeight: 700 }}>{docInfo.type}</h6>
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
                                  background: docInfo.required ? "#fee2e2" : "#f3f4f6",
                                  color: docInfo.required ? "#dc2626" : "#6b7280"
                                }}>
                                  {docInfo.required ? "Required" : "Optional"}
                                </span>
                                <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>{docInfo.category}</span>
                              </div>
                              {isUploaded ? (
                                <span style={{ fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                  <CheckCircle size={12} /> Uploaded · {getFileLabel(uploaded.fileUrl)}
                                </span>
                              ) : (
                                <span style={{ fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                                  <Clock size={12} /> Not uploaded yet
                                </span>
                              )}
                            </div>
                          </div>

                          {error && <p style={{ fontSize: 11, color: "#dc2626", margin: "4px 0 6px" }}>{error}</p>}

                          <div className="d-flex gap-2 mt-2 flex-wrap">
                            {isUploaded ? (
                              <>
                                <a href={uploaded.fileUrl} target="_blank" rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1">
                                  <ExternalLink size={13} /> View
                                </a>
                                <button onClick={() => downloadFile(uploaded.fileUrl, docInfo.type)} disabled={downloading[docInfo.type]}
                                  className="btn btn-sm btn-primary d-flex align-items-center gap-1">
                                  <Download size={13} /> {downloading[docInfo.type] ? "..." : "Download"}
                                </button>
                                <button
                                  onClick={() => fileRefs.current[docInfo.type]?.click()}
                                  disabled={isUploading}
                                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                                >
                                  <RefreshCw size={13} /> {isUploading ? "..." : "Replace"}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => fileRefs.current[docInfo.type]?.click()}
                                disabled={isUploading}
                                className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                              >
                                {isUploading
                                  ? <><span className="spinner-border spinner-border-sm me-1" />Uploading...</>
                                  : <><Upload size={13} /> Upload</>
                                }
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}