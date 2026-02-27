import { useEffect, useState } from "react";

export default function HrRejected() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;



  useEffect(() => {
    fetch(`${API_BASE}/api/hr/rejected`)
      .then(res => res.json())
      .then(data => setEmployees(data));
  }, []);

  return (
    <div className="container-fluid p-3">
      <h4 className="fw-bold mb-4 text-danger">Rejected Employees</h4>

      {/* TABLE */}
      <div className="card shadow-sm">
        <div className="card-body table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Remark</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {employees.map(emp => (
                <tr key={emp._id}>
                  <td>{emp.employeeId}</td>
                  <td>{emp.name}</td>
                  <td>{emp.department}</td>
                  <td className="text-danger">
                    {emp.remarks || "No remark"}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
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

      {/* MODAL */}
      {selected && (
        <div className="custom-modal">
          <div className="modal-box">

            <div className="d-flex justify-content-between mb-2">
              <h5>Rejected Employee</h5>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>

            <p><b>ID:</b> {selected.employeeId}</p>
            <p><b>Name:</b> {selected.name}</p>
            <p><b>Dept:</b> {selected.department}</p>

            {/* REMARK */}
            <div className="alert alert-danger mt-3">
              <b>HR Remark:</b> {selected.remarks}
            </div>

            {/* DOCUMENTS */}
            <h6 className="mt-3">Documents</h6>

            <div className="row">
              {selected.documents.map((doc, i) => (
                <div key={i} className="col-6 col-md-4 mb-3">
                  <div className="doc-card">

                    <small className="doc-title">{doc.docType}</small>

                    <div className="doc-img-box">
                      {doc.fileUrl.endsWith(".pdf") ? (
                        <a href={doc.fileUrl} target="_blank">
                          View PDF
                        </a>
                      ) : (
                        <img src={doc.fileUrl} alt="doc" />
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* STYLE */}
      <style>{`
        .custom-modal {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999;
        }

        .modal-box {
          background: #fff;
          padding: 20px;
          border-radius: 10px;
          width: 90%;
          max-width: 750px;
          max-height: 90vh;
          overflow-y: auto;
        }

        /* 🔥 FIX START */
        .doc-card {
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 10px;
          text-align: center;
          height: 150px; /* SAME HEIGHT */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .doc-title {
          font-size: 12px;
          font-weight: 600;
        }

        .doc-img-box {
          height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .doc-img-box img {
          max-height: 100%;
          max-width: 100%;
          object-fit: contain; /* 🔥 IMPORTANT */
        }
        /* 🔥 FIX END */

        @media (max-width: 768px) {
          .modal-box { width: 95%; }
        }
      `}</style>

    </div>
  );
}