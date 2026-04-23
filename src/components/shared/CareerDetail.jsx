import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  FaMapMarkerAlt, FaBriefcase, FaMoneyBillAlt,
  FaClock, FaGlobe, FaCheckCircle, FaListUl,
} from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "axios";

const CareerDetail = () => {
  const { jobTitle } = useParams();
  const decodedTitle = decodeURIComponent(jobTitle);
  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    axios.get(`${API_BASE}/api/jobs/public`)
      .then((res) => {
        const found = (res.data.jobs || []).find((j) => j.title === decodedTitle);
        setJob(found || null);
      })
      .catch((err) => console.error(err))
      .finally(() => setJobLoading(false));
  }, [decodedTitle]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "",
    address: "", location: "", resume: null, about: "",
    aadhaarLast4: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [aadhaarError, setAadhaarError] = useState("");

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showModal]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      setFormData({ ...formData, [name]: file });
    } else {
      if (name === "aadhaarLast4") {
        // Only allow numbers, max 4 digits
        const numericVal = value.replace(/\D/g, "").slice(0, 4);
        setFormData({ ...formData, [name]: numericVal });
        if (numericVal.length > 0 && numericVal.length < 4) {
          setAadhaarError("Aadhaar last 4 digits enter pannunga");
        } else {
          setAadhaarError("");
        }
      } else {
        setFormData({ ...formData, [name]: value });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Aadhaar validation
    if (formData.aadhaarLast4.length !== 4) {
      setAadhaarError("Aadhaar last 4 digits mandatory — exactly 4 digits enter pannunga");
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("address", formData.address);
    data.append("location", formData.location);
    data.append("about", formData.about);
    data.append("resume", formData.resume);
    data.append("jobTitle", job.title);
    data.append("aadhaarLast4", formData.aadhaarLast4);

    try {
      const res = await fetch(`${API_BASE}/api/hr/apply`, { method: "POST", body: data });
      const result = await res.json();
      if (!res.ok || !result.success) {
        Swal.fire({ icon: "error", title: "Error", text: result.msg || "Failed to submit application.", confirmButtonColor: "#dc3545" });
        return;
      }
      setFormSubmitted(true);
      Swal.fire({ icon: "success", title: "Application Submitted!", text: "Thank you! Your application has been submitted successfully.", confirmButtonColor: "#198754" });
      if (typeof window.gtag === "function") {
        window.gtag("event", "conversion", {
          send_to: "AW-16969684439/jDFLCMrClbwbENer45s_",
          event_label: `Job Application Submitted - ${job.title}`,
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", title: "Server Error", text: "Something went wrong. Please try again later.", confirmButtonColor: "#dc3545" });
    }
  };

  if (jobLoading) return (
    <section style={{ padding: "80px 0", textAlign: "center" }}>
      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid #f0f0f0", borderTopColor: "#dc2626",
          animation: "spin 0.8s linear infinite"
        }} />
        <p style={{ color: "#9ca3af", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>Loading position...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );

  if (!job) return (
    <section style={{ padding: "80px 0", textAlign: "center" }}>
      <h3 style={{ color: "#ef4444", fontFamily: "'DM Sans', sans-serif" }}>Job Not Found</h3>
      <Link to="/careers" style={{ color: "#dc2626" }}>← Back to All Positions</Link>
    </section>
  );

  return (
    <>
      <Helmet>
        <title>{job.title} | Careers at Radnus Communication</title>
        <meta name="description" content={`Apply for ${job.title} at Radnus Communication, Puducherry. ${job.description?.slice(0, 120)}...`} />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      </Helmet>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .cd-hero {
          background: #0d0d0d;
          padding: 48px 0 52px;
          position: relative;
          overflow: hidden;
        }
        .cd-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 80% at 80% 50%, rgba(220,38,38,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 10% 80%, rgba(220,38,38,0.06) 0%, transparent 60%);
          pointer-events: none;
        }
        .cd-hero-inner { position: relative; z-index: 1; }

        .cd-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
          font-size: 12.5px;
          font-weight: 500;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.3px;
          margin-bottom: 28px;
          transition: color 0.15s;
        }
        .cd-back-link:hover { color: #e5e7eb; }

        .cd-type-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(220,38,38,0.12);
          border: 1px solid rgba(220,38,38,0.25);
          color: #f87171;
          border-radius: 6px;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        .cd-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(22px, 4vw, 36px);
          font-weight: 800;
          color: #ffffff;
          line-height: 1.15;
          margin-bottom: 24px;
          letter-spacing: -0.5px;
        }

        .cd-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 28px;
        }
        .cd-meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 7px 14px;
          font-size: 12.5px;
          font-family: 'DM Sans', sans-serif;
          color: #d1d5db;
          font-weight: 500;
        }

        .cd-hero-bottom {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .cd-active-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(22,163,74,0.12);
          border: 1px solid rgba(22,163,74,0.3);
          color: #4ade80;
          border-radius: 6px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
        }
        .cd-active-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.25); }
          50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0.1); }
        }
        .cd-hero-apply-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #dc2626;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.18s, transform 0.1s;
          letter-spacing: 0.2px;
        }
        .cd-hero-apply-btn:hover { background: #b91c1c; }
        .cd-hero-apply-btn:active { transform: scale(0.98); }

        /* Body */
        .cd-body { background: #f8f9fb; padding: 40px 0 72px; }

        .cd-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e9ebee;
          padding: 28px 32px;
          margin-bottom: 16px;
        }
        .cd-card:last-child { margin-bottom: 0; }

        .cd-section-label {
          display: flex;
          align-items: center;
          gap: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f1f3;
        }
        .cd-section-label-icon {
          width: 28px; height: 28px;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .cd-company-row { display: flex; gap: 20px; align-items: flex-start; }
        .cd-company-logo {
          width: 56px; height: 56px;
          border-radius: 10px;
          border: 1px solid #e9ebee;
          object-fit: contain;
          flex-shrink: 0;
          padding: 6px;
          background: #fff;
        }
        .cd-company-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 6px;
        }
        .cd-company-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px; color: #6b7280; line-height: 1.75; margin-bottom: 10px;
        }
        .cd-company-link {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px; font-weight: 600; color: #dc2626; text-decoration: none;
        }
        .cd-company-link:hover { text-decoration: underline; }

        .cd-desc-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #4b5563; line-height: 1.85;
        }
        .cd-list-item {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 13px 0;
          border-bottom: 1px solid #f3f4f6;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #374151; line-height: 1.7;
        }
        .cd-list-item:last-child { border-bottom: none; padding-bottom: 0; }
        .cd-bullet {
          width: 6px; height: 6px;
          background: #dc2626; border-radius: 50%;
          margin-top: 7px; flex-shrink: 0;
        }
        .cd-check-icon { color: #16a34a; margin-top: 2px; flex-shrink: 0; }

        /* Sidebar */
        .cd-sidebar-card {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e9ebee;
          padding: 28px 24px;
          position: sticky;
          top: 24px;
        }
        .cd-sidebar-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px; font-weight: 800; color: #111827; margin-bottom: 6px;
        }
        .cd-sidebar-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; color: #9ca3af; line-height: 1.6; margin-bottom: 22px;
        }
        .cd-apply-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; background: #dc2626; color: #fff; border: none;
          border-radius: 9px; padding: 13px 20px;
          font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          cursor: pointer; letter-spacing: 0.3px;
          transition: background 0.18s, transform 0.1s;
          margin-bottom: 10px;
        }
        .cd-apply-btn:hover { background: #b91c1c; }
        .cd-apply-btn:active { transform: scale(0.98); }
        .cd-interested-btn {
          display: flex; align-items: center; justify-content: center;
          width: 100%; background: transparent; color: #374151;
          border: 1.5px solid #e5e7eb; border-radius: 9px; padding: 11px 20px;
          font-size: 13.5px; font-weight: 600; font-family: 'DM Sans', sans-serif;
          cursor: pointer; transition: border-color 0.18s, color 0.18s;
        }
        .cd-interested-btn:hover { border-color: #dc2626; color: #dc2626; }

        .cd-sidebar-divider { height: 1px; background: #f0f1f3; margin: 20px 0; }
        .cd-sidebar-meta-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .cd-sidebar-meta-item:last-child { border-bottom: none; }
        .cd-sidebar-meta-icon { color: #9ca3af; flex-shrink: 0; }
        .cd-sidebar-meta-label {
          display: block;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 600; color: #9ca3af;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;
        }
        .cd-sidebar-meta-val {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 600; color: #111827;
        }

        /* Modal */
        .cd-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: overlayIn 0.2s ease;
        }
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

        .cd-modal {
          background: #fff;
          border-radius: 16px;
          width: 100%; max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 36px 32px 32px;
          position: relative;
          animation: modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1);
          scrollbar-width: none;
        }
        .cd-modal::-webkit-scrollbar { display: none; }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .cd-modal-close {
          position: absolute; top: 14px; right: 16px;
          background: #f3f4f6; border: none; border-radius: 50%;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 18px; color: #6b7280; line-height: 1;
          transition: background 0.15s, color 0.15s;
        }
        .cd-modal-close:hover { background: #e5e7eb; color: #111827; }

        .cd-modal-job-chip {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fff1f2; border: 1px solid #fecaca; color: #dc2626;
          border-radius: 6px; padding: 4px 10px;
          font-size: 11px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 10px;
        }
        .cd-modal-heading {
          font-family: 'Syne', sans-serif;
          font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 4px;
        }
        .cd-modal-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; color: #9ca3af; margin-bottom: 24px;
        }
        .cd-modal-divider { height: 1px; background: #f0f1f3; margin-bottom: 22px; }

        .cd-field { margin-bottom: 16px; }
        .cd-field-row-2 {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;
        }
        .cd-label {
          display: block;
          font-family: 'DM Sans', sans-serif;
          font-size: 11.5px; font-weight: 700; color: #374151;
          letter-spacing: 0.4px; text-transform: uppercase; margin-bottom: 7px;
        }
        .cd-input {
          display: block; width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #e5e7eb; border-radius: 8px;
          font-size: 14px; color: #111827; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color 0.18s, box-shadow 0.18s;
          background: #fcfcfd;
        }
        .cd-input::placeholder { color: #c4c9d4; }
        .cd-input:focus {
          border-color: #dc2626; background: #fff;
          box-shadow: 0 0 0 3px rgba(220,38,38,0.07);
        }
        .cd-input-error {
          border-color: #dc2626 !important;
          background: #fff8f8 !important;
        }
        .cd-error-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 11.5px;
          color: #dc2626;
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .cd-file-wrap {
          display: block; width: 100%;
          padding: 10px 14px;
          border: 1.5px dashed #d1d5db; border-radius: 8px;
          font-size: 13.5px; font-family: 'DM Sans', sans-serif;
          color: #6b7280; background: #fafafa; cursor: pointer; outline: none;
          transition: border-color 0.18s;
        }
        .cd-file-wrap:focus { border-color: #dc2626; }

        .cd-submit-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; background: #dc2626; color: #fff; border: none;
          border-radius: 9px; padding: 13px 20px;
          font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          cursor: pointer; letter-spacing: 0.3px;
          transition: background 0.18s, transform 0.1s; margin-top: 6px;
        }
        .cd-submit-btn:hover { background: #b91c1c; }
        .cd-submit-btn:active { transform: scale(0.99); }

        .cd-success-box {
          text-align: center; padding: 40px 20px;
          background: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0;
        }
        .cd-success-title {
          font-family: 'Syne', sans-serif;
          font-size: 17px; font-weight: 800; color: #15803d; margin: 12px 0 6px;
        }
        .cd-success-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; color: #6b7280; line-height: 1.6;
        }

        /* Aadhaar field */
        .cd-aadhaar-wrap {
          margin-bottom: 16px;
        }
        .cd-aadhaar-header {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 7px;
        }
        .cd-verify-note {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: #9ca3af;
          margin-top: 5px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .cd-hero { padding: 32px 0 36px; }
          .cd-sidebar-card { position: static; }
          .cd-company-row { flex-direction: column; gap: 14px; }
          .cd-card { padding: 20px 18px; }
          .cd-modal { padding: 28px 20px 24px; }
          .cd-field-row-2 { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* HERO */}
      <div className="cd-hero">
        <div className="container cd-hero-inner">
          <Link to="/careers" className="cd-back-link">← All Positions</Link>
          <div className="cd-type-chip">📋 {job.type}</div>
          <h1 className="cd-title">{job.title}</h1>
          <div className="cd-meta-row">
            <span className="cd-meta-pill"><FaMapMarkerAlt size={11} /> Puducherry</span>
            <span className="cd-meta-pill"><FaBriefcase size={11} /> {job.duration}</span>
            <span className="cd-meta-pill"><FaClock size={11} /> {job.experience}</span>
            <span className="cd-meta-pill"><FaMoneyBillAlt size={11} /> {job.salary || "As per industry"}</span>
          </div>
          <div className="cd-hero-bottom">
            <div className="cd-active-badge">
              <span className="cd-active-dot" />
              Actively Hiring
            </div>
            <button className="cd-hero-apply-btn" onClick={() => setShowModal(true)}>
              Apply Now →
            </button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="cd-body">
        <div className="container">
          <div className="row g-4">

            {/* LEFT */}
            <div className="col-lg-8">
              <div className="cd-card">
                <div className="cd-company-row">
                  <img
                    src="https://res.cloudinary.com/dp9jv4wyh/image/upload/v1770016578/newabout_b8iiuk.webp"
                    alt="Radnus"
                    className="cd-company-logo"
                  />
                  <div>
                    <div className="cd-company-name">Radnus Communication</div>
                    <p className="cd-company-desc">
                      A leading mobile service and training organization with over 20 years of
                      industry experience. Founded in 2003 by Sundar, Radnus has been at the
                      forefront of innovation, trust, and technical expertise in the mobile sector.
                    </p>
                    <a href="https://www.radnus.in/" target="_blank" rel="noreferrer" className="cd-company-link">
                      <FaGlobe size={11} /> radnus.in
                    </a>
                  </div>
                </div>
              </div>

              <div className="cd-card">
                <div className="cd-section-label">
                  <span className="cd-section-label-icon" style={{ background: "#fff7f0" }}>📄</span>
                  Job Description
                </div>
                <p className="cd-desc-text">{job.description}</p>
              </div>

              {job.responsibilities?.length > 0 && (
                <div className="cd-card">
                  <div className="cd-section-label">
                    <span className="cd-section-label-icon" style={{ background: "#fff1f2" }}>
                      <FaListUl size={12} color="#dc2626" />
                    </span>
                    Key Responsibilities
                  </div>
                  {job.responsibilities.map((r, i) => (
                    <div className="cd-list-item" key={i}>
                      <span className="cd-bullet" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {job.requirements?.length > 0 && (
                <div className="cd-card">
                  <div className="cd-section-label">
                    <span className="cd-section-label-icon" style={{ background: "#f0fdf4" }}>
                      <FaCheckCircle size={12} color="#16a34a" />
                    </span>
                    Requirements
                  </div>
                  {job.requirements.map((r, i) => (
                    <div className="cd-list-item" key={i}>
                      <FaCheckCircle size={13} className="cd-check-icon" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Sticky Sidebar */}
            <div className="col-lg-4">
              <div className="cd-sidebar-card">
                <div className="cd-sidebar-title">Interested in this role?</div>
                <p className="cd-sidebar-sub">Read through the description and apply when you're ready.</p>

                <button className="cd-apply-btn" onClick={() => setShowModal(true)}>
                  Apply Now →
                </button>
                <button className="cd-interested-btn" onClick={() => setShowModal(true)}>
                  🙋 I'm Interested
                </button>

                <div className="cd-sidebar-divider" />

                {[
                  { label: "Location", val: "Puducherry", icon: <FaMapMarkerAlt size={13} /> },
                  { label: "Job Type", val: job.duration, icon: <FaBriefcase size={13} /> },
                  { label: "Experience", val: job.experience, icon: <FaClock size={13} /> },
                  { label: "Salary", val: job.salary || "As per industry", icon: <FaMoneyBillAlt size={13} /> },
                ].map((item) => (
                  <div className="cd-sidebar-meta-item" key={item.label}>
                    <span className="cd-sidebar-meta-icon">{item.icon}</span>
                    <div>
                      <span className="cd-sidebar-meta-label">{item.label}</span>
                      <span className="cd-sidebar-meta-val">{item.val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="cd-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="cd-modal">
            <button className="cd-modal-close" onClick={() => setShowModal(false)}>×</button>

            {formSubmitted ? (
              <div className="cd-success-box">
                <div style={{ fontSize: 44 }}>🎉</div>
                <div className="cd-success-title">Application Submitted!</div>
                <p className="cd-success-sub">We'll review your profile and get back to you soon.</p>
              </div>
            ) : (
              <>
                <div className="cd-modal-job-chip">📋 {job.type}</div>
                <div className="cd-modal-heading">Apply for this Position</div>
                <p className="cd-modal-sub">{job.title} · Puducherry</p>
                <div className="cd-modal-divider" />

                <form onSubmit={handleSubmit}>
                  {/* Full Name */}
                  <div className="cd-field">
                    <label className="cd-label">Full Name</label>
                    <input
                      className="cd-input"
                      type="text"
                      name="name"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Email + Phone */}
                  <div className="cd-field-row-2">
                    <div>
                      <label className="cd-label">Email</label>
                      <input
                        className="cd-input"
                        type="email"
                        name="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="cd-label">Phone</label>
                      <input
                        className="cd-input"
                        type="tel"
                        name="phone"
                        placeholder="9XXXXXXXXX"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Location — now mandatory */}
                  <div className="cd-field">
                    <label className="cd-label">Current Location</label>
                    <input
                      className="cd-input"
                      type="text"
                      name="location"
                      placeholder="Enter your city"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Aadhaar Last 4 Digits */}
                  <div className="cd-aadhaar-wrap">
                    <div className="cd-aadhaar-header">
                      <label className="cd-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                        <FaCheckCircle size={11} color="#6b7280" /> Aadhaar Last 4 Digits
                      </label>
                    </div>
                    <input
                      className={`cd-input ${aadhaarError ? "cd-input-error" : ""}`}
                      type="text"
                      inputMode="numeric"
                      name="aadhaarLast4"
                      placeholder="XXXX"
                      value={formData.aadhaarLast4}
                      onChange={handleChange}
                      maxLength={4}
                      required
                      style={{ letterSpacing: "6px", fontWeight: 700, fontSize: 16 }}
                    />
                    {aadhaarError ? (
                      <p className="cd-error-text"><FaCheckCircle size={10} color="#dc2626" /> {aadhaarError}</p>
                    ) : (
                      <p className="cd-verify-note">For verification purposes only.</p>
                    )}
                  </div>

                  {/* Resume */}
                  <div className="cd-field">
                    <label className="cd-label">
                      Resume / Document{" "}
                      <span style={{ color: "#9ca3af", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                        (PDF, DOC, Image — any format)
                      </span>
                    </label>
                    <input
                      className="cd-file-wrap"
                      type="file"
                      name="resume"
                      onChange={handleChange}
                      accept="*/*"
                      required
                    />
                  </div>

                  <button type="submit" className="cd-submit-btn">
                    Submit Application →
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CareerDetail;