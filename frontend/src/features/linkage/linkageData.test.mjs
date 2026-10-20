import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePfmeaRows,
  normalizeControls,
  controlOperationKey,
  controlsForPfmeaRow,
} from "./linkageData.ts";

test("normalizes real junction objects and preserves every authored effect/cause/function", () => {
  const [row] = normalizePfmeaRows(
    {
      data: [
        {
          id: "row",
          processStepId: "operation",
          functions: [
            { function: { id: "f1", name: "First" } },
            { function: { id: "f2", name: "Second" } },
          ],
          failureModes: [{ failureMode: { id: "m", name: "Mode" } }],
          effects: [{ effect: { id: "e", name: "Effect" } }],
          causes: [{ cause: { id: "c", name: "Cause" } }],
        },
      ],
    },
    "revision",
  );
  assert.deepEqual(
    row.functions.map((value) => value.name),
    ["First", "Second"],
  );
  assert.equal(row.failureModes[0].name, "Mode");
  assert.equal(row.effects[0].name, "Effect");
  assert.equal(row.causes[0].name, "Cause");
});
test("canonical controls retain explicit source revisions and all105lines; preserved legacy shape remains readable", () => {
  const canonical = normalizeControls({
    document: {
      lines: Array.from({ length: 105 }, (_, index) => ({
        id: `line-${index}`,
        operationId: "op",
        characteristicName: `Char${index}`,
        controlMethod: "Method",
        source: { revisionId: "old", pfmeaRowId: "row" },
      })),
    },
  });
  assert.equal(canonical.length, 105);
  assert.equal(canonical[104].characteristicName, "Char104");
  assert.equal(canonical[0].sourceRevisionId, "old");
  const [legacy] = normalizeControls({
    data: [
      {
        id: "legacy",
        processStepId: "legacy-op",
        processStep: { stepNumber: "10", name: "Inspect" },
        characteristic: { name: "Diameter" },
        controlMethod: "Gauge",
      },
    ],
  });
  assert.equal(legacy.operationId, "legacy-op");
  assert.equal(legacy.characteristicName, "Diameter");
  assert.equal(legacy.sourceState, "manual");
});
test("historicalsource rows cannot link to current analysis despite matching IDs/names", () => {
  const [control] = normalizeControls({
    document: {
      lines: [
        {
          id: "line",
          operationId: "old-op",
          operationName: "Assembly",
          source: { revisionId: "old", pfmeaRowId: "row" },
        },
      ],
    },
  });
  const current = normalizePfmeaRows(
    [{ id: "row", processStepId: "new-op" }],
    "new",
  )[0];
  assert.equal(controlsForPfmeaRow([control], current).length, 0);
  const contexts = [
    {
      revisionId: "old",
      steps: [{ id: "old-op", name: "Assembly", stepNumber: "10" }],
    },
    {
      revisionId: "new",
      steps: [{ id: "new-op", name: "Assembly", stepNumber: "10" }],
    },
  ];
  assert.equal(controlOperationKey(control, contexts, ["old"]), "old:old-op");
  assert.equal(controlOperationKey(control, [contexts[1]], ["old"]), null);
});
test("manual controls require exact operation identities within selected baselines", () => {
  const [control] = normalizeControls([
    { id: "line", operationId: "unknown", operationName: "Same name" },
  ]);
  const contexts = [
    {
      revisionId: "baseline",
      steps: [{ id: "actual", name: "Same name", stepNumber: "10" }],
    },
  ];
  assert.equal(controlOperationKey(control, contexts, ["baseline"]), null);
  control.operationId = "actual";
  assert.equal(controlOperationKey(control, contexts, ["other"]), null);
  assert.equal(
    controlOperationKey(control, contexts, ["baseline"]),
    "baseline:actual",
  );
});
test("malformedfailed responses are errors rather than silentlyempty data", () => {
  assert.throws(() => normalizeControls({ message: "Forbidden" }));
  assert.throws(() => normalizePfmeaRows({ message: "Forbidden" }, "revision"));
});

test("even explicit row references require matching operation and a nonremoved source", () => {
  const [row] = normalizePfmeaRows(
    [{ id: "row", processStepId: "operation" }],
    "revision",
  );
  const [control] = normalizeControls({
    document: {
      lines: [
        {
          id: "line",
          operationId: "wrong-operation",
          source: { revisionId: "revision", pfmeaRowId: "row" },
        },
      ],
    },
  });
  assert.equal(controlsForPfmeaRow([control], row).length, 0);
  control.operationId = "operation";
  assert.equal(controlsForPfmeaRow([control], row).length, 1);
  control.sourceState = "removed";
  assert.equal(controlsForPfmeaRow([control], row).length, 0);
  assert.equal(
    controlOperationKey(
      control,
      [
        {
          revisionId: "revision",
          steps: [{ id: "operation", stepNumber: "10", name: "Operation" }],
        },
      ],
      ["revision"],
    ),
    null,
  );
});
