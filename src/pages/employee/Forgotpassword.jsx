import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [status, setStatus]   = useState("idle"); // idle | loading | success | error
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
    <div style={styles.page}>
      {/* Animated background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={styles.card}
      >
        {/* Icon */}
        <div style={styles.iconWrap}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h2 style={styles.title}>Forgot Password?</h2>
        <p style={styles.subtitle}>
          Enter your registered email and we'll send you a reset link valid for 15 minutes.
        </p>

        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={styles.successBox}
            >
              <span style={{ fontSize: 32 }}>📬</span>
              <p style={{ margin: "8px 0 0", color: "#065f46", fontWeight: 600 }}>
                {message}
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.form}
            >
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  style={styles.input}
                  onFocus={(e) => (e.target.style.borderColor = "#1e40af")}
                  onBlur={(e)  => (e.target.style.borderColor = "#d1d5db")}
                />
              </div>

              {status === "error" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={styles.errorText}
                >
                  ⚠️ {message}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={status === "loading" || !email}
                style={{
                  ...styles.btn,
                  opacity: status === "loading" || !email ? 0.7 : 1,
                  cursor: status === "loading" || !email ? "not-allowed" : "pointer",
                }}
              >
                {status === "loading" ? (
                  <span style={styles.spinner} />
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <a href="/employee/login" style={styles.backLink}>
                ← Back to Login
              </a>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f0f4ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, #bfdbfe 0%, transparent 70%)",
    top: -100,
    left: -100,
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: "50%",
    background: "radial-gradient(circle, #ddd6fe 0%, transparent 70%)",
    bottom: -80,
    right: -80,
    pointerEvents: "none",
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 20px 60px rgba(30,64,175,0.12)",
    zIndex: 1,
    textAlign: "center",
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 8px",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    margin: "0 0 28px",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  inputGroup: {
    textAlign: "left",
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    display: "block",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #d1d5db",
    borderRadius: 10,
    fontSize: 14,
    color: "#111827",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    textAlign: "left",
    margin: 0,
  },
  btn: {
    padding: "12px",
    background: "linear-gradient(135deg, #1e40af, #3b82f6)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "opacity 0.2s",
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid rgba(255,255,255,0.4)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  backLink: {
    fontSize: 13,
    color: "#6b7280",
    textDecoration: "none",
    marginTop: 4,
  },
  successBox: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: 12,
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
};