export const homeStory = {
  project: "E-vacuum pump",
  characteristic: "Bearing alignment",
  originalControl: "In-station alignment check",
  proposedControl: "Automated alignment gauge",
  stages: [
    {
      id: "design",
      document: "DFMEA",
      title: "Design intent",
      description:
        "Give functions and requirements a place in the product structure.",
      relation:
        "A design requirement gives the process team context. Its downstream links are explicitly reviewed.",
    },
    {
      id: "process",
      document: "PFD",
      title: "Process flow",
      description: "See where the work happens and how operations connect.",
      relation:
        "The operation keeps its identity across the process flow, analysis and control plan.",
    },
    {
      id: "risk",
      document: "PFMEA",
      title: "Process risk",
      description:
        "Follow a cause, its failure mode and the effect that matters.",
      relation:
        "Prevention and detection controls belong to a specific cause, with their own engineering evaluation.",
    },
    {
      id: "control",
      document: "Control plan",
      title: "Production control",
      description:
        "Bring the characteristic and its execution decisions into focus.",
      relation:
        "Source changes are proposed for review. Control-plan decisions stay intact until the change is resolved.",
    },
    {
      id: "action",
      document: "Actions",
      title: "Verified action",
      description:
        "Keep responsibility, evidence and effectiveness review together.",
      relation:
        "An action needs evidence and review. Completing a task does not automatically reduce its risk rating.",
    },
  ] as const,
  method: [
    {
      title: "Planning",
      description:
        "Agree on the scope, team, timing and boundaries of the analysis.",
    },
    {
      title: "Structure",
      description:
        "Organize the design hierarchy or map the manufacturing process.",
    },
    {
      title: "Functions",
      description: "Connect the intended functions to measurable requirements.",
    },
    {
      title: "Failures",
      description:
        "Build explicit relationships between effects, modes and causes.",
    },
    {
      title: "Risk",
      description:
        "Evaluate severity, occurrence and detection using the applicable criteria.",
    },
    {
      title: "Optimization",
      description:
        "Assign work, capture implementation evidence and review effectiveness.",
    },
    {
      title: "Documentation",
      description:
        "Communicate the results, decisions and risks that still need attention.",
    },
  ],
  assurance: [
    {
      title: "Review the change.",
      description:
        "See what a source update would change before applying it to the control plan. Keep execution decisions in the hands of your team.",
    },
    {
      title: "Keep the history.",
      description:
        "Work in drafts, submit for review and protect approved revisions. New work starts from a traceable baseline.",
    },
    {
      title: "Show the evidence.",
      description:
        "Connect actions to owners, implementation evidence and effectiveness review. Make the reasoning behind a decision easier to follow.",
    },
  ],
};

export type StoryStage = (typeof homeStory.stages)[number]["id"];
export type ReviewState = "baseline" | "proposed" | "applied";
