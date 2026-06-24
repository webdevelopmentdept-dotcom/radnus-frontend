import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ShadeOfTrustTicker() {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const messages = [
    "☂️  Radnus Shade of Trust Mission™ — 10 Lakh Free Umbrellas for India's Vendors",
    "🏪  New Radnus Store Opening — October 2026 · Date & Location Reveal Coming Soon!",
    "🇮🇳  PAN India Mission · Empowering Roadside Vendors & Micro-Entrepreneurs Across India",
    "🤝  Every New Radnus Store Sponsors Free Umbrellas for Local Roadside Vendors",
    "❤️  Not Just a Campaign — Our Commitment to India's Local Economy · Since 2003",
  ];

  const tickerText = messages.join("     ✦     ");

  return (
    <>
      <style>{`
        .sot-ticker-outer {
          position: relative;
          background: #CC0000;
          overflow: hidden;
          cursor: pointer;
          border-top: 2px solid #F5A200;
          border-bottom: 2px solid #F5A200;
          user-select: none;
        }

        .sot-track-wrap {
          flex: 1;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          min-width: 0;
        }
        .sot-track {
          display: inline-flex;
          white-space: nowrap;
          animation: sotScroll 32s linear infinite;
          will-change: transform;
        }
        .sot-track.paused {
          animation-play-state: paused;
        }
        .sot-track-inner {
          display: inline-flex;
          align-items: center;
          color: white;
          font-size: 12.5px;
          font-weight: 500;
          letter-spacing: 0.2px;
          padding-right: 80px;
        }

        @keyframes sotScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .sot-live-dot {
          width: 7px;
          height: 7px;
          background: #FFDD00;
          border-radius: 50%;
          flex-shrink: 0;
          display: inline-block;
          animation: sotDotPulse 1.5s ease-in-out infinite;
        }
        @keyframes sotDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }

        .sot-arrow {
          display: inline-block;
          transition: transform 0.2s;
        }
        .sot-ticker-outer:hover .sot-arrow {
          transform: translateX(4px);
        }

        .sot-divider {
          width: 1px;
          background: rgba(255,255,255,0.25);
          flex-shrink: 0;
          align-self: stretch;
        }

        /* ═══════════ SPARK BADGE ═══════════ */
        .sot-badge-new {
          position: relative;
          background: #F5A200;
          color: #4a2d00;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          white-space: nowrap;
          gap: 5px;
          flex-shrink: 0;
          overflow: hidden;
          animation: sotBadgePulse 2s ease-in-out infinite;
        }

        /* 1. Pulse glow */
        @keyframes sotBadgePulse {
          0%, 100% { box-shadow: 0 0 0px 0px rgba(255, 200, 0, 0); }
          50%       { box-shadow: 0 0 10px 4px rgba(255, 200, 0, 0.6); }
        }

        /* 2. Shimmer sweep */
        .sot-badge-new::before {
          content: '';
          position: absolute;
          top: 0; left: -60%;
          width: 40%;
          height: 100%;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255,255,255,0.55) 50%,
            transparent 100%
          );
          animation: sotShimmer 2.2s ease-in-out infinite;
        }
        @keyframes sotShimmer {
          0%   { left: -60%; opacity: 0; }
          10%  { opacity: 1; }
          60%  { left: 130%; opacity: 1; }
          61%  { opacity: 0; }
          100% { left: 130%; opacity: 0; }
        }

        /* 3. Star sparkles */
        .sot-spark {
          position: absolute;
          pointer-events: none;
          opacity: 0;
          font-size: 8px;
          color: #fff;
          line-height: 1;
        }
        .sot-spark-1 {
          top: 2px; left: 5px;
          animation: sotSparkPop 2.2s 0s ease-in-out infinite;
        }
        .sot-spark-2 {
          bottom: 2px; left: 16px;
          animation: sotSparkPop 2.2s 0.4s ease-in-out infinite;
        }
        .sot-spark-3 {
          top: 2px; right: 8px;
          animation: sotSparkPop 2.2s 0.8s ease-in-out infinite;
        }
        .sot-spark-4 {
          bottom: 2px; right: 18px;
          animation: sotSparkPop 2.2s 1.2s ease-in-out infinite;
        }
        .sot-spark-5 {
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: sotSparkPop 2.2s 1.6s ease-in-out infinite;
        }
        @keyframes sotSparkPop {
          0%   { opacity: 0; transform: scale(0) rotate(0deg); }
          20%  { opacity: 1; transform: scale(1.3) rotate(20deg); }
          40%  { opacity: 0; transform: scale(0) rotate(40deg); }
          100% { opacity: 0; }
        }

        /* ═══════════ DESKTOP ═══════════ */
        .sot-desktop-layout {
          display: flex;
          align-items: stretch;
          height: 38px;
        }

        .sot-desktop-layout .sot-track-wrap::before,
        .sot-desktop-layout .sot-track-wrap::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          width: 48px;
          z-index: 2;
          pointer-events: none;
        }
        .sot-desktop-layout .sot-track-wrap::before {
          left: 0;
          background: linear-gradient(to right, #CC0000 40%, transparent);
        }
        .sot-desktop-layout .sot-track-wrap::after {
          right: 0;
          background: linear-gradient(to left, #CC0000 40%, transparent);
        }

        .sot-cta {
          background: #F5A200;
          color: #4a2d00;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          white-space: nowrap;
          flex-shrink: 0;
          gap: 5px;
          z-index: 3;
          border-left: 1px solid rgba(255,255,255,0.15);
          transition: background 0.2s;
        }
        .sot-cta:hover { background: #e09400; }

        /* ═══════════ MOBILE ═══════════ */
        .sot-mobile-layout {
          display: none;
          align-items: center;
          height: 30px;
          overflow: hidden;
        }

        .sot-mobile-layout .sot-badge-new {
          font-size: 9px;
          padding: 0 10px;
          letter-spacing: 1.5px;
          height: 100%;
        }

        .sot-mobile-layout .sot-track-inner {
          font-size: 10.5px;
          padding-right: 60px;
        }

        .sot-mobile-layout .sot-track {
          animation-duration: 28s;
        }

        @media (max-width: 768px) {
          .sot-desktop-layout { display: none; }
          .sot-mobile-layout  { display: flex; }
        }
      `}</style>

      <div
        className="sot-ticker-outer"
        onClick={() => navigate("/shade-of-trust")}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        role="banner"
        aria-label="Radnus Shade of Trust Mission — Click to know more"
      >

        {/* ── DESKTOP: single row ── */}
        <div className="sot-desktop-layout">
          <div className="sot-badge-new">
            <span className="sot-spark sot-spark-1">✦</span>
            <span className="sot-spark sot-spark-2">★</span>
            <span className="sot-spark sot-spark-3">✦</span>
            <span className="sot-spark sot-spark-4">★</span>
            <span className="sot-spark sot-spark-5">✦</span>
            <span className="sot-live-dot" />
            ☂️ NEW
          </div>
          <div className="sot-divider" />
          <div className="sot-track-wrap">
            <div className={`sot-track ${hovered ? "paused" : ""}`}>
              <span className="sot-track-inner">
                {tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{tickerText}
              </span>
            </div>
          </div>
       l   <div className="sot-cta">
            Know More <span className="sot-arrow">→</span>
          </div>
        </div>

        {/* ── MOBILE: single row, no Know More ── */}
        <div className="sot-mobile-layout">
          <div className="sot-badge-new">
            <span className="sot-spark sot-spark-1">✦</span>
            <span className="sot-spark sot-spark-2">★</span>
            <span className="sot-spark sot-spark-3">✦</span>
            <span className="sot-spark sot-spark-4">★</span>
            <span className="sot-spark sot-spark-5">✦</span>
            <span className="sot-live-dot" />
            ☂️ NEW
          </div>
          <div className="sot-divider" />
          <div className="sot-track-wrap">
            <div className={`sot-track ${hovered ? "paused" : ""}`}>
              <span className="sot-track-inner">
                {tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{tickerText}
              </span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default ShadeOfTrustTicker;