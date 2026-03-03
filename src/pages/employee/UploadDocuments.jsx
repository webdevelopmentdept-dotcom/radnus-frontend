import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  ShieldCheck,
  User,
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DOCUMENTS = [
  { id: "Aadhaar", label: "Aadhaar Card", category: "Identity", type: "file", required: true, icon: <ShieldCheck size={18} /> },
  { id: "PAN", label: "PAN Card", category: "Identity", type: "file", required: true, icon: <ShieldCheck size={18} /> },
  { id: "Passport Photo", label: "Passport Photo", category: "Identity", type: "file", required: true, icon: <User size={18} /> },
  { id: "10th Marksheet", label: "10th Marksheet", category: "Education", type: "file", required: true, icon: <GraduationCap size={18} /> },
  { id: "12th Marksheet", label: "12th Marksheet", category: "Education", type: "file", required: true, icon: <GraduationCap size={18} /> },
  { id: "Degree Certificate", label: "Degree Certificate", category: "Education", type: "file", required: false, icon: <GraduationCap size={18} /> },
  { id: "Diploma", label: "Diploma", category: "Education", type: "file", required: false, icon: <GraduationCap size={18} /> },
  { id: "Skill Certification", label: "Skill Certification", category: "Education", type: "file", required: false, icon: <GraduationCap size={18} /> },
  { id: "Experience Letter", label: "Experience Letter", category: "Professional", type: "file", required: false, icon: <Briefcase size={18} /> },
  { id: "Relieving Letter", label: "Relieving Letter", category: "Professional", type: "file", required: false, icon: <Briefcase size={18} /> },
  { id: "Payslip", label: "Latest Payslip", category: "Professional", type: "file", required: false, icon: <FileText size={18} /> },
  { id: "Resume", label: "Resume", category: "Professional", type: "file", required: true, icon: <FileText size={18} /> },
  { id: "Reference Letter", label: "Reference Letter", category: "Professional", type: "file", required: false, icon: <FileText size={18} /> },
  { id: "Facebook", label: "Facebook Profile", category: "Social", type: "link", required: false, icon: <LinkIcon size={18} /> },
  { id: "LinkedIn", label: "LinkedIn Profile", category: "Social", type: "link", required: false, icon: <LinkIcon size={18} /> },
];

export default function UploadDocuments() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [statuses, setStatuses] = useState({});
  const [dragActive, setDragActive] = useState(null);
  const [previewModal, setPreviewModal] = useState(null);
  const [links, setLinks] = useState({});

  /* ─── File Selection ─── */
  const handleFileChange = (docId, file) => {
    if (!file) return;

    // If already successfully uploaded, block re-select
    if (statuses[docId] === "success") return;

    setFiles((prev) => ({ ...prev, [docId]: file }));
    setStatuses((prev) => ({ ...prev, [docId]: "idle" }));

    // Revoke old preview URL to avoid memory leaks
    if (previews[docId] && !previews[docId].startsWith("http")) {
      URL.revokeObjectURL(previews[docId]);
    }

    const url = URL.createObjectURL(file);
    setPreviews((prev) => ({ ...prev, [docId]: url }));
  };

  /* ─── Remove File ─── */
  const removeFile = (docId) => {
    if (previews[docId] && !previews[docId].startsWith("http")) {
      URL.revokeObjectURL(previews[docId]);
    }
    setFiles((prev) => { const n = { ...prev }; delete n[docId]; return n; });
    setPreviews((prev) => { const n = { ...prev }; delete n[docId]; return n; });
    setStatuses((prev) => { const n = { ...prev }; delete n[docId]; return n; });
  };

  /* ─── Upload ─── */
  const handleUpload = async (docId) => {
    const file = files[docId];
    if (!file) return;

    const employeeId = localStorage.getItem("employeeId");
    if (!employeeId) {
      alert("Session expired. Please login again.");
      window.location.href = "/employee/login";
      return;
    }

    setStatuses((prev) => ({ ...prev, [docId]: "uploading" }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("employeeId", employeeId);
    formData.append("docType", docId);

    try {
      const res = await axios.post(
        `${API_BASE}/api/employee/upload-doc`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );


      // ✅ Save the Cloudinary URL as the preview so modal works after upload
      setPreviews((prev) => ({ ...prev, [docId]: res.data.fileUrl }));

      setStatuses((prev) => ({ ...prev, [docId]: "success" }));

      // Clear local file reference — it's now stored on Cloudinary
      setFiles((prev) => { const n = { ...prev }; delete n[docId]; return n; });

    } catch (err) {
      setStatuses((prev) => ({ ...prev, [docId]: "error" }));
      alert(err.response?.data?.message || "Upload failed");
    }
  };

  /* ─── All Required Uploaded? ─── */
  const isAllRequiredUploaded = () =>
    DOCUMENTS.filter((d) => d.required).every((doc) => {
      if (doc.type === "file") return statuses[doc.id] === "success";
      return !!links[doc.id];
    });

  /* ─── Preview Modal ─── */
  const openPreview = (docId) => {
    const url = previews[docId];
    if (!url) return;

    const lower = url.toLowerCase();
    const type = lower.match(/\.(jpg|jpeg|png|webp)/) ? "image"
      : lower.includes(".pdf") || lower.includes("pdf") ? "application/pdf"
      : "other";

    setPreviewModal({ name: docId, url, type });
  };

  /* ─── Submit All ─── */
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

  /* ─── On Mount: Redirect if already completed / load existing docs ─── */
  useEffect(() => {
    const fetchDocs = async () => {
      const employeeId = localStorage.getItem("employeeId");
      if (!employeeId) return;

      try {
        const res = await axios.get(`${API_BASE}/api/employee/me/${employeeId}`);

        if (res.data.documentsCompleted) {
          window.location.href = "/employee/dashboard";
          return;
        }

        const statusObj = {};
        const previewObj = {};

        res.data.documents.forEach((doc) => {
          statusObj[doc.docType] = "success";
          previewObj[doc.docType] = doc.fileUrl; // Cloudinary URL
        });

        setStatuses(statusObj);
        setPreviews(previewObj);
      } catch (err) {
        alert(err.response?.data?.message);
      }
    };

    fetchDocs();
  }, []);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => {
        if (url && !url.startsWith("http")) URL.revokeObjectURL(url);
      });
    };
  }, []);

  /* ─── Render ─── */
  return (
    <div className="container py-5">
      <header className="mb-5">
        <div className="d-flex align-items-center gap-3 mb-2">
          <div className="bg-success p-2 rounded text-white">
            <FileCheck size={24} />
          </div>
          <h1 className="h3 fw-bold m-0">Document Verification</h1>
        </div>
        <p className="text-muted">
          Please upload the following documents to complete your onboarding.
          Supported formats: PDF, JPG, PNG (Max 5MB).
        </p>
      </header>

      <div className="row g-4">
        {DOCUMENTS.map((doc, index) => (
          <div key={doc.id} className="col-12 col-md-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card h-100 p-4 ${dragActive === doc.id ? "border-primary" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(doc.id); }}
              onDragLeave={() => setDragActive(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(null);
                if (statuses[doc.id] !== "success") {
                  handleFileChange(doc.id, e.dataTransfer.files?.[0]);
                }
              }}
            >
              {/* Header */}
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="icon-box">{doc.icon}</div>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="h6 fw-bold m-0">{doc.label}</h5>
                      <span
                        className={`badge rounded-pill ${doc.required ? "bg-danger-subtle text-danger" : "bg-light text-secondary"}`}
                        style={{ fontSize: "10px" }}
                      >
                        {doc.required ? "Required" : "Optional"}
                      </span>
                    </div>
                    <small className="text-uppercase fw-bold text-muted" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
                      {doc.category}
                    </small>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {statuses[doc.id] === "success" && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-success">
                      <CheckCircle2 size={20} />
                    </motion.div>
                  )}
                  {statuses[doc.id] === "error" && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-danger">
                      <AlertCircle size={20} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* File or Link */}
              {doc.type === "file" ? (
                statuses[doc.id] === "success" ? (
                  /* Already uploaded — show preview button */
                  <div className="d-flex align-items-center justify-content-between p-3 bg-success-subtle rounded border border-success-subtle">
                    <span className="small text-success fw-semibold">✓ Uploaded</span>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => openPreview(doc.id)}
                    >
                      View
                    </button>
                  </div>
                ) : !files[doc.id] ? (
                  /* Drop zone */
                  <div
                    className={`upload-zone ${dragActive === doc.id ? "active" : ""}`}
                    style={{
                      border: "2px dashed #dee2e6",
                      borderRadius: "0.75rem",
                      padding: "2rem",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => document.getElementById(`file-input-${doc.id}`).click()}
                  >
                    <Upload size={24} className="text-muted mb-2" />
                    <p className="small text-muted m-0">
                      <strong>Click to upload</strong> or drag and drop
                    </p>
                    <input
                      id={`file-input-${doc.id}`}
                      type="file"
                      className="d-none"
                      accept="image/*,application/pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(doc.id, e.target.files?.[0])}
                    />
                  </div>
                ) : (
                  /* File selected — show name + upload button */
                  <div className="mt-2">
                    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded border mb-3">
                      <span className="small text-truncate me-2">{files[doc.id]?.name}</span>
                      <button onClick={() => removeFile(doc.id)} className="btn btn-sm btn-light flex-shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => handleUpload(doc.id)}
                      disabled={statuses[doc.id] === "uploading"}
                      className="btn btn-primary w-100"
                    >
                      {statuses[doc.id] === "uploading" ? (
                        <span>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          Uploading...
                        </span>
                      ) : "Upload"}
                    </button>
                  </div>
                )
              ) : (
                /* Link input */
                <div className="mt-2">
                  <input
                    type="url"
                    placeholder="Paste profile link..."
                    value={links[doc.id] || ""}
                    onChange={(e) => setLinks((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                    className="form-control"
                  />
                  {links[doc.id] && (
                    <p className="text-success small mt-2">Link added ✓</p>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="text-center mt-4">
        <button
          disabled={!isAllRequiredUploaded()}
          onClick={handleSubmit}
          className="btn btn-success px-4 py-2"
          style={{
            opacity: isAllRequiredUploaded() ? 1 : 0.5,
            cursor: isAllRequiredUploaded() ? "pointer" : "not-allowed",
          }}
        >
          Submit Documents
        </button>
        {!isAllRequiredUploaded() && (
          <p className="text-dark mt-2 small">Upload all required documents first</p>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewModal && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal-dialog modal-lg modal-dialog-centered"
            >
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "1.5rem" }}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">{previewModal.name}</h5>
                  <button type="button" className="btn-close" onClick={() => setPreviewModal(null)} />
                </div>
                <div className="modal-body p-4 text-center">
                  {previewModal.type === "image" ? (
                    <img src={previewModal.url} alt="Preview" className="img-fluid rounded shadow-sm" style={{ maxHeight: "70vh" }} />
                  ) : previewModal.type === "application/pdf" ? (
                    <iframe src={previewModal.url} title="PDF Preview" width="100%" height="500px" className="rounded border" />
                  ) : (
                    <a href={previewModal.url} target="_blank" rel="noreferrer" className="btn btn-primary">
                      Download / View File
                    </a>
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

      <footer className="mt-5 pt-4 border-top d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 text-muted small">
        <p className="m-0">© 2026 HR Systems Portal. All documents are encrypted and stored securely.</p>
        <div className="d-flex gap-4">
          <a href="#" className="text-decoration-none text-muted">Privacy Policy</a>
          <a href="#" className="text-decoration-none text-muted">Security Standards</a>
          <a href="#" className="text-decoration-none text-muted">Support</a>
        </div>
      </footer>
    </div>
  );
}