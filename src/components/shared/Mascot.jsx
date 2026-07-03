import React, { useState, useEffect, useCallback, useRef } from "react";
import chikkuImg from "../../assets/mascot.png";
import chikkuBackImg from "../../assets/mascotback.png";
import "./Mascot.css";

// Animation phases:
// 'idle'      -> Normal state, dancing
// 'flipping'  -> Front → Back (0.7s)
// 'flyingOut' -> Back face flies up-left (0.8s)
// 'hidden'    -> Completely hidden
// 'flyingIn'  -> Back face flies down from up-left (0.8s)
// 'returning' -> Back → Front turn (0.7s)

function Mascot() {
  const [phase, setPhase] = useState("idle");
  const [showBubble, setShowBubble] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Entrance animation
  useEffect(() => {
    setShowBubble(true);
  }, []);

  useEffect(() => {
    const enterTimer = setTimeout(() => setHasEntered(true), 900);
    return () => clearTimeout(enterTimer);
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 150);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ===== FLY OUT SEQUENCE =====
  // Step 1: Front → Back flip (0.7s)
  // Step 2: Back face flies up-left (0.8s)
  // Step 3: Hidden
  const handleFlyOut = useCallback(() => {
    if (phaseRef.current !== "idle") return; // Prevent double trigger

    setShowBubble(false);
    setPhase("flipping");

    setTimeout(() => {
      setPhase("flyingOut");

      setTimeout(() => {
        setPhase("hidden");
      }, 2400); // Fly-out duration
    }, 700); // Flip duration
  }, []);

  // ===== FLY IN SEQUENCE =====
  // Step 1: Back face flies down from up-left (0.8s)
  // Step 2: Back → Front turn (0.7s)
  // Step 3: Idle (dance resumes)
  const handleFlyIn = useCallback(() => {
    if (phaseRef.current !== "hidden") return; // Prevent double trigger

    setPhase("flyingIn");

    setTimeout(() => {
      setPhase("returning");

      setTimeout(() => {
        setPhase("idle");
        setShowBubble(true);
      }, 700); // Return/flip-back duration
    }, 2400 ); // Fly-in duration
  }, []);

  // Tawk callbacks
  useEffect(() => {
    window.Tawk_API = window.Tawk_API || {};

    window.Tawk_API.onChatMaximized = () => {
      setIsChatOpen(true);
      // Small delay to ensure Tawk widget renders before we animate
      setTimeout(() => {
        if (phaseRef.current === "idle") {
          handleFlyOut();
        }
      }, 100);
    };

    window.Tawk_API.onChatMinimized = () => {
      setIsChatOpen(false);
      setTimeout(() => {
        if (phaseRef.current === "hidden") {
          handleFlyIn();
        }
      }, 100);
    };

    window.Tawk_API.onChatHidden = () => {
      setIsChatOpen(false);
      setTimeout(() => {
        if (phaseRef.current === "hidden") {
          handleFlyIn();
        }
      }, 100);
    };

    window.Tawk_API.onLoad = function () {
      if (window.Tawk_API && typeof window.Tawk_API.hideWidget === "function") {
        window.Tawk_API.hideWidget();
      }
    };

    if (window.Tawk_API && typeof window.Tawk_API.hideWidget === "function") {
      window.Tawk_API.hideWidget();
    }
  }, [handleFlyOut, handleFlyIn]);

  const openChat = () => {
    if (window.Tawk_API && typeof window.Tawk_API.toggle === "function") {
      window.Tawk_API.toggle();
    }
  };

  const handleClick = () => {
    console.log("Chikku clicked! Current phase:", phase);

    if (phase === "idle") {
      // Open chat - Tawk callback will trigger fly out
      openChat();
    } else if (phase === "hidden") {
      // Chat is closed, Chikku is hidden, reopen chat
      openChat();
    }
    // For other phases (flipping, flyingOut, flyingIn, returning), ignore clicks
  };

  // Determine CSS classes based on phase
  const getPhaseClass = () => {
    switch (phase) {
      case "flipping":
        return "mascot-phase-flipping";
      case "flyingOut":
        return "mascot-phase-flying-out";
      case "hidden":
        return "mascot-phase-hidden";
      case "flyingIn":
        return "mascot-phase-flying-in";
      case "returning":
        return "mascot-phase-returning";
      case "idle":
      default:
        return "mascot-phase-idle";
    }
  };

  const isDancing = phase === "idle" && !isChatOpen;

  return (
    <div
      className={`mascot-wrapper 
        ${getPhaseClass()} 
        ${isDancing ? "mascot-dancing" : ""} 
        ${!hasEntered ? "mascot-entering" : ""} 
        ${isScrolled ? "mascot-scrolled" : ""}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Chikku mascot - click to chat"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      {showBubble && phase === "idle" && (
        <div className="mascot-bubble">Hi, I'm Chikku! How can I help you?</div>
      )}

      <div className="mascot-flip-inner">
        <img
          src={chikkuImg}
          alt="Chikku - Radnus Mascot"
          className="mascot-face mascot-face-front"
          draggable="false"
        />
        <img
          src={chikkuBackImg}
          alt="Chikku - Radnus Mascot (back)"
          className="mascot-face mascot-face-back"
          draggable="false"
        />
      </div>
    </div>
  );
}

export default Mascot;