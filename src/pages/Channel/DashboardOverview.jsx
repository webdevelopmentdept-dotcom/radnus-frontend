/* ---------- Dashboard Overview (Admin + Partner Compatible) ---------- */

import { useOutletContext } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { FiUsers, FiThumbsUp, FiClock, FiBook } from "react-icons/fi";

export default function DashboardOverview() {
  const { darkMode } = useOutletContext();

  // COLORS
  const text = darkMode ? "#F3F4F6" : "#1f2358";
  const metaColor = darkMode ? "#b0b4c4" : "#6f6b99";

  // AUTH INFO
  const role = localStorage.getItem("role"); // "admin" | "partner"
  const partnerId = localStorage.getItem("partnerId");

  // STATES
  const [totalLeads, setTotalLeads] = useState(0);
  const [approvedLeads, setApprovedLeads] = useState(0);
  const [pendingLeads, setPendingLeads] = useState(0);
  const [rejectedLeads, setRejectedLeads] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);

  // NOTIFICATIONS
  const [updates, setUpdates] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  const API = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ================= LOAD DATA =================
  const loadDashboardData = async () => {
    try {
      /* -------- LEADS (ADMIN vs PARTNER) -------- */
      const leadUrl =
        role === "admin"
          ? `${API}/api/lead`
          : `${API}/api/lead/partner/${partnerId}`;

      const leadRes = await fetch(leadUrl);
      const leadData = await leadRes.json();

      if (leadData.success) {
        const leads = leadData.leads || [];

        setTotalLeads(leads.length);

        setApprovedLeads(
          leads.filter((l) =>
            ["APPROVED", "Approve", "CONVERTED"].includes(l.status)
          ).length
        );

        setPendingLeads(
          leads.filter((l) =>
            ["PENDING", "Pending"].includes(l.status)
          ).length
        );

        setRejectedLeads(
          leads.filter((l) =>
            ["REJECTED", "Reject"].includes(l.status)
          ).length
        );
      }

      /* -------- COURSES -------- */
      const courseRes = await fetch(`${API}/api/courses`);
      const courseData = await courseRes.json();
      setTotalCourses(courseData?.courses?.length || 0);

      /* -------- UPDATES / NOTIFICATIONS -------- */
      const updateRes = await fetch(`${API}/api/updates`);
      const updateData = await updateRes.json();

      if (updateData.success) {
        const allUpdates = updateData.updates.reverse();
        setUpdates(allUpdates);

        const savedRead =
          Number(localStorage.getItem(`readUpdates_${role}_${partnerId}`)) || 0;

        const newUnread = allUpdates.length - savedRead;
        setUnreadCount(newUnread > 0 ? newUnread : 0);
      }
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    }
  };

  const handleOpenNotif = () => {
    setShowNotif(!showNotif);
    localStorage.setItem(
      `readUpdates_${role}_${partnerId}`,
      updates.length
    );
    setUnreadCount(0);
  };

  // STATS
  const stats = [
    { label: "Total Leads", value: totalLeads, icon: <FiUsers size={26} /> },
    { label: "Approved Leads", value: approvedLeads, icon: <FiThumbsUp size={26} /> },
    { label: "Pending Leads", value: pendingLeads, icon: <FiClock size={26} /> },
    { label: "Total Courses", value: totalCourses, icon: <FiBook size={26} /> },
  ];

  // ================= UI =================
  return (
    <div style={{ padding: "12px", position: "relative" }}>
      {/* NOTIFICATION ICON */}
      <div style={{ position: "absolute", top: 25, right: 25 }} ref={notifRef}>
        <div
          onClick={handleOpenNotif}
          style={{
            background: darkMode ? "#2e2e2e" : "#ffffff",
            padding: "10px",
            borderRadius: "50%",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
            position: "relative",
            fontSize: "20px",
          }}
        >
          🔔
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -1,
                right: -1,
                background: "#ff3b7d",
                color: "#fff",
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "50%",
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        {showNotif && (
          <div
            style={{
              position: "absolute",
              top: 60,
              right: 0,
              width: "270px",
              background: darkMode ? "#1f1f1f" : "#ffffffee",
              borderRadius: "14px",
              padding: "16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              backdropFilter: "blur(14px)",
              zIndex: 100,
            }}
          >
            <h4 style={{ marginBottom: "12px", color: text }}>Notifications</h4>

            {updates.length === 0 ? (
              <p style={{ color: metaColor }}>No updates</p>
            ) : (
              updates.slice(0, 5).map((u, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px",
                    background: darkMode ? "#2b2b2b" : "#f3e8ff",
                    borderRadius: "12px",
                    marginBottom: "10px",
                  }}
                >
                  <p style={{ margin: 0, color: text }}>{u.message}</p>
                  <small style={{ color: metaColor }}>
                    {new Date(u.createdAt).toLocaleString()}
                  </small>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* HEADER */}
      <div
        style={{
          padding: "32px",
          borderRadius: "22px",
          background: darkMode
            ? "linear-gradient(135deg, #242424, #111)"
            : "linear-gradient(135deg, #C084FC, #A855F7, #7C3AED)",
          color: "#fff",
          marginBottom: "25px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "30px" }}>Dashboard Overview</h1>
        <p style={{ marginTop: "6px", opacity: 0.9 }}>
          Welcome back! Here is your performance summary.
        </p>
      </div>

      {/* STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "18px",
        }}
      >
        {stats.map((stat, i) => (
          <div
            key={i}
            style={{
              background: darkMode
                ? "rgba(50,50,50,0.55)"
                : "linear-gradient(135deg, #f4e7ff, #efd9ff)",
              padding: "20px",
              borderRadius: "16px",
            }}
          >
            <h2 style={{ margin: 0, color: text }}>{stat.value}</h2>
            <p style={{ margin: 0, color: metaColor }}>{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
