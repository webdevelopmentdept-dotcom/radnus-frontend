import React, { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [applicants, setApplicants] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || "Invalid credentials");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      setLoggedIn(true);
      await fetchApplicants(data.token);
    } catch (err) {
      console.error(err);
      setError("Server error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async (token) => {
    try {
      const res = await fetch("http://localhost:5000/api/applicants", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.msg || "Failed to fetch applicants");
        return;
      }

      setApplicants(data.applicants || []);
    } catch (err) {
      console.error(err);
      setError("Error loading applicants");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
    setApplicants([]);
    setEmail(""); // reset email field
    setPassword(""); // reset password field
    setError(""); // optional: clear any error message
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh", background: "#f8f9fa" }}
    >
      <div
        className="card p-4 shadow-lg"
        style={{
          width: loggedIn ? "90%" : "400px", // small for login, wide for table
          maxWidth: "900px",
          minHeight: loggedIn ? "auto" : "auto", // optional
        }}
      >
        {!loggedIn ? (
          <>
            <h3 className="text-center  text-danger fw-bold">Admin Login</h3>
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
                  className="btn btn-danger w-80 "
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div>
            <h4 className="text-center text-danger mb-3">Applicant Details</h4>

            {error && (
              <p className="text-danger text-center small fw-bold">{error}</p>
            )}

            {applicants.length === 0 ? (
              <p className="text-center text-muted">No applicants yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table table-striped table-bordered">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Course</th>
                      <th>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((a, index) => (
                      <tr key={a._id || index}>
                        <td>{index + 1}</td>
                        <td>{a.name}</td>
                        <td>{a.email}</td>
                        <td>{a.phone}</td>
                        <td>{a.course}</td>
                        <td>{a.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-center mt-3">
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
