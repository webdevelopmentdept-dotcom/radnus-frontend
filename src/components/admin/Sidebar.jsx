import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function AdminSidebar() {
  const location = useLocation();
  const [hover, setHover] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [theme, setTheme] = useState("dark");

  // APPLY THEME ONLY IN ADMIN
  useEffect(() => {
    const saved = localStorage.getItem("admin-theme") || "dark";
    setTheme(saved);

    if (location.pathname.startsWith("/admin")) {
      document.body.classList.remove(
        "bg-dark",
        "bg-light",
        "text-light",
        "text-dark"
      );

      document.body.classList.add(saved === "dark" ? "bg-dark" : "bg-light");
      document.body.classList.add(saved === "dark" ? "text-light" : "text-dark");
    } else {
      document.body.classList.remove(
        "bg-dark",
        "bg-light",
        "text-light",
        "text-dark"
      );
    }
  }, [location.pathname]);

  const menu = [
    {
      module: "Main",
      items: [
        { name: "Dashboard", path: "/admin/dashboard", icon: "bi-speedometer2" },
      ],
    },
    {
      module: "Training",
      items: [
        { name: "Applicants", path: "/admin/applicants", icon: "bi-people-fill" },
      ],
    },
    {
      module: "Channel Partner",
      items: [
        { name: "Partner List", path: "/admin/partners", icon: "bi-person-badge-fill" },
        { name: "Lead List", path: "/admin/leads", icon: "bi-clipboard-data-fill" },
        { name: "Advance Records", path: "/admin/advance-records", icon: "bi-cash-stack" },
      ],
    },
    {
      module: "Courses",
      items: [
        { name: "Manage Courses", path: "/admin/courses", icon: "bi-journal-bookmark-fill" },
      ],
    },
    {
      module: "Settings",
      items: [
        { name: "Admin Settings", path: "/admin/settings", icon: "bi-gear-fill" },
        { name: "Updates", path: "/admin/updates", icon: "bi-bell-fill" },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("admin-theme");
    window.location.replace("/login");
  };

  return (
    <>
      {/* HAMBURGER BUTTON */}
      {!mobileOpen && (
        <div
          className="d-md-none p-2"
          style={{ position: "fixed", top: 0, left: 10, zIndex: 99999 }}
        >
          <i
            className="bi bi-list fs-4 p-1 rounded shadow"
            style={{
              background: "rgba(255,255,255,0.45)",
              backdropFilter: "blur(4px)",
              cursor: "pointer",
              color: "black",
            }}
            onClick={() => setMobileOpen(true)}
          ></i>
        </div>
      )}

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 5000 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR */}
      <div
        className="d-md-none position-fixed top-0 h-100"
        style={{
          width: "250px",
          left: mobileOpen ? "0" : "-260px",
          background: theme === "dark" ? "#000" : "#fff",
          color: theme === "dark" ? "#fff" : "#000",
          transition: "0.3s",
          zIndex: 6001,
          padding: "15px",
          overflowY: "auto",
        }}
      >
        <div className="d-flex justify-content-end">
          <i
            className="bi bi-x-lg fs-4"
            style={{ cursor: "pointer" }}
            onClick={() => setMobileOpen(false)}
          ></i>
        </div>

        <h4 className="mb-4">Admin</h4>

        {menu.map((section, s) => (
          <div key={s}>
            <p className="text-secondary small">{section.module}</p>

            {section.items.map((item, i) => (
              <Link key={i} to={item.path} style={{ textDecoration: "none" }}>
                <div
                  className="d-flex align-items-center p-2 rounded mb-1"
                  style={{
                    background:
                      location.pathname === item.path ? "#222" : "transparent",
                    color:
                      location.pathname === item.path
                        ? "#ff4d4d"
                        : theme === "dark"
                        ? "#fff"
                        : "#000",
                  }}
                >
                  <i className={`bi ${item.icon} fs-5`}></i>
                  <span className="ms-3">{item.name}</span>
                </div>
              </Link>
            ))}
          </div>
        ))}

        <hr />

        {/* MOBILE LOGOUT */}
        <div
          className="d-flex align-items-center text-danger"
          style={{ cursor: "pointer" }}
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right fs-5"></i>
          <span className="ms-2">Logout</span>
        </div>
      </div>

  {/* DESKTOP SIDEBAR – PREMIUM GLASS UI */}
<div
  className={`d-none d-md-flex flex-column justify-content-between ${
    theme === "dark" ? "text-light" : "text-dark"
  }`}
  style={{
    width: hover ? "230px" : "72px",
    height: "100vh",
    transition: "0.35s",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 3000,
    padding: "14px 10px",
    background: theme === "dark"
      ? "rgba(20,20,20,0.80)"
      : "rgba(255,255,255,0.55)",
    backdropFilter: "blur(14px)",
    borderRight: theme === "dark"
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(0,0,0,0.08)",
    boxShadow: theme === "dark"
      ? "4px 0 22px rgba(0,0,0,0.45)"
      : "4px 0 22px rgba(0,0,0,0.12)",
    borderRadius: "0 14px 14px 0"
  }}
  onMouseEnter={() => setHover(true)}
  onMouseLeave={() => setHover(false)}
>
  {/* TOP LOGO SECTION */}
  <div style={{ marginBottom: "20px", paddingLeft: hover ? "6px" : "0" }}>
    <div
      className="d-flex align-items-center"
      style={{
        padding: "10px 8px",
        borderRadius: "12px",
        background: theme === "dark"
          ? "rgba(255,255,255,0.05)"
          : "rgba(0,0,0,0.05)",
        boxShadow: theme === "dark"
          ? "0 3px 10px rgba(0,0,0,0.35)"
          : "0 3px 10px rgba(0,0,0,0.10)",
        transition: "0.3s"
      }}
    >
      <i className="bi bi-grid-fill fs-4"></i>
      {hover && (
        <h5 className="ms-2 mb-0 fw-bold" style={{ letterSpacing: "0.5px" }}>
          Admin
        </h5>
      )}
    </div>
  </div>

  {/* MENU SECTION */}
  <div
  style={{
    flexGrow: 1,
    overflowY: "auto",
    scrollbarWidth: "none",          // Firefox hide
    msOverflowStyle: "none",         // IE/Edge hide
  }}
  className="hide-scrollbar"
>

  
    {menu.map((section, idx) => (
      <div key={idx} className="mb-2">
        {/* Section Label */}
        {hover && (
          <p
            className="text-uppercase mb-2"
            style={{
              fontSize: "12px",
              letterSpacing: "0.7px",
              fontWeight: "600",
              opacity: 0.55,
              marginLeft: "6px"
            }}
          >
            {section.module}
          </p>
        )}

        {/* Items */}
        {section.items.map((item, i) => {
          const active = location.pathname === item.path;

          return (
            <Link key={i} to={item.path} style={{ textDecoration: "none" }}>
              <div
                className="d-flex align-items-center"
                style={{
                  padding: hover ? "10px 12px" : "10px 8px",
                  marginBottom: "6px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "0.3s",
                  background: active
                    ? theme === "dark"
                      ? "linear-gradient(135deg, #ff4d4d, #b30000)"
                      : "linear-gradient(135deg, #ffe0e0, #ffb3b3)"
                    : "transparent",
                  color: active
                    ? theme === "dark"
                      ? "#fff"
                      : "#b30000"
                    : theme === "dark"
                    ? "#e5e5e5"
                    : "#222",
                  boxShadow: active
                    ? "0 4px 12px rgba(0,0,0,0.25)"
                    : "none"
                }}
              >
                <i
                  className={`bi ${item.icon}`}
                  style={{
                    fontSize: "1.15rem",
                    minWidth: "26px",
                    textAlign: "center"
                  }}
                ></i>

                {hover && (
                  <span style={{ fontSize: "15px", marginLeft: "10px" }}>
                    {item.name}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    ))}
  </div>

  {/* LOGOUT BUTTON */}
  <div
    className="d-flex align-items-center p-2 rounded"
    style={{
      cursor: "pointer",
      marginBottom: "10px",
      background: "rgba(255,0,0,0.10)",
      borderRadius: "12px",
      transition: "0.3s",
    }}
    onClick={handleLogout}
  >
    <i className="bi bi-box-arrow-right fs-5 text-danger"></i>
    {hover && (
      <span className="ms-2 fw-semibold" style={{ color: "#dc3545" }}>
        Logout
      </span>
    )}
  </div>
</div>


      {/* SPACER FOR DESKTOP */}
      <div
        className="d-none d-md-block"
        style={{ width: hover ? "210px" : "70px" }}
      ></div>
    </>
  );
}
