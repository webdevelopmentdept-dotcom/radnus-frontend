import { useEffect, useState } from "react";

export default function HrEmployees() {
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetch(`${API_BASE}/api/hr/employees`)
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.log(err));
  }, []);

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/employee/employees/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Employee deleted successfully ✅");
        setEmployees((prev) => prev.filter((emp) => emp._id !== id));
      } else {
        alert("Failed to delete ❌");
      }
    } catch (err) {
      console.log(err);
      alert("Something went wrong ❌");
    }
  };

  // ── Relieve ───────────────────────────────────────────────────
  const handleRelieve = async (id) => {
    if (!window.confirm("Mark this employee as Relieved?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/hr/employees/${id}/relieve`, {
        method: "PATCH",
      });
      if (res.ok) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === id
              ? { ...emp, exitType: "relieved", accessDeactivated: false, status: "relieved" }
              : emp
          )
        );
      } else {
        alert("Failed to update ❌");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ── Fire ──────────────────────────────────────────────────────
  const handleFire = async (id) => {
    if (!window.confirm("Mark this employee as Fired/Terminated?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/hr/employees/${id}/fire`, {
        method: "PATCH",
      });
      if (res.ok) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === id
              ? { ...emp, exitType: "fired", accessDeactivated: false, status: "fired" }
              : emp
          )
        );
      } else {
        alert("Failed to update ❌");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ── Deactivate Access ─────────────────────────────────────────
  const handleDeactivateAccess = async () => {
    if (!selectedEmp) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/hr/employees/${selectedEmp._id}/deactivate-access`,
        { method: "PATCH" }
      );
      if (res.ok) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === selectedEmp._id
              ? { ...emp, accessDeactivated: true }
              : emp
          )
        );
        setShowDeactivateModal(false);
        setSelectedEmp(null);
        alert("Access deactivated successfully ✅");
      } else {
        alert("Failed to deactivate ❌");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ── Reactivate ────────────────────────────────────────────────
  const handleReactivate = async (id) => {
    if (!window.confirm("Reactivate this employee? They will regain full access.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/hr/employees/${id}/reactivate`, {
        method: "PATCH",
      });
      if (res.ok) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === id
              ? { ...emp, exitType: null, accessDeactivated: false, status: "active" }
              : emp
          )
        );
        alert("Employee reactivated successfully ✅");
      } else {
        alert("Failed to reactivate ❌");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // ── Status Badge ──────────────────────────────────────────────
  const getStatusBadge = (emp) => {
    if (emp.exitType === "relieved") {
      if (emp.accessDeactivated)
        return <span className="badge bg-secondary">🔒 Relieved · Access Off</span>;
      return <span className="badge bg-warning text-dark">📤 Relieved</span>;
    }
    if (emp.exitType === "fired") {
      if (emp.accessDeactivated)
        return <span className="badge bg-dark">🚫 Fired · Access Off</span>;
      return <span className="badge bg-danger">❌ Fired</span>;
    }
    if (emp.status === "active")
      return <span className="badge bg-success">✅ Active</span>;
    if (emp.status === "approved")
      return <span className="badge bg-info text-dark">👍 Approved</span>;
    if (emp.status === "rejected")
      return <span className="badge bg-danger">❌ Rejected</span>;
    if (emp.status === "pending") {
      if (emp.reuploaded)
        return <span className="badge bg-warning text-dark">🔁 Re-uploaded</span>;
      return <span className="badge bg-secondary">⏳ Pending</span>;
    }
    return <span className="badge bg-secondary">⏳ Pending</span>;
  };

  // ── Filter ────────────────────────────────────────────────────
  const filteredEmployees = employees.filter((emp) => {
    if (filter === "all") return true;
    if (filter === "active") return !emp.exitType;
    if (filter === "relieved") return emp.exitType === "relieved";
    if (filter === "fired") return emp.exitType === "fired";
    if (filter === "access-pending")
      return (emp.exitType === "relieved" || emp.exitType === "fired") &&
        !emp.accessDeactivated;
    return true;
  });

  const pendingAccessCount = employees.filter(
    (e) => (e.exitType === "relieved" || e.exitType === "fired") && !e.accessDeactivated
  ).length;

  return (
    <div className="container-fluid p-3">
      <h4 className="fw-bold mb-3">Employee List</h4>

      {/* Warning banner */}
      {pendingAccessCount > 0 && (
        <div
          className="alert alert-warning d-flex align-items-center gap-2 mb-3"
          role="alert"
        >
          <span>⚠️</span>
          <span>
            <strong>{pendingAccessCount} employee(s)</strong> have been relieved/fired
            but their account access is still active.{" "}
            <button
              className="btn btn-sm btn-warning ms-2"
              onClick={() => setFilter("access-pending")}
            >
              View now
            </button>
          </span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {[
          { key: "all",            label: "All Employees" },
          { key: "active",         label: "Active" },
          { key: "relieved",       label: "Relieved" },
          { key: "fired",          label: "Fired / Terminated" },
          { key: "access-pending", label: `⚠️ Access Pending (${pendingAccessCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`btn btn-sm ${filter === tab.key ? "btn-dark" : "btn-outline-secondary"}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted">
                    No employees found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp._id}>
                    <td>{emp.employeeId}</td>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.department}</td>
                    <td>{getStatusBadge(emp)}</td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">

                        {/* Active employees — Relieve / Fire */}
                        {!emp.exitType && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => handleRelieve(emp._id)}
                            >
                              Relieve
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleFire(emp._id)}
                            >
                              Fire
                            </button>
                          </>
                        )}

                        {/* Relieved/Fired — Deactivate Access (if not yet deactivated) */}
                        {(emp.exitType === "relieved" || emp.exitType === "fired") &&
                          !emp.accessDeactivated && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                setSelectedEmp(emp);
                                setShowDeactivateModal(true);
                              }}
                            >
                              🔒 Deactivate Access
                            </button>
                          )}

                        {/* Access already off label */}
                        {emp.accessDeactivated && (
                          <span className="text-muted small">✔ Access removed</span>
                        )}

                        {/* ✅ Reactivate — for any relieved/fired employee */}
                        {emp.exitType && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleReactivate(emp._id)}
                          >
                            ♻️ Reactivate
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(emp._id)}
                        >
                          Delete
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deactivate Access Confirmation Modal */}
      {showDeactivateModal && selectedEmp && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">🔒 Deactivate Account Access</h5>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setSelectedEmp(null);
                  }}
                />
              </div>
              <div className="modal-body">
                <p>You are about to deactivate all system access for:</p>
                <ul>
                  <li>
                    <strong>{selectedEmp.name}</strong> ({selectedEmp.employeeId})
                  </li>
                  <li>Department: {selectedEmp.department}</li>
                  <li>
                    Exit type:{" "}
                    <span className="badge bg-warning text-dark">
                      {selectedEmp.exitType}
                    </span>
                  </li>
                </ul>
                <p className="text-danger mt-2">
                  ⚠️ This will prevent the employee from logging into any company system.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setSelectedEmp(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeactivateAccess}
                >
                  Yes, Deactivate Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}