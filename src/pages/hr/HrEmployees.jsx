import { useEffect, useState } from "react";

export default function HrEmployees() {
  const [employees, setEmployees] = useState([]);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const handleDelete = async (id) => {

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this employee?"
  );

  if (!confirmDelete) return;

  try {
    const res = await fetch(
      `${API_BASE}/api/employee/employees/${id}`,
      {
        method: "DELETE",
      }
    );

    if (res.ok) {
      alert("Employee deleted successfully ✅");

      // ✅ remove from UI instantly
      setEmployees((prev) => prev.filter((emp) => emp._id !== id));
    } else {
      alert("Failed to delete ❌");
    }
  } catch (err) {
    console.log(err);
    alert("Something went wrong ❌");
  }
};

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
                <th>Action</th>
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

                    <td>
  <button
    className="btn btn-sm btn-danger"
    onClick={() => handleDelete(emp._id)}
  >
    Delete
  </button>
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