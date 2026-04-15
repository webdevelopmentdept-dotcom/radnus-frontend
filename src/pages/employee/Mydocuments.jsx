import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FileText, Download, ExternalLink, CheckCircle, Clock,
  ShieldCheck, FileCheck, Menu,
  ClipboardList, FileIcon, Lock, PenLine, DollarSign, BookOpen,
  Building2, User
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

export default function MyDocuments() {
  const [employee, setEmployee]         = useState(null);
  const [hrDocs, setHrDocs]             = useState([]);
  const [personalDocs, setPersonalDocs] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState("hr");
  const [downloading, setDownloading]   = useState({});

  useEffect(() => {
    const id = localStorage.getItem("employeeId");
    if (!id) { window.location.href = "/login"; return; }
    const fetchAll = async () => {
      try {
        const empRes = await axios.get(`${API_BASE}/api/employee/me/${id}`);
        setEmployee(empRes.data);
        const hrTypes = HR_DOC_TYPES.map(d => d.type);
        const allDocs = empRes.data.documents || [];
        setPersonalDocs(allDocs.filter(d => !hrTypes.includes(d.docType)));
        const hrRes = await axios.get(`${API_BASE}/api/hr/activation/docs/${id}`);
        if (hrRes.data.success) setHrDocs(hrRes.data.data || []);
      } catch (err) { console.log(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const getHrDocUrl  = (t) => hrDocs.find(d => d.docType === t)?.fileUrl || null;
  const getFileLabel = (url) => {
    if (!url) return "File";
    if (url.toLowerCase().includes("pdf")) return "PDF";
    if (/\.(jpg|jpeg|png)/i.test(url)) return "Image";
    return "Document";
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

        {/* Topbar */}
        <header style={{ background: "#fff", padding: "14px 28px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div className="d-flex align-items-center gap-3">
            <span className="fw-bold text-primary d-none d-sm-inline">My Documents</span>
            <div className="ms-auto bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40, fontSize: 16, fontWeight: 700 }}>
              {employee?.name?.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container-fluid" style={{ padding: 28 }}>

          {/* Stats */}
          <div className="row g-3 mb-4">
            {[
              { label: "HR Documents",       value: `${hrDocs.length} / ${HR_DOC_TYPES.length}`, icon: <ShieldCheck size={22} className="text-white" />, bg: "linear-gradient(135deg,#2563eb,#1e40af)" },
              { label: "Personal Documents", value: personalDocs.length,                          icon: <FileCheck   size={22} className="text-white" />, bg: "linear-gradient(135deg,#7c3aed,#5b21b6)" },
              { label: "Total Documents",    value: hrDocs.length + personalDocs.length,          icon: <FileText    size={22} className="text-white" />, bg: "linear-gradient(135deg,#059669,#065f46)" },
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

          {/* Card */}
          <div className="card">
            <div className="card-body">

              {/* Tabs */}
              <div className="d-flex gap-2 mb-4" style={{ borderBottom: "2px solid #e5e7eb" }}>
                {[
                  { key: "hr",       label: <span className="d-flex align-items-center gap-2"><Building2 size={15} />HR Documents</span>,     count: hrDocs.length },
                  { key: "personal", label: <span className="d-flex align-items-center gap-2"><User      size={15} />My Uploaded Docs</span>, count: personalDocs.length },
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
                    const url = getHrDocUrl(docInfo.type);
                    const isAvailable = !!url;
                    const isDownloading = downloading[docInfo.type];
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
                                <button onClick={() => downloadFile(url, docInfo.type)} disabled={isDownloading}
                                  className="btn btn-sm btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-1">
                                  <Download size={13} /> {isDownloading ? "..." : "Download"}
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
                <div>
                  {personalDocs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0" }}>
                      <FileText size={48} color="#d1d5db" />
                      <p style={{ color: "#9ca3af", marginTop: 12 }}>No personal documents uploaded yet.</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {personalDocs.map((doc, i) => (
                        <div key={i} className="col-md-6">
                          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", background: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ background: "#eff6ff", padding: 10, borderRadius: 8 }}>
                              <FileText size={22} color="#2563eb" />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h6 style={{ margin: 0, fontWeight: 700 }}>{doc.docType}</h6>
                              <span style={{ fontSize: 12, color: "#6b7280" }}>{getFileLabel(doc.fileUrl)}</span>
                            </div>
                            {doc.fileUrl && (
                              <div className="d-flex gap-2">
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1">
                                  <ExternalLink size={13} /> View
                                </a>
                                <button onClick={() => downloadFile(doc.fileUrl, doc.docType)} disabled={downloading[doc.docType]}
                                  className="btn btn-sm btn-primary d-flex align-items-center gap-1">
                                  <Download size={13} /> {downloading[doc.docType] ? "..." : "Download"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}