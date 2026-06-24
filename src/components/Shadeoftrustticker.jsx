import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ShadeOfTrustTicker() {
  const [hovered, setHovered] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const navigate = useNavigate();

  // Confetti particles data
  const confettiColors = [
    "#FFD700", "#FF0000", "#00FF00", "#FF6600", 
    "#FF1493", "#00BFFF", "#FFFF00", "#FF4500"
  ];
  
  const confettiShapes = ["circle", "rect", "square"];
  
  // Generate random confetti particles
  const generateConfetti = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2 + Math.random() * 1.5,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      shape: confettiShapes[Math.floor(Math.random() * confettiShapes.length)],
      size: 5 + Math.random() * 6,
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 100,
    }));
  };

  const [confettiParticles] = useState(() => generateConfetti(40));
  const [sparkles] = useState(() => generateConfetti(12));

  // Auto-hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

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
        /* ═══════════ CONFETTI / POPPERS ═══════════ */
        .sot-confetti-layer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 220px;
          pointer-events: none;
          z-index: 1000;
          overflow: hidden;
        }

        .sot-confetti-piece {
          position: absolute;
          top: -15px;
          will-change: transform, opacity;
        }

        .sot-confetti-circle {
          border-radius: 50%;
        }
        .sot-confetti-rect {
          border-radius: 2px;
        }
        .sot-confetti-square {
          border-radius: 2px;
        }

        @keyframes sotConfettiFall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
          }
          30% {
            opacity: 1;
            transform: translateY(60px) rotate(180deg) scale(1.2);
          }
          70% {
            opacity: 0.8;
            transform: translateY(140px) rotate(450deg) scale(0.9);
          }
          100% {
            opacity: 0;
            transform: translateY(200px) rotate(720deg) scale(0.3);
          }
        }

        /* Sparkle burst effect */
        .sot-sparkle-burst {
          position: absolute;
          width: 6px;
          height: 6px;
          background: #FFD700;
          border-radius: 50%;
          box-shadow: 0 0 15px 5px rgba(255, 215, 0, 0.8), 0 0 30px 10px rgba(255, 215, 0, 0.4);
          will-change: transform, opacity;
        }

        @keyframes sotSparkleBurst {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          20% {
            opacity: 1;
            transform: scale(2.5);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.5);
          }
          100% {
            opacity: 0;
            transform: scale(0);
          }
        }

        /* Popper cannon burst lines */
        .sot-popper-line {
          position: absolute;
          width: 3px;
          height: 40px;
          border-radius: 2px;
          transform-origin: bottom center;
          will-change: transform, opacity;
        }

        @keyframes sotPopperShoot {
          0% {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-80px) scaleY(0.6);
          }
          100% {
            opacity: 0;
            transform: translateY(-120px) scaleY(0.2);
          }
        }

        /* ═══════════ TICKER STYLES ═══════════ */
        .sot-ticker-outer {
          position: relative;
          background: linear-gradient(90deg, #CC0000 0%, #990000 100%);
          overflow: hidden;
          cursor: pointer;
          border-top: 3px solid #F5A200;
          border-bottom: 3px solid #F5A200;
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
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.3px;
          padding-right: 80px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        @keyframes sotScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .sot-live-dot {
          width: 9px;
          height: 9px;
          background: #FF0000;
          border-radius: 50%;
          flex-shrink: 0;
          display: inline-block;
          animation: sotDotPulse 1.5s ease-in-out infinite;
          box-shadow: 0 0 8px #FF0000;
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
          width: 2px;
          background: rgba(255,255,255,0.3);
          flex-shrink: 0;
          align-self: stretch;
        }

        /* ═══════════ SPARK BADGE ═══════════ */
        .sot-badge-new {
          position: relative;
          background: linear-gradient(135deg, #F5A200 0%, #FFD700 100%);
          color: #4a2d00;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          white-space: nowrap;
          gap: 6px;
          flex-shrink: 0;
          overflow: hidden;
          animation: sotBadgePulse 2s ease-in-out infinite;
        }

        @keyframes sotBadgePulse {
          0%, 100% { box-shadow: 0 0 0px 0px rgba(255, 200, 0, 0); }
          50%       { box-shadow: 0 0 12px 5px rgba(255, 200, 0, 0.6); }
        }

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

        .sot-spark {
          position: absolute;
          pointer-events: none;
          opacity: 0;
          font-size: 9px;
          color: #fff;
          line-height: 1;
        }
        .sot-spark-1 { top: 2px; left: 5px; animation: sotSparkPop 2.2s 0s ease-in-out infinite; }
        .sot-spark-2 { bottom: 2px; left: 16px; animation: sotSparkPop 2.2s 0.4s ease-in-out infinite; }
        .sot-spark-3 { top: 2px; right: 8px; animation: sotSparkPop 2.2s 0.8s ease-in-out infinite; }
        .sot-spark-4 { bottom: 2px; right: 18px; animation: sotSparkPop 2.2s 1.2s ease-in-out infinite; }
        .sot-spark-5 { top: 50%; left: 50%; transform: translate(-50%, -50%); animation: sotSparkPop 2.2s 1.6s ease-in-out infinite; }
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
          height: 52px;
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
          background: linear-gradient(135deg, #F5A200 0%, #FFD700 100%);
          color: #4a2d00;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          white-space: nowrap;
          flex-shrink: 0;
          gap: 6px;
          z-index: 3;
          border-left: 2px solid rgba(255,255,255,0.2);
          transition: background 0.2s, transform 0.2s;
        }
        .sot-cta:hover { 
          background: linear-gradient(135deg, #e09400 0%, #e6c200 100%);
          transform: scale(1.02);
        }

        /* ═══════════ MOBILE ═══════════ */
        .sot-mobile-layout {
          display: none;
          align-items: center;
          height: 42px;
          overflow: hidden;
        }

        .sot-mobile-layout .sot-badge-new {
          font-size: 11px;
          padding: 0 12px;
          letter-spacing: 1.5px;
          height: 100%;
        }

        .sot-mobile-layout .sot-track-inner {
          font-size: 13px;
          padding-right: 60px;
        }

        .sot-mobile-layout .sot-track {
          animation-duration: 28s;
        }

        /* Mobile confetti - smaller */
        .sot-mobile-layout ~ .sot-confetti-layer,
        .sot-confetti-layer.mobile {
          height: 160px;
        }

        @media (max-width: 768px) {
          .sot-desktop-layout { display: none; }
          .sot-mobile-layout  { display: flex; }
          .sot-confetti-layer { height: 160px; }
        }
      `}</style>

      {/* ═══════════ CONFETTI / POPPERS LAYER ═══════════ */}
      {showConfetti && (
        <div className="sot-confetti-layer">
          {/* Confetti pieces falling */}
          {confettiParticles.map((p) => (
            <div
              key={p.id}
              className={`sot-confetti-piece sot-confetti-${p.shape}`}
              style={{
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: p.shape === "rect" ? `${p.size * 1.5}px` : `${p.size}px`,
                backgroundColor: p.color,
                animation: `sotConfettiFall ${p.duration}s ease-out forwards`,
                animationDelay: `${p.delay}s`,
                transform: `rotate(${p.rotation}deg)`,
              }}
            />
          ))}

          {/* Sparkle bursts */}
          {sparkles.slice(0, 8).map((s, i) => (
            <div
              key={`sparkle-${i}`}
              className="sot-sparkle-burst"
              style={{
                left: `${s.left}%`,
                top: `${15 + Math.random() * 40}px`,
                animation: `sotSparkleBurst 1.8s ease-out forwards`,
                animationDelay: `${0.2 + i * 0.15}s`,
                backgroundColor: s.color,
                boxShadow: `0 0 15px 5px ${s.color}80, 0 0 30px 10px ${s.color}40`,
              }}
            />
          ))}

          {/* Popper cannon lines - shooting up from bottom */}
          {[15, 30, 50, 70, 85].map((pos, i) => (
            <div
              key={`popper-${i}`}
              className="sot-popper-line"
              style={{
                left: `${pos}%`,
                bottom: 0,
                background: `linear-gradient(to top, ${confettiColors[i]}, transparent)`,
                animation: `sotPopperShoot 1.2s ease-out forwards`,
                animationDelay: `${0.1 + i * 0.1}s`,
                height: `${30 + Math.random() * 30}px`,
              }}
            />
          ))}
        </div>
      )}

      <div
        className="sot-ticker-outer"
        onClick={() => navigate("/shade-of-trust")}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        role="banner"
        aria-label="Radnus Shade of Trust Mission — Click to know more"
      >

        {/* ── DESKTOP ── */}
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
          <div className="sot-cta">
            Know More <span className="sot-arrow">→</span>
          </div>
        </div>

        {/* ── MOBILE ── */}
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