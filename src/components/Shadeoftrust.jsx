import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";

function ShadeOfTrust() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({});
  const [revealed, setRevealed] = useState(false);
  const storeRef = useRef(null);

  // Countdown
  useEffect(() => {
    const target = new Date("2026-10-01T00:00:00");
    const tick = () => {
      const diff = target - new Date();
      if (diff <= 0) return setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Scroll reveal
  useEffect(() => {
    if (!storeRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(storeRef.current);
    return () => observer.disconnect();
  }, []);

  const pad = (n) => String(n ?? 0).padStart(2, "0");

  const benefits = [
    { icon: "🌞", title: "UV Protection", sub: "Waterproof fabric" },
    { icon: "💪", title: "Wind Resistant", sub: "Strong & durable" },
    { icon: "📦", title: "Easy to Carry", sub: "Comes with cover" },
    { icon: "🏷️", title: "Free of Cost", sub: "For local vendors" },
  ];

  const umbrellaValues = [
    { icon: "☂️", label: "Protection" },
    { icon: "🤝", label: "Support" },
    { icon: "❤️", label: "Responsibility" },
    { icon: "🚀", label: "Empowerment" },
  ];

  const visionPoints = [
    "Provide protection from sun and rain",
    "Support small business owners",
    "Improve roadside working conditions",
    "Create safer and more comfortable selling environments",
    "Strengthen community relationships",
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };
  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  return (
    <>
      <Helmet>
        <title>Coming Soon — New Store | Radnus Communication</title>
        <meta
          name="description"
          content="Radnus new mobile store opening October 2026. Shade of Trust Mission — free branded umbrellas for India's roadside vendors."
        />
      </Helmet>

      <style>{`
        .sot-page { font-family: inherit; color: #1a1a1a; overflow-x: hidden; }

        /* ── HERO ── */
        .sot-hero {
          background: #f2f2f2;
          padding: 52px 24px 32px;
          text-align: center;
          position: relative;
        }
        .sot-hero-back {
          position: absolute; top: 16px; left: 20px;
          background: rgba(0,0,0,0.08); color: #333;
          border: none; border-radius: 20px;
          padding: 6px 16px; font-size: 12px;
          cursor: pointer; display: flex; align-items: center; gap: 5px;
          transition: background 0.2s; z-index: 5;
        }
        .sot-hero-back:hover { background: rgba(0,0,0,0.14); }
        .sot-tag-line {
          font-size: 10px; letter-spacing: 3px;
          color: #888; text-transform: uppercase; margin-bottom: 12px;
        }
        .sot-coming {
          display: block;
          font-size: clamp(52px, 14vw, 84px);
          font-weight: 700; color: #CC0000;
          line-height: 0.93; letter-spacing: -1px;
        }
        .sot-soon {
          display: block;
          font-size: clamp(52px, 14vw, 84px);
          font-weight: 700; color: #1a1a1a;
          line-height: 0.93; letter-spacing: -1px;
          margin-bottom: 22px;
        }
        .sot-store-label {
          font-size: 11px; letter-spacing: 2px;
          color: #666; text-transform: uppercase;
          margin-bottom: 10px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .sot-store-label::before, .sot-store-label::after {
          content: ''; width: 36px; height: 1px; background: #CC0000;
        }
        .sot-oct {
          display: inline-block;
          background: #CC0000; color: white;
          font-size: 14px; font-weight: 700;
          letter-spacing: 3px; padding: 8px 24px;
          border-radius: 4px; margin-bottom: 24px;
        }
        .sot-scroll-hint {
          display: flex; flex-direction: column;
          align-items: center; gap: 6px;
          color: #aaa; font-size: 10px;
          letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 28px;
        }
        .sot-scroll-arrow {
          width: 18px; height: 18px;
          border-right: 2px solid #CC0000;
          border-bottom: 2px solid #CC0000;
          transform: rotate(45deg);
          animation: sotArrow 1.2s ease-in-out infinite;
        }
        @keyframes sotArrow {
          0%,100% { transform: rotate(45deg) translateY(0); }
          50%      { transform: rotate(45deg) translateY(5px); }
        }

        /* ── STORE REVEAL ── */
        .sot-store-section {
          padding: 0 24px 40px;
          display: flex; justify-content: center;
          background: #f2f2f2;
        }
        .sot-store-outer {
          width: 100%; max-width: 420px;
          height: 260px;
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: #161616;
        }
        .sot-building {
          position: absolute; inset: 0;
          background: #1c1c1c;
          display: flex; align-items: flex-end; justify-content: center;
        }
        .sot-building-front {
          position: relative;
          width: 100%; height: 220px;
          background: linear-gradient(180deg, #232323 0%, #181818 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 6px;
          overflow: hidden;
        }
        .sot-b-glow {
          position: absolute; top: 50%; left: 50%;
          width: 220px; height: 220px;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(245,162,0,0.0) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 1s ease 1s, background 1s ease 1s;
          z-index: 0;
        }
        .sot-building.lit .sot-b-glow {
          opacity: 1;
          background: radial-gradient(circle, rgba(245,162,0,0.35) 0%, transparent 70%);
        }
        .sot-b-name {
          position: relative; z-index: 1;
          font-size: 20px; font-weight: 700; color: #F5A200; letter-spacing: 5px;
        }
        .sot-b-since {
          position: relative; z-index: 1;
          font-size: 9px; color: rgba(255,255,255,0.4); letter-spacing: 3px;
        }
        .sot-spotlight {
          position: absolute; top: -16px;
          width: 120px; height: 240px;
          clip-path: polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%);
          background: linear-gradient(180deg, rgba(255,232,170,0.55) 0%, rgba(255,232,170,0.14) 55%, transparent 85%);
          opacity: 0; z-index: 4; pointer-events: none;
          mix-blend-mode: screen;
          animation: sotSpotSway 4s ease-in-out infinite;
          transition: opacity 0.7s ease 1s;
        }
        .sot-spotlight.show { opacity: 1; }
        .sot-spotlight-l { left: 8%; transform-origin: top center; }
        .sot-spotlight-r { right: 8%; transform-origin: top center; animation-delay: 0.3s; }
        @keyframes sotSpotSway {
          0%, 100% { transform: rotate(-4deg); }
          50%      { transform: rotate(4deg); }
        }
        .sot-cloth {
          position: absolute; top: 0; left: 0; right: 0;
          height: 100%; z-index: 3;
          clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 50% 72%, 0% 100%);
          transition: clip-path 1.3s cubic-bezier(0.76, 0, 0.24, 1);
          will-change: clip-path;
        }
        .sot-cloth.revealed {
          clip-path: polygon(0% 0%, 100% 0%, 100% -20%, 50% -20%, 0% -20%);
        }
        .sot-cloth-shadow {
          position: absolute; inset: 0;
          background: linear-gradient(160deg, #dd1111 0%, #990000 55%, #770000 100%);
        }
        .sot-cloth-fold-l {
          position: absolute; top: 0; left: 0;
          width: 52%; height: 100%;
          background: #bb0000;
          clip-path: polygon(0 0, 100% 0, 68% 100%, 0 100%);
        }
        .sot-cloth-fold-r {
          position: absolute; top: 0; right: 0;
          width: 52%; height: 100%;
          background: #bb0000;
          clip-path: polygon(0 0, 100% 0, 100% 100%, 32% 100%);
        }
        .sot-cloth-gap {
          position: absolute; bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 0; height: 0;
          border-left: 72px solid transparent;
          border-right: 72px solid transparent;
          border-bottom: 62px solid #f2f2f2;
          z-index: 2;
        }
        .sot-ribbon {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 5px; background: #F5A200; z-index: 4;
          transform: scaleY(0); transform-origin: bottom;
          transition: transform 0.4s ease 1.2s;
        }
        .sot-ribbon.show { transform: scaleY(1); }
        .sot-reveal-tag {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(204,0,0,0.92);
          padding: 10px; text-align: center; z-index: 5;
          opacity: 0; transform: translateY(100%);
          transition: opacity 0.5s ease 1.4s, transform 0.5s ease 1.4s;
        }
        .sot-reveal-tag.show { opacity: 1; transform: translateY(0); }
        .sot-reveal-tag p { color: white; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; }
        .sot-reveal-tag span { color: #F5A200; font-weight: 700; }

        /* ── TAGLINE + INSTAGRAM ── */
        .sot-below {
          padding: 28px 24px 32px;
          background: #f2f2f2;
          text-align: center;
        }
        .sot-tagline-txt {
          font-size: 11px; letter-spacing: 2px;
          color: #555; text-transform: uppercase; margin-bottom: 16px;
        }
        .sot-tagline-txt span { color: #CC0000; font-weight: 700; }
        .sot-ig-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: #CC0000; color: white;
          font-size: 12px; font-weight: 700; letter-spacing: 1px;
          padding: 11px 26px; border-radius: 28px;
          text-decoration: none; text-transform: uppercase;
          transition: background 0.2s, transform 0.15s;
        }
        .sot-ig-btn:hover { background: #aa0000; transform: scale(1.02); color: white; }

        /* ── COUNTDOWN ── */
        .sot-cd-wrap {
          background: #CC0000; padding: 26px 20px; text-align: center;
        }
        .sot-cd-label {
          font-size: 9px; letter-spacing: 2px;
          color: rgba(255,255,255,0.6); text-transform: uppercase; margin-bottom: 14px;
        }
        .sot-cd { display: flex; gap: 8px; justify-content: center; }
        .sot-cd-box {
          background: rgba(255,255,255,0.10);
          border: 0.5px solid rgba(255,255,255,0.2);
          border-radius: 10px;
          padding: 12px 6px 8px;
          min-width: clamp(56px, 17vw, 72px);
          text-align: center;
        }
        .sot-cd-num {
          font-size: clamp(22px, 6vw, 30px);
          font-weight: 700; color: white;
          line-height: 1; font-variant-numeric: tabular-nums;
        }
        .sot-cd-lbl {
          font-size: 8px; color: rgba(255,255,255,0.5);
          letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px;
        }
        .sot-cd-sep {
          color: rgba(255,255,255,0.3); font-size: 20px;
          align-self: center; padding-bottom: 10px;
        }

        /* ══════════════════════════════
           SHADE OF TRUST — BENTO SECTION
           ══════════════════════════════ */
        .sot-bento-sec {
          padding: 64px 40px 72px;
          background: white;
        }
        .sot-bento-inner {
          max-width: 1100px;
          margin: 0 auto;
        }

        /* Section header */
        .sot-bento-header {
          text-align: center;
          margin-bottom: 36px;
        }
        .sot-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 3px;
          color: #CC0000; text-transform: uppercase;
          display: block; margin-bottom: 10px;
        }
        .sot-bento-h {
          font-size: clamp(26px, 3.5vw, 42px);
          font-weight: 700; color: #1a1a1a;
          margin-bottom: 12px; line-height: 1.15;
        }
        .sot-bento-h span { color: #CC0000; }
        .sot-bento-sub {
          font-size: 15px; color: #777; line-height: 1.7;
          max-width: 560px; margin: 0 auto;
        }

        /* ── BENTO GRID ── */
        .bento-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: 2fr 1fr;
          grid-template-areas:
            "umb    commit"
            "ben    beyond"
            "vis    vis"
            "tog    tog";
        }

        /* Base card */
        .bento-card {
          border-radius: 18px;
          padding: 30px 28px;
          overflow: hidden;
        }
        .bento-card-label {
          font-size: 10px; font-weight: 700; letter-spacing: 2.5px;
          color: #CC0000; text-transform: uppercase; margin-bottom: 16px;
        }

        /* ── UMBRELLA CARD ── */
        .bc-umb {
          grid-area: umb;
          background: #1a1a1a;
          display: flex; align-items: center; gap: 32px;
          min-height: 200px;
        }
        .bc-umb-icon {
          font-size: 100px; flex-shrink: 0; line-height: 1;
          animation: sotUmbFloat 3s ease-in-out infinite;
        }
        @keyframes sotUmbFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        .bc-umb-info {}
        .bc-umb-name {
          font-size: 22px; font-weight: 700; color: #F5A200; margin-bottom: 14px;
        }
        .bc-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .bc-tag {
          font-size: 10px; font-weight: 700; padding: 5px 12px;
          border-radius: 4px; letter-spacing: 0.5px;
          background: #CC0000; color: white;
        }
        .bc-tag-gold { background: #F5A200; color: #3d2000; }
        .bc-umb-size { font-size: 13px; color: rgba(255,255,255,0.35); letter-spacing: 0.5px; }

        /* ── COMMITMENT CARD ── */
        .bc-commit {
          grid-area: commit;
          background: #CC0000;
          text-align: center;
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          min-height: 200px;
        }
        .bc-commit-label {
          font-size: 10px; font-weight: 700; letter-spacing: 2px;
          color: rgba(255,255,255,0.65); text-transform: uppercase; margin-bottom: 14px;
        }
        .bc-commit-num {
          font-size: clamp(28px, 3.5vw, 48px);
          font-weight: 700; color: #F5A200; line-height: 1; margin-bottom: 12px;
        }
        .bc-commit-desc {
          font-size: 13px; color: rgba(255,255,255,0.8); line-height: 1.6;
          max-width: 200px;
        }

        /* ── BENEFITS CARD ── */
        .bc-ben {
          grid-area: ben;
          background: #f8f8f8;
          border: 0.5px solid #e8e8e8;
        }
        .bc-ben-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }
        .bc-ben-item {
          background: white; border-radius: 12px;
          border: 0.5px solid #ebebeb;
          padding: 20px 14px; text-align: center;
        }
        .bc-ben-icon { font-size: 28px; display: block; margin-bottom: 10px; }
        .bc-ben-title { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
        .bc-ben-sub { font-size: 12px; color: #999; }

        /* ── BEYOND BRANDING CARD ── */
        .bc-beyond {
          grid-area: beyond;
          background: #fff8f0;
          border: 1.5px solid #F5A200;
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .bc-beyond-desc {
          font-size: 13px; color: #666; line-height: 1.7; margin-bottom: 18px;
        }
        .bc-val-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        }
        .bc-val-item {
          background: white; border-radius: 10px;
          border: 0.5px solid #f0ddb0;
          padding: 14px 8px; text-align: center;
        }
        .bc-val-icon { font-size: 22px; display: block; margin-bottom: 6px; }
        .bc-val-lbl { font-size: 11px; font-weight: 700; color: #7a5500; }

        /* ── VISION CARD ── */
        .bc-vis {
          grid-area: vis;
          background: #f8f8f8;
          border: 0.5px solid #e8e8e8;
        }
        .bc-vis-inner {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 40px;
          align-items: start;
        }
        .bc-vis-tagline {
          font-size: clamp(18px, 2.2vw, 26px);
          font-weight: 700; color: #1a1a1a;
          line-height: 1.3; margin-bottom: 12px;
        }
        .bc-vis-tagline em { color: #CC0000; font-style: normal; }
        .bc-vis-desc { font-size: 14px; color: #777; line-height: 1.65; }
        .bc-vis-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .bc-vis-item {
          display: flex; align-items: flex-start; gap: 12px;
          font-size: 15px; color: #444; line-height: 1.55;
        }
        .bc-vis-check {
          flex-shrink: 0; width: 22px; height: 22px;
          background: #CC0000; color: white; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; margin-top: 1px;
        }

        /* ── TOGETHER STRIP ── */
        .bc-tog {
          grid-area: tog;
          background: #1a1a1a;
          display: flex; align-items: center;
          justify-content: space-between; gap: 20px;
          padding: 28px 36px;
        }
        .bc-chain { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .bc-chain-item {
          background: rgba(255,255,255,0.08);
          border: 0.5px solid rgba(255,255,255,0.14);
          border-radius: 10px; padding: 12px 20px;
          font-size: 14px; font-weight: 600; color: white;
          white-space: nowrap;
        }
        .bc-chain-arrow { color: #CC0000; font-size: 20px; font-weight: 700; }
        .bc-tog-tagline {
          font-size: 15px; font-weight: 600;
          color: rgba(255,255,255,0.55); text-align: right;
          flex-shrink: 0; white-space: nowrap;
        }
        .bc-tog-tagline em { color: #F5A200; font-style: normal; }

        /* ── FOOTER ── */
        .sot-footer { background: #1a1a1a; padding: 20px 24px; text-align: center; }
        .sot-footer p { color: rgba(255,255,255,0.6); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
        .sot-footer span { color: #F5A200; }

        /* ══════════════
           TABLET (≤960px)
           ══════════════ */
        @media (max-width: 960px) {
          .sot-bento-sec { padding: 48px 24px 56px; }
          .bc-vis-inner { grid-template-columns: 1fr; gap: 20px; }
          .bc-umb-icon { font-size: 80px; }
          .bc-umb-name { font-size: 18px; }
          .bc-commit-num { font-size: 32px; }
        }

        /* ══════════════
           MOBILE (≤600px)
           ══════════════ */
        @media (max-width: 600px) {
          /* Hero */
          .sot-hero { padding: 52px 16px 24px; }
          .sot-store-section { padding: 0 16px 28px; }
          .sot-store-outer { height: 210px; }
          .sot-below { padding: 22px 16px 24px; }

          /* Bento section */
          .sot-bento-sec { padding: 36px 14px 44px; }

          /* Stack everything to single column */
          .bento-grid {
            grid-template-columns: 1fr;
            grid-template-areas:
              "umb"
              "commit"
              "ben"
              "beyond"
              "vis"
              "tog";
          }

          /* Umbrella card — vertical on mobile */
          .bc-umb {
            flex-direction: column;
            text-align: center;
            align-items: center;
            gap: 14px;
            padding: 24px 18px;
          }
          .bc-umb-icon { font-size: 64px; }
          .bc-umb-name { font-size: 15px; }
          .bc-tags { justify-content: center; }
          .bc-umb-size { text-align: center; }

          /* Commitment card */
          .bc-commit { padding: 24px 18px; }
          .bc-commit-num { font-size: 30px; }
          .bc-commit-desc { max-width: 240px; }

          /* Benefits — 2×2 stays fine on mobile */
          .bc-ben-grid { gap: 8px; }
          .bc-ben-item { padding: 12px 8px; }

          /* Beyond */
          .bc-beyond { padding: 20px 16px; }

          /* Vision — single column */
          .bc-vis-inner {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .bc-vis-tagline { font-size: 17px; }

          /* Together — vertical stack on mobile */
          .bc-tog {
            flex-direction: column;
            align-items: flex-start;
            gap: 14px;
            padding: 20px 16px;
          }
          .bc-chain { flex-direction: column; align-items: flex-start; gap: 8px; }
          .bc-chain-arrow { transform: rotate(90deg); margin-left: 4px; }
          .bc-tog-tagline { text-align: left; white-space: normal; }
        }

        /* Very small phones */
        @media (max-width: 360px) {
          .sot-bento-sec { padding: 28px 12px 36px; }
          .bc-ben-grid { grid-template-columns: 1fr 1fr; }
          .bc-val-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="sot-page">

        {/* ══ HERO ══ */}
        <section className="sot-hero">
          <button className="sot-hero-back" onClick={() => navigate(-1)}>← Back</button>

          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="sot-tag-line">New Beginning. Better Experience.</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}>
            <span className="sot-coming">COMING</span>
            <span className="sot-soon">SOON</span>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.25 }}>
            <div className="sot-store-label">A new mobile store is on the way</div>
            <div className="sot-oct">OCT 2026</div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <div className="sot-scroll-hint">
              <span>Scroll to reveal</span>
              <div className="sot-scroll-arrow" />
            </div>
          </motion.div>
        </section>

        {/* ══ STORE REVEAL ══ */}
        <div className="sot-store-section">
          <div className="sot-store-outer" ref={storeRef}>
            <div className={`sot-building${revealed ? " lit" : ""}`}>
              <div className="sot-building-front">
                <div className="sot-b-glow" />
                <div className="sot-b-name">RADNUS</div>
                <div className="sot-b-since">SINCE 2003</div>
              </div>
            </div>
            <div className={`sot-spotlight sot-spotlight-l${revealed ? " show" : ""}`} />
            <div className={`sot-spotlight sot-spotlight-r${revealed ? " show" : ""}`} />
            <div className={`sot-cloth${revealed ? " revealed" : ""}`}>
              <div className="sot-cloth-shadow" />
              <div className="sot-cloth-fold-l" />
              <div className="sot-cloth-fold-r" />
              <div className="sot-cloth-gap" />
            </div>
            <div className={`sot-ribbon${revealed ? " show" : ""}`} />
            <div className={`sot-reveal-tag${revealed ? " show" : ""}`}>
              <p>Grand Opening — <span>October 2026</span></p>
            </div>
          </div>
        </div>

        {/* ══ TAGLINE + INSTAGRAM ══ */}
        <div className="sot-below">
          <div className="sot-tagline-txt">Same Trust. <span>Better Experience.</span></div>
          <a
            href="https://www.instagram.com/radnus_official?igsh=dnd5cGY0NWNxZDFj"
            target="_blank"
            rel="noopener noreferrer"
            className="sot-ig-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
            </svg>
            Follow Us for Updates
          </a>
        </div>

        {/* ══ COUNTDOWN ══ */}
        <motion.div className="sot-cd-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }}>
          <div className="sot-cd-label">Counting down to opening day</div>
          <div className="sot-cd">
            {[
              { val: timeLeft.d, lbl: "Days" },
              { val: timeLeft.h, lbl: "Hours" },
              { val: timeLeft.m, lbl: "Mins" },
              { val: timeLeft.s, lbl: "Secs" },
            ].map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="sot-cd-sep">:</div>}
                <div className="sot-cd-box">
                  <div className="sot-cd-num">{pad(item.val)}</div>
                  <div className="sot-cd-lbl">{item.lbl}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        {/* ══ SHADE OF TRUST — BENTO SECTION ══ */}
        <section className="sot-bento-sec">
          <div className="sot-bento-inner">

            {/* Header */}
            <motion.div
              className="sot-bento-header"
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            >
              <span className="sot-eyebrow">Special at our opening</span>
              <h2 className="sot-bento-h">Shade of <span>Trust Mission™</span></h2>
              <p className="sot-bento-sub">
                At our store opening, we distribute free Radnus branded umbrellas to local roadside vendors — our gift to the community.
              </p>
            </motion.div>

            {/* Bento Grid */}
            <motion.div
              className="bento-grid"
              variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            >

              {/* 1. Umbrella Card */}
              <motion.div className="bento-card bc-umb" variants={fadeUp}>
                <div className="bc-umb-icon">☂️</div>
                <div className="bc-umb-info">
                  <div className="bc-umb-name">Radnus Branded Umbrella</div>
                  <div className="bc-tags">
                    <span className="bc-tag">Mobile Sales & Service</span>
                    <span className="bc-tag bc-tag-gold">Mobile Recharge</span>
                    <span className="bc-tag">Accessories</span>
                  </div>
                  <div className="bc-umb-size">Red · White · Gold — 6 feet (72 inch)</div>
                </div>
              </motion.div>

              {/* 2. Commitment Card */}
              <motion.div className="bento-card bc-commit" variants={fadeUp}>
                <div className="bc-commit-label">🎯 Our Commitment</div>
                <div className="bc-commit-num">10,00,000</div>
                <div className="bc-commit-desc">
                 Free branded umbrellas will be distributed across India to roadside vendors and micro-entrepreneurs
                </div>
              </motion.div>

              {/* 3. Benefits Card */}
              <motion.div className="bento-card bc-ben" variants={fadeUp}>
                <div className="bento-card-label">Umbrella Features</div>
                <div className="bc-ben-grid">
                  {benefits.map((b, i) => (
                    <div key={i} className="bc-ben-item">
                      <span className="bc-ben-icon">{b.icon}</span>
                      <div className="bc-ben-title">{b.title}</div>
                      <div className="bc-ben-sub">{b.sub}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* 4. Beyond Branding Card */}
              <motion.div className="bento-card bc-beyond" variants={fadeUp}>
                <div>
                  <div className="bento-card-label">Beyond Branding</div>
                  <p className="bc-beyond-desc">
                  This will not be just a marketing campaign. Every umbrella that will be distributed will represent our commitment to empowering local entrepreneurs who contribute to India's economy every day
                  </p>
                </div>
                <div className="bc-val-grid">
                  {umbrellaValues.map((v, i) => (
                    <div key={i} className="bc-val-item">
                      <span className="bc-val-icon">{v.icon}</span>
                      <div className="bc-val-lbl">{v.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* 5. Vision Card */}
              <motion.div className="bento-card bc-vis" variants={fadeUp}>
                <div className="bento-card-label">Our Vision</div>
                <div className="bc-vis-inner">
                  <div>
                    <div className="bc-vis-tagline">
                      One store. <em>One street.</em><br />One umbrella at a time.
                    </div>
                    <p className="bc-vis-desc">
                      Every new Radnus store inaugurated across India will sponsor and distribute free umbrellas to local roadside vendors in its community.
                    </p>
                  </div>
                  <ul className="bc-vis-list">
                    {visionPoints.map((point, i) => (
                      <li key={i} className="bc-vis-item">
                        <div className="bc-vis-check">✓</div>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* 6. Together Strip */}
              <motion.div className="bento-card bc-tog" variants={fadeUp}>
                <div className="bc-chain">
                  <div className="bc-chain-item">🧑‍🤝‍🧑 Entrepreneurs Grow</div>
                  <span className="bc-chain-arrow">→</span>
                  <div className="bc-chain-item">🏘️ Communities Grow</div>
                  <span className="bc-chain-arrow">→</span>
                  <div className="bc-chain-item">🇮🇳 India Grows</div>
                </div>
                <div className="bc-tog-tagline">
                  Radnus — <em>Service We Care.</em><br />Trust We Deliver.
                </div>
              </motion.div>

            </motion.div>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        {/* <div className="sot-footer">
          <p>Radnus — <span>Service We Care.</span> Trust We Deliver. · Since 2003</p>
        </div> */}

      </div>
    </>
  );
}

export default ShadeOfTrust;