import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [status, setStatus]   = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setMessage("");

    try {
      await axios.post(`${API_BASE}/api/employee/forgot-password`, { email });
      setStatus("success");
      setMessage("Reset link sent! Check your inbox (and spam folder).");
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (msg === "EMAIL_NOT_FOUND") {
        setMessage("No account found with this email address.");
      } else {
        setMessage("Something went wrong. Please try again.");
      }
      setStatus("error");
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        .fp-page {
          min-height: 100vh;
          background: #f0f4ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 16px;
        }
        .fp-blob1 {
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, #bfdbfe 0%, transparent 70%);
          top: -100px; left: -100px;
          pointer-events: none;
        }
        .fp-blob2 {
          position: absolute;
          width: 350px; height: 350px;
          border-radius: 50%;
          background: radial-gradient(circle, #ddd6fe 0%, transparent 70%);
          bottom: -80px; right: -80px;
          pointer-events: none;
        }
        .fp-card {
          background: #fff;
          border-radius: 20px;
          padding: 40px 36px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 20px 60px rgba(30,64,175,0.12);
          z-index: 1;
          text-align: center;
        }
        @media (max-width: 480px) {
          .fp-card {
            padding: 28px 20px;
            border-radius: 16px;
          }
          .fp-blob1 { width: 220px; height: 220px; top: -60px; left: -60px; }
          .fp-blob2 { width: 200px; height: 200px; bottom: -50px; right: -50px; }
        }
        .fp-icon-wrap {
          width: 60px; height: 60px;
          border-radius: 50%;
          background: #eff6ff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .fp-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px;
        }
        .fp-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 28px;
          line-height: 1.6;
        }
        @media (max-width: 480px) {
          .fp-title { font-size: 20px; }
          .fp-subtitle { font-size: 13px; margin-bottom: 20px; }
        }
        .fp-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #d1d5db;
          border-radius: 10px;
          font-size: 14px;
          color: #111827;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: #fff;
        }
        .fp-input:focus {
          border-color: #1e40af;
          box-shadow: 0 0 0 3px rgba(30,64,175,0.08);
        }
        .fp-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.15s;
          cursor: pointer;
          letter-spacing: 0.2px;
        }
        .fp-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(30,64,175,0.25);
        }
        .fp-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .fp-back-link {
          font-size: 13px;
          color: #6b7280;
          text-decoration: none;
          margin-top: 4px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.2s;
        }
        .fp-back-link:hover { color: #1e40af; }
        .fp-help-section {
          margin-top: 1.75rem;
          border-top: 1px solid #e5e7eb;
          padding-top: 1.5rem;
          text-align: left;
        }
        .fp-help-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          text-decoration: none;
          transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
          overflow: hidden;
          min-width: 0;
        }
        .fp-help-link:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
          box-shadow: 0 2px 8px rgba(30,64,175,0.07);
        }
        .fp-help-link-text {
          flex: 1;
          min-width: 0;
          text-align: left;
        }
        .fp-help-link-label {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }
        .fp-help-link-value {
          font-size: 13px;
          font-weight: 500;
          color: #111827;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .fp-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top: 2px solid #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
      `}</style>

      <div className="fp-page">
        <div className="fp-blob1" />
        <div className="fp-blob2" />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fp-card"
        >
          {/* Lock Icon */}
          <div className="fp-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="#1e40af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <h2 className="fp-title">Forgot Password?</h2>
          <p className="fp-subtitle">
            Enter your registered email and we'll send you a reset link valid for 15 minutes.
          </p>

          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: 12,
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 32 }}>📬</span>
                <p style={{ margin: "8px 0 0", color: "#065f46", fontWeight: 600, fontSize: 14 }}>
                  {message}
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div style={{ textAlign: "left" }}>
                  <label style={{
                    fontSize: 13, fontWeight: 600, color: "#374151",
                    display: "block", marginBottom: 6
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="fp-input"
                  />
                </div>

                {status === "error" && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ color: "#dc2626", fontSize: 13, textAlign: "left", margin: 0 }}
                  >
                    ⚠️ {message}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading" || !email}
                  className="fp-btn"
                  style={{
                    opacity: status === "loading" || !email ? 0.7 : 1,
                    cursor: status === "loading" || !email ? "not-allowed" : "pointer",
                  }}
                >
                  {status === "loading"
                    ? <span className="fp-spinner" />
                    : "Send Reset Link"
                  }
                </button>

                <a href="/employee/login" className="fp-back-link"
                  style={{ justifyContent: "center" }}>
                  ← Back to Login
                </a>
              </motion.form>
            )}
          </AnimatePresence>

          {/* ===== Web Team Help Section ===== */}
          <div className="fp-help-section">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
              <span style={{ fontSize: 17 }}>🎧</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                Need help? Contact our Web Team
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

              <a href="mailto:webdevelopmentdept@gmail.com" className="fp-help-link">
                <span style={{ fontSize: 20, flexShrink: 0 }}>📧</span>
                <div className="fp-help-link-text">
                  <p className="fp-help-link-label">Email us</p>
                  <p className="fp-help-link-value">webdevelopmentdept@gmail.com</p>
                </div>
                <span style={{ color: "#9ca3af", fontSize: 16, flexShrink: 0 }}>→</span>
              </a>

              <a
                href="https://wa.me/91XXXXXXXXXX"
                target="_blank"
                rel="noreferrer"
                className="fp-help-link"
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>💬</span>
                <div className="fp-help-link-text">
                  <p className="fp-help-link-label">WhatsApp</p>
                  <p className="fp-help-link-value">Chat with us</p>
                </div>
                <span style={{ color: "#9ca3af", fontSize: 16, flexShrink: 0 }}>→</span>
              </a>

            </div>
          </div>
          {/* ===== End Web Team Help Section ===== */}

        </motion.div>
      </div>
    </>
  );
}