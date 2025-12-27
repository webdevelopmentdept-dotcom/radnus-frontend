import React, { useEffect, useState } from "react";
import "./Popup.css";

/* 🔁 Software Tools Rotation */
const SOFTWARE_TOOLS = [
  "UMT PRO",
  "UNLOCK TOOL",
  "CHIMERA TOOL",
  "SIGMA TOOL",
  "CHEETAH TOOL",
  "AMT TOOL",
  "HYDRA TOOL",
];

/* 🔧 Get tool based on week */
const getToolForWeek = (weekIndex) => {
  return SOFTWARE_TOOLS[weekIndex % SOFTWARE_TOOLS.length];
};

export default function UpcomingEventsPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [weekOffset, setWeekOffset] = useState(1);

 useEffect(() => {
  setShowPopup(true); // always show on refresh
}, []);

const closePopup = () => {
  setShowPopup(false); // close only for now
};


  const formatDate = (d) =>
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

  /* 📅 Get weekly events */
  const getWeekEvents = (offset, remainingOnly = false) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);

    const toolName = getToolForWeek(offset);

    const weeklyPrograms = {
      1: { name: "Mobile Exchange Mela", form: "https://forms.gle/5EGH8oPhQfQuAso59" },
      2: { name: "Mobile Service Training Demo", form: "https://forms.gle/rDS49wNbpSqXusyy8" },
      3: {
        name: `Software Tool Training – ${toolName}`,
        form: "https://forms.gle/U9g2NJDCzPXJmDLH8",
      },
      4: { name: "Mobile Service Mela", form: "https://forms.gle/Ks5rTawHXSe2AznNA" },
      5: { name: "Radnus Unlocker Training", form: "https://forms.gle/uy6MoQRPTPWfaK1A9" },
      6: { name: "Mobile Service Training Demo", form: "https://forms.gle/kDThKZ9UGmGFJcU89" },
    };

    const events = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const d = date.getDay();

      if (weeklyPrograms[d]) {
        if (remainingOnly && date < today) continue;

        events.push({
          title: weeklyPrograms[d].name,
          label: formatDate(date),
          form: weeklyPrograms[d].form,
        });
      }
    }

    return events;
  };

  const thisWeek = getWeekEvents(0, true);
  const upcoming = getWeekEvents(weekOffset);

  if (!showPopup) return null;

  return (
    <div className="popup-side">
      <div className="popup-card premium">
        <button className="popup-close" onClick={closePopup}>
          ✕
        </button>

        {/* HEADER */}
        <div className="popup-header">
          <h3 className="popup-title">
            Radnus Conducts Daily Professional Programs
          </h3>

          {/* FREE MARQUEE */}
          <div className="free-marquee">
            <div className="free-marquee-track">
              <span className="free-marquee-text">
                🚀 Below programs are training sessions only –{" "}
                <span className="blink-free">FREE</span>
              </span>

              <span className="free-marquee-text">
                🎯 Enroll now and attend the programs –{" "}
                <span className="blink-free">FREE</span>
              </span>
            </div>
          </div>
        </div>

        {/* THIS WEEK */}
        <div className="section">
          <h4>📅 This Week</h4>
          <ul className="event-list">
            {thisWeek.map((e, i) => (
              <li key={i} className="event-item highlight">
                <span style={{ fontWeight: "bold" }}>
                  {e.title} <small>({e.label})</small>
                </span>
                <a href={e.form} className="btn-enroll">
                  Enroll
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* UPCOMING */}
        <div className="section">
          <h4
            className="upcoming-toggle"
            onClick={() => setShowUpcoming(!showUpcoming)}
          >
            📆 Upcoming {showUpcoming ? "▲" : "▶"}
          </h4>

          {showUpcoming && (
            <>
              <div className="week-nav">
                <button
                  disabled={weekOffset <= 1}
                  onClick={() => setWeekOffset(weekOffset - 1)}
                >
                  ⬅
                </button>
                <span>Next Weeks</span>
                <button onClick={() => setWeekOffset(weekOffset + 1)}>➡</button>
              </div>

              <ul className="event-list">
                {upcoming.map((e, i) => (
                  <li key={i} className="event-item">
                    <span>
                      {e.title} <small>({e.label})</small>
                    </span>
                    <a href={e.form} className="btn-enroll outline">
                      Enroll
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="popup-footer">
          📞 <a href="tel:+916384282689">+91 63842 82689</a>
        </div>
      </div>
    </div>
  );
}