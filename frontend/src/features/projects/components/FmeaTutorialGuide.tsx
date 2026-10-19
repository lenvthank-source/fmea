import React, { useEffect, useRef, useState } from "react";
import { Popper } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, X } from "lucide-react";

export interface FmeaTutorialGuideProps {
  open: boolean;
  onClose: () => void;
  onSkipAll: () => void;
  projectId?: string;
}
type Hint = {
  target: string;
  title: string;
  text: string;
  field?: boolean;
  optional?: boolean;
  wait?: boolean;
};
const planning: Record<number, Hint[]> = {
  1: [
    {
      target: "part-name",
      title: "Name the program",
      text: "Enter the part or program you are analyzing. This becomes the name in your program list.",
      field: true,
    },
    {
      target: "part-number",
      title: "Identify the part",
      text: "Enter your organisation’s part number so the analysis stays traceable.",
      field: true,
    },
    {
      target: "wizard-next",
      title: "Set the program phase",
      text: "Review the phase and any optional classification fields, then click Next Step. Required fields are checked before you can continue.",
      wait: true,
    },
  ],
  2: [
    {
      target: "organisation",
      title: "Set the organisation",
      text: "Enter the organisation responsible for this analysis.",
      field: true,
    },
    {
      target: "customer",
      title: "Name the customer",
      text: "Enter the customer. Add plant and contact information where relevant.",
      field: true,
    },
    {
      target: "wizard-next",
      title: "Continue to document control",
      text: "Click Next Step once the organisation and customer details are ready.",
      wait: true,
    },
  ],
  3: [
    {
      target: "team",
      title: "Bring your team into the analysis",
      text: "Add cross-functional team members with the field’s Add button. Review drawing and document references above. Approval fields are optional at creation.",
      field: true,
      optional: true,
    },
    {
      target: "wizard-create",
      title: "Create the program",
      text: "Click Create Program to save your project. The guide continues into its process flow after the save succeeds.",
      wait: true,
    },
  ],
};
const chapters = [
  "Planning",
  "Structure",
  "Functions",
  "Failures",
  "Risk",
  "Optimization",
  "Documentation",
];
const chapterFor = (pathname: string, search: string) =>
  pathname.endsWith("/pfd")
    ? 2
    : pathname.endsWith("/pfmea")
      ? search.includes("table")
        ? 5
        : 3
      : pathname.endsWith("/linkage")
        ? 4
        : pathname === "/app/actions"
          ? 6
          : pathname.endsWith("/control-plan")
            ? 7
            : 1;

/** A coachmark follows real controls; it never submits data or completes FMEA gates. */
export const FmeaTutorialGuide: React.FC<FmeaTutorialGuideProps> = ({
  open,
  onClose,
  onSkipAll,
  projectId,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [wizard, setWizard] = useState(0);
  const [detail, setDetail] = useState(0);
  const [chapter, setChapter] = useState(() =>
    chapterFor(location.pathname, location.search),
  );
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [fieldReady, setFieldReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [canCreate, setCanCreate] = useState(true);
  const lastProject = useRef(projectId);
  if (projectId) lastProject.current = projectId;

  useEffect(() => {
    const start = (event: Event) => {
      const context = (event as CustomEvent).detail;
      setWizard(context?.wizardStep || 0);
      setDetail(0);
      setChapter(chapterFor(location.pathname, location.search));
    };
    const context = (event: Event) => {
      setWizard((event as CustomEvent).detail?.wizardStep || 0);
      setDetail(0);
    };
    window.addEventListener("fmea:open_tutorial", start);
    window.addEventListener("fmea:tour-context", context);
    return () => {
      window.removeEventListener("fmea:open_tutorial", start);
      window.removeEventListener("fmea:tour-context", context);
    };
  }, [location.pathname, location.search]);
  useEffect(() => {
    setWizard(0);
    setDetail(0);
    setChapter(chapterFor(location.pathname, location.search));
  }, [location.pathname, location.search]);
  useEffect(() => {
    if (open) sessionStorage.setItem("fmea_tour_active", "true");
    else sessionStorage.removeItem("fmea_tour_active");
    return () => sessionStorage.removeItem("fmea_tour_active");
  }, [open]);

  const workflow: Record<number, Hint> = {
    1: canCreate
      ? {
          target: "create-project",
          title: "Start with a program",
          text: "Click Create Project. We will guide you through scope, identification, and team setup before moving into the seven-step workflow.",
          wait: true,
        }
      : {
          target: "project-link",
          title: "Explore an existing program",
          text: "Your trial already has a custom program. Open a program to continue the guided engineering workflow.",
          wait: true,
        },
    2: drawerOpen
      ? {
          target: "pfd-step-save",
          title: "Define the process step",
          text: "Enter the step number and description, then complete the relevant inputs and characteristics. Click Create Step when ready; validation still applies.",
          wait: true,
        }
      : {
          target: "pfd-add-step",
          title: "Build your process structure",
          text: "Click Add Step to map an operation. Arrange the process before moving to functions. You can also review existing steps.",
          wait: true,
        },
    3: {
      target: "pfmea-add-function",
      title: "Describe the intended function",
      text: "Expand your process structure, then use Add Function beside the process or work element. Capture what it must do and the measurable requirement.",
    },
    4: {
      target: "pfmea-add-failure",
      title: "Connect causes, modes, and effects",
      text: "Use Add Failure beside a function. Review complete cause → mode → effect relationships before assessing risk.",
    },
    5: {
      target: "risk-grid",
      title: "Assess risk in the grid",
      text: "Review severity, occurrence, detection, and existing controls. Action Priority is calculated; it is not manually overridden.",
    },
    6: {
      target: "actions-workflow",
      title: "Follow through on priority risks",
      text: "Review the action owner, due date, evidence, and after-action ratings. Verification is required before closure.",
    },
    7: {
      target: "control-plan-workflow",
      title: "Review the connected documentation",
      text: "Review controls and characteristics, then follow your revision review and approval workflow. Finishing this tour does not approve the analysis.",
    },
  };
  const hint = wizard
    ? planning[wizard]?.[detail] || planning[wizard][0]
    : workflow[chapter];
  const target = hint?.target;

  useEffect(() => {
    if (!open || !target) return;
    let marked: HTMLElement | null = null;
    let lastAnchor: HTMLElement | null = null;
    const refresh = () => {
      const visible = (element: Element) => element.getClientRects().length > 0;
      const candidate =
        [
          ...document.querySelectorAll<HTMLElement>(
            '[data-tour="' + target + '"]',
          ),
        ].find(visible) ||
        (target === "create-project"
          ? [
              ...document.querySelectorAll<HTMLElement>(
                '[data-tour="project-link"]',
              ),
            ].find(visible)
          : undefined) ||
        document.querySelector<HTMLElement>("main h1, main h4");
      if (marked !== candidate) {
        marked?.classList.remove("quality-tour-target");
        marked = candidate || null;
        marked?.classList.add("quality-tour-target");
      }
      if (candidate !== lastAnchor) {
        lastAnchor = candidate || null;
        candidate?.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "instant",
        });
        setAnchor(candidate || null);
      }
      const input = candidate?.matches("input")
        ? (candidate as HTMLInputElement)
        : candidate?.querySelector<HTMLInputElement>("input");
      setFieldReady(!!input?.value.trim());
      setDrawerOpen(!!document.querySelector('[data-tour="pfd-step-save"]'));
      const create = document.querySelector<HTMLButtonElement>(
        '[data-tour="create-project"]',
      );
      if (create) setCanCreate(!create.disabled);
    };
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", refresh);
    window.addEventListener("resize", refresh);
    return () => {
      observer.disconnect();
      document.removeEventListener("input", refresh);
      window.removeEventListener("resize", refresh);
      marked?.classList.remove("quality-tour-target");
    };
  }, [open, target, location.pathname, location.search]);

  const stop = (finish = false) => {
    sessionStorage.setItem("fmea_tutorial_dismissed", "true");
    sessionStorage.removeItem("fmea_tour_active");
    if (finish) onSkipAll();
    else onClose();
    document.querySelector<HTMLElement>('[data-tour="start-guide"]')?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        sessionStorage.removeItem("fmea_tour_active");
      }
    };
    document.addEventListener("keydown", escape, true);
    return () => document.removeEventListener("keydown", escape, true);
  }, [open, onClose]);

  const nextChapter = () => {
    if (chapter === 7) {
      stop(true);
      return;
    }
    const next = chapter + 1;
    const id = projectId || lastProject.current;
    if (!id) {
      navigate("/app/projects");
      return;
    }
    const routes: Record<number, string> = {
      2: "pfd",
      3: "pfmea?tab=tree",
      4: "pfmea?tab=tree",
      5: "pfmea?tab=table",
      7: "control-plan",
    };
    setChapter(next);
    navigate(
      next === 6 ? "/app/actions" : "/app/projects/" + id + "/" + routes[next],
    );
  };
  if (!open || !hint) return null;
  return (
    <Popper
      open
      anchorEl={anchor}
      placement="bottom-start"
      popperOptions={{ strategy: "fixed" }}
      container={anchor?.closest(".MuiModal-root") || document.body}
      modifiers={[
        { name: "offset", options: { offset: [0, 12] } },
        {
          name: "flip",
          options: {
            fallbackPlacements: [
              "right-start",
              "left-start",
              "top-start",
              "bottom-start",
            ],
          },
        },
        { name: "preventOverflow", options: { padding: 12 } },
      ]}
      sx={{ zIndex: 1601, maxWidth: "calc(100vw - 24px)" }}
    >
      <section
        className="quality-coachmark"
        role="dialog"
        aria-modal="false"
        aria-label="7-step walkthrough"
      >
        <header>
          <BookOpen size={15} aria-hidden="true" />
          <span>
            Step {wizard ? 1 : chapter} of 7 ·{" "}
            {chapters[(wizard ? 1 : chapter) - 1]}
          </span>
          <button aria-label="Close walkthrough" onClick={() => stop()}>
            <X size={16} />
          </button>
        </header>
        <div aria-live="polite">
          <h2>{hint.title}</h2>
          <p>{hint.text}</p>
        </div>
        <footer>
          <button className="quality-tour-exit" onClick={() => stop()}>
            End tour
          </button>
          {wizard ? (
            <div className="quality-tour-controls">
              {detail > 0 && (
                <button
                  aria-label="Previous tip"
                  onClick={() => setDetail((value) => value - 1)}
                >
                  <ArrowLeft size={15} />
                </button>
              )}
              {hint.field ? (
                <button
                  className="quality-tour-next"
                  disabled={!hint.optional && !fieldReady}
                  onClick={() => setDetail((value) => value + 1)}
                >
                  Continue <ArrowRight size={13} />
                </button>
              ) : (
                <small>Use the highlighted button</small>
              )}
            </div>
          ) : chapter > 1 ? (
            <button className="quality-tour-next" onClick={nextChapter}>
              {chapter === 7
                ? "Finish tour"
                : !(projectId || lastProject.current)
                  ? "Choose a program"
                  : "Next: " + chapters[chapter]}{" "}
              <ArrowRight size={13} />
            </button>
          ) : (
            <small>Click the highlighted control</small>
          )}
        </footer>
      </section>
    </Popper>
  );
};
export default FmeaTutorialGuide;
