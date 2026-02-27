import { useEffect, useState } from "react";

export default function HrEmployees() {
  const [employees, setEmployees] = useState([]);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // 🔥 FETCH ALL EMPLOYEES
  useEffect(() => {
    fetch(`${API_BASE}/api/hr/employees`)
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.log(err));
  }, []);

  return (
    <div className="container-fluid p-3">
      <h4 className="fw-bold mb-4">Employee List</h4>

      <div className="card shadow-sm">
        <div className="card-body table-responsive">

          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp._id}>
                    <td>{emp.employeeId}</td>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.department}</td>

                    {/* STATUS */}
                    <td>
                      {emp.status === "approved" && (
                        <span className="badge bg-success">Approved</span>
                      )}

                      {emp.status === "pending" && (
                        emp.reuploaded ? (
                          <span className="badge bg-warning text-dark">
                            🔁 Re-uploaded
                          </span>
                        ) : (
                          <span className="badge bg-secondary">Pending</span>
                        )
                      )}

                      {emp.status === "rejected" && (
                        <span className="badge bg-danger">Rejected</span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>

        </div>
      </div>
    </div>
  );
}