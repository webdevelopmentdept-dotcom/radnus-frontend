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

  // Scroll reveal — fires only when the store card actually enters the screen
  useEffect(() => {
    if (!storeRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
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
        <meta name="description" content="Radnus new mobile store opening October 2026. Shade of Trust Mission — free branded umbrellas for India's roadside vendors." />
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

        /* Scroll hint */
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

        /* Building */
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
          position: absolute;
          top: 50%; left: 50%;
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

        /* Spotlights */
        .sot-spotlight {
          position: absolute;
          top: -16px;
          width: 120px;
          height: 240px;
          clip-path: polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%);
          background: linear-gradient(180deg, rgba(255,232,170,0.55) 0%, rgba(255,232,170,0.14) 55%, transparent 85%);
          opacity: 0;
          z-index: 4;
          pointer-events: none;
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

        /* Cloth */
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

        /* Gold ribbon at bottom */
        .sot-ribbon {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 5px; background: #F5A200; z-index: 4;
          transform: scaleY(0); transform-origin: bottom;
          transition: transform 0.4s ease 1.2s;
        }
        .sot-ribbon.show { transform: scaleY(1); }

        /* Grand opening tag */
        .sot-reveal-tag {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(204,0,0,0.92);
          padding: 10px; text-align: center;
          z-index: 5;
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

        /* ── UMBRELLA SECTION ── */
        .sot-umb-sec {
          padding: 44px 20px; background: white; text-align: center;
        }
        .sot-umb-inner { max-width: 540px; margin: 0 auto; }
        .sot-eyebrow {
          font-size: 9px; font-weight: 700; letter-spacing: 2.5px;
          color: #CC0000; text-transform: uppercase;
          display: block; margin-bottom: 8px;
        }
        .sot-umb-h {
          font-size: clamp(20px, 5vw, 28px);
          font-weight: 700; color: #1a1a1a;
          margin-bottom: 8px; line-height: 1.2;
        }
        .sot-umb-h span { color: #CC0000; }
        .sot-umb-sub {
          font-size: 13px; color: #777; line-height: 1.65;
          max-width: 420px; margin: 0 auto 28px;
        }

        /* Umbrella card */
        .sot-umb-card {
          background: #f8f8f8; border-radius: 14px;
          padding: 24px 20px 20px;
          margin-bottom: 20px;
          display: flex; flex-direction: column;
          align-items: center; gap: 10px;
          max-width: 480px; margin-left: auto; margin-right: auto;
        }
        .sot-umb-info {
          display: flex; flex-direction: column;
          align-items: center; gap: 10px;
        }
        .sot-umb-emoji {
          font-size: 64px; line-height: 1;
          animation: sotUmbFloat 3s ease-in-out infinite;
        }
        @keyframes sotUmbFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-9px); }
        }
        .sot-umb-name { font-size: 13px; font-weight: 700; color: #1a1a1a; letter-spacing: 0.5px; }
        .sot-umb-tags { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
        .sot-umb-tag {
          background: #CC0000; color: white;
          font-size: 9px; font-weight: 700;
          padding: 4px 10px; border-radius: 4px; letter-spacing: 0.5px;
        }
        .sot-umb-tag.gold { background: #F5A200; color: #4a2d00; }
        .sot-umb-size { font-size: 10px; color: #999; letter-spacing: 0.5px; }

        /* Benefits */
        .sot-ben-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; margin-bottom: 20px;
          max-width: 480px; margin-left: auto; margin-right: auto;
        }
        .sot-ben { background: #f8f8f8; border-radius: 10px; padding: 14px 10px; text-align: center; }
        .sot-ben-icon { font-size: 22px; display: block; margin-bottom: 6px; }
        .sot-ben-title { font-size: 12px; font-weight: 700; color: #1a1a1a; margin-bottom: 2px; }
        .sot-ben-sub { font-size: 10px; color: #999; line-height: 1.4; }

        /* Milestone */
        .sot-milestone {
          background: #CC0000; border-radius: 12px;
          padding: 24px 20px; text-align: center;
          max-width: 480px; margin: 0 auto;
        }
        .sot-mil-num {
          font-size: clamp(32px, 8vw, 48px);
          font-weight: 700; color: #F5A200;
          line-height: 1; margin-bottom: 6px;
        }
        .sot-mil-lbl { font-size: 13px; color: white; font-weight: 600; margin-bottom: 4px; }
        .sot-mil-sub { font-size: 11px; color: rgba(255,255,255,0.65); }

        /* ── FOOTER ── */
        .sot-footer { background: #1a1a1a; padding: 20px 24px; text-align: center; }
        .sot-footer p { color: rgba(255,255,255,0.6); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
        .sot-footer span { color: #F5A200; }

        /* ── DESKTOP ── */
        @media (min-width: 768px) {
          .sot-umb-sec { padding: 72px 40px; }
          .sot-umb-inner { max-width: 760px; }
          .sot-umb-h { font-size: 34px; }
          .sot-umb-sub { max-width: 560px; font-size: 14.5px; }

          .sot-umb-card {
            max-width: 680px;
            flex-direction: row; align-items: center;
            text-align: left; gap: 30px;
            padding: 30px 38px;
          }
          .sot-umb-info { align-items: flex-start; }
          .sot-umb-tags { justify-content: flex-start; }
          .sot-umb-emoji { font-size: 88px; }

          .sot-ben-grid {
            grid-template-columns: repeat(4, 1fr);
            max-width: 760px; gap: 16px;
          }
          .sot-ben { padding: 18px 12px; }

          .sot-milestone { max-width: 680px; padding: 30px 32px; }
        }

        /* ── MOBILE ── */
        @media (max-width: 480px) {
          .sot-hero { padding: 52px 16px 28px; }
          .sot-store-section { padding: 0 16px 32px; }
          .sot-store-outer { height: 220px; }
          .sot-below { padding: 24px 16px 28px; }
          .sot-umb-sec { padding: 36px 16px; }
          .sot-ben-grid { gap: 8px; }
          .sot-umb-card { margin-bottom: 16px; }
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
            {/* Building */}
            <div className={`sot-building${revealed ? " lit" : ""}`}>
              <div className="sot-building-front">
                <div className="sot-b-glow" />
                <div className="sot-b-name">RADNUS</div>
                <div className="sot-b-since">SINCE 2003</div>
              </div>
            </div>
            {/* Spotlights */}
            <div className={`sot-spotlight sot-spotlight-l${revealed ? " show" : ""}`} />
            <div className={`sot-spotlight sot-spotlight-r${revealed ? " show" : ""}`} />
            {/* Cloth */}
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
            {[{ val: timeLeft.d, lbl: "Days" }, { val: timeLeft.h, lbl: "Hours" }, { val: timeLeft.m, lbl: "Mins" }, { val: timeLeft.s, lbl: "Secs" }].map((item, i) => (
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

        {/* ══ UMBRELLA ══ */}
        <section className="sot-umb-sec">
          <div className="sot-umb-inner">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <span className="sot-eyebrow">Special at our opening</span>
              <h2 className="sot-umb-h">Shade of <span>Trust Mission™</span></h2>
              <p className="sot-umb-sub">At our store opening, we distribute free Radnus branded umbrellas to local roadside vendors — our gift to the community.</p>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <div className="sot-umb-card">
                <div className="sot-umb-emoji">☂️</div>
                <div className="sot-umb-info">
                  <div className="sot-umb-name">Radnus Branded Umbrella</div>
                  <div className="sot-umb-tags">
                    <div className="sot-umb-tag">MOBILE SALES & SERVICE</div>
                    <div className="sot-umb-tag gold">MOBILE RECHARGE</div>
                    <div className="sot-umb-tag">ACCESSORIES</div>
                  </div>
                  <div className="sot-umb-size">Red · White · Gold — 6 feet (72 inch)</div>
                </div>
              </div>
            </motion.div>

            <motion.div className="sot-ben-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              {benefits.map((b, i) => (
                <motion.div key={i} className="sot-ben" variants={fadeUp}>
                  <span className="sot-ben-icon">{b.icon}</span>
                  <div className="sot-ben-title">{b.title}</div>
                  <div className="sot-ben-sub">{b.sub}</div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <div className="sot-milestone">
                <div className="sot-mil-num">10,00,000</div>
                <div className="sot-mil-lbl">Free Umbrellas — PAN India Mission</div>
                <div className="sot-mil-sub">One store at a time · every state · every street</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <div className="sot-footer">
          <p>Radnus — <span>Service We Care.</span> Trust We Deliver. · Since 2003</p>
        </div>

      </div>
    </>
  );
}

export default ShadeOfTrust;