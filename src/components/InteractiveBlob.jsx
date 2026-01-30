import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function InteractiveBlob({
  type,
  mousePosition = { x: 0, y: 0 },
  isPasswordFocused = false,
  isAnyInputFocused = false,
  happiness = 0, // 0 → 100
}) {
  const ref = useRef(null);
  const [blink, setBlink] = useState(false);

  /* ---------- styles ---------- */
  const styles = {
    pink: { bg: "#fbcfe8", w: 150, h: 190, mouth: true },
    teal: { bg: "#5eead4", w: 120, h: 120, ears: true },
    blue: { bg: "#60a5fa", w: 90, h: 90 },
    long: { bg: "#fde68a", w: 60, h: 200 }, // yellow
  };
  const s = styles[type];

  /* ---------- auto blinking ---------- */
  useEffect(() => {
    const blinkInterval = setInterval(
      () => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
      },
      3000 + Math.random() * 2000,
    );

    return () => clearInterval(blinkInterval);
  }, []);

  /* ---------- eye movement ---------- */
  let eyeX = 0;
  let eyeY = 0;

  if (ref.current && !isPasswordFocused) {
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = mousePosition.x - cx;
    const dy = mousePosition.y - cy;

    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const MAX = 4;

    eyeX = (dx / dist) * Math.min(MAX, dist / 40);
    eyeY = (dy / dist) * Math.min(MAX, dist / 40);
  }

  /* ---------- smile ---------- */
  const smile = happiness > 70 ? "◡‿◡" : happiness > 30 ? "◡" : "︶";

  return (
    <motion.div
      ref={ref}
      animate={{ y: [0, -6, 0] }}
      transition={{ repeat: Infinity, duration: 3 }}
      style={{
        width: s.w,
        height: s.h,
        borderRadius: "999px",
        background: s.bg,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* ears (only teal) */}
      {s.ears && (
        <>
          <div className="ear left-ear" />
          <div className="ear right-ear" />
        </>
      )}

      {/* 👀 EYES — NOW FOR ALL TYPES (INCLUDING YELLOW) */}
      {!isPasswordFocused && (
        <div
          className={`eyes ${type === "long" ? "eyes-long" : ""} ${
            blink ? "blink" : ""
          }`}
        >
          {[1, 2].map((i) => (
            <div className="eye" key={i}>
              <div
                className="pupil"
                style={{
                  transform: `translate(${eyeX}px, ${eyeY}px)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* password focus */}
      {isPasswordFocused && <div className="cover-eyes">🙈</div>}

      {/* smile (only pink) */}
      {s.mouth && !isPasswordFocused && <div className="mouth">{smile}</div>}

      {/* focus glow */}
      {isAnyInputFocused && (
        <motion.div
          className="focus-ring"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}
    </motion.div>
  );
}
