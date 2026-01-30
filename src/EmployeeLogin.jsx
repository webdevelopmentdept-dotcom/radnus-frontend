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
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useEmployeeRegister } from "@/hooks/useEmployeeRegister";
import { useEmployeeLogin } from "@/hooks/useEmployeeLogin";

import { InteractiveBlob } from "@/components/InteractiveBlob";
import { motion } from "framer-motion";
import "./components/mission-login.css";

export default function EmployeeLogin() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [xp, setXp] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  

  // REGISTER or LOGIN
  const [isRegister, setIsRegister] = useState(true);

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      email: "",
      designation: "",
      department: "",
      password: "",
    },
  });
const registerMutation = useEmployeeRegister();
const loginMutation = useEmployeeLogin();

const isPending =
  registerMutation.isPending || loginMutation.isPending;

  const watched = form.watch();

  /* XP logic */
  useEffect(() => {
    if (!isRegister) {
      setXp(0);
      return;
    }

    let v = 0;
    if (watched.name?.length > 2) v += 20;
    if (watched.email?.includes("@")) v += 20;
    if (watched.designation?.length > 2) v += 20;
    if (watched.department?.length > 2) v += 20;
    if (watched.password?.length > 5) v += 20;
    setXp(v);
  }, [watched, isRegister]);

  /* Mouse follow */
  useEffect(() => {
    const move = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  /* SUBMIT */
  const onSubmit = (data) => {
    // REGISTER
    if (isRegister) {
      registerMutation.mutate(data, {
        onSuccess: () => {
          // AUTO LOGIN
          loginMutation.mutate(
            { email: data.email, password: data.password },
            {
              onSuccess: (res) => {
                localStorage.setItem("employeeToken", res.token);
                window.location.href = "/employee/dashboard";
              },
            },
          );
        },
        onError: () => {
          alert("Already registered. Please login.");
          setIsRegister(false);
        },
      });
    }

    // LOGIN
    else {
      loginMutation.mutate(
        { email: data.email, password: data.password },
        {
          onSuccess: (res) => {
            localStorage.setItem("employeeToken", res.token);
            window.location.href = "/employee/dashboard";
          },
          onError: () => {
            alert("Login failed");
          },
        },
      );
    }
  };

  return (
    <Container className="py-5">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ maxWidth: "1000px", margin: "0 auto" }}
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
                      isPasswordFocused={isPasswordFocused}
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
                  ? "New employee? Please fill all details"
                  : "Welcome back! Login with email & password"}
              </p>

              {/* ERROR MESSAGE */}
              {errorMsg && (
                <p className="text-danger text-center fw-bold">{errorMsg}</p>
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
                    <>
                      <Col md={6}>
                        <Form.Control
                          {...form.register("name")}
                          placeholder="Name"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          {...form.register("designation")}
                          placeholder="Designation"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          {...form.register("department")}
                          placeholder="Department"
                        />
                      </Col>
                    </>
                  )}

                  <Col md={6}>
                    <Form.Control
                      {...form.register("email")}
                      placeholder="Email"
                    />
                  </Col>

                  <Col xs={12}>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      {...form.register("password")}
                      placeholder="Password"
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                    />
                  </Col>

                  <Col xs={12} className="text-center mt-3">
                    <Button type="submit" disabled={isPending}>
                      {isPending ? (
                        <Spinner size="sm" />
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
