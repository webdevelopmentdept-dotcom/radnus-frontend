import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiUserCheck,
  FiBriefcase,
  FiArrowRight,
  FiMapPin,
  FiShield,
  FiTrendingUp,
  FiSearch,
} from "react-icons/fi";

export default function RadnusConnectHome() {
  const [stats, setStats] = useState({ openJobs: 0, availableTechs: 0 });

  useEffect(() => {
    axios
      .get("/api/connect/stats")
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  return (
    <section className="portal position-relative overflow-hidden">
      <style>{css}</style>

      {/* Animated background grid */}
      <div className="bg-grid" />
      <div className="bg-glow" />

      <div className="container position-relative z-1">
        <div className="row align-items-center g-5">

          {/* ── LEFT ── */}
          <div className="col-lg-7">

            <div className="badge-pill mb-3">
              <span className="badge-dot" />
              RADNUS CONNECT
            </div>

            <h1 className="hero-heading mt-3">
              India's <span className="highlight">Mobile Service</span>
              <br />
              Hiring Platform
            </h1>

            <p className="hero-sub mt-3">
              Radnus Connect bridges skilled mobile technicians and verified
              mobile shops through a structured hiring &amp; placement ecosystem.
            </p>

            {/* Live stats strip */}
            {(stats.openJobs > 0 || stats.availableTechs > 0) && (
              <div className="stats-strip mt-4">
                <div className="stat-item">
                  <span className="stat-num">{stats.openJobs}</span>
                  <span className="stat-label">Open Jobs</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-num">{stats.availableTechs}</span>
                  <span className="stat-label">Available Techs</span>
                </div>
              </div>
            )}

           {/* PRIMARY CTA BUTTONS - இப்போ Register & Post a Job பெரியதா */}
<div className="d-flex flex-wrap gap-3 mt-4">
  <Link to="/radnus-connect/technician" className="cta-primary">
    <FiUserCheck size={18} />
    Register as Technician
  </Link>
  <Link to="/radnus-connect/shop-owner" className="cta-secondary">
    <FiBriefcase size={18} />
    Post a Job
    <FiArrowRight size={16} />
  </Link>
</div>

{/* SECONDARY SMALL BUTTONS - இப்போ Find Job & Find Technician சிறியதா */}
<div className="d-flex flex-wrap gap-3 mt-3">
  <Link to="/radnus-connect/jobs" className="reg-btn reg-red">
    <FiSearch size={15} />
    Find Job
  </Link>
  <Link to="/radnus-connect/find-technician" className="reg-btn reg-dark">
    <FiUserCheck size={15} />
    Find Technician
  </Link>
</div>

            {/* Feature pills */}
            <div className="feature-row mt-4">
              <Feature icon={<FiShield />}    text="Verified profiles" />
              <Feature icon={<FiMapPin />}     text="Location based matching" />
              <Feature icon={<FiTrendingUp />} text="Career growth support" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="col-lg-5">
            <div className="cards-stack">

              <Link to="/radnus-connect/jobs" className="info-link">
                <InfoCard
                  icon={<FiSearch size={20} />}
                  title={`${stats.openJobs} Open Jobs`}
                  sub="Browse all mobile shop requirements"
                />
              </Link>

              <Link to="/radnus-connect/find-technician" className="info-link">
                <InfoCard
                  icon={<FiUserCheck size={20} />}
                  title={`${stats.availableTechs} Technicians`}
                  sub="Find skilled & verified techs"
                  dark
                />
              </Link>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ── Sub-components ─────────────────────────── */

function Feature({ icon, text }) {
  return (
    <div className="feature-pill">
      <span className="feature-icon">{icon}</span>
      <span className="feature-text">{text}</span>
    </div>
  );
}

function InfoCard({ icon, title, sub, dark }) {
  return (
    <div className={`icard ${dark ? "icard-dark" : "icard-light"}`}>
      <div className="icard-icon">{icon}</div>
      <div className="icard-body">
        <div className="icard-title">{title}</div>
        <div className="icard-sub">{sub}</div>
      </div>
      <FiArrowRight className="icard-arrow" size={18} />
    </div>
  );
}

/* ── CSS ─────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=Playfair+Display:wght@700;800;900&display=swap');
.portal {
  font-family: 'DM Sans', sans-serif;
  min-height: auto;
  padding-top: 32px;
  padding-bottom: 120px;
  background: #fafafa;
}

/* ── Background ── */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(214,31,38,.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(214,31,38,.06) 1px, transparent 1px);
  background-size: 40px 40px;
  z-index: 0;
}
.bg-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(214,31,38,.12) 0%, transparent 70%);
  right: -100px;
  top: -100px;
  z-index: 0;
  pointer-events: none;
}

/* ── Badge ── */
.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(214,31,38,.08);
  border: 1px solid rgba(214,31,38,.2);
  color: #d61f26;
  font-family: 'Syne', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 6px 14px;
  border-radius: 100px;
}
.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d61f26;
  animation: pulse 2s ease infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .5; transform: scale(1.4); }
}

/* ── Heading ── */
.hero-heading {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 900;
  line-height: 1.2;
  color: #111;
  letter-spacing: -0.5px;
}

.highlight {
  color: #d61f26;
  position: relative;
}
.highlight::after {
  content: '';
  position: absolute;
  left: 0; bottom: 2px;
  width: 100%; height: 3px;
  background: #d61f26;
  border-radius: 2px;
  opacity: .3;
}

/* ── Sub ── */
.hero-sub {
  font-size: 1rem;
  color: #666;
  line-height: 1.7;
  max-width: 520px;
}

/* ── Stats ── */
.stats-strip {
  display: inline-flex;
  align-items: center;
  gap: 20px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 12px 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,.06);
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-num {
  font-family: 'Syne', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  color: #d61f26;
  line-height: 1;
}
.stat-label {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
  font-weight: 500;
}
.stat-divider {
  width: 1px;
  height: 36px;
  background: #eee;
}

/* ── Primary CTA ── */
.cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #d61f26;
  color: #fff;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 15px;
  padding: 13px 28px;
  border-radius: 12px;
  text-decoration: none;
  transition: all .25s ease;
  box-shadow: 0 8px 24px rgba(214,31,38,.3);
}
.cta-primary:hover {
  background: #b81920;
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(214,31,38,.4);
}
.cta-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  color: #111;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 15px;
  padding: 13px 28px;
  border-radius: 12px;
  border: 2px solid #111;
  text-decoration: none;
  transition: all .25s ease;
}
.cta-secondary:hover {
  background: #111;
  color: #fff;
  transform: translateY(-2px);
}

/* ── Register buttons ── */
.reg-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  padding: 11px 22px;
  border-radius: 10px;
  text-decoration: none;
  transition: all .2s ease;
  border: 1.5px solid;
}
.reg-red  { color: #d61f26; border-color: rgba(214,31,38,.35); }
.reg-red:hover  { background: rgba(214,31,38,.07); color: #d61f26; }
.reg-dark { color: #444; border-color: #ccc; }
.reg-dark:hover { background: #f0f0f0; color: #111; }

/* ── Features ── */
.feature-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.feature-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 100px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #444;
  box-shadow: 0 2px 8px rgba(0,0,0,.04);
}
.feature-icon { color: #d61f26; display: flex; align-items: center; }
.feature-text { white-space: nowrap; }

/* ── Info Cards ── */
.cards-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.info-link {
  text-decoration: none;
  display: block;
}
.icard {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 22px;
  border-radius: 18px;
  transition: transform .3s ease, box-shadow .3s ease;
  cursor: pointer;
}
.icard:hover {
  transform: translateY(-5px);
  box-shadow: 0 24px 48px rgba(0,0,0,.18) !important;
}
.icard-light {
  background: #fff;
  box-shadow: 0 12px 32px rgba(0,0,0,.1);
  border: 1px solid #f0f0f0;
}
.icard-dark {
  background: #111;
  box-shadow: 0 12px 32px rgba(0,0,0,.25);
}
.icard-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  background: #d61f26;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.icard-body { flex: 1; min-width: 0; }
.icard-title {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: inherit;
}
.icard-light .icard-title { color: #111; }
.icard-dark  .icard-title { color: #fff; }
.icard-sub {
  font-size: 12px;
  margin-top: 2px;
}
.icard-light .icard-sub { color: #888; }
.icard-dark  .icard-sub { color: #aaa; }
.icard-arrow { color: #d61f26; flex-shrink: 0; }
`;