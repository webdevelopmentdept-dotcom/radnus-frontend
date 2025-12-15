import React, { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";

export default function Courses() {
  const { darkMode } = useOutletContext();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/courses");
      const data = await res.json();
      if (data.success) setCourses(data.courses);
    } catch (err) {
      console.log("Load Error:", err);
    }
  };

  const cardBg = darkMode ? "#1e1e1e" : "#ffffff";
  const text = darkMode ? "#f1f1f1" : "#111";
  const sub = darkMode ? "#aaa" : "#555";

  return (
    <div style={{ padding: "10px" }}>
      
      {/* PAGE TITLE */}
      <h1
        style={{
          color: text,
          marginBottom: "20px",
          fontSize: "26px",
          fontWeight: "700",
        }}
      >
        📚 Available Courses
      </h1>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gap: "18px",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        }}
      >
        {courses.map((c) => (
          <div
            key={c._id}
            style={{
              background: cardBg,
              padding: "18px",
              borderRadius: "14px",
              boxShadow: darkMode
                ? "0 4px 12px rgba(0,0,0,0.35)"
                : "0 4px 14px rgba(0,0,0,0.12)",
              transition: "0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow =
                "0 10px 22px rgba(0,0,0,0.20)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0px)";
              e.currentTarget.style.boxShadow = darkMode
                ? "0 4px 12px rgba(0,0,0,0.35)"
                : "0 4px 14px rgba(0,0,0,0.12)";
            }}
          >
            {/* TITLE + FEE */}
            <div>
              <h2
                style={{
                  color: text,
                  fontSize: "19px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                {c.title}
              </h2>

              <p
                style={{
                  color: sub,
                  fontSize: "15px",
                  margin: 0,
                  paddingBottom: "5px",
                }}
              >
                <span style={{ fontWeight: "600" }}>Fee:</span> {c.fee}
              </p>
            </div>

            {/* VIEW BUTTON */}
          <Link to={`/channel/course/${c._id}`} style={{ display: "flex", justifyContent: "center" }}>

  <button
    style={{
      background: "linear-gradient(135deg, #6B11CB, #2575FC)",
      color: "#fff",
      padding: "10px 0",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontSize: "15px",
      marginTop: "18px",
      width: "140px",      // 🔥 width kammiyaagum
      fontWeight: 600,
      letterSpacing: "0.3px",
      display: "block",     // center align
      marginLeft: "auto",   // center align
      marginRight: "auto",  // center align
      textDecoration:"none"
    }}
  >
    View Details →
  </button>
</Link>

          </div>
        ))}
      </div>
    </div>
  );
}
