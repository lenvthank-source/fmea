export type EngineeringCell = string | number | boolean | null | undefined;
export interface EngineeringDocument {
  canonicalModel?: unknown;
  printIdentityKeys?: string[];
  title: string;
  fileName: string;
  metadata: Record<string, string>;
  columns: { key: string; label: string; width?: number }[];
  rows: Record<string, EngineeringCell>[];
}

async function worksheetSignature(rows: unknown[][]) {
  const bytes = new TextEncoder().encode(
    JSON.stringify(rows.map((row) => row.map((value) => String(value ?? "")))),
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/** Export the complete supplied revision, never the visible table page. */
export async function createEngineeringWorkbook(document: EngineeringDocument) {
  const XLSX = await import("xlsx");
  const book = XLSX.utils.book_new();
  const longText: unknown[][] = [["Row", "Column", "Part", "Text"]];
  const cells = document.rows.map((row, rowIndex) =>
    document.columns.map((column, columnIndex) => {
      const value = row[column.key] ?? "";
      if (typeof value !== "string" || value.length <= 32767) return value;
      let part = 0;
      for (let offset = 0; offset < value.length; ) {
        let end = Math.min(offset + 30000, value.length);
        if (end < value.length && /[\uD800-\uDBFF]/.test(value[end - 1])) end--;
        longText.push([
          rowIndex + 1,
          columnIndex + 1,
          ++part,
          value.slice(offset, end),
        ]);
        offset = end;
      }
      return value.slice(0, 1000) + "\n[Full content in Long text sheet]";
    }),
  );
  const sheet = XLSX.utils.aoa_to_sheet([
    document.columns.map((column) => column.label),
    ...cells,
  ]);
  sheet["!cols"] = document.columns.map((column) => ({
    wch: column.width ?? 25,
  }));
  sheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: {
        r: document.rows.length,
        c: Math.max(0, document.columns.length - 1),
      },
    }),
  };
  XLSX.utils.book_append_sheet(book, sheet, "Analysis");
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ["Document", document.title],
      ...Object.entries(document.metadata),
    ]),
    "Document",
  );
  if (document.canonicalModel !== undefined) {
    const json = JSON.stringify(document.canonicalModel);
    const chunks: string[][] = [];
    for (let offset = 0; offset < json.length; ) {
      let end = Math.min(offset + 30000, json.length);
      if (end < json.length && /[\uD800-\uDBFF]/.test(json[end - 1])) end--;
      chunks.push([json.slice(offset, end)]);
      offset = end;
    }
    const signature = await worksheetSignature([
      document.columns.map((c) => c.label),
      ...document.rows.map((row) =>
        document.columns.map((c) => row[c.key] ?? ""),
      ),
    ]);
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet([
        ["Canonical model JSON; review before importing"],
        ["Worksheet SHA256", signature],
        ...chunks,
      ]),
      "Model",
    );
  }
  if (longText.length > 1)
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet(longText),
      "Long text",
    );
  return book;
}
export async function exportEngineeringXlsx(
  document: EngineeringDocument,
): Promise<void> {
  const XLSX = await import("xlsx");
  const book = await createEngineeringWorkbook(document);
  XLSX.writeFile(book, `${document.fileName}.xlsx`);
}

const escapeHtml = (value: EngineeringCell) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );

// A table row taller than a printable page can overflow even with break-inside.
// Bound each physical row while preserving every character and source identity.
function printCellParts(value: EngineeringCell): string[] {
  const text = String(value ?? "");
  if (!text) return [""];
  const parts: string[] = [];
  for (let offset = 0; offset < text.length;) {
    let end = Math.min(offset + 650, text.length);
    let lineBreaks = 0;
    for (let cursor = offset; cursor < end; cursor++) {
      if (text[cursor] === "\n" && ++lineBreaks === 20) {
        end = cursor + 1;
        break;
      }
    }
    if (end < text.length && text[end - 1] !== "\n") {
      const wordBoundary = text.lastIndexOf(" ", end - 1);
      if (wordBoundary > offset + (end - offset) * 0.75) end = wordBoundary + 1;
    }
    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
    parts.push(text.slice(offset, end));
    offset = end;
  }
  return parts;
}

/** Use the browser's paginated PDF engine; no screen capture or row truncation. */
export function printEngineeringDocument(document: EngineeringDocument): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow)
    throw new Error(
      "Allow a new window to print or save this revision as PDF.",
    );
  const identity = document.printIdentityKeys?.length
    ? document.printIdentityKeys.map(key => document.columns.find(column => column.key === key)).filter((column): column is EngineeringDocument["columns"][number] => !!column)
    : document.columns.slice(0, 2);
  const identityKeys = new Set(identity.map(column => column.key));
  const rest = document.columns.filter(column => !identityKeys.has(column.key));
  const sectionWidth = Math.max(1, 8 - identity.length);
  const sections = rest.length
    ? Array.from({ length: Math.ceil(rest.length / sectionWidth) }, (_, index) => [
        ...identity,
        ...rest.slice(index * sectionWidth, index * sectionWidth + sectionWidth),
      ])
    : [identity];
  const tables = sections
    .map(
      (columns, index) =>
        `<section><h2>${sections.length > 1 ? `Worksheet section ${index + 1} of ${sections.length}` : ""}</h2><table><thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead><tbody>${document.rows.map((row) => {
          const cells = columns.map((column) => printCellParts(row[column.key]));
          return Array.from({length: Math.max(...cells.map(parts => parts.length))}, (_, part) =>
            `<tr>${cells.map((parts, cell) => `<td>${escapeHtml(parts[part] ?? (cell < identity.length && parts.length === 1 ? parts[0] : ""))}${cell === 0 && part > 0 ? `<br><small>Continued ${part + 1}</small>` : ""}</td>`).join("")}</tr>`
          ).join("");
        }).join("")}</tbody></table></section>`,
    )
    .join("");
  printWindow.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(document.title)}</title><style>@page{size:A3 landscape;margin:10mm}body{font:10px Arial,sans-serif;color:#242621;overflow-wrap:anywhere}h1{font-size:20px}h2{font-size:12px}section+section{break-before:page}dl{display:grid;grid-template-columns:160px 1fr;gap:4px}dt{font-weight:bold}dd{margin:0;white-space:pre-wrap}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:1px solid #c9cec1;padding:5px;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}th{background:#eff2e8}thead{display:table-header-group}tr{break-inside:avoid}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Print / Save PDF</button><h1>${escapeHtml(document.title)}</h1><dl>${Object.entries(
      document.metadata,
    )
      .map(
        ([key, value]) =>
          `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`,
      )
      .join("")}</dl>${tables}</body></html>`,
  );
  printWindow.document.close();
}

export async function parseEngineeringXlsx(
  file: File,
): Promise<{
  headers: string[];
  rows: Record<string, unknown>[];
  model?: unknown;
  worksheetChanged?: boolean;
}> {
  const XLSX = await import("xlsx");
  const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet =
    book.Sheets[
      book.SheetNames.includes("Analysis") ? "Analysis" : book.SheetNames[0]
    ];
  if (!sheet) throw new Error("The workbook has no analysis worksheet.");
  const values = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  });
  if (!values.length) throw new Error("The worksheet is empty.");
  const headers = values[0].map((value) => String(value));
  if (
    new Set(headers).size !== headers.length ||
    headers.some((header) => !header.trim())
  )
    throw new Error("Column headings must be non-empty and unique.");
  if (book.Sheets["Long text"]) {
    const continuation = XLSX.utils
      .sheet_to_json<
        unknown[]
      >(book.Sheets["Long text"], { header: 1, defval: "" })
      .slice(1);
    const parts = new Map<string, { part: number; text: string }[]>();
    for (const row of continuation) {
      const key = String(row[0]) + ":" + String(row[1]);
      parts.set(key, [
        ...(parts.get(key) ?? []),
        { part: Number(row[2]), text: String(row[3]) },
      ]);
    }
    for (const [key, chunks] of parts) {
      const [row, col] = key.split(":").map(Number);
      if (values[row])
        values[row][col - 1] = chunks
          .sort((a, b) => a.part - b.part)
          .map((c) => c.text)
          .join("");
    }
  }
  let model: unknown;
  let worksheetChanged = false;
  if (book.Sheets.Model) {
    const chunks = XLSX.utils.sheet_to_json<unknown[]>(book.Sheets.Model, {
      header: 1,
      defval: "",
    });
    if (chunks.length > 1) {
      const signed = chunks[1]?.[0] === "Worksheet SHA256";
      model = JSON.parse(
        chunks
          .slice(signed ? 2 : 1)
          .map((r) => String(r[0] ?? ""))
          .join(""),
      );
      if (signed)
        worksheetChanged =
          String(chunks[1][1]) !== (await worksheetSignature(values));
    }
  }
  return {
    model,
    worksheetChanged,
    headers,
    rows: values
      .slice(1)
      .filter((row) => row.some((value) => value !== ""))
      .map((row) =>
        Object.fromEntries(
          headers.map((header, index) => [header, row[index] ?? ""]),
        ),
      ),
  };
}
