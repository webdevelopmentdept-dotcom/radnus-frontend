import { useEffect, useState } from "react";

export default function HrPending() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [remark, setRemark] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // 🔥 FETCH DATA
  useEffect(() => {
    fetch(`${API_BASE}/api/hr/pending`)
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.log(err));
  }, []);

  // 🔥 FILE URL FIX
  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http")) return fileUrl;
    return `${API_BASE}/uploads/${fileUrl}`;
  };

  // 🔥 SAFE PDF CHECK
  const isPDF = (url) => url?.toLowerCase().endsWith(".pdf");

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

    // refresh list
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

    // refresh list
    setEmployees(prev => prev.filter(emp => emp._id !== id));
  };

  // 🔥 CLOSE MODAL
  const handleClose = () => {
    setSelected(null);
    setRemark("");
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
    <th>Status</th>   {/* 🔥 NEW */}
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

      {/* 🔥 STATUS COLUMN */}
      <td>
        {emp.reuploaded ? (
          <span className="badge bg-warning text-dark">
            🔁 Re-uploaded
          </span>
        ) : (
          <span className="badge bg-secondary">
            New
          </span>
        )}
      </td>

      {/* ACTION */}
      <td>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setSelected(emp)}
        >
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

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center">
              <h5>Employee Details</h5>
              <button className="btn btn-sm btn-light" onClick={handleClose}>✕</button>
            </div>

            {/* INFO */}
            <div className="mt-3">
              <p><b>Name:</b> {selected.name}</p>
              <p><b>Department:</b> {selected.department}</p>
              <p><b>Email:</b> {selected.email}</p>
              <p><b>Mobile:</b> {selected.mobile}</p>
               <p>
    <b>Created At:</b>{" "}
    {new Date(selected.createdAt).toLocaleString()}
  </p>
            </div>

            {/* DOCUMENTS */}
            <h6 className="mt-3">
              Documents ({selected.documents?.length || 0})
            </h6>

            <div className="row">
              {selected.documents?.map((doc, i) => {
                const fileUrl = getFileUrl(doc.fileUrl);

                return (
                  <div key={i} className="col-6 col-md-4 mb-3">
                    <div className="doc-card text-center">
                      <small className="text-uppercase">{doc.docType}</small>

                      <div className="mt-2">
                        {isPDF(fileUrl) ? (
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => setPreviewFile(fileUrl)}
                          >
                            View PDF
                          </button>
                        ) : (
                          <img
                            src={fileUrl}
                            alt="doc"
                            className="img-fluid rounded"
                            style={{
                              height: "100px",
                              objectFit: "cover",
                              cursor: "pointer"
                            }}
                            onClick={() => setPreviewFile(fileUrl)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* REMARK */}
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

            {/* ACTIONS */}
            <div className="mt-3 d-flex gap-2 flex-wrap">
              <button
                className="btn btn-success"
                onClick={() => handleApprove(selected._id)}
              >
                Approve
              </button>

              <button
                className="btn btn-danger"
                disabled={!remark}
                onClick={() => handleReject(selected._id)}
              >
                Reject
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleClose}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===== PREVIEW MODAL ===== */}
      {previewFile && (
        <div className="preview-modal">
          <div className="preview-box">

            <button
              className="close-btn"
              onClick={() => setPreviewFile(null)}
            >
              ✕
            </button>

          <div style={{ maxHeight: "70vh", overflowY: "auto" }}>

  {/* PDF */}
  {previewFile?.endsWith(".pdf") && (
    <>
      <iframe
        src={previewFile}
        width="100%"
        height="500px"
      />

      <div className="text-center mt-3">
        <a
          href={previewFile}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          ⬇ Download PDF
        </a>
      </div>
    </>
  )}

  {/* DOC */}
  {previewFile?.match(/\.(doc|docx)$/) && (
    <>
      <iframe
        src={`https://docs.google.com/gview?url=${encodeURIComponent(previewFile)}&embedded=true`}
        width="100%"
        height="500px"
      />

      <div className="text-center mt-3">
        <a
          href={previewFile}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          ⬇ Download File
        </a>
      </div>
    </>
  )}

  {/* IMAGE */}
  {previewFile?.match(/\.(jpg|jpeg|png)$/) && (
    <img
      src={previewFile}
      alt="preview"
      className="preview-img"
    />
  )}

  {/* FALLBACK */}
  {!previewFile?.match(/\.(pdf|doc|docx|jpg|jpeg|png)$/) && (
    <div className="text-center">
      <p>Preview not supported</p>

      <a
        href={previewFile}
        target="_blank"
        className="btn btn-primary"
      >
        ⬇ Download
      </a>
    </div>
  )}

</div>

          </div>
        </div>
      )}

      {/* ===== STYLES ===== */}
      <style>{`
        .custom-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
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

        .preview-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 3000;
        }

        .preview-box {
          position: relative;
          width: 90%;
          max-width: 900px;
          background: #fff;
          padding: 10px;
          border-radius: 10px;
        }

        .preview-img {
          width: 100%;
          max-height: 80vh;
          object-fit: contain;
        }

        .close-btn {
          position: absolute;
          top: -10px;
          right: -10px;
          background: red;
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 35px;
          height: 35px;
          font-size: 18px;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .btn { width: 100%; }
        }
      `}</style>
    </div>
  );
}