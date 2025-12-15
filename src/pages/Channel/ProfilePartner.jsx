import React, { useEffect, useState } from "react";

export default function PartnerProfile() {
  const partnerId = localStorage.getItem("partnerId");
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [leadCount, setLeadCount] = useState(0);

  useEffect(() => {
    if (!partnerId) {
      setLoading(false);
      return;
    }

    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/partners/${partnerId}`);
      const data = await res.json();

      if (data.success) {
        setPartner(data.partner);
      }

      // Load Lead Count
      const leadRes = await fetch(`${API_BASE}/api/lead/by-partner/${partnerId}`);
      const leadData = await leadRes.json();

      setLeadCount(leadData.length || 0);
    } catch (err) {
      console.log("Profile fetch error:", err);
    }
    setLoading(false);
  };

  if (loading)
    return (
      <h4 className="text-center mt-5 fw-bold" style={{ color: "#555" }}>
        Loading...
      </h4>
    );

  if (!partner)
    return (
      <h3 className="text-center mt-5 fw-bold text-danger">No Data Found</h3>
    );

  return (
    <div className="container py-4" style={{ maxWidth: "900px" }}>
      {/* PAGE TITLE */}
      <h2 className="fw-bold mb-4" style={{ color: "#1b8f3c" }}>
        Partner Profile
      </h2>

      {/* PROFILE CARD */}
      <div
        className="shadow p-4 rounded-4"
        style={{
          background: "white",
          borderLeft: "6px solid #1b8f3c",
        }}
      >
        <h4 className="fw-bold mb-4" style={{ color: "#1b8f3c" }}>
          Personal Details
        </h4>

        <div className="row mb-3">
          <div className="col-4 fw-bold">Name:</div>
          <div className="col-8">{partner.name}</div>
        </div>

        <div className="row mb-3">
          <div className="col-4 fw-bold">Email:</div>
          <div className="col-8">{partner.email}</div>
        </div>

        <div className="row mb-3">
          <div className="col-4 fw-bold">Phone:</div>
          <div className="col-8">{partner.phone}</div>
        </div>

        <div className="row mb-3">
          <div className="col-4 fw-bold">Address:</div>
          <div className="col-8">{partner.address}</div>
        </div>

        <div className="row mb-3">
          <div className="col-4 fw-bold">Joined:</div>
          <div className="col-8">
            {new Date(partner.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-4 fw-bold">Total Leads:</div>
          <div className="col-8 fw-bold text-primary">{leadCount}</div>
        </div>

        <div className="row mb-1">
          <div className="col-4 fw-bold">Status:</div>
          <div className="col-8">
            {partner.disabled ? (
              <span className="badge bg-danger">Disabled</span>
            ) : (
              <span className="badge bg-success">Active</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
