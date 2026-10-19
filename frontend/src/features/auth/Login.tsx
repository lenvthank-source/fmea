import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  GitBranch,
  Layers3,
  Link2,
  Network,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useBackendReady } from "../../hooks/useBackendWarmup";
import { SEO } from "../../components/SEO/SEO";
import "../../theme/quality-theme.css";

export const Login: React.FC = () => {
  const { login, token } = useAuth();
  const { isBackendReady } = useBackendReady();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    if (token) {
      navigate("/app/projects", { replace: true });
      return;
    }
    setCheckingAccess(false);
  }, [token, navigate]);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (signInLoading) return;
    setError("");
    setSignInLoading(true);
    try {
      await login(email, password, "guest-tenant");
      sessionStorage.removeItem("logged_out");
      navigate("/app/projects");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sign-in failed. Check your email and password and try again.",
      );
    } finally {
      setSignInLoading(false);
    }
  };
  const handleTryIt = () => {
    sessionStorage.removeItem("logged_out");
    navigate("/app/initializing");
  };

  return (
    <div className="quality-login">
      <SEO
        title="Sign in — FMEApex"
        description="Return to your connected FMEA workspace, or try FMEApex with a pre-filled engineering project."
        canonical="/login"
      />
      <header className="quality-login-header">
        <Link to="/" className="quality-brand" aria-label="FMEApex home">
          <span>
            <GitBranch size={21} aria-hidden="true" />
          </span>
          fmeapex
        </Link>
        <Link to="/" className="quality-back">
          <ArrowLeft size={15} aria-hidden="true" />
          Back to home
        </Link>
      </header>
      <main className="quality-login-main">
        <section
          className="quality-login-story"
          aria-label="Connected quality engineering"
        >
          <div className="quality-eyebrow">
            <span />
            Keep the whole picture.
          </div>
          <h2>
            Connected thinking.
            <br />
            Better quality.
          </h2>
          <p>
            Your structures, risks, controls, and decisions.
            <br />
            Together, from the first question to the final review.
          </p>
          <div className="quality-login-thread">
            {[
              {
                icon: Layers3,
                title: "Start with design intent",
                text: "Structures, functions & requirements",
              },
              {
                icon: Network,
                title: "Understand the relationships",
                text: "Causes, failure modes & effects",
              },
              {
                icon: Link2,
                title: "Connect the controls",
                text: "Process flow, PFMEA & control plans",
              },
              {
                icon: ShieldCheck,
                title: "Follow through on risk",
                text: "Owned actions & verified evidence",
              },
            ].map(({ icon: Icon, title, text }, index) => (
              <div key={title}>
                <span
                  className={`quality-thread-icon ${index === 2 ? "is-highlighted" : ""}`}
                >
                  <Icon size={21} aria-hidden="true" />
                </span>
                <div>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </div>
                <Check size={14} aria-hidden="true" />
              </div>
            ))}
          </div>
          <div className="quality-login-story-foot">
            <span className="quality-line" />
            From design intent to verified action.
          </div>
        </section>
        <section
          className="quality-login-panel"
          aria-labelledby="quality-sign-in-title"
        >
          {checkingAccess ? (
            <div className="quality-access-loading" role="status">
              <span className="quality-brand-icon">
                <GitBranch size={26} aria-hidden="true" />
              </span>
              <h2>Opening your workspace.</h2>
              <p>
                {isBackendReady
                  ? "Preparing your connected project…"
                  : "Connecting to FMEApex. This may take a moment…"}
              </p>
              <span className="quality-loading-line" />
            </div>
          ) : (
            <>
              <div className="quality-login-panel-heading">
                <span className="quality-section-tag">
                  Your engineering workspace
                </span>
                <h1 id="quality-sign-in-title">Welcome back.</h1>
                <p>Sign in to pick up where your team left off.</p>
              </div>
              <form onSubmit={handleSignIn} className="quality-sign-in-form">
                {error && (
                  <div className="quality-login-error" role="alert">
                    <AlertCircle size={17} aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}
                <label htmlFor="sign-in-email">Work email</label>
                <input
                  id="sign-in-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                />
                <label htmlFor="sign-in-password">Password</label>
                <div className="quality-password-field">
                  <input
                    id="sign-in-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  className="quality-primary-button"
                  type="submit"
                  disabled={signInLoading}
                >
                  {signInLoading ? "Signing in…" : "Sign in to your workspace"}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </button>
              </form>
              <div className="quality-login-divider">
                <span />
                New to FMEApex?
                <span />
              </div>
              <button
                className="quality-try-button"
                onClick={handleTryIt}
                disabled={signInLoading}
              >
                <span>Try it out</span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </button>
              <p className="quality-login-try-note">
                No sign-up. A pre-filled project, ready to explore.
              </p>
              <div className="quality-connection-status" role="status">
                <span className={isBackendReady ? "is-ready" : ""} />
                {isBackendReady
                  ? "Ready to connect"
                  : "Connecting to the workspace…"}
              </div>
            </>
          )}
        </section>
      </main>
      <footer className="quality-login-footer">
        <span>© {new Date().getFullYear()} FMEApex</span>
        <span>Connected thinking. Better quality.</span>
        <Link to="/learn">
          Explore the methodology <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
};

export default Login;
