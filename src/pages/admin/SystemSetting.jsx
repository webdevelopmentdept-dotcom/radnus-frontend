import React, { useState, useEffect } from "react";

export default function SystemSettings() {
  const [admin, setAdmin] = useState({
    name: "",
    email: "",
    role: "Administrator",
  });

  useEffect(() => {
    // Sample data (later you can fetch from backend)
    setAdmin({
      name: "Sundar",
      email: "sundar12134@gmail.com",
      role: "Admin",
    });
  }, []);

 return (
  <div className="container mt-4 pb-5">

    {/* PAGE HEADER — SAME STYLE AS OTHER PAGES */}
    <div className="d-flex align-items-center mb-4">
      <img
        src="https://img.icons8.com/color/48/settings--v1.png"
        alt="icon"
        style={{ width: "38px", marginRight: "12px" }}
      />

      <h2 className="fw-bold text-primary m-0">System Admin Settings</h2>
    </div>

    {/* ADMIN INFO CARD */}
    <div className="card shadow-sm p-4 mb-4 rounded-4">
      <h5 className="fw-bold mb-3">Admin Information</h5>

      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">Admin Name</label>
          <input type="text" className="form-control" value={admin.name} disabled />
        </div>

        <div className="col-md-4">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" value={admin.email} disabled />
        </div>

        <div className="col-md-4">
          <label className="form-label">Role</label>
          <input type="text" className="form-control" value={admin.role} disabled />
        </div>
      </div>
    </div>

    {/* SYSTEM INFO */}
    <div className="card shadow-sm p-4 mb-4 rounded-4">
      <h5 className="fw-bold mb-3">System Information</h5>

      <p className="mb-1"><strong>Version:</strong> 1.0.0</p>
      <p className="mb-1"><strong>Last Updated:</strong> November 2025</p>
      <p className="mb-1"><strong>Server Status:</strong> Online ✔</p>
      <p className="mb-1"><strong>Database:</strong> Connected</p>
    </div>

    {/* SUPPORT */}
    <div className="card shadow-sm p-4 rounded-4">
      <h5 className="fw-bold mb-3">Support</h5>

      <p>If you face any issues, please contact your IT administrator.</p>
      <p>Email: <strong>webdevelopment@radnus.in</strong></p>
    </div>
  </div>
);

}
