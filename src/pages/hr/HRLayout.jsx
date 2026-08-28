import React, { useState } from 'react';
import HrSidebar from './HrSidebar';
import { Outlet } from 'react-router-dom';

export default function HRLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

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