import { lazy, Suspense, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { MotionConfig, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileSpreadsheet,
  Link2,
} from "lucide-react";
import { SEO } from "../../components/SEO/SEO";
import { SiteHeader } from "../../components/site/SiteHeader";
import { SiteFooter } from "../../components/site/SiteFooter";
import { TrialButton } from "../../components/site/TrialButton";
import { useBackendReady } from "../../hooks/useBackendWarmup";
import { API_BASE_URL } from "../../config";
import {
  EngineeringTeaser,
  ReviewChange,
  TraceWorkbench,
} from "./EngineeringStory";
import {
  homeStory,
  type ReviewState,
  type StoryStage,
} from "./home-story-content";
import "./landing-story.css";
import "./home-story.css";

const RiskCalculator = lazy(() =>
  import("./RiskCalculatorWidget").then((module) => ({
    default: module.RiskCalculatorWidget,
  })),
);

export function LandingPage() {
  const { isBackendReady } = useBackendReady();
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState<StoryStage>("risk");
  const [review, setReview] = useState<ReviewState>("baseline");
  const [method, setMethod] = useState(0);
  const [showSimulator, setShowSimulator] = useState(false);
  const [contactStatus, setContactStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const offer = new URLSearchParams(window.location.search).get("offer");

  useEffect(() => {
    const target =
      new URLSearchParams(window.location.search).get("scroll") ||
      window.location.hash.slice(1);
    if (!target) return;
    if (target === "simulator") setShowSimulator(true);
    const timer = window.setTimeout(
      () =>
        document
          .getElementById(target)
          ?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth" }),
      100,
    );
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (contactStatus === "sending") return;
    const form = event.currentTarget;
    const values = new FormData(form);
    setContactStatus("sending");
    try {
      const response = await fetch(`${API_BASE_URL}/auth/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.get("name"),
          email: values.get("email"),
          company: values.get("company"),
          type: values.get("type"),
          message: values.get("message"),
        }),
      });
      if (!response.ok) throw new Error("Contact submission failed");
      setContactStatus("success");
      form.reset();
    } catch {
      setContactStatus("error");
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="fmea-story story-home">
        <SEO
          title="FMEApex — One engineering decision. The whole picture."
          description="Follow design intent through process risk, reviewed control plans and action evidence. A connected digital FMEA workspace for quality engineering teams."
          canonical="/"
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "FMEApex",
            url: "https://fmeapex.online/",
            inLanguage: "en",
            description:
              "Connected quality engineering, from design intent to verified action.",
          }}
        />
        <a className="story-skip" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main-content">
          <section
            className="home-hero home-container"
            aria-labelledby="home-title"
          >
            <div className="home-hero-copy">
              <p className="home-intro">
                <span /> Quality engineering, connected.
              </p>
              <h1 id="home-title">
                One engineering decision.
                <br />
                Follow it everywhere.
              </h1>
              <p className="home-hero-description">
                From the first design requirement to the control on your
                production line. Bring your FMEA, your team and the decisions
                between them into one connected workspace.
              </p>
              <div className="home-hero-actions">
                <TrialButton />
                <a className="home-text-link" href="#sync">
                  <ArrowDown size={17} aria-hidden="true" /> Follow the thread
                </a>
              </div>
              <p className="home-trial-note">
                <Check size={14} aria-hidden="true" /> No sign-up to explore{" "}
                <span>One custom project for 24 hours</span>
              </p>
            </div>
            <EngineeringTeaser />
            <div className="home-hero-footnote">
              <span>From intent to evidence.</span>
              <p>
                DFMEA <ArrowRight /> Process flow <ArrowRight /> PFMEA{" "}
                <ArrowRight /> Control plan <ArrowRight /> Actions
              </p>
            </div>
          </section>
          <section
            id="story"
            className="home-problem home-container"
            aria-labelledby="home-problem-title"
          >
            <div>
              <h2 id="home-problem-title">
                The work is connected.
                <br />
                The files drift apart.
              </h2>
              <p>
                A requirement changes. A control is updated. Someone asks which
                version the team is working from.
              </p>
              <p>
                When the context lives in separate files, finding the answer
                becomes another job.
              </p>
            </div>
            <div
              className="home-file-story"
              aria-label="Illustrative disconnected files"
            >
              {[
                "Design_FMEA_rev4.xlsx",
                "Process_FMEA_final.xlsx",
                "Control_Plan_latest.xlsx",
              ].map((name) => (
                <div key={name}>
                  <FileSpreadsheet size={20} aria-hidden="true" />
                  <span>{name}</span>
                  <small>Separate context</small>
                </div>
              ))}
              <p>
                <Link2 size={17} aria-hidden="true" /> Follow the relationship,
                not the filename.
              </p>
            </div>
          </section>
          <section
            id="sync"
            className="home-thread-section"
            aria-labelledby="home-thread-title"
          >
            <div className="home-container">
              <div className="home-section-heading">
                <h2 id="home-thread-title">
                  One thread.
                  <br />
                  The whole engineering story.
                </h2>
                <p>
                  Select a document. Follow the same characteristic through
                  different engineering views.
                </p>
              </div>
              <TraceWorkbench
                stage={stage}
                onStage={setStage}
                applied={review === "applied"}
              />
            </div>
          </section>
          <section
            id="review"
            className="home-review-section home-container"
            aria-labelledby="home-review-title"
          >
            <div className="home-section-heading">
              <h2 id="home-review-title">
                Connected data.
                <br />
                Considered decisions.
              </h2>
              <p>
                A connection should make a change visible. Your team decides
                when it belongs in the plan.
              </p>
            </div>
            <ReviewChange
              state={review}
              onChange={(next) => {
                setReview(next);
                if (next === "applied") setStage("control");
              }}
            />
          </section>
          <section
            id="workflow"
            className="home-method-section"
            aria-labelledby="home-method-title"
          >
            <div className="home-container">
              <div className="home-section-heading">
                <h2 id="home-method-title">
                  Seven activities.
                  <br />A method you can return to.
                </h2>
                <p>
                  Organize the analysis around the AIAG &amp; VDA seven-step
                  approach. Revisit the work as your understanding develops.
                </p>
              </div>
              <div
                className="home-method-nav"
                role="group"
                aria-label="Explore the seven FMEA activities"
              >
                {homeStory.method.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    aria-pressed={method === index}
                    onClick={() => setMethod(index)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{item.title}</strong>
                  </button>
                ))}
              </div>
              <div className="home-method-description">
                <p aria-live="polite" aria-atomic="true">
                  <strong>{homeStory.method[method].title}.</strong>{" "}
                  {homeStory.method[method].description}
                </p>
                <Link to="/learn" className="home-text-link">
                  Explore the method{" "}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
          <section
            className="home-assurance home-container"
            aria-labelledby="home-assurance-title"
          >
            <h2 id="home-assurance-title">Work your team can explain.</h2>
            <div className="home-assurance-grid">
              {homeStory.assurance.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
            <div id="simulator" className="home-simulator">
              <button
                type="button"
                className="home-simulator-toggle"
                aria-expanded={showSimulator}
                aria-controls="home-risk-calculator"
                onClick={() => setShowSimulator((value) => !value)}
              >
                <span>Want to explore risk evaluation?</span>
                <span>
                  {showSimulator ? "Close calculator" : "Open risk calculator"}{" "}
                  <ArrowDown size={16} aria-hidden="true" />
                </span>
              </button>
              <div id="home-risk-calculator" hidden={!showSimulator}>
                {showSimulator && (
                  <Suspense
                    fallback={<p role="status">Loading risk calculator…</p>}
                  >
                    <RiskCalculator />
                  </Suspense>
                )}
              </div>
            </div>
          </section>
          <section
            id="contact"
            className="home-contact-section"
            aria-labelledby="home-contact-title"
          >
            <div className="home-contact home-container">
              <div className="home-contact-copy">
                <h2 id="home-contact-title">
                  Start with
                  <br />
                  the whole picture.
                </h2>
                <p>
                  Explore a reference project. Follow its connections. Then see
                  what a shared engineering story could look like for your team.
                </p>
                <TrialButton />
                <p className="home-contact-readiness" role="status">
                  <span className={isBackendReady ? "is-ready" : ""} />
                  {isBackendReady
                    ? "Workspace ready to explore"
                    : "Preparing your workspace…"}
                </p>
                <div className="home-contact-invitation">
                  <h3>Bring your own engineering challenge.</h3>
                  <p>
                    Tell us about your workflow, migration or deployment needs.
                  </p>
                  <a href="mailto:quality@fmeapex.online">
                    quality@fmeapex.online{" "}
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                </div>
              </div>
              <form
                className="home-contact-form"
                onSubmit={submitContact}
                aria-label="Contact the FMEApex team"
              >
                <h3>Let’s connect.</h3>
                <div className="home-form-row">
                  <label>
                    Your name
                    <input
                      name="name"
                      autoComplete="name"
                      required
                      maxLength={150}
                    />
                  </label>
                  <label>
                    Work email
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      spellCheck={false}
                    />
                  </label>
                </div>
                <label>
                  Company
                  <input
                    name="company"
                    autoComplete="organization"
                    maxLength={200}
                  />
                </label>
                <label>
                  What can we help with?
                  <select name="type" defaultValue="Demo Request">
                    <option>Demo Request</option>
                    <option>Excel Data Migration</option>
                    <option>Enterprise On-Premises License</option>
                    <option>Architecture &amp; Security Review</option>
                  </select>
                </label>
                <label>
                  Your message
                  <textarea
                    name="message"
                    rows={4}
                    required
                    maxLength={5000}
                    defaultValue={
                      offer ? `Please send a quote for ${offer}.` : ""
                    }
                  />
                </label>
                <button
                  type="submit"
                  className="story-button"
                  disabled={contactStatus === "sending"}
                >
                  {contactStatus === "sending" ? "Sending…" : "Send message"}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
                {contactStatus === "success" && (
                  <p role="status">
                    Your message has been sent. Thank you for getting in touch.
                  </p>
                )}
                {contactStatus === "error" && (
                  <p role="alert">
                    Your message could not be sent. Please try again or email{" "}
                    <a href="mailto:quality@fmeapex.online">
                      quality@fmeapex.online
                    </a>
                    .
                  </p>
                )}
              </form>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </MotionConfig>
  );
}
