import React, { useState, useEffect } from "react";
import "./Popup.css";

export default function UpcomingEventsPopup() {
  const [showPopup, setShowPopup] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    program: "",
  });

 const programs = [
    "Radnus Unlocker – 19 Dec",
    "White Labelling – 22 Dec",
    "Service Training – 23 Dec",
    "Machines & Tools Sale – 24 Dec",
    "Poorvika – 25 Dec",
  ];

  // Show popup on page load
  useEffect(() => {
    setShowPopup(true);
  }, []);

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
        "https://script.google.com/macros/s/AKfycbxRHhLdznwPM_3WUjN8t3-aoBGL-BV9E3LCTC6PvfbRetCtqbwEpY5GccRyA32ht7-r/exec", // 👈 replace with Google Script URL
        {
          method: "POST",
          mode: "no-cors",
          body: new URLSearchParams(form),
        }
      );

      alert("Thank you! Our team will contact you shortly.");
      setForm({ name: "", phone: "", program: "" });
      setShowPopup(false); // close popup after submit
    } catch (error) {
      alert("Network issue. Please call us directly.");
      console.error(error);
    }
  };

  // ❗ IMPORTANT: hide popup when closed
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
              100% <span className="blink-free">FREE</span> All Training
              Programs – Enroll Now
            </span>
            <span className="free-marquee-text">
              100% <span className="blink-free">FREE</span> All Training
              Programs – Enroll Now
            </span>
          </div>
        </div>

        {/* PROGRAM LIST */}
        <h4 className="section-title">📅 This Week Programs</h4>

        <p className="program-question">
          Radnus conducts daily professional programs and sessions
        </p>

        <ul className="program-list">
          {programs.map((p, i) => (
            <li key={i}>👉 {p}</li>
          ))}
        </ul>

        <hr />

        {/* FORM */}
        <h4 className="section-title">Enroll Now</h4>

        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          className="contact-input"
        />

        <input
          type="tel"
          name="phone"
          placeholder="10-digit Mobile Number"
          value={form.phone}
          onChange={handleChange}
          className="contact-input"
        />

        <select
          name="program"
          value={form.program}
          onChange={handleChange}
          className="contact-input"
        >
          <option value="">Select Program</option>
          {programs.map((p, i) => (
            <option key={i} value={p}>
              {p}
            </option>
          ))}
        </select>

        <button className="apply-btn" onClick={handleSubmit}>
          Enroll Now
        </button>

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