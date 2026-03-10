import { useEffect, useState, useRef, useCallback } from "react";

export default function HrPending() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [remark, setRemark] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [previewDocType, setPreviewDocType] = useState("");
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // 🔥 FETCH DATA
  useEffect(() => {
    fetch(`${API_BASE}/api/hr/pending`)
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.log(err));
  }, []);

  // Reset zoom/pan/loading when preview file changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImgLoading(true);
    setImgError(false);
  }, [previewFile]);

  // 🔥 FILE URL FIX
  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http")) return fileUrl;
    return `${API_BASE}/uploads/${fileUrl}`;
  };

  const isPDF = (url) => url?.toLowerCase().endsWith(".pdf");
  const isImage = (url) => url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isDoc = (url) => url?.match(/\.(doc|docx)$/i);

  // Open preview with doc type label
  const openPreview = (fileUrl, docType = "") => {
    setPreviewFile(fileUrl);
    setPreviewDocType(docType);
  };

  // ✅ APPROVE
  const handleApprove = async (id) => {
    await fetch(`${API_BASE}/api/hr/approve/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remarks: remark })
    });
    alert("Approved ✅");
    setSelected(null);
    setRemark("");
    setEmployees(prev => prev.filter(emp => emp._id !== id));
  };

  // ❌ REJECT
  const handleReject = async (id) => {
    if (!remark) {
      alert("Please enter remark ❗");
      return;
    }
    await fetch(`${API_BASE}/api/hr/reject/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remarks: remark })
    });
    alert("Rejected ❌");
    setSelected(null);
    setRemark("");
    setEmployees(prev => prev.filter(emp => emp._id !== id));
  };

  const handleClose = () => {
    setSelected(null);
    setRemark("");
  };

  // =================== ZOOM CONTROLS ===================
  const ZOOM_STEP = 0.25;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 5;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));

  const handleZoomOut = () => {
    setZoom(prev => {
      const next = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    setZoom(prev => {
      const next = Math.min(Math.max(prev + delta, MIN_ZOOM), MAX_ZOOM);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // =================== PAN CONTROLS ===================
  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPan({
      x: panStart.current.x + (e.clientX - dragStart.current.x),
      y: panStart.current.y + (e.clientY - dragStart.current.y)
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleTouchStart = (e) => {
    if (zoom <= 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    panStart.current = { ...pan };
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPan({
      x: panStart.current.x + (touch.clientX - dragStart.current.x),
      y: panStart.current.y + (touch.clientY - dragStart.current.y)
    });
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  // =================== DOWNLOAD ===================
  const handleDownload = async (url, docType) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const ext = url.split(".").pop().split("?")[0];
      const filename = `${docType || "document"}_${Date.now()}.${ext}`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      // fallback: direct link download
      const link = document.createElement("a");
      link.href = url;
      link.download = docType || "document";
      link.target = "_blank";
      link.click();
    }
  };

  // =================== OPEN IN NEW TAB ===================
  const handleOpenNewTab = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="container-fluid p-3">
      <h4 className="fw-bold mb-4">Pending Approvals</h4>

      {/* ===== TABLE ===== */}
      <div className="card shadow-sm">
        <div className="card-body table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Email</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp._id} className={emp.reuploaded ? "table-warning" : ""}>
                  <td>{emp.employeeId}</td>
                  <td>{emp.name}</td>
                  <td>{emp.department}</td>
                  <td>{emp.email}</td>
                  <td>
                    {emp.reuploaded ? (
                      <span className="badge bg-warning text-dark">🔁 Re-uploaded</span>
                    ) : (
                      <span className="badge bg-secondary">New</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => setSelected(emp)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MAIN MODAL ===== */}
      {selected && (
        <div className="custom-modal">
          <div className="modal-box">

            <div className="d-flex justify-content-between align-items-center">
              <h5>Employee Details</h5>
              <button className="btn btn-sm btn-light" onClick={handleClose}>✕</button>
            </div>

            <div className="mt-3">
              <p><b>Name:</b> {selected.name}</p>
              <p><b>Department:</b> {selected.department}</p>
              <p><b>Email:</b> {selected.email}</p>
              <p><b>Mobile:</b> {selected.mobile}</p>
              <p><b>Date:</b> {new Date().toLocaleDateString()}</p>
            </div>

            <h6 className="mt-3">Documents ({selected.documents?.length || 0})</h6>

            <div className="row">
              {selected.documents?.map((doc, i) => {
                const fileUrl = getFileUrl(doc.fileUrl);
                return (
                  <div key={i} className="col-6 col-md-4 mb-3">
                    <div className="doc-card text-center">
                      <small className="text-uppercase fw-semibold">{doc.docType}</small>
                      <div className="mt-2">
                        {isPDF(fileUrl) ? (
                          <button
                            className="btn btn-outline-primary btn-sm w-100"
                            onClick={() => openPreview(fileUrl, doc.docType)}
                          >
                            📄 View PDF
                          </button>
                        ) : (
                          <img
                            src={fileUrl}
                            alt="doc"
                            className="img-fluid rounded"
                            style={{ height: "100px", objectFit: "cover", cursor: "pointer" }}
                            onClick={() => openPreview(fileUrl, doc.docType)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3">
              <label className="fw-semibold">HR Remark</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Enter remarks..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>

            <div className="mt-3 d-flex gap-2 flex-wrap">
              <button className="btn btn-success" onClick={() => handleApprove(selected._id)}>
                Approve
              </button>
              <button
                className="btn btn-danger"
                disabled={!remark}
                onClick={() => handleReject(selected._id)}
              >
                Reject
              </button>
              <button className="btn btn-secondary" onClick={handleClose}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===== PREVIEW MODAL ===== */}
      {previewFile && (
        <div
          className="preview-modal"
          onClick={(e) => {
            if (e.target.classList.contains("preview-modal")) setPreviewFile(null);
          }}
        >
          <div className="preview-box">

            {/* ── TOP BAR ── */}
            <div className="preview-topbar">
              <span className="preview-doc-label">
                {isImage(previewFile) ? "🖼️" : isPDF(previewFile) ? "📄" : "📁"}
                &nbsp;{previewDocType || "Document"}
              </span>

              <div className="preview-actions">

                {/* Download Button */}
                <button
                  className="prev-action-btn"
                  title="Download"
                  onClick={() => handleDownload(previewFile, previewDocType)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>Download</span>
                </button>

                {/* Open in New Tab Button */}
                <button
                  className="prev-action-btn"
                  title="Open in new tab"
                  onClick={() => handleOpenNewTab(previewFile)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  <span>New Tab</span>
                </button>

                {/* Close Button */}
                <button
                  className="prev-action-btn close-action-btn"
                  title="Close"
                  onClick={() => setPreviewFile(null)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  <span>Close</span>
                </button>

              </div>
            </div>

            {/* ── ZOOM CONTROLS (images only) ── */}
            {isImage(previewFile) && (
              <div className="zoom-controls">
                <button
                  className="zoom-btn"
                  onClick={handleZoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  title="Zoom Out"
                >−</button>

                <span
                  className="zoom-label"
                  onClick={handleZoomReset}
                  title="Click to reset zoom"
                >
                  {Math.round(zoom * 100)}%
                </span>

                <button
                  className="zoom-btn"
                  onClick={handleZoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  title="Zoom In"
                >+</button>

                <button
                  className="zoom-btn reset-btn"
                  onClick={handleZoomReset}
                  title="Reset Zoom"
                >↺</button>
              </div>
            )}

            {/* ── FILE CONTENT ── */}
            {isPDF(previewFile) ? (
              <iframe src={previewFile} width="100%" height="500px" title="PDF Preview" />

            ) : isDoc(previewFile) ? (
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(previewFile)}&embedded=true`}
                width="100%"
                height="500px"
                title="Doc Preview"
              />

            ) : isImage(previewFile) ? (
              <div
                className="img-zoom-container"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
              >
                {/* Loading Spinner */}
                {imgLoading && !imgError && (
                  <div className="img-loading">
                    <div className="spinner" />
                    <p>Loading image...</p>
                  </div>
                )}

                {/* Error State */}
                {imgError && (
                  <div className="img-error">
                    <p>⚠️ Failed to load image</p>
                    <button
                      className="prev-action-btn"
                      onClick={() => handleOpenNewTab(previewFile)}
                    >
                      Open in New Tab
                    </button>
                  </div>
                )}

                <img
                  src={previewFile}
                  alt="preview"
                  className="preview-img"
                  draggable={false}
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                    transformOrigin: "center center",
                    userSelect: "none",
                    display: imgError ? "none" : "block",
                    opacity: imgLoading ? 0 : 1,
                    transition: isDragging
                      ? "opacity 0.3s ease"
                      : "opacity 0.3s ease, transform 0.15s ease",
                  }}
                  onLoad={() => setImgLoading(false)}
                  onError={() => { setImgLoading(false); setImgError(true); }}
                />
              </div>

            ) : (
              <div className="text-center p-4" style={{ color: "#aaa" }}>
                <p>⚠️ Preview not supported for this file type.</p>
                <div className="d-flex gap-2 justify-content-center mt-2">
                  <button
                    className="prev-action-btn"
                    onClick={() => handleDownload(previewFile, previewDocType)}
                  >
                    ⬇️ Download
                  </button>
                  <button
                    className="prev-action-btn"
                    onClick={() => handleOpenNewTab(previewFile)}
                  >
                    🔗 Open in New Tab
                  </button>
                </div>
              </div>
            )}

            {/* ── BOTTOM HINT (images only) ── */}
            {isImage(previewFile) && !imgError && (
              <p className="zoom-hint">
                🖱 Scroll to zoom &nbsp;|&nbsp;
                {zoom > 1 ? "🖐 Drag to pan" : "🔍 Use + / − or scroll"}
                &nbsp;|&nbsp; Click % to reset
              </p>
            )}

          </div>
        </div>
      )}

      {/* ===== STYLES ===== */}
      <style>{`
        /* ---- MAIN MODAL ---- */
        .custom-modal {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .modal-box {
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          width: 90%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .doc-card {
          border: 1px solid #eee;
          padding: 10px;
          border-radius: 10px;
        }

        /* ---- PREVIEW MODAL ---- */
        .preview-modal {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.92);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 3000;
          animation: fadeInBackdrop 0.2s ease;
        }

        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .preview-box {
          position: relative;
          width: 90%;
          max-width: 920px;
          background: #1c1c1e;
          border-radius: 14px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.8);
          overflow: hidden;
          animation: slideUp 0.22s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(28px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* ---- TOP BAR ---- */
        .preview-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #2a2a2e;
          border-bottom: 1px solid #3a3a3e;
          gap: 10px;
          flex-wrap: wrap;
        }

        .preview-doc-label {
          color: #e0e0e0;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .preview-actions {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
        }

        .prev-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          background: #3a3a3e;
          color: #e0e0e0;
          border: 1px solid #505055;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          white-space: nowrap;
        }

        .prev-action-btn:hover {
          background: #505055;
          border-color: #707075;
          color: #fff;
        }

        .prev-action-btn.close-action-btn:hover {
          background: #b91c1c;
          border-color: #ef4444;
          color: #fff;
        }

        /* ---- ZOOM CONTROLS ---- */
        .zoom-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 14px;
          background: #242426;
          border-bottom: 1px solid #2e2e32;
        }

        .zoom-btn {
          background: #3a3a3e;
          color: #fff;
          border: 1px solid #505055;
          border-radius: 6px;
          width: 34px;
          height: 34px;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          flex-shrink: 0;
        }

        .zoom-btn:hover:not(:disabled) {
          background: #555;
        }

        .zoom-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .zoom-btn.reset-btn {
          font-size: 15px;
          background: #444;
        }

        .zoom-label {
          color: #ccc;
          font-size: 13px;
          font-weight: 600;
          min-width: 54px;
          text-align: center;
          cursor: pointer;
          user-select: none;
          padding: 4px 10px;
          border-radius: 6px;
          background: #2a2a2a;
          border: 1px solid #444;
          transition: background 0.15s;
        }

        .zoom-label:hover {
          background: #3a3a3a;
          color: #fff;
        }

        /* ---- IMAGE ZOOM CONTAINER ---- */
        .img-zoom-container {
          width: 100%;
          height: 68vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #111;
          position: relative;
        }

        .preview-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
          pointer-events: none;
        }

        /* ---- IMAGE LOADING / ERROR STATES ---- */
        .img-loading,
        .img-error {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #888;
          font-size: 13px;
        }

        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #333;
          border-top-color: #aaa;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ---- BOTTOM HINT ---- */
        .zoom-hint {
          text-align: center;
          color: #555;
          font-size: 11px;
          margin: 0;
          padding: 7px 0;
          background: #161618;
          border-top: 1px solid #2a2a2e;
          letter-spacing: 0.2px;
        }

        /* ---- RESPONSIVE ---- */
        @media (max-width: 768px) {
          .btn { width: 100%; }
          .img-zoom-container { height: 52vw; min-height: 220px; }
          .prev-action-btn span { display: none; }
          .prev-action-btn { padding: 6px 10px; }
        }
      `}</style>
    </div>
  );
}