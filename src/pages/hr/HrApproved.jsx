import { useEffect, useState } from "react";

export default function HrApproved() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [files, setFiles] = useState({});
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // ✅ FETCH APPROVED EMPLOYEES
  useEffect(() => {
    fetch(`${API_BASE}/api/hr/approved`)
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.log(err));
  }, []);

  // ✅ HANDLE FILE CHANGE
  const handleFileChange = (label, file) => {
    setFiles(prev => ({
      ...prev,
      [label]: file
    }));
  };

  // ✅ SAVE DOCUMENTS
  const handleUpload = async () => {
    if (!selected) return;

    try {
      for (let key in files) {
        const formData = new FormData();
        formData.append("file", files[key]);
        formData.append("employeeId", selected._id);
        formData.append("docType", key);

        await fetch(`${API_BASE}/api/employee/upload-doc`, {
          method: "POST",
          body: formData
        });
      }

      alert("Documents Uploaded ✅");

      setSelected(null);
      setFiles({});

    } catch (err) {
      console.log(err);
      alert("Upload failed ❌");
    }
  };

  return (
    <div className="container-fluid p-3">
      <h4 className="fw-bold text-success mb-4">Approved Employees</h4>

      {/* TABLE */}
      <div className="card shadow-sm">
        <div className="card-body table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted">
                    No approved employees
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp._id}>
                    <td>{emp.employeeId}</td>
                    <td>{emp.name}</td>
                    <td>{emp.department}</td>
                    <td>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => setSelected(emp)}
                      >
                        Upload Docs
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* MODAL */}
      {selected && (
        <div className="modal d-block" style={{ background: "#00000080" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content p-3">

              <h5>Upload Documents - {selected.name}</h5>

              {/* Upload Fields */}
              <div className="row">
                <UploadField label="Offer Letter" onChange={handleFileChange} />
                <UploadField label="Appointment Letter" onChange={handleFileChange} />
                <UploadField label="NDA Agreement" onChange={handleFileChange} />
                <UploadField label="Salary Structure" onChange={handleFileChange} />
                <UploadField label="Promotion Letter" onChange={handleFileChange} />
              </div>

              {/* ACTION */}
              <div className="mt-3">
                <button className="btn btn-success me-2" onClick={handleUpload}>
                  Save
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}

/* Upload Field Component */
function UploadField({ label, onChange }) {
  return (
    <div className="col-md-6 mb-3">
      <label className="form-label">{label}</label>
      <input
        type="file"
        className="form-control"
        onChange={(e) => onChange(label, e.target.files[0])}
      />
    </div>
  );
}