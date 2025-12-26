import React, { useState, useEffect } from "react";
import "./Popup.css";

export default function UpcomingEventsPopup() {
  const [showPopup, setShowPopup] = useState(false);

  // Show popup on page load
  useEffect(() => {
    setShowPopup(true);
  }, []);

  useEffect(() => {
    const closed = localStorage.getItem("popupClosed");
    if (!closed) setShowPopup(true);
  }, []);

  const closePopup = () => {
    localStorage.setItem("popupClosed", "true");
    setShowPopup(false);
  };

  // Helper: Generate weekly events
  const getWeeklyEvents = () => {
    const today = new Date();
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const day = today.getDay(); // Sunday = 0
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

    const formatDate = (date) =>
      date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });

    const events = [
      {
        offset: 0,
        name: "Mobile Exchange Mela",
        form: "https://forms.gle/Zi7rTw3ty8xbzucc7",
      },
      {
        offset: 1,
        name: "Mobile Service Training Demo",
        form: "https://forms.gle/bSdyNZPRooKs3mfD7",
      },
      {
        offset: 2,
        name: "Software Tool Training UMT PRO ",
        form: "https://forms.gle/HHRRZafeM66WG1U49",
      },
      {
        offset: 3,
        name: "Mobile Service Mela",
        form: "https://forms.gle/dCbKQuBidodCS3CY8",
      },
      {
        offset: 4,
        name: "Radnus Unlocker Training",
        form: "https://forms.gle/hrmgCjsLZ89R5kKP6",
      },
      {
        offset: 5,
        name: "Mobile Service Training Demo",
        form: "https://forms.gle/saturday-form",
      },
    ];

    return events
      .map((e) => {
        const date = new Date(monday.getTime() + e.offset * 86400000);
        return {
          title: `${e.name} (${formatDate(date)})`,
          date,
          isToday: date.getTime() === todayDate.getTime(),
          form: e.form,
        };
      })
      .filter((e) => e.date >= todayDate); // Hide past days
  };

  const events = getWeeklyEvents();

  // Form state
  const [form, setForm] = useState({
    name: "",
    phone: "",
    program: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.program) {
      alert("Please fill all fields");
      return;
    }

    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbxRHhLdznwPM_3WUjN8t3-aoBGL-BV9E3LCTC6PvfbRetCtqbwEpY5GccRyA32ht7-r/exec",
        {
          method: "POST",
          mode: "no-cors",
          body: new URLSearchParams(form),
        }
      );

      alert("Thank you! Our team will contact you shortly.");
      setForm({ name: "", phone: "", program: "" });
      setShowPopup(false);
    } catch (error) {
      alert("Network issue. Please call us directly.");
      console.error(error);
    }
  };

  // ❗ Hide popup if closed
  if (!showPopup) return null;

  return (
    <div className="popup-side">
      <div className="popup-card popup-attention">
        {/* CLOSE BUTTON */}
        <button className="popup-close" onClick={() => setShowPopup(false)}>
          ✕
        </button>
        {/* FREE MARQUEE */}
<div className="free-marquee">
  <div className="free-marquee-track">
    <span className="free-marquee-text">
      🚀 Below programs are full training sessions – <span className="blink-free">FREE</span>
    </span>

    <span className="free-marquee-text">
      🎯 Enroll now and attend the programs – <span className="blink-free">FREE</span>
    </span>
  </div>
</div>


        {/* PROGRAM LIST */}
        <h4 className="section-title">📅 This Week Programs</h4>

        <p className="program-question">
          Radnus conducts daily professional programs and sessions
        </p>

        <ul className="program-list">
          {events.map((e, i) => (
            <li key={i} className={e.isToday ? "today-program" : ""}>
              <span>{e.title}</span>
              <a
                href={e.form}
                target="_blank"
                rel="noreferrer"
                className="event-btn"
              >
                Enroll
              </a>
            </li>
          ))}
        </ul>

        <hr />

        {/* CONTACT */}
        <h4 className="section-title contact-title">Contact Us</h4>

        <div className="contact-info">
          <p className="contact-name">Radnus Communication</p>

          <p>
            📍{" "}
            <a
              href="https://www.google.com/maps?q=Sinnaaya+Plaza,+MG+Road,+Puducherry"
              target="_blank"
              rel="noreferrer"
            >
              Sinnaaya Plaza, MG Road, Puducherry
            </a>
          </p>

          <p>
            📞 <a href="tel:+916384282689">+91 63842 82689</a>
          </p>
        </div>
      </div>
    </div>
  );
}