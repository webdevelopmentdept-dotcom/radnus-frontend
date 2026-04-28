import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const getStrength = (pw) => {
  let s = 0;
  if (pw.length >= 6)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

export default function ResetPassword() {
  const { token }    = useParams();
  const navigate     = useNavigate();

  const [newPassword, setNewPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw]                 = useState(false);
  const [status, setStatus]                 = useState("idle"); // idle | loading | success | error
  const [message, setMessage]               = useState("");

  const strength     = getStrength(newPassword);
  const strengthColor =
    strength <= 1 ? "#ef4444" :
    strength === 2 ? "#f59e0b" :
    strength === 3 ? "#3b82f6" : "#10b981";
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      await axios.post(`${API_BASE}/api/employee/reset-password`, { token, newPassword });
      setStatus("success");
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (msg === "TOKEN_INVALID_OR_EXPIRED") {
        setMessage("This reset link has expired or is invalid. Please request a new one.");
      } else {
        setMessage("Something went wrong. Please try again.");
      }
      setStatus("error");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: #1e40af !important; }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={styles.card}
      >
        <div style={styles.iconWrap}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>

        <h2 style={styles.title}>Set New Password</h2>
        <p style={styles.subtitle}>Choose a strong password for your HR Portal account.</p>

        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={styles.successBox}
            >
              <span style={{ fontSize: 36 }}>✅</span>
              <p style={{ margin: "10px 0 4px", color: "#065f46", fontWeight: 700, fontSize: 16 }}>
                Password Reset Successful!
              </p>
              <p style={{ margin: 0, color: "#065f46", fontSize: 13 }}>
                You can now login with your new password.
              </p>
              <button
                onClick={() => navigate("/employee/login")}
                style={{ ...styles.btn, marginTop: 16 }}
              >
                Go to Login →
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.form}
            >
              {/* New Password */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 chars, 1 uppercase, 1 number"
                    required
                    style={styles.input}
                  />
                  <span
                    onClick={() => setShowPw(!showPw)}
                    style={styles.eyeBtn}
                    title="Toggle visibility"
                  >
                    {showPw ? "🙈" : "👁️"}
                  </span>
                </div>

                {/* Strength bar */}
                {newPassword && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "#6b7280" }}>Password Strength</span>
                      <span style={{ color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
                    </div>
                    <div style={styles.strengthBg}>
                      <div
                        style={{
                          ...styles.strengthFill,
                          width: `${(strength / 4) * 100}%`,
                          background: strengthColor,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  style={{
                    ...styles.input,
                    borderColor:
                      confirmPassword && confirmPassword !== newPassword
                        ? "#ef4444"
                        : confirmPassword && confirmPassword === newPassword
                        ? "#10b981"
                        : "#d1d5db",
                  }}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && confirmPassword === newPassword && (
                  <p style={{ color: "#10b981", fontSize: 12, margin: "4px 0 0" }}>
                    ✓ Passwords match
                  </p>
                )}
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
                disabled={status === "loading" || !newPassword || !confirmPassword}
                style={{
                  ...styles.btn,
                  opacity: status === "loading" || !newPassword || !confirmPassword ? 0.7 : 1,
                  cursor: status === "loading" || !newPassword || !confirmPassword ? "not-allowed" : "pointer",
                }}
              >
                {status === "loading" ? (
                  <span style={styles.spinner} />
                ) : (
                  "Reset Password"
                )}
              </button>

              <a href="/employee/forgot-password" style={styles.backLink}>
                ← Request new link
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
    right: -100,
    pointerEvents: "none",
  },
  blob2: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: "50%",
    background: "radial-gradient(circle, #d9f99d 0%, transparent 70%)",
    bottom: -80,
    left: -80,
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
    padding: "11px 40px 11px 14px",
    border: "1.5px solid #d1d5db",
    borderRadius: 10,
    fontSize: 14,
    color: "#111827",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    fontSize: 18,
    userSelect: "none",
  },
  strengthBg: {
    height: 6,
    background: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.3s, background 0.3s",
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
    cursor: "pointer",
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
    padding: "28px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
};