import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
import { TextEncoder } from 'node:util';
import ts from 'typescript';

// Exercise the actual browser adapter and actual XLSX library without saving files.
const front = resolve(__dirname, '../../../frontend');
const load = createRequire(resolve(front, 'package.json'));
const source = readFileSync(
  resolve(front, 'src/features/shared/engineeringDocumentExport.ts'),
  'utf8',
);
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
let html = '';
const exportsObject: any = {};
new Function(
  'exports',
  'require',
  'module',
  'window',
  'crypto',
  'TextEncoder',
  code,
)(
  exportsObject,
  load,
  { exports: exportsObject },
  {
    open: () => ({
      document: {
        write: (value: string) => {
          html = value;
        },
        close: () => {},
      },
    }),
  },
  webcrypto,
  TextEncoder,
);
describe('complete engineering document export', () => {
  it('round-trips all records, provenance, long text and Unicode in genuine XLSX', async () => {
    const text = '圧力 Δ & <test> 🐻'.repeat(4000);
    const model = {
      schemaVersion: 1,
      sourceBaselines: [{ revisionId: 'approved-source' }],
      lines: Array.from({ length: 125 }, (_, i) => ({
        id: String(i),
        description: i === 124 ? text : `Control ${i}`,
      })),
    };
    const report = {
      title: 'Complete revision',
      fileName: 'test',
      metadata: { Revision: '2.0' },
      columns: [
        { key: 'id', label: 'Line ID' },
        { key: 'description', label: 'Description' },
      ],
      rows: model.lines,
      canonicalModel: model,
    };
    const XLSX = load('xlsx'),
      book = await exportsObject.createEngineeringWorkbook(report);
    expect(book.SheetNames).toEqual([
      'Analysis',
      'Document',
      'Model',
      'Long text',
    ]);
    const bytes = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
    expect(bytes.subarray(0, 2).toString()).toBe('PK');
    const actual = await exportsObject.parseEngineeringXlsx({
      arrayBuffer: async () => bytes,
    });
    expect(actual.rows).toHaveLength(125);
    expect(actual.rows[124].Description).toBe(text);
    expect(actual.model).toEqual(model);
    expect(actual.worksheetChanged).toBe(false);
    book.Sheets.Analysis.B2 = { t: 's', v: 'Reviewed edit' };
    const changed = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
    expect(
      (
        await exportsObject.parseEngineeringXlsx({
          arrayBuffer: async () => changed,
        })
      ).worksheetChanged,
    ).toBe(true);
  });
  it('prints every row, escapes content and splits wide forms into readable sections', () => {
    html = '';
    exportsObject.printEngineeringDocument({
      title: '<unsafe>',
      metadata: { Decision: 'A & B' },
      columns: Array.from({ length: 20 }, (_, i) => ({
        key: `c${i}`,
        label: `Field ${i}`,
      })),
      rows: Array.from({ length: 101 }, (_, i) =>
        Object.fromEntries(
          Array.from({ length: 20 }, (_, c) => [
            `c${c}`,
            `row${i}-column${c}<script>`,
          ]),
        ),
      ),
    });
    expect(html).toContain('row100-column19&lt;script&gt;');
    expect(html).toContain('&lt;unsafe&gt;');
    expect(html).not.toContain('<script>');
    expect(html.match(/<section>/g)).toHaveLength(3);
  });
  it('splits oversized instructions into traceable continuation rows without losing Unicode or tail content', () => {
    const instruction = '圧力 Δ µm 🐻 '.repeat(500) + 'END-OF-INSTRUCTION';
    exportsObject.printEngineeringDocument({title:'Long instruction',metadata:{},columns:[
      {key:'id',label:'Identity'},{key:'operation',label:'Operation'},{key:'instruction',label:'Instruction'},
    ],rows:[{id:'stable-record',operation:'OP10',instruction}]});
    expect(html).toContain('Continued 2');
    expect(html).toContain('END-OF-INSTRUCTION');
    expect(html.match(/stable-record/g)!.length).toBeGreaterThan(1);
    expect(html).not.toContain('\uFFFD');
    const values = [...html.matchAll(/<tr><td>stable-record(?:<br><small>Continued \d+<\/small>)?<\/td><td>OP10<\/td><td>([\s\S]*?)<\/td><\/tr>/g)].map(match=>match[1]);
    expect(values.join('')).toBe(instruction);
  });
  it('repeats readable operation and characteristic identity alongside stable IDs on every print section', () => {
    exportsObject.printEngineeringDocument({title:'Identity',metadata:{},printIdentityKeys:['op','feature','id'],
      columns:[{key:'id',label:'Stable ID'},{key:'op',label:'Operation'},{key:'feature',label:'Characteristic'},...Array.from({length:11},(_,i)=>({key:`f${i}`,label:`Field ${i}`}))],
      rows:[{id:'line-1',op:'OP20',feature:'KPC-2'}],
    });
    expect(html.match(/<th>Operation<\/th><th>Characteristic<\/th><th>Stable ID<\/th>/g)).toHaveLength(3);
    expect(html.match(/<td>OP20<\/td><td>KPC-2<\/td><td>line-1<\/td>/g)).toHaveLength(3);
  });
});
