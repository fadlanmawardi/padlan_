function escapeCsvCell(value: string): string {
  if (/[";\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function downloadBlob(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export interface ExportColumn {
  header: string;
  value: string;
  align?: "left" | "right";
}

export function exportCsv(
  filename: string,
  headers: string[],
  rows: string[][]
): void {
  const lines = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell ?? "")).join(";"))
    .join("\r\n");
  downloadBlob("\uFEFF" + lines, filename.endsWith(".csv") ? filename : `${filename}.csv`, "text/csv;charset=utf-8");
}

export function exportPdf(
  filename: string,
  title: string,
  columns: ExportColumn[],
  rows: string[][]
): void {
  const pageWidth = 595;
  const margin = 48;
  const lineHeight = 18;

  const lines: string[] = [];
  const pushLine = (text: string, size: number, dy: number) => {
    lines.push(`BT /F${size > 12 ? 2 : 1} ${size} Tf ${margin} ${dy} Td (${escapePdfText(text)}) Tj ET`);
  };

  let y = 800;
  pushLine(title, 16, y);
  y -= lineHeight + 4;

  const header = columns.map((col) => col.header).join("   |   ");
  pushLine(header, 10, y);
  y -= lineHeight;
  lines.push(`${margin} ${y + 8} m ${pageWidth - margin} ${y + 8} l S`);
  y -= 8;

  let overflow = 0;
  for (const row of rows) {
    if (y < margin + lineHeight) {
      y = 800 - lineHeight * 2;
      overflow += 1;
    }
    const cells = row.map((cell, index) => {
      const col = columns[index];
      return col ? `${col.header}: ${col.value} · ${cell ?? ""}`.trim() : cell ?? "";
    });
    pushLine(cells.join("   |   "), 9, y);
    y -= lineHeight;
  }
  if (overflow > 0) {
    pushLine(`... ${overflow} baris tambahan dipotong`, 8, margin + 4);
  }

  const footer = `SchoolHub · ${new Date().toLocaleString("id-ID")} · Mode demo`;
  pushLine(footer, 8, 36);

  const stream = lines.join("\n");
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>"
  );
  objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  const entries = objects.map(
    (obj, index) => `${index + 1} 0 obj\n${obj}\nendobj\n`
  );
  const pdfBody = "%PDF-1.4\n" + entries.join("");
  const offsets: number[] = [];
  let acc = "%PDF-1.4\n".length;
  for (const entry of entries) {
    offsets.push(acc);
    acc += entry.length;
  }
  const xrefOffset = pdfBody.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  const pdf =
    pdfBody +
    xref +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let index = 0; index < pdf.length; index++) {
    bytes[index] = pdf.charCodeAt(index) & 0xff;
  }
  downloadBlob(
    bytes,
    filename.endsWith(".pdf") ? filename : `${filename}.pdf`,
    "application/pdf"
  );
}
