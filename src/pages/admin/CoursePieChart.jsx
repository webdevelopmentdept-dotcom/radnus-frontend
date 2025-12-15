import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function CoursePieChart({ data }) {
  const COLORS = [
    "url(#gradBlue)",
    "url(#gradGreen)",
    "url(#gradYellow)",
  ];

  return (
    <div style={{ width: "100%", height: "100%" }}>
      
      <h6
        style={{
          fontWeight: "600",
          fontSize: "0.95rem",
          color: "#6b7280",
          textAlign: "center",
          marginBottom: "4px",   // 🔥 ultra-small spacing
        }}
      >
        Course Popularity
      </h6>

      {/* 🔥 Ultra compact height */}
      <div
        style={{
          width: "100%",
          height: "160px",     // ← COMPACT HEIGHT
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>

            {/* Gradients */}
            <defs>
              <linearGradient id="gradBlue" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4F8CFF" />
                <stop offset="100%" stopColor="#256BFF" />
              </linearGradient>

              <linearGradient id="gradGreen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#41E37A" />
                <stop offset="100%" stopColor="#1FBF57" />
              </linearGradient>

              <linearGradient id="gradYellow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFD76A" />
                <stop offset="100%" stopColor="#FFB300" />
              </linearGradient>
            </defs>

            <Pie
              data={data}
              dataKey="count"
              nameKey="course"
              cx="50%"
              cy="47%"        // 🔥 slight lift for better fit  
              innerRadius={25} // 🔥 smaller donut
              outerRadius={55} // 🔥 smaller pie size
              paddingAngle={3}
              cornerRadius={4}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>

            <Tooltip />

            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              iconSize={10}            // 🔥 very compact legend icons
              wrapperStyle={{
                marginTop: "-6px",    // move legend closer
                fontSize: "0.75rem",  // smaller text
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
