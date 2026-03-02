



import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  FileCheck,
  ShieldCheck,
  User,
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DOCUMENTS = [
  { id: "Aadhaar", label: "Aadhaar Card", category: "Identity", type: "file", required: true, icon: <ShieldCheck size={18} /> },
  { id: "PAN", label: "PAN Card", category: "Identity", type: "file", required: true, icon: <ShieldCheck size={18} /> },
  { id: "Passport Photo", label: "Passport Photo", category: "Identity", type: "file", required: true, icon: <User size={18} /> },

  { id: "10th Marksheet", required: true, type: "file", label: "10th Marksheet", category: "Education", icon: <GraduationCap size={18} /> },
  { id: "12th Marksheet", required: true, type: "file", label: "12th Marksheet", category: "Education", icon: <GraduationCap size={18} /> },

  { id: "Degree Certificate", required: false, type: "file", label: "Degree Certificate", category: "Education", icon: <GraduationCap size={18} /> },
  { id: "Diploma", required: false, type: "file", label: "Diploma", category: "Education", icon: <GraduationCap size={18} /> },
  { id: "Skill Certification", required: false, type: "file", label: "Skill Certification", category: "Education", icon: <GraduationCap size={18} /> },

  { id: "Experience Letter", required: false, type: "file", label: "Experience Letter", category: "Professional", icon: <Briefcase size={18} /> },
  { id: "Relieving Letter", required: false, type: "file", label: "Relieving Letter", category: "Professional", icon: <Briefcase size={18} /> },
  { id: "Payslip", required: false, type: "file", label: "Latest Payslip", category: "Professional", icon: <FileText size={18} /> },
  { id: "Resume", required: true, type: "file", label: "Resume", category: "Professional", icon: <FileText size={18} /> },

  { id: "Reference Letter", required: false, type: "file", label: "Reference Letter", category: "Professional", icon: <FileText size={18} /> },

  { id: "Facebook", required: false, type: "link", label: "Facebook Profile", category: "Social", icon: <LinkIcon size={18} /> },
  { id: "LinkedIn", required: false, type: "link", label: "LinkedIn Profile", category: "Social", icon: <LinkIcon size={18} /> }
];

export default function UploadDocuments() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  
  const [statuses, setStatuses] = useState({});
  const [dragActive, setDragActive] = useState(null);
  const [previewModal, setPreviewModal] = useState(null);
   // { file, url, type }
const [links, setLinks] = useState({});
  const handleFileChange = (docId, file) => {
  if (file) {
    setFiles((prev) => ({ ...prev, [docId]: file }));
    setStatuses((prev) => ({ ...prev, [docId]: "idle" }));

    const url = URL.createObjectURL(file); // ✅ correct
    setPreviews((prev) => ({ ...prev, [docId]: url }));
  }
};
  
const isAllRequiredUploaded = () => {
  return DOCUMENTS
    .filter(doc => doc.required)
    .every(doc => {
      if (doc.type === "file") {
        return statuses[doc.id] === "success";
      } else {
        return links[doc.id];
      }
    });
};
  const handleUpload = async (docId) => {
  const file = files[docId];
  if (!file) return;

  setStatuses((prev) => ({ ...prev, [docId]: "uploading" }));

  const formData = new FormData();
  formData.append("file", file);

  const employeeId = localStorage.getItem("employeeId");

  if (!employeeId) {
    alert("Session expired. Please login again.");
    window.location.href = "/employee/login";
    return;
  }

  formData.append("employeeId", employeeId);
  formData.append("docType", docId);

  try {
    await axios.post(
      `${API_BASE}/api/employee/upload-doc`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    );

    setStatuses((prev) => ({ ...prev, [docId]: "success" }));
setFiles((prev) => {
  const newFiles = { ...prev };
  delete newFiles[docId];
  return newFiles;
});
  } catch (err) {
  console.log(err.response?.data || err.message);
  alert(err.response?.data?.message || "Upload failed");
}
};

  const removeFile = (docId) => {
    if (previews[docId]) {
      URL.revokeObjectURL(previews[docId]);
    }
    setFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[docId];
      return newFiles;
    });
    setPreviews((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[docId];
      return newPreviews;
    });
    setStatuses((prev) => {
      const newStatuses = { ...prev };
      delete newStatuses[docId];
      return newStatuses;
    });
  };

const openPreview = (docId) => {
  const url = previews[docId];
  if (!url) return;

  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(url);

  setPreviewModal({
    name: docId,
    url: url,
    type: isImage ? "image" : "other"
  });
};

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  useEffect(() => {
  const checkStatus = async () => {
    const employeeId = localStorage.getItem("employeeId");

    if (!employeeId) return;

    try {
      const res = await axios.get(
        `${API_BASE}/api/employee/me/${employeeId}`
      );

      if (res.data.documentsCompleted) {
        window.location.href = "/employee/dashboard"; // ✅ redirect
      }
    } catch (err) {
      console.log(err);
    }
  };

  checkStatus();
}, []);

useEffect(() => {
  const fetchDocs = async () => {
    const employeeId = localStorage.getItem("employeeId");

    if (!employeeId) return;

    const res = await axios.get(
      `${API_BASE}/api/employee/me/${employeeId}`
    );

    const uploadedDocs = res.data.documents;

    const statusObj = {};
    const previewObj = {};

    uploadedDocs.forEach(doc => {
      statusObj[doc.docType] = "success";
      previewObj[doc.docType] = doc.fileUrl; // 🔥 Google Drive URL
    });

    setStatuses(statusObj);
    setPreviews(previewObj);
  };

  fetchDocs();
}, []);

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
          Please upload the following documents to complete your onboarding process. 
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
              className={`card h-100 p-4 ${dragActive === doc.id ? 'drag-over' : ''}`}
              onDragOver={(e) => { 
                e.preventDefault(); 

              }}
              onDragLeave={() => setDragActive(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(null);
                if (!files[doc.id]) {
                  handleFileChange(doc.id, e.dataTransfer.files?.[0]);
                }
              }}
            >
              <div className="d-flex align-items-start justify-content-between mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="icon-box">
                    {doc.icon}
                  </div>
                  <div>
                <div className="d-flex align-items-center gap-2">
  <h5 className="h6 fw-bold m-0">{doc.label}</h5>

<span
  className={`badge rounded-pill ${
    doc.required ? "bg-danger-subtle text-danger" : "bg-light text-secondary"
  }`}
  style={{ fontSize: "10px" }}
>
  {doc.required ? "Required" : "Optional"}
</span>
</div>
                    
                    <small className="text-uppercase fw-bold text-muted" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
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

            {doc.type === "file" ? (

  // ================= FILE =================
  !files[doc.id] ? (
    <div 
      className={`upload-zone ${dragActive === doc.id ? 'active' : ''}`}
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
        accept="image/*,.doc,.docx"
        onChange={(e) => handleFileChange(doc.id, e.target.files?.[0])}
      />
    </div>
  ) : (
    <div className="mt-2">
      <div className="d-flex justify-content-between p-3 bg-light rounded border mb-3">
        <span className="small">{files[doc.id]?.name}</span>

        <button onClick={() => removeFile(doc.id)} className="btn btn-sm btn-light">
          <X size={14} />
        </button>
      </div>

      <button
        onClick={() => handleUpload(doc.id)}
        className="btn btn-primary w-100"
      >
        {statuses[doc.id] === "uploading"
          ? "Uploading..."
          : statuses[doc.id] === "success"
          ? "Uploaded ✓"
          : "Upload"}
      </button>
    </div>
  )

) : (

  // ================= LINK =================
  <div className="mt-2">
    <input
      type="text"
      placeholder="Paste profile link..."
      value={links[doc.id] || ""}
      onChange={(e) =>
        setLinks((prev) => ({
          ...prev,
          [doc.id]: e.target.value
        }))
      }
      className="form-control"
    />

    {links[doc.id] && (
      <p className="text-success small mt-2">
        Link added ✓
      </p>
    )}
  </div>

)}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {/* Preview Modal */}
<AnimatePresence>
  {previewModal && (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="modal-dialog modal-lg modal-dialog-centered"
      >
        <div
          className="modal-content border-0 shadow-lg"
          style={{ borderRadius: "1.5rem" }}
        >
          {/* HEADER */}
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              {previewModal.name}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setPreviewModal(null)}
            ></button>
          </div>

          {/* BODY */}
          <div className="modal-body p-4 text-center">
            
            {/* ✅ IMAGE PREVIEW */}
            {previewModal.type === "image" ? (
              <img
                src={previewModal.url}
                className="img-fluid rounded"
                style={{ maxHeight: "70vh", objectFit: "contain" }}
              />
            ) : (
              <>
                {/* ❌ DOC preview not possible directly */}
                <p className="text-muted mb-3">
                  Preview not available for this file type
                </p>

                {/* ✅ DOWNLOAD BUTTON */}
                <a
                  href={previewModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  ⬇ Download File
                </a>
              </>
            )}

          </div>

          {/* FOOTER */}
          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-light rounded-pill px-4"
              onClick={() => setPreviewModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
<div className="text-center mt-4">

  <button
    disabled={!isAllRequiredUploaded()}
    onClick={async () => {
      await axios.put(`${API_BASE}/api/employee/complete-documents`, {
       employeeId: localStorage.getItem("employeeId")
      });

      alert("Documents Submitted ✅");

      window.location.href = "/employee/dashboard";
    }}
    className="btn btn-success px-4 py-2"
    style={{
      opacity: isAllRequiredUploaded() ? 1 : 0.5,
      cursor: isAllRequiredUploaded() ? "pointer" : "not-allowed"
    }}
  >
    Submit Documents
  </button>

  {!isAllRequiredUploaded() && (
    <p className="text-dark mt-2 small">
      Upload all required documents first
    </p>
  )}

</div>
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
