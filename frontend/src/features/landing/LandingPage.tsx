import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  motion,
  MotionConfig,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  FileSpreadsheet,
  Layers3,
  Link2,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { SEO } from "../../components/SEO/SEO";
import { useAuth } from "../auth/AuthContext";
import { useBackendReady } from "../../hooks/useBackendWarmup";
import { API_BASE_URL } from "../../config";
import { ConnectedProduct } from "./ConnectedProduct";
import "./landing-story.css";
import { SiteHeader } from "../../components/site/SiteHeader";
import { SiteFooter } from "../../components/site/SiteFooter";

const RiskCalculator = lazy(() =>
  import("./RiskCalculatorWidget").then((module) => ({
    default: module.RiskCalculatorWidget,
  })),
);
const chapters = [
  {
    title: "Start with the structure.",
    description:
      "See the system, its assemblies, and every component in context. Give each function and requirement a home before you start assessing failure.",
    tag: "DFMEA · Structure & functions",
    icon: Layers3,
    detail: "System → subsystem → component",
    proof: "Every failure connects to the function it affects.",
  },
  {
    title: "Connect the failure story.",
    description:
      "Follow causes, failure modes, and effects across your analysis. Bring design characteristics into process planning, with linked PFD and PFMEA coverage.",
    tag: "PFMEA · Failure relationships",
    icon: Network,
    detail: "Cause → failure mode → effect",
    proof: "Find gaps before they become disconnected documents.",
  },
  {
    title: "Bring controls into alignment.",
    description:
      "Keep process controls and the control plan connected. A linked control or tolerance change carries through the workflow, so your team works from shared information.",
    tag: "Control plan · Shared controls",
    icon: Link2,
    detail: "Process flow ↔ PFMEA ↔ control plan",
    proof: "Less copying. More confidence in what is current.",
  },
  {
    title: "Close the loop on risk.",
    description:
      "Give priority risks an owner and a next step. Track evidence, review before-and-after ratings, and verify the work before closing an action.",
    tag: "Optimization · Verified actions",
    icon: ShieldCheck,
    detail: "Priority → owner → evidence → verification",
    proof: "A completed task becomes a traceable engineering decision.",
  },
];
const steps = [
  ["Planning", "Agree on the scope, team, timing, and objectives."],
  ["Structure", "Build the product hierarchy or map the process flow."],
  ["Functions", "Connect functions to measurable requirements."],
  ["Failures", "Link effects, failure modes, and their causes."],
  ["Risk", "Assess S/O/D and calculate Action Priority."],
  ["Optimization", "Assign actions and verify their effectiveness."],
  ["Documentation", "Communicate scope, results, and unresolved risks."],
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isBackendReady } = useBackendReady();
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const [chapter, setChapter] = useState(0);
  const [step, setStep] = useState(0);
  const [showSimulator, setShowSimulator] = useState(false);
  const [contactStatus, setContactStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible)
          setChapter(Number((visible.target as HTMLElement).dataset.chapter));
      },
      { rootMargin: "-22% 0px -30% 0px", threshold: [0, 0.3, 0.6] },
    );
    chapterRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
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
          ?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth" }),
      100,
    );
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);


  const launch = () => {
    if (token) {
      navigate("/app/projects");
      return;
    }
    sessionStorage.removeItem("logged_out");
    navigate("/app/initializing");
  };
  const submitContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
  };
  const ctaLabel = token ? "Open workspace" : "Try it out";

  return (
    <MotionConfig reducedMotion="user">
      <div className="fmea-story">
        <SEO
          title="FMEApex — Connected FMEA, from design to control"
          description="Move beyond disconnected spreadsheets. Connect DFMEA structures, PFMEA, control plans, and verified risk mitigation in one digital FMEA workspace."
          canonical="/"
          jsonLd={{'@context':'https://schema.org','@type':'WebSite',name:'FMEApex',url:'https://fmeapex.online/',inLanguage:'en',description:'Connected quality engineering, from design intent to verified action.'}}
        />
        <a className="story-skip" href="#main-content">
          Skip to content
        </a>
        <motion.div
          className="story-progress"
          style={{ scaleX: reduceMotion ? scrollYProgress : progress }}
          aria-hidden="true"
        />
        <SiteHeader />
        <main id="main-content">
          <section className="story-hero story-container">
            <motion.div
              className="story-hero-copy"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="story-intro">
                <span /> Quality engineering, connected.
              </div>
              <h1>
                Your FMEA deserves
                <br />a life beyond
                <br />
                <span className="story-headline-last">
                  the spreadsheet.
                  <svg viewBox="0 0 600 20" aria-hidden="true">
                    <path d="M4 12 Q230 -2 595 10" />
                  </svg>
                </span>
              </h1>
              <p>
                Turn isolated rows into a connected engineering story.
                <br className="story-desktop-break" /> From design intent to
                process controls and verified action,
                <br className="story-desktop-break" /> bring your entire FMEA
                into focus.
              </p>
              <div className="story-hero-actions">
                <button className="story-button" onClick={launch}>
                  {ctaLabel}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </button>
                <a className="story-text-link" href="#story">
                  <span className="story-play">
                    <ArrowDown size={16} aria-hidden="true" />
                  </span>
                  See how it connects
                </a>
              </div>
              <div className="story-hero-note">
                <Check size={14} aria-hidden="true" /> No sign-up to explore{" "}
                <span /> Pre-filled engineering project
              </div>
            </motion.div>
            <motion.div
              className="story-hero-product"
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              <ConnectedProduct />
            </motion.div>
            <div className="story-hero-bottom">
              <span>Built for the way quality actually works.</span>
              <a href="#story">
                Follow the thread <ArrowDown size={14} aria-hidden="true" />
              </a>
            </div>
          </section>
          <div className="story-discipline-strip">
            <div className="story-container">
              <span>One shared engineering context</span>
              <strong>Design FMEA</strong>
              <span className="story-strip-plus">+</span>
              <strong>Process FMEA</strong>
              <span className="story-strip-plus">+</span>
              <strong>Control plans</strong>
              <span className="story-strip-plus">+</span>
              <strong>Corrective actions</strong>
            </div>
          </div>
          <section className="story-problem story-container" id="story">
            <div className="story-section-label">
              <span className="story-line" /> The problem was never the rows.
            </div>
            <div className="story-problem-grid">
              <h2>
                It’s everything
                <br />
                between them.
              </h2>
              <div>
                <p>
                  A design changes. Someone updates the FMEA. Someone else
                  copies a control into another file. An action gets lost in an
                  email.
                </p>
                <p className="story-problem-emphasis">
                  Your engineering is connected.
                  <br />
                  Your quality tools should be, too.
                </p>
              </div>
            </div>
            <div
              className="story-file-trail"
              aria-label="Disconnected spreadsheet workflow"
            >
              <span>
                <FileSpreadsheet /> DFMEA_final.xlsx
              </span>
              <i />
              <span>
                <FileSpreadsheet /> PFMEA_v12.xlsx
              </span>
              <i />
              <span>
                <FileSpreadsheet /> Control_plan_NEW.xlsx
              </span>
              <span className="story-file-question">
                Which version has the full picture?
              </span>
            </div>
          </section>
          <section
            className="story-journey story-container"
            id="sync"
            aria-label="The connected FMEA journey"
          >
            <div className="story-journey-visual">
              <div className="story-section-label">
                <span className="story-line" /> The golden thread
              </div>
              <JourneyVisual chapter={chapter} />
              <div
                className="story-journey-dots"
                aria-label="Jump to a chapter"
              >
                {chapters.map((item, index) => (
                  <button
                    key={item.title}
                    aria-label={item.title}
                    aria-current={chapter === index ? "step" : undefined}
                    onClick={() =>
                      chapterRefs.current[index]?.scrollIntoView({
                        behavior: reduceMotion ? "instant" : "smooth",
                        block: "center",
                      })
                    }
                  >
                    <span />
                    {String(index + 1).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
            <div className="story-chapters">
              {chapters.map((item, index) => (
                <article
                  key={item.title}
                  data-chapter={index}
                  ref={(element) => {
                    chapterRefs.current[index] = element;
                  }}
                  className={`story-chapter ${chapter === index ? "is-current" : ""}`}
                >
                  <span className="story-chapter-number">
                    0{index + 1} / 04
                  </span>
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                  <div className="story-chapter-proof">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    {item.proof}
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="story-workflow" id="workflow">
            <div className="story-container">
              <div className="story-workflow-heading">
                <div>
                  <div className="story-section-label">
                    <span className="story-line" /> A method behind every
                    decision
                  </div>
                  <h2>
                    Seven steps.
                    <br />
                    One continuous workflow.
                  </h2>
                </div>
                <p>
                  Follow the AIAG-VDA 2019 methodology with structure, context,
                  and clear handoffs at every stage.
                </p>
              </div>
              <div
                className="story-step-buttons"
                role="group"
                aria-label="Explore the seven FMEA steps"
              >
                {steps.map(([name], index) => (
                  <button
                    key={name}
                    aria-pressed={step === index}
                    onClick={() => setStep(index)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {name}
                    <ChevronRight size={15} aria-hidden="true" />
                  </button>
                ))}
              </div>
              <div className="story-step-detail" aria-live="polite">
                <span>Step {step + 1}</span>
                <h3>{steps[step][0]}</h3>
                <p>{steps[step][1]}</p>
                <Link to="/learn">
                  Explore the methodology{" "}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
          <section className="story-assurance story-container">
            <div className="story-assurance-heading">
              <h2>
                Engineering judgment.
                <br />A stronger foundation.
              </h2>
              <p>
                Give your team useful intelligence, clear priorities, and a
                history they can follow.
              </p>
            </div>
            <div className="story-assurance-grid">
              <article>
                <Target />
                <h3>Risk that leads to action.</h3>
                <p>
                  Assess severity, occurrence, and detection with calculated
                  Action Priority. Keep the focus on what needs attention next.
                </p>
                <a href="#simulator" onClick={() => setShowSimulator(true)}>
                  Try the risk calculator{" "}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </article>
              <article>
                <Sparkles />
                <h3>AI supports. You decide.</h3>
                <p>
                  Review suggested failure modes and controls in context. Your
                  engineers choose what to accept, change, or reject.
                </p>
                <Link to="/product">
                  Explore the platform{" "}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </article>
              <article>
                <LockKeyhole />
                <h3>A history worth keeping.</h3>
                <p>
                  Bring review, approval, locked revisions, and evidence into
                  the same workflow. Keep decisions traceable as your analysis
                  evolves.
                </p>
                <Link to="/product">
                  See the full workflow{" "}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </article>
            </div>
            <div id="simulator" className="story-simulator">
              <button
                className="story-simulator-toggle"
                aria-expanded={showSimulator}
                aria-controls="story-calculator"
                onClick={() => setShowSimulator(!showSimulator)}
              >
                <span>
                  <CircleDot size={19} aria-hidden="true" />
                  Explore Action Priority with your own ratings
                </span>
                <span>
                  {showSimulator ? "Close calculator" : "Open calculator"}{" "}
                  {showSimulator ? <X size={17} /> : <ArrowRight size={17} />}
                </span>
              </button>
              {showSimulator && (
                <div id="story-calculator" className="story-calculator">
                  <Suspense
                    fallback={<p role="status">Loading risk calculator…</p>}
                  >
                    <RiskCalculator />
                  </Suspense>
                </div>
              )}
            </div>
          </section>
          <section className="story-contact" id="contact">
            <div className="story-container story-contact-grid">
              <div>
                <div className="story-section-label">
                  <span className="story-line" /> Your next chapter
                </div>
                <h2>
                  Less chasing files.
                  <br />
                  More engineering
                  <br />
                  confidence.
                </h2>
                <p>
                  Explore a connected project for yourself, or tell us how your
                  team works today.
                </p>
                <button
                  className="story-button story-button-light"
                  onClick={launch}
                >
                  {ctaLabel}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </button>
                <span className="story-contact-note" role="status">
                  {isBackendReady
                    ? "Workspace ready to explore"
                    : "Your workspace may take a moment to wake up."}
                </span>
              </div>
              <div className="story-contact-form">
                <h3>Let’s connect your workflow.</h3>
                <p>Talk to us about your FMEA process.</p>
                {contactStatus === "success" ? (
                  <div className="story-contact-success" role="status">
                    <CheckCircle2 />
                    <h4>Thanks for starting the conversation.</h4>
                    <p>Your inquiry has been sent to the quality team.</p>
                    <button onClick={() => setContactStatus("idle")}>
                      Send another inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={submitContact}>
                    <div className="story-form-row">
                      <label>
                        Your name
                        <input
                          required
                          name="name"
                          autoComplete="name"
                          maxLength={150}
                        />
                      </label>
                      <label>
                        Work email
                        <input
                          required
                          type="email"
                          name="email"
                          autoComplete="email"
                          spellCheck={false}
                          maxLength={254}
                        />
                      </label>
                    </div>
                    <div className="story-form-row">
                      <label>
                        Company
                        <input
                          name="company"
                          autoComplete="organization"
                          maxLength={200}
                        />
                      </label>
                      <label>
                        How can we help?
                        <select name="type" defaultValue="Demo Request">
                          <option>Demo Request</option>
                          <option>Excel Data Migration</option>
                          <option>Enterprise On-Premises License</option>
                          <option>Architecture &amp; Security Review</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      Tell us about your workflow
                      <textarea
                        name="message"
                        defaultValue={new URLSearchParams(window.location.search).get("offer") ? `Please send a quote for ${new URLSearchParams(window.location.search).get("offer")}.` : ""}
                        required
                        rows={3}
                        maxLength={5000}
                      />
                    </label>
                    {contactStatus === "error" && (
                      <p className="story-form-error" role="alert">
                        Your inquiry could not be sent. Try again or email{" "}
                        <a href="mailto:quality@fmeapex.online">
                          quality@fmeapex.online
                        </a>
                        .
                      </p>
                    )}
                    <button
                      className="story-button"
                      type="submit"
                      disabled={contactStatus === "sending"}
                    >
                      {contactStatus === "sending"
                        ? "Sending inquiry…"
                        : "Start the conversation"}
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </MotionConfig>
  );
};

const JourneyVisual: React.FC<{ chapter: number }> = ({ chapter }) => {
  const content = chapters[chapter];
  const Icon = content.icon;
  return (
    <div className="story-thread-visual">
      <div className="story-thread-top">
        <span>
          <span className="story-status-dot" /> Connected project
        </span>
        <span>Illustrative workflow</span>
      </div>
      <div className="story-thread-nodes">
        {chapters.map((item, index) => {
          const NodeIcon = item.icon;
          return (
            <div
              key={item.tag}
              className={`story-thread-node ${index <= chapter ? "is-linked" : ""} ${index === chapter ? "is-active" : ""}`}
            >
              <span className="story-thread-node-icon">
                <NodeIcon size={21} aria-hidden="true" />
              </span>
              <div>
                <small>
                  {
                    [
                      "Design intent",
                      "Process risk",
                      "Shared controls",
                      "Verified action",
                    ][index]
                  }
                </small>
                <strong>
                  {
                    [
                      "DFMEA structure",
                      "PFD & PFMEA",
                      "Central control plan",
                      "Risk mitigation",
                    ][index]
                  }
                </strong>
              </div>
              {index < chapter ? (
                <Check size={18} aria-hidden="true" />
              ) : (
                <span className="story-node-index">0{index + 1}</span>
              )}
            </div>
          );
        })}
      </div>
      <motion.div
        key={chapter}
        className="story-thread-caption"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Icon size={18} aria-hidden="true" />
        <div>
          <strong>{content.tag}</strong>
          <p>{content.detail}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
