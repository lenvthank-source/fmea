const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
require.extensions[".ts"] = (loaded, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  loaded._compile(compiled.outputText, filename);
};
function load(relative) {
  const filename = path.join(__dirname, relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(compiled.outputText, filename);
  return loaded.exports;
}
const { DesignContextDiagrams } = load("components/DesignContextDiagrams.tsx");
const { DesignResultsSummary } = load("components/DesignResultsSummary.tsx");
const { FailureReferenceReview } = load(
  "components/FailureReferenceReview.tsx",
);
const model = () => ({
  schemaVersion: 1,
  planning: {
    scope: "",
    boundary: "",
    team: "",
    timing: "",
    criteriaProfile: "",
  },
  parameterContext: {
    idealFunction: "Retain pressure",
    inputs: "Fluid flow",
    outputs: "Required pressure",
    noiseFactors: "Temperature",
    controlFactors: "Seal geometry",
  },
  elements: [
    {
      id: "system",
      parentId: null,
      kind: "system",
      name: "Pump <system>",
      description: "",
    },
    {
      id: "seal",
      parentId: "system",
      kind: "component",
      name: "Seal",
      description: "",
    },
    {
      id: "external",
      parentId: null,
      kind: "system",
      name: "Battery",
      description: "",
    },
    {
      id: "unrelated",
      parentId: null,
      kind: "system",
      name: "Not linked",
      description: "",
    },
  ],
  functions: [
    {
      id: "f",
      elementId: "seal",
      text: "Retain pressure",
      requirement: "Spec R1",
    },
  ],
  interfaces: [
    {
      id: "link",
      sourceId: "external",
      targetId: "seal",
      description: "Electrical interaction",
    },
  ],
  functionLinks: [],
  chains: [],
});
test("boundary uses only authored containment and interfaces and escapes user text", () => {
  const html = renderToStaticMarkup(
    React.createElement(DesignContextDiagrams, {
      data: model(),
      onFocus: () => {},
    }),
  );
  assert.match(html, /Pump &lt;system&gt;/);
  assert.match(html, /Electrical interaction/);
  assert.match(html, /Edit Battery/);
  assert.doesNotMatch(html, /Edit Not linked/);
  assert.match(html, /Accessible interface and containment list/);
  assert.match(html, /role="button" tabindex="0"/);
});
test("parameter diagram displays authored inputs and explicit missing state", () => {
  const data = model();
  data.parameterContext.outputs = "";
  const html = renderToStaticMarkup(
    React.createElement(DesignContextDiagrams, { data, onFocus: () => {} }),
  );
  assert.match(html, /Fluid flow/);
  assert.match(html, /Seal geometry/);
  assert.match(html, /Not recorded/);
});
test("results counts coverage and preserves completed versus verified distinction", () => {
  const data = model();
  data.chains = [
    {
      id: "chain",
      functionId: "f",
      focusElementId: "seal",
      mode: "Leak",
      reviewDecision: "",
      specialCharacteristicRefs: [],
      effects: [],
      causes: [
        {
          id: "cause",
          actions: [
            {
              id: "action",
              status: "completed",
              description: "Test design",
              owner: "Engineer",
            },
          ],
        },
      ],
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(DesignResultsSummary, {
      data,
      evaluations: [
        {
          chainId: "chain",
          causeId: "cause",
          severity: 8,
          ap: "H",
          revisedAp: null,
        },
      ],
      dirty: false,
      onRecord: () => {},
    }),
  );
  assert.match(html, /1\/1/);
  assert.match(html, /Completed actions awaiting review/);
  assert.match(html, /Team decision missing/);
  assert.match(html, /Recorded effectiveness decisions \(0\)/);
});
test("unsaved results never show stale High AP as current", () => {
  const html = renderToStaticMarkup(
    React.createElement(DesignResultsSummary, {
      data: model(),
      evaluations: [{ chainId: "old", causeId: "old", ap: "H" }],
      dirty: true,
      onRecord: () => {},
    }),
  );
  assert.match(html, /Save the current draft/);
  assert.doesNotMatch(html, />High-priority team review</);
});
test('historical partial reassessment is visibly unreviewed instead of labeling the missing rating unchanged',()=>{const data=model();data.chains=[{id:'chain',functionId:'f',focusElementId:'seal',mode:'Leak',reviewDecision:'',specialCharacteristicRefs:[],effects:[],causes:[{id:'cause',actions:[{id:'a',status:'verified',description:'Old assessment',owner:'Engineer',decision:'Old result',evidence:'Report',completionDate:'2026-10-20',revisedOccurrence:2,revisedDetection:null}]}]}];const html=renderToStaticMarkup(React.createElement(DesignResultsSummary,{data,evaluations:[],dirty:false,onRecord:()=>{}}));assert.match(html,/Historical partial pair/);assert.match(html,/not used for reassessed AP/);assert.doesNotMatch(html,/Unchanged/);});
test("failure relationship review exposes changed source, exact identities and explicit proposal without implicit updates", () => {
  const data = model();
  data.chains = [
    {
      id: "source",
      focusElementId: "system",
      functionId: "f",
      mode: "System mode",
      effects: [
        {
          id: "source-effect",
          text: "Changed source",
          severity: 9,
          elementId: "system",
        },
      ],
      causes: [],
    },
    {
      id: "target",
      focusElementId: "seal",
      functionId: "f",
      mode: "Seal mode",
      effects: [
        {
          id: "target-effect",
          text: "Accepted prior effect",
          severity: 8,
          elementId: "system",
        },
      ],
      causes: [],
    },
  ];
  data.failureReferences = [
    {
      id: "reference",
      sourceChainId: "source",
      sourceRole: "effect",
      sourceFailureId: "source-effect",
      targetChainId: "target",
      targetRole: "effect",
      targetFailureId: "target-effect",
      snapshot: {
        text: "Accepted prior effect",
        severity: 8,
        elementId: "system",
      },
      reviewedBy: "Reviewer",
      decision: "Accepted source",
    },
  ];
  const html = renderToStaticMarkup(
    React.createElement(FailureReferenceReview, {
      data,
      writable: false,
      onChange: () => {},
      onTrace: () => {},
    }),
  );
  assert.match(html, /Source changed/);
  assert.match(html, /source-effect/);
  assert.match(html, /target-effect/);
  assert.match(html, /Preview reviewed change/);
  assert.match(html, /never update other records automatically/);
  assert.equal(data.chains[1].effects[0].severity, 8);
});
