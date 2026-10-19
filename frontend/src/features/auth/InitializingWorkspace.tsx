import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowUpRight, GitBranch } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useBackendReady } from "../../hooks/useBackendWarmup";
import "../../theme/quality-theme.css";

/** The explicit Try route initializes a guest; protected-route loading only waits. */
export const InitializingWorkspace: React.FC<{ initializeGuest?: boolean }> = ({
  initializeGuest = false,
}) => {
  const { token, isHydrating, guestLogin } = useAuth();
  const { isBackendReady } = useBackendReady();
  const navigate = useNavigate();
  const started = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!initializeGuest || isHydrating) return;
    if (token) {
      navigate("/app/projects", { replace: true });
      return;
    }
    if (started.current) return;
    started.current = true;
    guestLogin().catch(() =>
      setError(
        "We could not connect to your workspace. Please try again in a moment.",
      ),
    );
  }, [initializeGuest, isHydrating, token, guestLogin, navigate, attempt]);
  return (
    <main
      className="quality-login"
      style={{ alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <section
        className="quality-login-panel quality-access-loading"
        style={{ width: "100%", maxWidth: 440 }}
        aria-labelledby="workspace-loading-title"
      >
        <span className="quality-brand-icon">
          <GitBranch size={26} aria-hidden="true" />
        </span>
        <h1
          id="workspace-loading-title"
          style={{
            fontFamily: "var(--ff-heading)",
            fontSize: 25,
            fontWeight: 550,
            letterSpacing: "-0.04em",
            marginTop: 25,
          }}
        >
          {error ? "Let’s try that again." : "Opening your workspace."}
        </h1>
        {error ? (
          <>
            <div
              className="quality-login-error"
              role="alert"
              style={{ marginTop: 24 }}
            >
              <AlertCircle size={18} aria-hidden="true" />
              {error}
            </div>
            <button
              className="quality-primary-button"
              onClick={() => {
                started.current = false;
                setError("");
                setAttempt((value) => value + 1);
              }}
            >
              Try again
              <ArrowUpRight size={17} aria-hidden="true" />
            </button>
          </>
        ) : (
          <div role="status">
            <p>
              {isBackendReady
                ? "Preparing your connected engineering project…"
                : "Connecting to FMEApex. This may take a moment…"}
            </p>
            <span className="quality-loading-line" />
          </div>
        )}
        <Link to="/" className="quality-back" style={{ marginTop: 28 }}>
          <ArrowLeft size={14} aria-hidden="true" />
          Back to home
        </Link>
      </section>
    </main>
  );
};
