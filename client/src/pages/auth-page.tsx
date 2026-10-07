import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/auth-context";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, register, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      if (isRegister) await register({ name, email, password }); else await login({ email, password });
      navigate("/dashboard");
    } catch { /* The context exposes the safe API error to the form. */ }
  }
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">RoleScout</p><h1>{isRegister ? "Create your account" : "Welcome back"}</h1><p className="muted">Find jobs that actually match you.</p><form onSubmit={handleSubmit}>{isRegister && <label>Name<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} /></label>}<label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></label>{error && <p className="form-error" role="alert">{error.message}</p>}<button className="primary-button" type="submit">{isRegister ? "Create account" : "Log in"}</button></form><p className="muted">{isRegister ? "Already have an account?" : "New to RoleScout?"} <Link to={isRegister ? "/login" : "/register"} state={location.state}>{isRegister ? "Log in" : "Create an account"}</Link></p></section></main>;
}
