import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function ThankYou() {
  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: "AW-16969684439/pIfGCL35lLwbENer45s_",
      });
      console.log("🔥 Thank-you conversion fired!");
    }
  }, []);

  return (
    <div className="text-center p-5" style={{ minHeight: "60vh" }}>
      <h1 className="text-success">Thank You!</h1>
      <p>Your form was submitted successfully.</p>

      {/* ⭐ NEW BUTTON TO GO BACK HOME ⭐ */}
      <Link to="/academy" className="btn btn-danger mt-3 px-4 fw-bold">
        ← Back to Academy
      </Link>
    </div>
  );
}
