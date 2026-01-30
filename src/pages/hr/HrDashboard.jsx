import { Outlet } from "react-router-dom";
import HrSidebar from "./HrSidebar";

export default function HrDashboard() {
  return (
    <div style={{ display: "flex" }}>
      <HrSidebar />
      <div style={{ flex: 1, padding: "20px" }}>
        <Outlet />
      </div>
    </div>
  );
}
