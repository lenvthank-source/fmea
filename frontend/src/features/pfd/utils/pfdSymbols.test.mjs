import test from 'node:test';
import assert from 'node:assert/strict';
import { PFD_SYMBOLS, getPfdSymbol, isEngineeringSymbol, isManufacturingSymbolCompatible, legacyManufacturingSymbol, resolveStepSymbol, escapePfdSymbolLabel, CLASSIC_MANUFACTURING_IDS, getClassicManufacturingSymbol, getMarkerSymbol } from './pfdSymbols.ts';

test('every catalog entry has unique stable identity, accessible label, bounded ports and safe geometry', () => {
  assert.equal(new Set(PFD_SYMBOLS.map(symbol => symbol.id)).size, PFD_SYMBOLS.length);
  assert.ok(PFD_SYMBOLS.length > 100);
  for (const symbol of PFD_SYMBOLS) {
    assert.ok(symbol.label && symbol.category && symbol.svg);
    assert.equal(symbol.viewBox, '0 0 96 72');
    assert.ok(!/<script|foreignObject|on\w+\s*=|javascript:|<image|href=/i.test(symbol.svg), symbol.id);
    for (const port of ['north', 'east', 'south', 'west']) {
      const [x, y] = symbol.ports[port];
      assert.ok(Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 96 && y >= 0 && y <= 72, symbol.id);
    }
  }
});
test('equipment choice preserves activity and never infers machinery from narration', () => {
  const equipment = PFD_SYMBOLS.find(symbol => symbol.kind === 'engineering');
  const step = { stepType: 'inspection', name: 'Pump pressure test', engineeringSymbolId: equipment.id };
  assert.equal(resolveStepSymbol(step, 'engineering').symbol.id, equipment.id);
  assert.equal(resolveStepSymbol(step, 'manufacturing').symbol.id, 'manufacturing.inspection');
  assert.equal(step.stepType, 'inspection');
  const unset = resolveStepSymbol({ stepType: 'operation', name: 'Centrifugal pump' }, 'engineering');
  assert.equal(unset.symbol.id, 'manufacturing.operation');
  assert.ok(unset.findings.includes('Equipment symbol not selected'));
});
test('manufacturing selections are strictly compatible; arbitrary basic shapes cannot masquerade as equipment', () => {
  assert.equal(isManufacturingSymbolCompatible('manufacturing.inspection', 'operation'), false);
  assert.equal(isManufacturingSymbolCompatible('manufacturing.operation', 'operation'), true);
  assert.equal(isManufacturingSymbolCompatible('not-a-symbol', 'operation'), false);
  assert.equal(isEngineeringSymbol('manufacturing.operation'), false);
  assert.equal(isEngineeringSymbol(PFD_SYMBOLS.find(symbol => symbol.kind === 'basic').id), false);
  const resolved = resolveStepSymbol({ stepType: 'inspection', manufacturingSymbolId: 'manufacturing.operation' }, 'manufacturing');
  assert.equal(resolved.symbol.id, 'manufacturing.inspection');
  assert.ok(resolved.findings.length);
});
test('legacy mapping is read-only, records ambiguity and does not override declared activity', () => {
  const icons = { oper: true, trans: true, wip: true };
  const resolved = resolveStepSymbol({ stepType: 'delay', flowIcons: icons }, 'manufacturing');
  assert.equal(resolved.symbol.id, 'manufacturing.delay');
  assert.ok(resolved.findings.some(finding => finding.includes('ambiguous')));
  assert.deepEqual(icons, { oper: true, trans: true, wip: true });
  assert.deepEqual(legacyManufacturingSymbol({ oper: true, insp: true }).id, 'manufacturing.combined');
  assert.equal(legacyManufacturingSymbol({ wip: true, reject: true }).id, null);
  assert.ok(resolveStepSymbol({ stepType: 'operation', flowIcons: { insp: true } }, 'manufacturing').findings.length);
});
test('classic manufacturing symbols and markers maintain authentic outlines', () => {
  for (const id of CLASSIC_MANUFACTURING_IDS) {
    const symbol = getPfdSymbol(id);
    assert.ok(symbol, `Missing classic symbol ${id}`);
    assert.equal(symbol.kind, 'manufacturing');
    assert.ok(symbol.activityTypes?.length);
  }
  const classicRework = getPfdSymbol('manufacturing.classic.rework');
  assert.ok(!classicRework?.svg.includes('RW'), 'Classic rework must use pentagon outline, not text RW');
  assert.ok(classicRework?.svg.includes('M48 9L81 30'), 'Classic rework outline must be pentagonal');

  const baseRework = getPfdSymbol('manufacturing.rework');
  assert.ok(!baseRework?.svg.includes('RW'), 'Base rework must use pentagon outline, not text RW');

  const wip = getMarkerSymbol('wip');
  assert.ok(wip, 'WIP marker must exist in registry');
  const reject = getMarkerSymbol('reject');
  assert.ok(reject, 'Reject marker must exist in registry');
  assert.ok(reject?.svg.includes('M14 36L28 9'), 'Reject marker must use hexagonal outline');

  assert.equal(getClassicManufacturingSymbol('operation')?.id, 'manufacturing.classic.operation');
});
test('export label escaping preserves Unicode and rejects active markup as text', () => {
  assert.equal(escapePfdSymbolLabel('<script>"\'&日本'), '&lt;script&gt;&quot;&apos;&amp;日本');
  assert.equal(getPfdSymbol('missing'), undefined);
});
