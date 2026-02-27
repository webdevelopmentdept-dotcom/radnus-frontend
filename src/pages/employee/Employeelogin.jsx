import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
} from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useEmployeeRegister } from "@/hooks/useEmployeeRegister";
import { useEmployeeLogin } from "@/hooks/useEmployeeLogin";
import { useNavigate } from "react-router-dom";
import { InteractiveBlob } from "@/components/InteractiveBlob";
import { motion } from "framer-motion";
import "./mission-login.css";

export default function EmployeeLogin() {
  const navigate = useNavigate();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showPassword, setShowPassword] = useState(false);
  const [xp, setXp] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [isRegister, setIsRegister] = useState(true);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const registerMutation = useEmployeeRegister();
  const loginMutation = useEmployeeLogin();

  const isPending =
    registerMutation.isPending || loginMutation.isPending;

  const watched = form.watch();

  // PASSWORD STRENGTH
  const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const password = form.watch("password") || "";
  const strength = getPasswordStrength(password);

  // XP
  useEffect(() => {
    if (!isRegister) {
      setXp(0);
      return;
    }

    let v = 0;
    if (watched.name?.length > 2) v += 50;
    if (watched.email?.includes("@")) v += 25;
    if (watched.password?.length > 5) v += 25;

    setXp(v);
  }, [watched, isRegister]);

  // Mouse
  useEffect(() => {
    const move = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // 🔥 SUBMIT
  const onSubmit = (data) => {
    console.log("🚀 FORM DATA:", data); 
    if (isRegister && data.password !== confirmPassword) return;

    // ✅ REGISTER
    if (isRegister) {
      registerMutation.mutate(data, {
        onSuccess: () => {
          // 🔥 AUTO LOGIN AFTER REGISTER
          loginMutation.mutate(
            { email: data.email, password: data.password },
            {
             onSuccess: (res) => {
  const { token, documentsCompleted, id } = res;

  if (!token) {
    setErrorMsg("Login failed after register");
    setIsRegister(false);
    return;
  }

  // ✅ SAVE ID (IMPORTANT)
  localStorage.setItem("employeeId", id);

  // ✅ SAVE TOKEN
  if (rememberMe) {
    localStorage.setItem("employeeToken", token);
  } else {
    sessionStorage.setItem("employeeToken", token);
  }

  // 🔥 MAIN FIX
  if (!documentsCompleted) {
    navigate("/employee/upload-docs"); // ✅ GO HERE FIRST
  } else {
    navigate("/employee/dashboard");
  }
},
              onError: (err) => {
                console.log("LOGIN ERROR", err);
                setErrorMsg("Auto login failed, please login");
                setIsRegister(false);
              },
            }
          );
        },

       onError: (err) => {
  const msg = err?.response?.data?.message;

  if (msg === "EMPLOYEE_EXISTS") {
    setErrorMsg("Already registered. Please login.");
    setIsRegister(false); // 🔥 switch to login
  
form.setValue("email", data.email);
  } else {
    setErrorMsg("Server error. Try again.");
  }
},
      });
    }

    // ✅ LOGIN
    else {
      loginMutation.mutate(
        { email: data.email, password: data.password },
        {
       onSuccess: (res) => {
  const { token, documentsCompleted, id } = res;

  // ✅ ADD THIS LINE
  localStorage.setItem("employeeId", id);

  if (rememberMe) {
    localStorage.setItem("employeeToken", token);
  } else {
    sessionStorage.setItem("employeeToken", token);
  }

  if (!documentsCompleted) {
    navigate("/employee/upload-docs");
  } else {
    navigate("/employee/dashboard");
  }
},

          onError: () => {
            setErrorMsg("Invalid email or password");
          },
        }
      );
    }
  };

  return (
    <Container className="py-5">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ maxWidth: "900px", margin: "0 auto" }}
      >
        <Card className="mission-card border-0 shadow">
          <Row className="g-0">
            {/* LEFT */}
            <Col lg={5} className="mission-left-panel">
              <div className="blob-container">
                {["pink", "teal", "blue", "long"].map((t) => (
                  <div key={t} className={`blob blob-${t}`}>
                    <InteractiveBlob
                      type={t}
                      mousePosition={mousePos}
                    />
                  </div>
                ))}
              </div>
            </Col>

            {/* RIGHT */}
            <Col lg={7} className="p-5 bg-white form-panel">
              <h3 className="fw-bold text-center">
                {isRegister ? "Employee Registration" : "Employee Login"}
              </h3>

              <p className="text-muted text-center">
                {isRegister
                  ? "Create your account"
                  : "Login to continue"}
              </p>

              {errorMsg && (
                <p className="text-danger text-center fw-bold">
                  {errorMsg}
                </p>
              )}

              <div className="text-center mb-3">
                <Button
                  variant="link"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setErrorMsg("");
                  }}
                >
                  {isRegister
                    ? "Already registered? Login"
                    : "New employee? Register"}
                </Button>
              </div>

              {isRegister && (
                <div className="xp-container mb-3">
                  <div className="d-flex justify-content-between small fw-bold">
                    <span>Progress</span>
                    <span>{xp}%</span>
                  </div>
                  <div className="xp-bar-bg">
                    <div
                      className="xp-fill"
                      style={{ width: `${xp}%` }}
                    />
                  </div>
                </div>
              )}

              <Form onSubmit={form.handleSubmit(onSubmit)}>
                <Row className="g-3">
                  {isRegister && (
                    <Col md={12}>
                      <Form.Control
                        {...form.register("name")}
                        placeholder="Full Name"
                      />
                    </Col>
                  )}

                  <Col md={12}>
                    <Form.Control
                      {...form.register("email")}
                      placeholder="Email"
                    />
                  </Col>

                  <Col xs={12}>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        {...form.register("password")}
                        placeholder="Password"
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="position-absolute top-50 end-0 translate-middle-y pe-3"
                        style={{ cursor: "pointer" }}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </span>
                    </div>

                    {isRegister && (
                      <div className="mt-2">
                        <small>Password Strength</small>
                        <div className="progress">
                          <div
                            className="progress-bar"
                            style={{
                              width: `${(strength / 4) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </Col>

                  {isRegister && (
                    <Col xs={12}>
                      <Form.Control
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                      />
                    </Col>
                  )}

                    {isRegister && (
  <>
    <Col md={12}>
      <Form.Control
        {...form.register("mobile")}
        placeholder="Mobile Number"
      />
    </Col>

    <Col md={12}>
      <Form.Control
        {...form.register("department")}
        placeholder="Department"
      />
    </Col>

    <Col md={12}>
      <Form.Control
        {...form.register("designation")}
        placeholder="Designation"
      />
    </Col>
  </>
)}

                  <Col xs={12}>
                    <Form.Check
                      type="checkbox"
                      label="Remember Me"
                      checked={rememberMe}
                      onChange={(e) =>
                        setRememberMe(e.target.checked)
                      }
                    />
                  </Col>

                  <Col xs={12}>
                    <Button
                      type="submit"
                      disabled={
                        isPending ||
                        (isRegister && password !== confirmPassword)
                      }
                      className="w-100"
                    >
                      {isPending ? (
                        <>
                          <Spinner size="sm" /> Processing...
                        </>
                      ) : isRegister ? (
                        "Register"
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Col>
          </Row>
        </Card>
      </motion.div>
    </Container>
  );
}