// Render the actual frontend print adapter to synthetic HTML for offline PDF QA.
// Does not start or automate a browser and does not access engineering records.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const ts = require('typescript');
const output = path.resolve(process.argv[2] || path.join(require('node:os').tmpdir(), 'fmeapex-print-qa'));
fs.mkdirSync(output, { recursive: true });
const frontend = path.resolve(__dirname, '../../frontend');
const load = createRequire(path.join(frontend, 'package.json'));
const code = ts.transpileModule(fs.readFileSync(path.join(frontend, 'src/features/shared/engineeringDocumentExport.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
let html = '';
const adapter = {};
new Function('exports', 'require', 'module', 'window', code)(adapter, load, { exports: adapter }, {
  open: () => ({ document: { write: value => { html = value; }, close() {} } }),
});
for (const fixture of [{ type: 'dfmea', count: 30, columns: 14 }, { type: 'control-plan', count: 105, columns: 37 }]) {
  const columns = Array.from({ length: fixture.columns }, (_, i) => ({
    key: `c${i}`, label: i === 0 ? 'Stable identity' : i === 1 ? 'Operation / focus' : `Engineering field ${i}`,
  }));
  const rows = Array.from({ length: fixture.count }, (_, row) => Object.fromEntries(columns.map((c, col) => [c.key,
    col === 0 ? `QA-${String(row + 1).padStart(3, '0')}` : col === 1 ? `Authored operation ${Math.floor(row / 5) + 1}` :
      `Row ${row + 1} field ${col}: 圧力 Δ µm — actual requirement, control and reaction owner. ` +
      ((row === fixture.count - 1 && col === 2) ? 'Long reviewed engineering instruction. '.repeat(120) : 'Reviewed rationale. '.repeat((row + col) % 3)),
  ])));
  adapter.printEngineeringDocument({
    title: `Synthetic ${fixture.type} full-revision QA`, fileName: fixture.type,
    metadata: { Revision: 'QA-1', Scope: 'Synthetic fixtures only; no conformity claim', Profile: 'legacy-configured-unverified', Customer: 'Not configured' },
    columns, rows,
  });
  const file = path.join(output, `${fixture.type}.html`);
  fs.writeFileSync(file, html, 'utf8');
  console.log(`${fixture.type}: ${fixture.count} complete rows, ${Math.ceil((fixture.columns - 2) / 6)} sections → ${file}`);
}
