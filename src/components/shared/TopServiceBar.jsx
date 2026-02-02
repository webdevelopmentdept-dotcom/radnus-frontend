import React from "react";
import {
  FiUnlock,
  FiZap,
  FiTool,
  FiPlusCircle,
  FiActivity,
  FiGrid,
  FiCpu,
  FiShield,
} from "react-icons/fi";

const services = [
  { name: "Unlock Tool Rent", icon: <FiUnlock />, badge: "24x7" },
  { name: "AMT Tool Rent", icon: <FiCpu />, badge: "HOT" },
  { name: "Cheetah Tool Rent", icon: <FiZap />, badge: "Instant" },
  { name: "Hydra Tool Rent", icon: <FiActivity />, badge: "Online" },
  { name: "Sigma Plus Rent", icon: <FiPlusCircle />, badge: "Online" },
  { name: "UMT Pro", icon: <FiTool />, badge: "Pro" },
  { name: "Chimera Tool", icon: <FiShield />, badge: "Server" },
  { name: "Borneo Schematics", icon: <FiGrid />, badge: "VIP" },
];

export default function TopServiceBar() {
  return (
    <div className="top-scroll-bar">
      <div className="scroll-track">
        {[...services, ...services].map((item, i) => (
          <div className="service-pill" key={i}>
            <span className="icon">{item.icon}</span>
            <span className="text">{item.name}</span>
            <span className="badge">{item.badge}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
