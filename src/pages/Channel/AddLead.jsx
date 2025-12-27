import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import courseData from "./courseData";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* Load Razorpay */
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function AddLead() {
  const { darkMode } = useOutletContext();

  const defaultForm = {
    name: "",
    phone: "",
    email: "",
    course: "",
    advance: "",
  };

  const [form, setForm] = useState(defaultForm);
  const [proof, setProof] = useState(null);

  const inputStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: darkMode
      ? "2px solid rgba(180,130,255,0.7)"
      : "2px solid rgba(120,120,120,0.5)",
    background: darkMode ? "#1f1f1f" : "#ffffff",
    color: darkMode ? "#fff" : "#222",
    fontSize: "16px",
  };

  const validateForm = () => {
    if (!form.name.trim()) return toast.error("Enter Name");
    if (form.phone.length !== 10)
      return toast.error("Phone must be 10 digits");
    if (!form.course) return toast.error("Select Course");
    if (!form.advance || Number(form.advance) < 1)
      return toast.error("Enter valid amount");
    if (!proof) return toast.error("Upload ID Proof");
    return true;
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ==========================
     PAY & SUBMIT
  ========================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const loaded = await loadRazorpay();
    if (!loaded) return toast.error("Razorpay failed to load");

    const partnerId = localStorage.getItem("partnerId");
    const partnerName = localStorage.getItem("partnerName");

    if (!partnerId || !partnerName)
      return toast.error("Login again");
 const API = import.meta.env.VITE_API_BASE_URL;
    // CREATE ORDER
    const orderRes = await fetch(
      `${API}/api/payments/create-order`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: form.advance }),
      }
    );

    const orderData = await orderRes.json();
    if (!orderData.success)
      return toast.error("Payment initiation failed");

    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: "INR",
      name: "Radnus Communications",
      description: "Lead Payment",
      order_id: orderData.orderId,

      handler: async function (response) {
        const fd = new FormData();

        fd.append("name", form.name);
        fd.append("phone", form.phone);
        fd.append("email", form.email);
        fd.append("course", form.course);
        fd.append("advance", form.advance);
        fd.append("partnerId", partnerId);
        fd.append("partnerName", partnerName);

        fd.append("razorpay_payment_id", response.razorpay_payment_id);
        fd.append("razorpay_order_id", response.razorpay_order_id);
        fd.append("razorpay_signature", response.razorpay_signature);

        if (proof) fd.append("proof", proof);

        const saveRes = await fetch(
          `${API}/api/lead/add-after-payment`,
          {
            method: "POST",
            body: fd,
          }
        );

        const saveData = await saveRes.json();

        if (saveData.success) {
          toast.success("Payment successful & Lead added");
          setForm(defaultForm);
          setProof(null);
          document.querySelector("#proofInput").value = "";
        } else {
          toast.error("Payment done, lead save failed");
        }
      },

      prefill: {
        name: form.name,
        email: form.email,
        contact: form.phone,
      },

      theme: { color: "#6b11cb" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const allCourses = Object.entries(courseData).map(([id, data]) => ({
    id,
    name: data.title,
  }));


 return (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: darkMode ? "#0f0f0f" : "#f5f7fb",
      padding: "20px",
    }}
  >
    <ToastContainer />

    <div
      style={{
        width: "100%",
        maxWidth: "480px",
        background: darkMode ? "#161616" : "#ffffff",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: darkMode
          ? "0 0 25px rgba(138,43,226,0.35)"
          : "0 10px 30px rgba(0,0,0,0.12)",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: "25px",
          color: darkMode ? "#fff" : "#222",
        }}
      >
        Add New Lead
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <input
          name="name"
          placeholder="Student Name"
          style={inputStyle}
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Phone Number"
          style={inputStyle}
          onChange={handleChange}
        />

        <input
          name="email"
          placeholder="Email (optional)"
          style={inputStyle}
          onChange={handleChange}
        />

        <select
          name="course"
          style={inputStyle}
          onChange={handleChange}
        >
          <option value="">Select Course</option>
          {allCourses.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="advance"
          placeholder="Advance Amount"
          style={inputStyle}
          onChange={handleChange}
        />

        <input
          id="proofInput"
          type="file"
          accept="image/*,.pdf"
          style={{
            ...inputStyle,
            padding: "10px",
          }}
          onChange={(e) => setProof(e.target.files[0])}
        />

        <button
          type="submit"
          style={{
            marginTop: "10px",
            background: "linear-gradient(135deg, #6b11cb, #8e2de2)",
            color: "#fff",
            padding: "14px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            transition: "0.3s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.opacity = "0.9")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.opacity = "1")
          }
        >
          Pay & Submit
        </button>
      </form>
    </div>
  </div>
);


}
