import { Link, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LogIn, ScanSearch, ShieldCheck, Zap } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/error";

export function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail || !password) {
      showToast("Email and password are required.", "error");
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      showToast("Enter a valid email address.", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    setLoading(true);

    try {
      await login({ email: normalizedEmail, password });
      showToast("Login successful.", "success");
      navigate("/dashboard");
    } catch (err) {
      showToast(getErrorMessage(err, "Login failed. Please try again."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-wrap">
      <div className="auth-layout">
        <aside className="auth-aside panel">
          <h2>StreamGuard</h2>
          <p>Secure access to your moderation workflow.</p>
          <div className="auth-points">
            <p>
              <ShieldCheck size={14} /> Role-based dashboard access
            </p>
            <p>
              <Zap size={14} /> Realtime processing updates
            </p>
            <p>
              <ScanSearch size={14} /> Unified video review workspace
            </p>
          </div>
        </aside>

        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>Welcome Back</h1>
          <p>Sign in to continue.</p>

          <label htmlFor="email">
            Email <span className="required-mark">*</span>
          </label>
          <input id="email" value={email} onChange={(event) => setEmail(event.target.value)} />

          <label htmlFor="password">
            Password <span className="required-mark">*</span>
          </label>
          <div className="password-wrap">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="ghost-btn password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" disabled={loading}>
            <LogIn size={16} />
            {loading ? "Logging in..." : "Log In"}
          </button>

          <p className="auth-switch">
            New user? <Link to="/register">Create account</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
