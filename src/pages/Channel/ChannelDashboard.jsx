import { Outlet, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FiHome,
  FiBookOpen,
  FiPlusCircle,
  FiList,
  FiUser,
  FiLogOut,
  FiSun,
  FiMoon,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";

export default function ChannelDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 600);
  const [partnerName, setPartnerName] = useState("Partner");

  /* ---------------- LOAD PARTNER NAME ---------------- */
  useEffect(() => {
    const name = localStorage.getItem("partnerName");
    if (name) setPartnerName(name);
  }, []);

  /* ---------------- RESPONSIVE ---------------- */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 600;
      setIsMobile(mobile);
      setCollapsed(mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ---------------- THEME ---------------- */
  const theme = {
    light: {
      bg: "#F7F9FC",
      sidebar: "rgba(255,255,255,0.75)",
      text: "#1F1F1F",
      textSoft: "#6B7280",
      primary: "#6D28D9",
      hover: "rgba(109,40,217,0.08)",
      border: "rgba(0,0,0,0.08)",
      shadow: "rgba(0,0,0,0.10)",
      activeBg: "rgba(109,40,217,0.12)",
    },
    dark: {
      bg: "#0B0B0D",
      sidebar: "rgba(20,20,22,0.75)",
      text: "#F5F5F5",
      textSoft: "#A1A1AA",
      primary: "#A78BFA",
      hover: "rgba(167,139,250,0.10)",
      border: "rgba(255,255,255,0.08)",
      shadow: "rgba(0,0,0,0.45)",
      activeBg: "rgba(167,139,250,0.15)",
    },
  };

  const t = darkMode ? theme.dark : theme.light;

  /* ---------------- SIDEBAR STYLE ---------------- */
  const sidebarStyle = {
    position: isMobile ? "fixed" : "relative",
    top: 0,
    left: isMobile ? (collapsed ? "-260px" : "0") : "0",
    width: isMobile ? "260px" : collapsed ? "86px" : "240px",
    height: "100vh",
    backdropFilter: "blur(22px)",
    background: t.sidebar,
    borderRight: `1px solid ${t.border}`,
    padding: collapsed ? "12px 6px" : "16px 14px",
    transition: "all 0.35s ease",
    zIndex: 1000,
    boxShadow: `4px 0 24px ${t.shadow}`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
  };

  const linkBase = {
    display: "flex",
    alignItems: "center",
    gap: collapsed ? "0px" : "14px",
    padding: collapsed ? "12px 4px" : "12px 14px",
    borderRadius: "14px",
    textDecoration: "none",
    fontSize: "16px",
    fontWeight: 500,
    transition: "0.25s ease",
    justifyContent: collapsed ? "center" : "flex-start",
  };

  const navItems = [
    { to: "dashboard", label: "Dashboard", icon: <FiHome size={20} /> },
    { to: "courses", label: "Courses", icon: <FiBookOpen size={20} /> },
    { to: "add-lead", label: "Add Lead", icon: <FiPlusCircle size={20} /> },
    { to: "leads", label: "My Leads", icon: <FiList size={20} /> },
    { to: "profile", label: "Profile", icon: <FiUser size={20} /> },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: t.bg }}>
      
      {/* MOBILE HAMBURGER */}
      {isMobile && collapsed && (
  <button
    onClick={() => setCollapsed(false)}
    style={{
      position: "fixed",
      top: "10px",          // 👈 mela konjam
      left: "10px",
      zIndex: 1100,
      background: t.primary,
      color: "#fff",
      border: "none",
      borderRadius: "8px",  // 👈 small radius
      padding: "6px",       // 👈 size reduce
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <FiChevronsRight size={18} /> {/* 👈 icon size reduce */}
  </button>
)}


      {/* MOBILE OVERLAY */}
      {!collapsed && isMobile && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 900,
          }}
        />
      )}

      {/* SIDEBAR */}
      <div style={sidebarStyle}>
        {/* DESKTOP TOGGLE */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              border: "none",
              padding: "8px",
              borderRadius: "10px",
              cursor: "pointer",
              marginBottom: "14px",
              background: t.primary,
              color: "#fff",
            }}
          >
            {collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
          </button>
        )}

        <div style={{ flexGrow: 1 }}>
          {!collapsed && (
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <img
                src={localStorage.getItem("companyLogo") || "/image.png"}
                alt="logo"
                style={{ width: "80px", filter: darkMode ? "brightness(1.2)" : "none" }}
              />
              <h3 style={{ margin: "4px 0", fontSize: "15px", color: t.text }}>
                {localStorage.getItem("companyName") || "RADNUS"}
              </h3>
              <p style={{ fontSize: "11px", color: t.textSoft }}>
                {localStorage.getItem("companyTagline") || "Communications"}
              </p>
            </div>
          )}

          {!collapsed && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                padding: "8px",
                borderRadius: "10px",
                background: t.hover,
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "8px",
                  background: t.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {partnerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: t.text }}>
                  {partnerName}
                </p>
                <p style={{ margin: 0, fontSize: "11px", color: t.textSoft }}>
                  Channel Partner
                </p>
              </div>
            </div>
          )}

          <ul style={{ listStyle: "none", padding: 0 }}>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => isMobile && setCollapsed(true)}
                  style={({ isActive }) => ({
                    ...linkBase,
                    background: isActive ? t.activeBg : "transparent",
                    color: isActive ? t.primary : t.textSoft,
                  })}
                >
                  {item.icon}
                  {!collapsed && item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <NavLink to="/" style={{ ...linkBase, color: "#E11D48" }}>
          <FiLogOut />
          {!collapsed && "Logout"}
        </NavLink>
      </div>

      {/* CONTENT */}
      <div style={{ flexGrow: 1, padding: "20px", overflowY: "auto" }}>
        <Outlet context={{ darkMode }} />
      </div>
    </div>
  );
}
