import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PartnerLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const handlePartnerLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/partners/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Invalid login");
        setLoading(false);
        return;
      }

      localStorage.setItem("partnerId", data.partnerId);
      localStorage.setItem("partnerName", data.name || "");

      navigate("/channel/dashboard");
    } catch (err) {
      setError("Server error, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <div className="card shadow p-4" style={{ width: "400px", borderRadius: "15px" }}>
        <h3 className="text-center fw-bold mb-4" style={{ color: "#1b8f3c" }}>
          Channel Partner Login
        </h3>

        <form onSubmit={handlePartnerLogin}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <p className="text-danger small text-center fw-bold">{error}</p>}

          <button
            className="w-100"
            disabled={loading}
            style={{
              backgroundColor: "#1b8f3c",
              border: "none",
              padding: "10px",
              borderRadius: "5px",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* BACK BUTTON */}
        <button
          className="btn btn-secondary mt-3"
          style={{ width: "200px", margin: "0 auto", display: "block" }}
          onClick={() => navigate("/login")}
        >
          ← Back to Role Selection
        </button>
      </div>
    </div>
  );
}
