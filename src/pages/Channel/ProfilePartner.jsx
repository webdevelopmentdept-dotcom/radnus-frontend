import React, { useEffect, useState } from "react";

export default function PartnerProfile() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // ✅ SAFER WAY
  const partnerId =
    localStorage.getItem("partnerId") ||
    localStorage.getItem("partner_id") ||
    localStorage.getItem("id");

  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [leadCount, setLeadCount] = useState(0);

  useEffect(() => {
    if (!partnerId) {
      console.log("❌ partnerId missing in localStorage");
      setLoading(false);
      return;
    }

    loadProfile();
  }, [partnerId]);

  const loadProfile = async () => {
    try {
      /* ================= PARTNER DETAILS ================= */
      const res = await fetch(`${API_BASE}/api/partners/${partnerId}`);
      const data = await res.json();

      if (data.success && data.partner) {
        setPartner(data.partner);
      } else {
        setPartner(null);
      }

      /* ================= PARTNER LEADS (FIXED ROUTE) ================= */
      const leadRes = await fetch(
        `${API_BASE}/api/lead/partner/${partnerId}`
      );
      const leadData = await leadRes.json();

      setLeadCount(leadData?.leads?.length || 0);
    } catch (err) {
      console.log("Profile fetch error:", err);
      setPartner(null);
    }

    setLoading(false);
  };

  /* ================= UI STATES ================= */

  if (loading) {
    return (
      <h4 className="text-center mt-5 fw-bold text-secondary">
        Loading...
      </h4>
    );
  }

  if (!partner) {
    return (
      <h3 className="text-center mt-5 fw-bold text-danger">
        No Data Found
      </h3>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="container py-4" style={{ maxWidth: "900px" }}>
      <h2 className="fw-bold mb-4" style={{ color: "#6B11CB" }}>
        Partner Profile
      </h2>

      <div
        className="shadow p-4 rounded-4"
        style={{
          background: "#ffffff",
          borderLeft: "6px solid #6B11CB",
        }}
      >
        <h4 className="fw-bold mb-4 text-secondary">
          Personal Details
        </h4>

        <ProfileRow label="Name" value={partner.name} />
        <ProfileRow label="Email" value={partner.email} />
        <ProfileRow label="Phone" value={partner.phone} />
        <ProfileRow label="Address" value={partner.address || "-"} />
        <ProfileRow
          label="Joined"
          value={new Date(partner.createdAt).toLocaleDateString()}
        />
        <ProfileRow
          label="Total Leads"
          value={
            <span className="fw-bold text-primary">{leadCount}</span>
          }
        />

        <div className="row mt-3">
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

/* ================= SMALL COMPONENT ================= */
const ProfileRow = ({ label, value }) => (
  <div className="row mb-3">
    <div className="col-4 fw-bold">{label}:</div>
    <div className="col-8">{value}</div>
  </div>
);
