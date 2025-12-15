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
    (a.name + a.email + a.jobTitle).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-3">
      <h3 className="text-center fw-bold text-primary">HR Applicants</h3>

      <input
        className="form-control mb-3"
        placeholder="Search applicants..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="table table-bordered text-center">
        <thead className="table-dark">
          <tr>
            <th>No</th>
            <th>Name</th>
            <th>Email</th>
            <th>Job Title</th>
            <th>Resume</th>
            <th>Delete</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((a, i) => (
            <tr key={a._id}>
              <td>{i + 1}</td>
              <td>{a.name}</td>
              <td>{a.email}</td>
              <td>{a.jobTitle}</td>

              <td>
                {a.resumeUrl ? (
                  <a
                    href={`${API_BASE}/${a.resumeUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary"
                  >
                    View
                  </a>
                ) : (
                  "No File"
                )}
              </td>

              <td>
                <button
                  className="btn btn-danger btn-sm"
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
  );
}
