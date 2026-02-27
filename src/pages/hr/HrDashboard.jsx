import { Outlet } from "react-router-dom";
import HrSidebar from "./HrSidebar";
import { useEffect, useState } from "react";

export default function HrDashboard() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      {/* Sidebar */}
      <HrSidebar />

      {/* Main Content */}
      <div
        style={{
          marginLeft: isMobile ? "0px" : "260px",
          padding: isMobile ? "15px" : "20px",
          transition: "0.3s",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}