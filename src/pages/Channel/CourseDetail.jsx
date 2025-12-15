import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    loadCourse();
  }, []);

  const loadCourse = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${id}`);
      const data = await res.json();
      if (data.success) setCourse(data.course);
    } catch (err) {
      console.log("Error loading course:", err);
    }
  };

  if (!course)
    return (
      <div className="p-6">
        <h2>Loading...</h2>
      </div>
    );

  return (
    <div style={{ padding: "22px", maxWidth: "1250px", margin: "0 auto" }}>
      <style>
        {`
          .grid-layout {
            display: grid;
            gap: 18px;
            grid-template-columns: repeat(3, 1fr);
          }

          .card {
            background: #fff;
            padding: 18px 20px;
            border-radius: 16px;
            border: 1px solid rgba(120, 80, 200, 0.20);
            box-shadow: 0 5px 18px rgba(0,0,0,0.06);
            transition: .25s ease;
          }

          .card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 28px rgba(0,0,0,0.12);
          }

          .title-box {
            background: linear-gradient(135deg, #ece1ff, #ffffff);
            border-left: 4px solid #8b4dff;
            padding: 22px;
          }

          .title-text {
            font-size: 26px;
            font-weight: 800;
            color: #2a2a2a;
            margin: 0;
          }

          .section-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #2a2a2a;
          }

          ul li {
            margin-bottom: 6px;
            line-height: 1.6;
            font-size: 16px;
          }

          /* MOBILE FIXES */
          @media (max-width: 900px) {
            .grid-layout {
              grid-template-columns: 1fr !important;
            }

            .card {
              grid-column: span 1 !important;
              grid-row: auto !important;
            }

            .title-box {
              grid-column: span 1 !important;
            }
          }
        `}
      </style>

      <div className="grid-layout">

        {/* TITLE SECTION */}
        <div className="card title-box" style={{ gridColumn: "span 2" }}>
          <h2 className="title-text">{course.title}</h2>
        </div>

        {/* FEE / DURATION / MODE */}
        <div className="card">
          <p><b>Fee:</b> {course.fee}</p>
          <p><b>Duration:</b> {course.duration}</p>
          <p><b>Mode:</b> {course.mode}</p>
        </div>

        {/* ELIGIBILITY + BENEFITS */}
        <div className="card" style={{ gridRow: "span 2" }}>
          <h3 className="section-title">Eligibility Criteria</h3>
          <ul>
            {course.eligibility?.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h3 className="section-title" style={{ marginTop: "25px" }}>
            Program Benefits
          </h3>

          {Array.isArray(course.benefits) ? (
            <ul>
              {course.benefits.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          ) : (
            <p>{course.benefits}</p>
          )}
        </div>

        {/* COURSE CURRICULUM */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <h3 className="section-title">Course Curriculum</h3>
          <ul>
            {course.curriculum?.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
