import { Link, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, ShieldCheck, UploadCloud, UserPlus, Zap } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/error";

export function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedName || !normalizedEmail || !password) {
      showToast("Name, email, and password are required.", "error");
      return;
    }

    if (normalizedName.length < 2) {
      showToast("Name must be at least 2 characters.", "error");
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
      await register({ name: normalizedName, email: normalizedEmail, password });
      showToast("Account created. You can login now.", "success");
      navigate("/login");
    } catch (err) {
      const message = getErrorMessage(err, "Registration failed. Please try again.");
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-wrap">
      <div className="auth-layout">
        <aside className="auth-aside panel">
          <h2>Create Workspace Access</h2>
          <p>Set up your account to start uploading and moderating videos.</p>
          <div className="auth-points">
            <p>
              <UserPlus size={14} /> Quick onboarding in seconds
            </p>
            <p>
              <UploadCloud size={14} /> Upload and monitor media instantly
            </p>
            <p>
              <ShieldCheck size={14} /> Protected account and role-based access
            </p>
            <p>
              <Zap size={14} /> Realtime status updates after upload
            </p>
          </div>
        </aside>

        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>Create Account</h1>
          <p>Register your StreamGuard account.</p>

          <label htmlFor="name">
            Name <span className="required-mark">*</span>
          </label>
          <input id="name" value={name} onChange={(event) => setName(event.target.value)} />

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
            <UserPlus size={16} />
            {loading ? "Creating..." : "Create Account"}
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
