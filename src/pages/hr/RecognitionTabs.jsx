import { NavLink } from "react-router-dom";

const B = "/hr/dashboard/recognition";
const GROUPS = {
  schemes: [
    { to: `${B}/award-config`, label: "Schemes" },
    { to: `${B}/settings`, label: "Settings" },
  ],
  approvals: [
    { to: `${B}/award-approvals`, label: "Approvals" },
    { to: `${B}/rewards-register`, label: "Rewards Register" },
  ],
};

export default function RecognitionTabs({ group }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: "8px 0", marginBottom: 12 }}>
      {GROUPS[group].map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          style={({ isActive }) => ({
            padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            textDecoration: "none",
            background: isActive ? "#2563eb" : "#fff",
            color: isActive ? "#fff" : "#374151",
            border: "1px solid #e5e7eb",
          })}
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}