/* ---------- Dashboard Overview (Improved Colors + UI) ---------- */

import { useOutletContext } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { FiUsers, FiThumbsUp, FiClock, FiBook } from "react-icons/fi";

export default function DashboardOverview() {
  const { darkMode } = useOutletContext();

  // NEW PREMIUM COLORS
  const text = darkMode ? "#F3F4F6" : "#1f2358";
  const metaColor = darkMode ? "#b0b4c4" : "#6f6b99";

 const partnerId = localStorage.getItem("partnerId");


  const [totalLeads, setTotalLeads] = useState(0);
  const [approvedLeads, setApprovedLeads] = useState(0);
  const [pendingLeads, setPendingLeads] = useState(0);
  const [rejectedLeads, setRejectedLeads] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);

  // NOTIFICATION
  const [updates, setUpdates] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

  const notifRef = useRef(null);

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

 const API = import.meta.env.VITE_API_URL;

const loadDashboardData = async () => {
  try {
    const leadRes = await fetch(
      `${API}/api/lead/partner/${partnerId}`
    );
    const leadData = await leadRes.json();

    if (leadData.success) {
      const leads = leadData.leads;
      setTotalLeads(leads.length);

      setApprovedLeads(
        leads.filter(l =>
          ["APPROVED", "Approve", "CONVERTED"].includes(l.status)
        ).length
      );

      setPendingLeads(
        leads.filter(l =>
          ["PENDING", "Pending"].includes(l.status)
        ).length
      );

      setRejectedLeads(
        leads.filter(l =>
          ["REJECTED", "Reject"].includes(l.status)
        ).length
      );
    }

    const courseRes = await fetch(`${API}/api/courses`);
    const courseData = await courseRes.json();
    setTotalCourses(courseData?.courses?.length || 0);

    const updateRes = await fetch(`${API}/api/updates`);
    const updateData = await updateRes.json();

    if (updateData.success) {
      setUpdates(updateData.updates.reverse());

      const savedRead =
        Number(localStorage.getItem(`readUpdates_${partnerId}`)) || 0;

      const newUnread = updateData.updates.length - savedRead;
      setUnreadCount(newUnread > 0 ? newUnread : 0);
    }
  } catch (err) {
    console.log("Dashboard Load Error:", err);
  }
};


  const handleOpenNotif = () => {
    setShowNotif(!showNotif);
    localStorage.getItem(`readUpdates_${partnerId}`, updates.length);
    setUnreadCount(0);
  };

  const stats = [
    { label: "Total Leads", value: totalLeads, icon: <FiUsers size={26} /> },
    { label: "Approved Leads", value: approvedLeads, icon: <FiThumbsUp size={26} /> },
    { label: "Pending Leads", value: pendingLeads, icon: <FiClock size={26} /> },
    { label: "Total Courses", value: totalCourses, icon: <FiBook size={26} /> },
  ];

  return (
    <div style={{ padding: "12px", position: "relative" }}>

      {/* Notification Icon */}
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
                boxShadow: "0 2px 6px rgba(255,0,120,0.5)",
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        {/* Dropdown */}
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
            <h4 style={{ margin: 0, marginBottom: "12px", color: text }}>Notifications</h4>

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
                    border: "1px solid rgba(150,100,255,0.2)",
                  }}
                >
                  <p style={{ margin: 0, color: text }}>{u.message}</p>
                  <small style={{ color: metaColor }}>
                    {new Date(u.createdAt).toLocaleDateString()} •{" "}
                    {new Date(u.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Header */}
      <div
        style={{
          padding: "32px",
          borderRadius: "22px",
          background: darkMode
            ? "linear-gradient(135deg, #242424, #111)"
            : "linear-gradient(135deg, #C084FC, #A855F7, #7C3AED)",
          color: "#fff",
          marginBottom: "25px",
          boxShadow: "0 12px 28px rgba(120,60,200,0.25)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "30px" }}>Dashboard Overview</h1>
        <p style={{ marginTop: "6px", opacity: 0.9 }}>
          Welcome back! Here is your performance summary.
        </p>
      </div>

      {/* Stats Cards */}
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
              boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
              border: darkMode
                ? "1px solid rgba(255,255,255,0.08)"
                : "1px solid rgba(150,0,255,0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  padding: "10px",
                  borderRadius: "12px",
                  background: darkMode ? "#3a3a3a" : "rgba(145,90,255,0.25)",
                  color: darkMode ? "#fff" : "#5b21b6",
                }}
              >
                {stat.icon}
              </div>

              <div>
                <h2 style={{ margin: 0, fontSize: "24px", color: text }}>
                  {stat.value}
                </h2>
                <p style={{ margin: 0, marginTop: "4px", color: metaColor }}>
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress + Performance Side-by-Side */}
      <div
        style={{
          marginTop: "35px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Progress Box */}
        <div
          style={{
            padding: "22px",
            borderRadius: "18px",
            background: darkMode
              ? "linear-gradient(135deg, #1c1c1c, #111)"
              : "linear-gradient(135deg, #f1e8ff, #eadfff)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
          }}
        >
          <h2 style={{ color: text, marginBottom: "18px" }}>Progress</h2>

          {[
            { label: "Approved Leads", value: approvedLeads, color: "#5EE77D" },
            { label: "Rejected Leads", value: rejectedLeads, color: "#FF6A88" },
            { label: "Pending Leads", value: pendingLeads, color: "#7C3AED" },
          ].map((p, i) => {
            const percent = totalLeads
              ? Math.round((p.value / totalLeads) * 100)
              : 0;

            return (
              <div key={i} style={{ marginBottom: "18px" }}>
                <p style={{ color: text }}>{p.label}</p>
                <div
                  style={{
                    width: "100%",
                    height: "12px",
                    background: "#ded3ff",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      width: `${percent}%`,
                      height: "100%",
                      background: p.color,
                      borderRadius: "8px",
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Level */}
        <div
          style={{
            padding: "22px",
            borderRadius: "18px",
            background: darkMode
              ? "linear-gradient(135deg, #1e1e1e, #111)"
              : "linear-gradient(135deg, #e0f4ff, #d6edff)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
          }}
        >
          <h2 style={{ color: text, marginBottom: "16px" }}>
            Performance Level
          </h2>

          {(() => {
            const approvalRate = totalLeads
              ? Math.round((approvedLeads / totalLeads) * 100)
              : 0;

            let level = "";
            let badgeColor = "";

            if (approvalRate >= 75) {
              level = "GOLD";
              badgeColor = "#FFD700";
            } else if (approvalRate >= 50) {
              level = "SILVER";
              badgeColor = "#C0C0C0";
            } else if (approvalRate >= 25) {
              level = "BRONZE";
              badgeColor = "#CD7F32";
            } else {
              level = "STARTER";
              badgeColor = "#9CA3AF";
            }

            return (
              <div
                style={{
                  padding: "18px",
                  borderRadius: "14px",
                  background: darkMode
                    ? "#2a2a2a"
                    : "rgba(255,255,255,0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p style={{ margin: 0, color: metaColor }}>Approval Rate</p>
                  <h3 style={{ margin: "6px 0", color: text, fontSize: "26px" }}>
                    {approvalRate}%
                  </h3>
                  <p style={{ margin: 0, color: text, fontWeight: "600" }}>
                    Current Level: {level}
                  </p>
                </div>

                <div
                  style={{
                    width: "75px",
                    height: "75px",
                    background: badgeColor,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#222",
                    fontWeight: "700",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                  }}
                >
                  {level}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
