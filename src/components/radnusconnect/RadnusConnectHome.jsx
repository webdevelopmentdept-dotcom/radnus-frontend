import { Link } from "react-router-dom";
import {
  FiUserCheck,
  FiBriefcase,
  FiArrowRight,
  FiMapPin,
  FiShield,
  FiTrendingUp,
} from "react-icons/fi";

export default function RadnusConnectHome() {
  return (
    <section className="portal position-relative overflow-hidden">

      <style>{css}</style>

      {/* dotted background */}
      <div className="bg-dots" />

      {/* red circle accent */}
      <div className="accent-circle d-none d-lg-block" />

      <div className="container position-relative z-1">
        <div className="row align-items-center g-5">
          {/* LEFT */}
          <div className="col-lg-7">
            <span className="badge rounded-pill text-danger bg-danger bg-opacity-10 px-3 py-2">
              RADNUS CONNECT
            </span>

            <h1 className="fw-bold display-5 mt-3">
              India’s <span className="text-danger">Mobile Service</span>
              <br />
              Hiring Platform
            </h1>

            <p className="text-muted fs-5 mt-3">
              Radnus Connect bridges skilled mobile technicians and verified
              mobile shops through a structured hiring & placement ecosystem.
            </p>

            <div className="d-flex flex-wrap gap-3 mt-4">
              <Link
  to="/radnus-connect/technician"
  className="btn btn-danger btn-lg d-flex gap-2 align-items-center"
>
  <FiUserCheck /> Join as Technician
</Link>


             <Link
  to="/radnus-connect/shop-owner"
  className="btn btn-outline-dark btn-lg d-flex gap-2 align-items-center"
>
  Hire a Technician <FiArrowRight />
</Link>

            </div>

            <div
              className="row row-cols-1 row-cols-sm-3 g-3 mt-4 "
              style={{ fontSize: "18px" }}
            >
              <Feature icon={<FiShield />} text="Verified profiles" />
              <Feature icon={<FiMapPin />} text="Location based matching" />
              <Feature icon={<FiTrendingUp />} text="Career growth support" />
            </div>
          </div>

          {/* RIGHT */}
          <div className="col-lg-5">
            <div className="d-flex flex-column gap-4 align-items-center align-items-lg-start">
              <InfoCard
                icon={<FiUserCheck size={22} />}
                title="Technicians"
                sub="Skilled & Verified"
              />

              <InfoCard
                icon={<FiBriefcase size={22} />}
                title="Shops"
                sub="Trusted Businesses"
                dark
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Components ---------- */

function Feature({ icon, text }) {
  return (
    <div className="col d-flex align-items-center gap-2">
      <span className="text-danger">{icon}</span>
      <span className="small fw-medium">{text}</span>
    </div>
  );
}

function InfoCard({ icon, title, sub, dark }) {
  return (
    <div
      className={`info-card card border-0 rounded-4 w-100 ${
        dark ? "bg-dark text-white" : ""
      }`}
    >
      <div className="card-body d-flex align-items-center gap-3">
        <div className="icon-box">{icon}</div>
        <div>
          <div className="fw-bold">{title}</div>
          <small className={dark ? "text-light" : "text-muted"}>{sub}</small>
        </div>
      </div>
    </div>
  );
}

/* ---------- MINIMAL CSS (Design Only) ---------- */

const css = `
.portal{
  position: relative;
  min-height: auto;      /* ✅ IMPORTANT */
  padding-top: 24px;     /* small top gap */
  padding-bottom: 120px;  /* small bottom gap */
}




/* dotted bg */
.bg-dots{
  position:absolute;
  inset:0;
  background:radial-gradient(rgba(0,0,0,.08) 1px, transparent 1px);
  background-size:24px 24px;
  z-index:0;
}

/* red circle */
.accent-circle{
  position:absolute;
  width:360px;
  height:360px;
  border-radius:50%;
  background:radial-gradient(circle, #d61f26, #9f1216);
  right:-120px;
  bottom:-120px;
  z-index:0;
}

/* cards */
.info-card{
  max-width:360px;
  backdrop-filter:blur(14px);
  background:rgba(255,255,255,.85);
  box-shadow:0 20px 40px rgba(0,0,0,.15);
  transition:transform .35s ease, box-shadow .35s ease;
}

/* hover micro animation */
.info-card:hover{
  transform:translateY(-6px) scale(1.02);
  box-shadow:0 30px 60px rgba(0,0,0,.25);
}

/* icon box */
.icon-box{
  width:52px;
  height:52px;
  border-radius:14px;
  background:#d61f26;
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
}
`;