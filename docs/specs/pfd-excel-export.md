# PFD Excel Export — Formatting Implementation Spec

## 1. Objective
Upgrade the existing PFD (Process Flow Diagram) Excel export so that instead of a raw data dump, it produces a professional engineering document suitable for customer submission, APQP, and PPAP packages — matching the target layout (`target_pfd_format.jpg`) while preserving the existing data model, row order, and process hierarchy shown in the application UI (`image.jpg`).

**Do not modify:** exported data, row sequence, process hierarchy, numbering, operation names.
**Only modify:** formatting, layout, borders, alignment, spacing, column widths, row heights.

---

## 2. Problems in Current Export (`EXCEL_REPOT_260726.jpg`)
- No borders on any cell
- No merged header/title block
- Top-left alignment everywhere (no vertical centering)
- Uneven column widths, cramped or overly wide cells
- No distinction between title block, info block, and data table
- No wrap text — long text overflows instead of wrapping
- No freeze panes, no autofilter
- No print layout configuration
- Looks like raw exported rows, not a formatted report

---

## 3. Target Structure (`target_pfd_format.jpg`)
The worksheet must be organized into four visual blocks, top to bottom:

1. **Title Block** — company name, document type, revision/status — merged across all columns, centered, bold.
2. **Info Grid** — 6 rows x 2 label/value pairs (Organisation Name, Customer Name, Manufacturing Plant, Document Number, Subject/Part Name, Part Number, Revision, Origination Date, Dwg No., Dwg Rev No/Date, Assy Line No., CFT Members). Each label+value is a merged 2-cell block, bordered.
3. **Process Table** — main data table with header row (Step #, Process Description, Incoming Source of Variation, Spec Class, Flow Symbols, Machines/Equipment/Docs, Desired Outcome, Process Characteristics), bordered, wrapped text, auto row height.
4. **Footer** — legend row (flow symbol definitions) + signature row (Prepared By / Checked By / Approved By).

---

## 4. Column Definitions

| # | Column | Width (approx) | Alignment (horizontal) |
|---|--------|-----------------|--------------------------|
| A | Step # | 9 | center |
| B | Process Description | 22 | left |
| C | Incoming Source of Variation | 26 | left |
| D | Spec Class | 10 | center |
| E | Flow Symbols | 20 | center |
| F | Machines / Equipment / Docs | 26 | left |
| G | Desired Outcome | 30 | left |
| H | Process Characteristics | 30 | left |

All cells: vertical alignment = middle. Wrap text = true for text-heavy columns (B, C, F, G, H).

---

## 5. Styling Rules

### Fonts
- Font family: Calibri (fallback Arial/Aptos)
- Title block: 14pt bold (main title), 12pt bold (subtitle), 11pt italic (status/revision note)
- Info grid labels: 11pt bold
- Info grid values: 11pt regular
- Table header: 11pt bold
- Table body: 11pt regular
- Legend/footer: 10pt italic

### Borders
- All data/info cells: thin border (`FF000000`), all 4 sides
- Table header row: medium/thick border, all sides
- Outer border of entire table (first row to last row, first col to last col): medium thickness
- Signature row: thin border box around each label/value pair
- No floating/borderless cells anywhere in the used range

### Fill
- Table header row: light grey solid fill (`FFD9D9D9`)
- Title/info block: no fill (white), unless matching existing app theme

### Alignment Summary
- Step # → center, middle
- Spec Class → center, middle
- Process Description, Incoming Source of Variation, Machines/Equipment/Docs, Desired Outcome, Process Characteristics → left, middle, wrap text
- Header row → center, middle, bold
- Info grid labels → left, middle, indent 1
- Info grid values → left, middle, indent 1, wrap text

### Row Heights
- Title rows: 20–22
- Info grid rows: 20
- Table header row: 30
- Table data rows: dynamic = `max(20, maxLinesInAnyCell * 15)` — computed from the longest wrapped text in that row across all columns
- Legend row: 20
- Signature row: 25

### Merged Cells
- Title rows: merge A:H per row
- Info grid: merge each label into 2 cells (e.g., A:B), each value into 2 cells (e.g., C:D), repeated for the second label/value pair (E:F, G:H)
- Legend row: merge A:H
- Signature row: merge label+blank pairs (A:B, C:D, E:F, G:H)
- Do not merge cells inside the main process table — each of the 8 columns stays separate per row.

---

## 6. Hierarchy Preservation Rules
- Iterate the existing `steps` array in original order — no sorting, no flattening, no grouping changes.
- Multi-value fields (e.g., Incoming Source of Variation, Machines/Equipment/Docs, Desired Outcome, Process Characteristics) that are arrays must be rendered as numbered multi-line text within a single cell using `\n` line breaks (e.g., "1. Child part variation\n2. Fixture\n3. Pokayoke"), with wrap text enabled — this preserves sub-item hierarchy without adding extra rows or columns.
- Step numbering (OP10, OP20, etc.) must be output exactly as stored — no renumbering or recalculation.

---

## 7. Workbook Behavior

### Freeze Panes
- Freeze all rows above and including the table header row so column titles stay visible when scrolling through data rows.

### AutoFilter
- Apply Excel autoFilter to the header row range only (8 columns).

### Print / Page Setup
- Orientation: landscape
- Fit to width: 1 page; fit to height: 0 (auto/multi-page allowed vertically)
- Margins: left/right 0.3", top/bottom 0.4", header/footer 0.2"
- Print area: entire used range (title block through signature row)
- Repeat header row on every printed page (`printTitlesRow` = the table header row index)

### Performance
- All formatting must be applied inline during cell/row creation in a single pass through the data (O(n) complexity) — no separate post-processing pass over the generated workbook.
- Must scale to hundreds of rows without measurable slowdown.

---

## 8. Reference Implementation (Node.js / ExcelJS)

```javascript
const ExcelJS = require('exceljs');

const FONT = 'Calibri';
const BORDER = { style: 'thin', color: { argb: 'FF000000' } };
const THICK_BORDER = { style: 'medium', color: { argb: 'FF000000' } };
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };

function allBorders(style = BORDER) {
  return { top: style, left: style, bottom: style, right: style };
}

async function exportPFDReport(pfdData, outputPath) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PFD System';
  wb.created = new Date();

  const ws = wb.addWorksheet('PFD', {
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    }
  });

  const COLS = ['Step #', 'Process Description', 'Incoming Source of Variation',
    'Spec Class', 'Flow Symbols', 'Machines / Equipment / Docs',
    'Desired Outcome', 'Process Characteristics'];

  ws.columns = [
    { width: 9 },  { width: 22 }, { width: 26 },
    { width: 10 }, { width: 20 }, { width: 26 },
    { width: 30 }, { width: 30 }
  ];

  // ---- TITLE BLOCK ----
  ws.mergeCells('A1:H1');
  ws.getCell('A1').value = 'PADMINI VNA MECHATRONICS PRIVATE LIMITED';
  styleTitle(ws.getCell('A1'), 14);

  ws.mergeCells('A2:H2');
  ws.getCell('A2').value = 'Process Flow Diagram (PFD)';
  styleTitle(ws.getCell('A2'), 12);

  ws.mergeCells('A3:H3');
  ws.getCell('A3').value = `(${pfdData.status || 'Prototype'})`;
  styleTitle(ws.getCell('A3'), 11, false, true);

  // ---- LABEL / VALUE BLOCK ----
  const infoRows = [
    ['Organisation Name:', pfdData.orgName, 'Customer Name:', pfdData.customerName],
    ['Manufacturing Plant:', pfdData.plant, 'Document Number:', pfdData.docNumber],
    ['Subject (Part Name):', pfdData.partName, 'Part Number:', pfdData.partNumber],
    ['Revision:', pfdData.revision, 'Origination Date:', pfdData.originationDate],
    ['Dwg No.:', pfdData.dwgNo, 'Dwg Rev No / Date.:', pfdData.dwgRev],
    ['Assy. Line No.:', pfdData.assyLine, 'CFT Members:', pfdData.cftMembers],
  ];

  let r = 4;
  infoRows.forEach(([l1, v1, l2, v2]) => {
    ws.mergeCells(`A${r}:B${r}`);
    ws.getCell(`A${r}`).value = l1;
    styleLabel(ws.getCell(`A${r}`));

    ws.mergeCells(`C${r}:D${r}`);
    ws.getCell(`C${r}`).value = v1 || '';
    styleValue(ws.getCell(`C${r}`));

    ws.mergeCells(`E${r}:F${r}`);
    ws.getCell(`E${r}`).value = l2;
    styleLabel(ws.getCell(`E${r}`));

    ws.mergeCells(`G${r}:H${r}`);
    ws.getCell(`G${r}`).value = v2 || '';
    styleValue(ws.getCell(`G${r}`));

    ws.getRow(r).height = 20;
    r++;
  });

  // ---- TABLE HEADER ----
  const headerRowIdx = r;
  const headerRow = ws.getRow(headerRowIdx);
  COLS.forEach((title, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = title;
    cell.font = { name: FONT, size: 11, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = HEADER_FILL;
    cell.border = allBorders(THICK_BORDER);
  });
  headerRow.height = 30;
  ws.views = [{ state: 'frozen', ySplit: headerRowIdx }];
  ws.autoFilter = { from: { row: headerRowIdx, column: 1 }, to: { row: headerRowIdx, column: 8 } };

  r = headerRowIdx + 1;

  // ---- DATA ROWS ----
  pfdData.steps.forEach((step) => {
    const row = ws.getRow(r);
    const values = [
      step.stepNo,
      step.processDescription,
      arrToText(step.incomingVariation),
      step.specClass,
      step.flowSymbols,
      arrToText(step.machinesEquipment),
      arrToText(step.desiredOutcome),
      arrToText(step.processCharacteristics)
    ];

    values.forEach((val, i) => {
      const cell = row.getCell(i + 1);
      cell.value = val;
      cell.font = { name: FONT, size: 11 };
      cell.border = allBorders(BORDER);
      cell.alignment = {
        vertical: 'middle',
        wrapText: true,
        horizontal: (i === 0 || i === 3) ? 'center' : 'left'
      };
    });

    const maxLines = Math.max(...values.map(v => String(v || '').split('\n').length));
    row.height = Math.max(20, maxLines * 15);
    r++;
  });

  const lastDataRow = r - 1;
  applyOuterBorder(ws, headerRowIdx, 1, lastDataRow, 8, THICK_BORDER);

  // ---- LEGEND ROW ----
  r += 1;
  ws.mergeCells(`A${r}:H${r}`);
  ws.getCell(`A${r}`).value =
    'LEGEND:  Transportation: TRNS (⇨)  |  Storage: STR (▽)  |  Work-In Progress: WIP (⊙)  |  ' +
    'Operation: OPER (○)  |  Inspection: INSP (▭)  |  Decision: DEC (◇)  |  Rework: REW (⬠)  |  Reject: REJ (⬡)';
  ws.getCell(`A${r}`).font = { name: FONT, size: 10, italic: true };
  ws.getCell(`A${r}`).alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(r).height = 20;

  // ---- SIGNATURE ROW ----
  r += 1;
  ws.mergeCells(`A${r}:B${r}`); ws.getCell(`A${r}`).value = 'Prepared By:';
  ws.mergeCells(`C${r}:D${r}`);
  ws.mergeCells(`E${r}:F${r}`); ws.getCell(`E${r}`).value = 'Checked By:';
  ws.mergeCells(`G${r}:H${r}`);
  [`A${r}`, `E${r}`].forEach(addr => styleLabel(ws.getCell(addr)));
  ws.getRow(r).height = 25;
  applyOuterBorder(ws, r, 1, r, 8, BORDER);

  ws.pageSetup.printArea = `A1:H${r}`;
  ws.pageSetup.printTitlesRow = `${headerRowIdx}:${headerRowIdx}`;

  await wb.xlsx.writeFile(outputPath);
}

function styleTitle(cell, size, bold = true, note = false) {
  cell.font = { name: FONT, size, bold: !note, italic: note };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}
function styleLabel(cell) {
  cell.font = { name: FONT, size: 11, bold: true };
  cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  cell.border = allBorders(BORDER);
}
function styleValue(cell) {
  cell.font = { name: FONT, size: 11 };
  cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true };
  cell.border = allBorders(BORDER);
}
function arrToText(arr) {
  if (!arr) return '';
  return Array.isArray(arr) ? arr.map((x, i) => `${i + 1}. ${x}`).join('\n') : arr;
}
function applyOuterBorder(ws, r1, c1, r2, c2, style) {
  for (let c = c1; c <= c2; c++) {
    ws.getRow(r1).getCell(c).border = { ...ws.getRow(r1).getCell(c).border, top: style };
    ws.getRow(r2).getCell(c).border = { ...ws.getRow(r2).getCell(c).border, bottom: style };
  }
  for (let rr = r1; rr <= r2; rr++) {
    ws.getRow(rr).getCell(c1).border = { ...ws.getRow(rr).getCell(c1).border, left: style };
    ws.getRow(rr).getCell(c2).border = { ...ws.getRow(rr).getCell(c2).border, right: style };
  }
}

module.exports = { exportPFDReport };
```

---

## 9. Acceptance Checklist
- [ ] Layout matches `target_pfd_format.jpg`
- [ ] Title block merged, centered, bold
- [ ] Info grid label/value pairs merged and bordered
- [ ] Table header bold, centered, filled, thick-bordered, frozen, autofiltered
- [ ] Every cell in used range has borders (no floating/borderless cells)
- [ ] Vertical alignment = middle everywhere
- [ ] Step # and Spec Class centered; text columns left-aligned
- [ ] Wrap text enabled on text-heavy columns; row height auto-adjusts to content
- [ ] Column widths proportional, no truncation, no excess whitespace
- [ ] Font = Calibri throughout, consistent sizes per rules above
- [ ] Legend row and signature row present at bottom, matching target style
- [ ] Original data, row order, hierarchy, and numbering unchanged
- [ ] Print setup: landscape, fit-to-width, margins set, header row repeats on each page
- [ ] Freeze panes active on header row
- [ ] AutoFilter active on header row
- [ ] Formatting applied in single pass during workbook creation (no post-processing loop)
- [ ] Performs well on datasets with hundreds of rows

---

## 10. Notes for Adapting to Other Stacks
- **Java (Apache POI):** use `CellStyle`, `Sheet.addMergedRegion()`, `Row.setHeightInPoints()`, `Sheet.setColumnWidth()`, `Sheet.createFreezePane()`, `Sheet.setAutoFilter()`.
- **.NET (EPPlus):** use `ExcelRange.Merge`, `Style.Border`, `Style.Font`, `Row.Height`, `Column.Width`, `View.FreezePanes()`, `AutoFilter`.
- **Browser (SheetJS):** SheetJS Community Edition has limited styling support; use SheetJS Pro or export via a server-side library (ExcelJS/POI/EPPlus) for full formatting fidelity.
- The block structure (Title → Info Grid → Table → Legend/Signature) and the styling rules in Sections 4–7 are library-agnostic and should be replicated 1:1 regardless of implementation language.


---

## 11. Companion Script: `pfd-excel-formatter.js`

The full source of this script is embedded below in **Appendix A** so this single `.md` file is fully self-contained.

A ready-to-use, modular ExcelJS formatting script (`pfd-excel-formatter.js`) is provided alongside this spec. It is structured as small composable builder functions so it can be dropped into an existing export pipeline with minimal changes.

### File structure
- `CONFIG` — all fonts, sizes, border styles, fills, column widths, row heights, and page setup in one place. Edit values here first before touching layout logic.
- `mapStepToRowValues(step)` — the ONLY function that reads from your actual data model. Edit this if your step object field names differ from `stepNo`, `processDescription`, `incomingVariation`, `specClass`, `flowSymbols`, `machinesEquipment`, `desiredOutcome`, `processCharacteristics`.
- `buildTitleBlock()`, `buildInfoGrid()`, `buildTableHeader()`, `buildDataRows()`, `buildLegendRow()`, `buildSignatureRow()` — one function per visual section (see Section 3). Each returns the next free row index so sections stack automatically regardless of row count.
- `exportPFDReport(pfdData, outputPath)` — the entry point. Call this from your existing export/controller code.

### How to modify the script to match your exact export rules

1. **Data field mapping** — If your existing PFD object uses different property names (e.g., `step.opNo` instead of `step.stepNo`), edit only `mapStepToRowValues()`. Do not touch `buildDataRows()`.

2. **Info grid labels/values** — If your title-block metadata fields differ (e.g., you don't have `assyLine`), edit the `infoRows` array inside `buildInfoGrid()`. Keep the 4-item `[label, value, label, value]` shape per row so merges stay correct.

3. **Column set changes** — If you need to add/remove a column (e.g., add "Reaction Plan"):
   - Add/remove the title in `CONFIG.COLUMN_TITLES`
   - Add/remove the width in `CONFIG.COLUMN_WIDTHS`
   - Add/remove the corresponding field in `mapStepToRowValues()`
   - Update `CONFIG.CENTERED_COLUMN_INDEXES` if the new column needs center alignment
   - All merge ranges (`A1:H1`, `A${r}:H${r}`, etc.) must be updated from `H` to the new last column letter.

4. **Styling tweaks** (colors, fonts, border thickness) — Change only values inside `CONFIG`. Never hardcode style values inside the builder functions — this keeps a single source of truth.

5. **Row height tuning** — If text still clips with long content, increase `CONFIG.ROW_HEIGHT.DATA_LINE_HEIGHT` (currently 15pt per wrapped line).

6. **Adding a new footer section** (e.g., a "Notes" row) — Write a new `buildXxxRow(ws, startRow)` function following the same pattern as `buildLegendRow`, call it in `exportPFDReport()` in the correct order, and use its return value to keep row-tracking consistent.

7. **Multi-sheet or multi-part-number batch export** — Wrap `exportPFDReport()` in a loop, calling `wb.addWorksheet()` per part inside a shared workbook if a single file with multiple PFDs is required (currently one call = one workbook = one PFD).

### Integration example

```javascript
const { exportPFDReport } = require('./pfd-excel-formatter');

async function handlePFDExportRequest(req, res) {
  const pfdData = await getPFDDataFromDB(req.params.pfdId); // your existing data fetch — DO NOT CHANGE
  const filePath = `./tmp/PFD_${pfdData.docNumber}.xlsx`;

  await exportPFDReport(pfdData, filePath);

  res.download(filePath);
}
```

### Validation before deployment
- Run against a small PFD (2–3 steps) and a large PFD (100+ steps) to confirm row-height auto-sizing and performance both hold up.
- Open the generated file in Excel (not just a viewer) to confirm freeze panes, autofilter, and print preview all render correctly.
- Confirm no data values were altered by diffing the exported cell values against the source `pfdData.steps` array.


---

## Appendix A: Full Source — `pfd-excel-formatter.js`

Save this block as `pfd-excel-formatter.js` in your project.

```javascript
/**
 * pfd-excel-formatter.js
 * ----------------------------------------------------------------------
 * Standalone formatting module for PFD (Process Flow Diagram) Excel export.
 * Library: ExcelJS
 *
 * USAGE:
 *   const { exportPFDReport } = require('./pfd-excel-formatter');
 *   await exportPFDReport(pfdData, './output/PFD_Report.xlsx');
 *
 * DO NOT reorder, filter, or renumber `pfdData.steps` before passing it in.
 * This module only applies FORMATTING. All data/hierarchy must already be
 * final and in the correct order before calling exportPFDReport().
 * ----------------------------------------------------------------------
 */

const ExcelJS = require('exceljs');

// ============================================================
// CONFIG — edit these constants to retune the look without
// touching the layout logic below.
// ============================================================
const CONFIG = {
  FONT: 'Calibri',
  BORDER_THIN: { style: 'thin', color: { argb: 'FF000000' } },
  BORDER_THICK: { style: 'medium', color: { argb: 'FF000000' } },
  HEADER_FILL: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } },

  TITLE_FONT_SIZE: 14,
  SUBTITLE_FONT_SIZE: 12,
  NOTE_FONT_SIZE: 11,
  LABEL_FONT_SIZE: 11,
  BODY_FONT_SIZE: 11,
  LEGEND_FONT_SIZE: 10,

  COLUMN_WIDTHS: [9, 22, 26, 10, 20, 26, 30, 30],
  COLUMN_TITLES: [
    'Step #',
    'Process Description',
    'Incoming Source of Variation',
    'Spec Class',
    'Flow Symbols',
    'Machines / Equipment / Docs',
    'Desired Outcome',
    'Process Characteristics'
  ],
  // Column indexes (0-based) that should be CENTER aligned instead of LEFT
  CENTERED_COLUMN_INDEXES: [0, 3], // Step #, Spec Class

  ROW_HEIGHT: {
    TITLE: 20,
    INFO_GRID: 20,
    TABLE_HEADER: 30,
    LEGEND: 20,
    SIGNATURE: 25,
    DATA_MIN: 20,
    DATA_LINE_HEIGHT: 15 // multiplied by number of wrapped lines
  },

  PAGE_SETUP: {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
  }
};

// ============================================================
// STYLE HELPERS
// ============================================================
function allBorders(style = CONFIG.BORDER_THIN) {
  return { top: style, left: style, bottom: style, right: style };
}

function styleTitle(cell, size, { bold = true, italic = false } = {}) {
  cell.font = { name: CONFIG.FONT, size, bold, italic };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}

function styleLabel(cell) {
  cell.font = { name: CONFIG.FONT, size: CONFIG.LABEL_FONT_SIZE, bold: true };
  cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  cell.border = allBorders();
}

function styleValue(cell) {
  cell.font = { name: CONFIG.FONT, size: CONFIG.BODY_FONT_SIZE };
  cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true };
  cell.border = allBorders();
}

function arrToText(arr) {
  if (!arr) return '';
  if (Array.isArray(arr)) {
    return arr.map((x, i) => `${i + 1}. ${x}`).join('\n');
  }
  return String(arr);
}

function applyOuterBorder(ws, r1, c1, r2, c2, style) {
  for (let c = c1; c <= c2; c++) {
    const topCell = ws.getRow(r1).getCell(c);
    const bottomCell = ws.getRow(r2).getCell(c);
    topCell.border = { ...topCell.border, top: style };
    bottomCell.border = { ...bottomCell.border, bottom: style };
  }
  for (let rr = r1; rr <= r2; rr++) {
    const leftCell = ws.getRow(rr).getCell(c1);
    const rightCell = ws.getRow(rr).getCell(c2);
    leftCell.border = { ...leftCell.border, left: style };
    rightCell.border = { ...rightCell.border, right: style };
  }
}

// ============================================================
// SECTION BUILDERS
// ============================================================

function buildTitleBlock(ws, pfdData) {
  ws.mergeCells('A1:H1');
  ws.getCell('A1').value = pfdData.orgName || 'ORGANISATION NAME';
  styleTitle(ws.getCell('A1'), CONFIG.TITLE_FONT_SIZE);
  ws.getRow(1).height = CONFIG.ROW_HEIGHT.TITLE;

  ws.mergeCells('A2:H2');
  ws.getCell('A2').value = 'Process Flow Diagram (PFD)';
  styleTitle(ws.getCell('A2'), CONFIG.SUBTITLE_FONT_SIZE);
  ws.getRow(2).height = CONFIG.ROW_HEIGHT.TITLE;

  ws.mergeCells('A3:H3');
  ws.getCell('A3').value = `(${pfdData.status || 'Prototype'})`;
  styleTitle(ws.getCell('A3'), CONFIG.NOTE_FONT_SIZE, { bold: false, italic: true });
  ws.getRow(3).height = CONFIG.ROW_HEIGHT.TITLE;

  return 4; // next free row
}

function buildInfoGrid(ws, pfdData, startRow) {
  const infoRows = [
    ['Organisation Name:', pfdData.orgName, 'Customer Name:', pfdData.customerName],
    ['Manufacturing Plant:', pfdData.plant, 'Document Number:', pfdData.docNumber],
    ['Subject (Part Name):', pfdData.partName, 'Part Number:', pfdData.partNumber],
    ['Revision:', pfdData.revision, 'Origination Date:', pfdData.originationDate],
    ['Dwg No.:', pfdData.dwgNo, 'Dwg Rev No / Date.:', pfdData.dwgRev],
    ['Assy. Line No.:', pfdData.assyLine, 'CFT Members:', pfdData.cftMembers],
  ];

  let r = startRow;
  infoRows.forEach(([l1, v1, l2, v2]) => {
    ws.mergeCells(`A${r}:B${r}`);
    ws.getCell(`A${r}`).value = l1;
    styleLabel(ws.getCell(`A${r}`));

    ws.mergeCells(`C${r}:D${r}`);
    ws.getCell(`C${r}`).value = v1 || '';
    styleValue(ws.getCell(`C${r}`));

    ws.mergeCells(`E${r}:F${r}`);
    ws.getCell(`E${r}`).value = l2;
    styleLabel(ws.getCell(`E${r}`));

    ws.mergeCells(`G${r}:H${r}`);
    ws.getCell(`G${r}`).value = v2 || '';
    styleValue(ws.getCell(`G${r}`));

    ws.getRow(r).height = CONFIG.ROW_HEIGHT.INFO_GRID;
    r++;
  });

  return r; // next free row
}

function buildTableHeader(ws, startRow) {
  const headerRow = ws.getRow(startRow);
  CONFIG.COLUMN_TITLES.forEach((title, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = title;
    cell.font = { name: CONFIG.FONT, size: CONFIG.BODY_FONT_SIZE, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = CONFIG.HEADER_FILL;
    cell.border = allBorders(CONFIG.BORDER_THICK);
  });
  headerRow.height = CONFIG.ROW_HEIGHT.TABLE_HEADER;

  ws.views = [{ state: 'frozen', ySplit: startRow }];
  ws.autoFilter = { from: { row: startRow, column: 1 }, to: { row: startRow, column: 8 } };

  return startRow + 1; // next free row (first data row)
}

// Maps each PFD step object to the ordered array of cell values.
// EDIT THIS FUNCTION if your data model field names differ.
function mapStepToRowValues(step) {
  return [
    step.stepNo,
    step.processDescription,
    arrToText(step.incomingVariation),
    step.specClass,
    step.flowSymbols,
    arrToText(step.machinesEquipment),
    arrToText(step.desiredOutcome),
    arrToText(step.processCharacteristics)
  ];
}

function buildDataRows(ws, steps, startRow) {
  let r = startRow;
  steps.forEach((step) => {
    const row = ws.getRow(r);
    const values = mapStepToRowValues(step);

    values.forEach((val, i) => {
      const cell = row.getCell(i + 1);
      cell.value = val;
      cell.font = { name: CONFIG.FONT, size: CONFIG.BODY_FONT_SIZE };
      cell.border = allBorders(CONFIG.BORDER_THIN);
      cell.alignment = {
        vertical: 'middle',
        wrapText: true,
        horizontal: CONFIG.CENTERED_COLUMN_INDEXES.includes(i) ? 'center' : 'left'
      };
    });

    const maxLines = Math.max(...values.map(v => String(v || '').split('\n').length));
    row.height = Math.max(CONFIG.ROW_HEIGHT.DATA_MIN, maxLines * CONFIG.ROW_HEIGHT.DATA_LINE_HEIGHT);
    r++;
  });

  return r; // row AFTER last data row
}

function buildLegendRow(ws, startRow) {
  ws.mergeCells(`A${startRow}:H${startRow}`);
  ws.getCell(`A${startRow}`).value =
    'LEGEND:  Transportation: TRNS (⇨)  |  Storage: STR (▽)  |  Work-In Progress: WIP (⊙)  |  ' +
    'Operation: OPER (○)  |  Inspection: INSP (▭)  |  Decision: DEC (◇)  |  Rework: REW (⬠)  |  Reject: REJ (⬡)';
  ws.getCell(`A${startRow}`).font = { name: CONFIG.FONT, size: CONFIG.LEGEND_FONT_SIZE, italic: true };
  ws.getCell(`A${startRow}`).alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(startRow).height = CONFIG.ROW_HEIGHT.LEGEND;

  return startRow + 1;
}

function buildSignatureRow(ws, startRow) {
  ws.mergeCells(`A${startRow}:B${startRow}`);
  ws.getCell(`A${startRow}`).value = 'Prepared By:';
  ws.mergeCells(`C${startRow}:D${startRow}`);

  ws.mergeCells(`E${startRow}:F${startRow}`);
  ws.getCell(`E${startRow}`).value = 'Checked By:';
  ws.mergeCells(`G${startRow}:H${startRow}`);

  [`A${startRow}`, `E${startRow}`].forEach(addr => styleLabel(ws.getCell(addr)));
  ws.getRow(startRow).height = CONFIG.ROW_HEIGHT.SIGNATURE;
  applyOuterBorder(ws, startRow, 1, startRow, 8, CONFIG.BORDER_THIN);

  return startRow;
}

// ============================================================
// MAIN EXPORT FUNCTION
// ============================================================
async function exportPFDReport(pfdData, outputPath) {
  if (!pfdData || !Array.isArray(pfdData.steps)) {
    throw new Error('pfdData.steps must be an array — export aborted to avoid corrupting hierarchy.');
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = 'PFD System';
  wb.created = new Date();

  const ws = wb.addWorksheet('PFD', { pageSetup: CONFIG.PAGE_SETUP });
  ws.columns = CONFIG.COLUMN_WIDTHS.map(width => ({ width }));

  let row = buildTitleBlock(ws, pfdData);
  row = buildInfoGrid(ws, pfdData, row);

  const headerRowIdx = row;
  row = buildTableHeader(ws, headerRowIdx);

  const firstDataRow = row;
  row = buildDataRows(ws, pfdData.steps, row);
  const lastDataRow = row - 1;

  applyOuterBorder(ws, headerRowIdx, 1, lastDataRow, 8, CONFIG.BORDER_THICK);

  row += 1; // spacer before legend
  row = buildLegendRow(ws, row);
  const signatureRow = buildSignatureRow(ws, row);

  ws.pageSetup.printArea = `A1:H${signatureRow}`;
  ws.pageSetup.printTitlesRow = `${headerRowIdx}:${headerRowIdx}`;

  await wb.xlsx.writeFile(outputPath);
  return outputPath;
}

module.exports = {
  exportPFDReport,
  CONFIG,          // exported so callers can override styling without editing this file
  mapStepToRowValues // exported so callers can override the data mapping if field names differ
};

```
