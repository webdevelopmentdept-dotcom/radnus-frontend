import React, { useEffect, useState } from "react";

export default function HrApplicants() {
  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState("");
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    loadApplicants();
  }, []);

  const loadApplicants = async () => {
    const res = await fetch(`${API_BASE}/api/hr/applications`);
    const data = await res.json();
    setApplicants(data.applications || []);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this HR applicant?")) return;

    await fetch(`${API_BASE}/api/hr/applications/${id}`, { method: "DELETE" });
    setApplicants(applicants.filter((a) => a._id !== id));
  };

  const filtered = applicants.filter((a) =>
    (a.name + a.email + a.jobTitle)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-primary mb-0">
          HR Applicants
          <span className="badge bg-dark ms-2">
            {filtered.length}
          </span>
        </h4>
      </div>

      {/* Search */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <input
            className="form-control"
            placeholder="Search by name, email or job title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Applicants Table */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Candidate</th>
                <th>Email</th>
                <th>Job Role</th>
                <th>Applied Date</th>
                <th className="text-center">Resume</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    No applicants found
                  </td>
                </tr>
              )}

              {filtered.map((a, i) => (
                <tr key={a._id}>
                  <td>{i + 1}</td>

                  <td className="fw-semibold">{a.name}</td>

                  <td className="text-muted">{a.email}</td>

                  <td>
                    <span className="badge bg-primary-subtle text-primary">
                      {a.jobTitle}
                    </span>
                  </td>

                  <td className="text-muted">
                    {a.createdAt
                      ? new Date(a.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>

                  <td className="text-center">
  {a.resumeUrl ? (
    <a
      href={a.resumeUrl}
      target="_blank"
      rel="noreferrer"
      className="btn btn-outline-primary btn-sm"
    >
      View
    </a>
  ) : (
    <span className="text-muted">No File</span>
  )}
</td>


                  <td className="text-center">
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDelete(a._id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
