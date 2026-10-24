import React, { useState, useEffect } from 'react';
import HrSidebar from './HrSidebar';
import { Outlet } from 'react-router-dom';

export default function HRLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // HR pages use plain fetch() without a token. While the HR panel is open,
  // attach the HR token to calls to our own API so the backend knows who acted.
  useEffect(() => {
    const original = window.fetch;
    const base = import.meta.env.VITE_API_BASE_URL;
    window.fetch = (input, init = {}) => {
      try {
        const url = typeof input === "string" ? input : input?.url || "";
        const t = localStorage.getItem("hrToken");
        if (t && base && url.startsWith(base)) {
          const headers = new Headers(init.headers || (typeof input !== "string" ? input.headers : undefined));
          if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${t}`);
          init = { ...init, headers };
        }
      } catch { /* never block a request */ }
      return original(input, init);
    };
    return () => { window.fetch = original; };
  }, []);


  return (
    <>
      <style>
        {`
          /* FULL WIDTH ON MOBILE */
          @media(max-width: 768px){
            .content-area {
              width: 100% !important;
              margin-left: 0 !important;
              padding: 10px !important;
            }
          }

          /* DESKTOP */
          @media(min-width: 769px){
            .content-area {
              transition: margin-left 0.3s ease;
            }
          }
        `}
      </style>

      <div style={{ display: "flex" }}>
        {/* LEFT SIDEBAR */}
        <HrSidebar onHoverChange={setSidebarExpanded} />

        {/* MAIN CONTENT AREA — shifts in sync with the sidebar's hover state */}
        <div
          className="content-area"
          style={{
            flex: 1,
            background: "#F8F9FA",
            minHeight: "100vh",
            padding: "20px 30px",
            marginLeft: sidebarExpanded ? "260px" : "72px",
            overflowX: "hidden",
          }}
        >
          <Outlet />
        </div>
      </div>
    </>
  );
}