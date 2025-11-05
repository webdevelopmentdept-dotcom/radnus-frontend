import React, { useState } from "react";

function Login() {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        role === "admin"
          ? `${API_BASE}/api/admin/login`
          : `${API_BASE}/api/hr/login`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.msg || "Invalid credentials");
        setLoading(false);
        return;
      }

      setLoggedIn(true);

      if (role === "admin") await fetchAdminApplicants();
      if (role === "hr") await fetchHRApplicants();
    } catch (err) {
      console.error(err);
      setError("Server error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminApplicants = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/applicants`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || "Failed to fetch applicants");
        return;
      }
      setApplicants(data.applicants || []);
    } catch (err) {
      console.error(err);
      setError("Error loading admin applicants");
    }
  };

  const fetchHRApplicants = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/hr/applications`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || "Failed to fetch job applicants");
        return;
      }
      setApplicants(data.applications || []);
    } catch (err) {
      console.error(err);
      setError("Error loading HR applicants");
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setRole("");
    setApplicants([]);
    setEmail("");
    setPassword("");
    setError("");
    setSearch("");
  };

  const filteredApplicants = applicants.filter((a) => {
    const s = search.toLowerCase();
    return (
      a.name?.toLowerCase().includes(s) ||
      a.email?.toLowerCase().includes(s) ||
      a.phone?.toLowerCase().includes(s) ||
      a.jobTitle?.toLowerCase().includes(s)
    );
  });

  const getResumeLink = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div className="login-wrapper">
      <div
        className="login-card shadow-lg"
        style={{
          width: loggedIn ? "100%" : "400px",
          maxWidth: loggedIn ? "1000px" : "420px",
        }}
      >
        {!role ? (
          <>
            <h3 className="text-center text-danger fw-bold mb-4">
              Choose Role
            </h3>
            <div className="d-flex justify-content-around">
              <button
                className="btn btn-outline-danger"
                onClick={() => handleRoleSelect("admin")}
              >
                Admin
              </button>
              <button
                className="btn btn-outline-primary"
                onClick={() => handleRoleSelect("hr")}
              >
                HR
              </button>
            </div>
          </>
        ) : !loggedIn ? (
          <>
            <h3
              className={`text-center fw-bold ${
                role === "admin" ? "text-danger" : "text-primary"
              }`}
            >
              {role === "admin" ? "Admin Login" : "HR Login"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-danger small text-center fw-bold">{error}</p>
              )}

              <div className="text-center">
                <button
                  type="submit"
                  className={`btn ${
                    role === "admin" ? "btn-danger" : "btn-primary"
                  } w-100`}
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>

              <p
                className="text-center mt-3 text-secondary"
                onClick={() => setRole("")}
                style={{ cursor: "pointer", fontSize: "0.9rem" }}
              >
                ← Back to role selection
              </p>
            </form>
          </>
        ) : (
          <>
            <h4
              className={`text-center mb-3 fw-bold ${
                role === "admin" ? "text-danger" : "text-primary"
              }`}
            >
              {role === "admin" ? "Training Applicants" : "HR Job Applications"}
            </h4>

            {error && (
              <p className="text-danger text-center small fw-bold">{error}</p>
            )}

            {applicants.length === 0 ? (
              <p className="text-center text-muted">No records found.</p>
            ) : (
              <>
                <input
                  type="text"
                  className="form-control mb-3"
                  placeholder="Search by name, email, or job title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <div className="table-container">
                  <table className="table table-striped table-bordered text-center align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>No</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Address</th>
                        {role === "admin" ? (
                          <th>Course</th>
                        ) : (
                          <>
                            <th>Job Title</th>
                            <th>Resume</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplicants.map((a, index) => (
                        <tr key={a._id || index}>
                          <td>{index + 1}</td>
                          <td>{a.name}</td>
                          <td>{a.email}</td>
                          <td>{a.phone}</td>
                          <td>{a.address || a.location}</td>
                          {role === "admin" ? (
                            <td>{a.course}</td>
                          ) : (
                            <>
                              <td>{a.jobTitle}</td>
                              <td>
                                {a.resumeUrl ? (
                                  <div className="d-flex gap-2 justify-content-center">
                                    <a
                                      href={getResumeLink(a.resumeUrl)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-primary"
                                    >
                                      View
                                    </a>
                                    <a
                                      href={getResumeLink(a.resumeUrl)}
                                      download
                                      className="text-success"
                                    >
                                      Download
                                    </a>
                                  </div>
                                ) : (
                                  "No file"
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="text-center mt-3">
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
