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
  const [rememberMe, setRememberMe] = useState(false);
  const [isRegister, setIsRegister] = useState(true);

  const form = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      mobile: "",
      department: "",
      designation: "",
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

  // Mouse tracking
  useEffect(() => {
    const move = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // SUBMIT
  const onSubmit = (data) => {
    if (isRegister) {
      registerMutation.mutate(data, {
        onSuccess: () => {
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

                localStorage.setItem("employeeId", id);

                if (rememberMe) {
                  localStorage.setItem("employeeToken", token);
                } else {
                  sessionStorage.setItem("employeeToken", token);
                }

              if (documentsCompleted === true) {
  navigate("/employee/dashboard");
} else {
  navigate("/employee/upload-docs");
}
              },
              onError: () => {
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
            setIsRegister(false);
            form.setValue("email", data.email);
          } else {
            setErrorMsg("Server error. Try again.");
          }
        },
      });
    } else {
      loginMutation.mutate(
        { email: data.email, password: data.password },
        {
          onSuccess: (res) => {
            const { token, documentsCompleted, id } = res;

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
                    <InteractiveBlob type={t} mousePosition={mousePos} />
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
                {isRegister ? "Create your account" : "Login to continue"}
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
                    <div className="xp-fill" style={{ width: `${xp}%` }} />
                  </div>
                </div>
              )}

              <Form onSubmit={form.handleSubmit(onSubmit)}>
                <Row className="g-3">

                  {isRegister && (
                    <Col md={12}>
                    <Form.Control
  {...form.register("name", {
    required: "Name is required",
    minLength: {
      value: 3,
      message: "Minimum 3 characters",
    },
    pattern: {
      value: /^[A-Za-z\s]+$/,
      message: "Only alphabets allowed",
    },
  })}
  placeholder="Full Name"
/>

<p className="text-danger">
  {form.formState.errors.name?.message}
</p>
                    </Col>
                  )}

                  <Col md={12}>
                    <Form.Control
                      {...form.register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Invalid email format",
                        },
                      })}
                      placeholder="Email"
                    />
                    <p className="text-danger">
                      {form.formState.errors.email?.message}
                    </p>
                  </Col>

                  <Col xs={12}>
                    <div className="position-relative">
  <Form.Control
    type={showPassword ? "text" : "password"}
    {...form.register("password", {
      required: "Password is required",
      minLength: {
        value: 6,
        message: "Minimum 6 characters",
      },
      pattern: {
        value: /^(?=.*[A-Z])(?=.*[0-9]).*$/,
        message: "Must include uppercase & number",
      },
    })}
    placeholder="Password"
  />

  {/* 👁️ Eye Icon */}
  <span
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "15px",
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer",
      fontSize: "18px",
    }}
  >
    {showPassword ? "🙈" : "👁️"}
  </span>
</div>

<p className="text-danger">
  {form.formState.errors.password?.message}
</p>

                    {isRegister && (
                      <div className="mt-2">
                        <small>Password Strength</small>
                        <div className="progress">
                          <div
                            className="progress-bar"
                            style={{ width: `${(strength / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Col>

                  {isRegister && (
                    <>
                      <Col xs={12}>
                        <Form.Control
                          type="password"
                          placeholder="Confirm Password"
                          {...form.register("confirmPassword", {
                            required: "Confirm your password",
                            validate: (value) =>
                              value === password ||
                              "Passwords do not match",
                          })}
                        />
                        <p className="text-danger">
                          {form.formState.errors.confirmPassword?.message}
                        </p>
                      </Col>

                      <Col md={12}>
                      <Form.Control
  type="tel"
  inputMode="numeric"
  maxLength={10}
  onInput={(e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  }}
  {...form.register("mobile", {
    required: "Mobile number required",
    pattern: {
      value: /^[6-9]\d{9}$/,
      message: "Enter valid 10-digit mobile number",
    },
  })}
  placeholder="Mobile Number"
/>

<p className="text-danger">
  {form.formState.errors.mobile?.message}
</p>
                      </Col>

                      <Col md={12}>
                        <Form.Control
                          {...form.register("department", {
                            required: "Department required",
                          })}
                          placeholder="Department"
                        />
                        <p className="text-danger">
                          {form.formState.errors.department?.message}
                        </p>
                      </Col>

                      <Col md={12}>
                        <Form.Control
                          {...form.register("designation", {
                            required: "Designation required",
                          })}
                          placeholder="Designation"
                        />
                        <p className="text-danger">
                          {form.formState.errors.designation?.message}
                        </p>
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
                      disabled={isPending || !form.formState.isValid}
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