// Text and document exports. DOCX and XLSX are written by hand as minimal Office Open XML,
// zipped with fflate, which is only loaded when one of these is downloaded.
import { stripTags, fmtTime, type Caption } from './subs.ts';

export type DocFormat = 'txt' | 'txt-times' | 'csv' | 'docx' | 'docx-table' | 'xlsx';
export const DOC_FORMATS: { value: DocFormat; label: string; ext: string; mime: string }[] = [
  { value: 'txt', label: 'Plain text (.txt)', ext: 'txt', mime: 'text/plain;charset=utf-8' },
  { value: 'txt-times', label: 'Text with times (.txt)', ext: 'txt', mime: 'text/plain;charset=utf-8' },
  { value: 'csv', label: 'Spreadsheet (.csv)', ext: 'csv', mime: 'text/csv;charset=utf-8' },
  { value: 'docx', label: 'Word, as text (.docx)', ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { value: 'docx-table', label: 'Word, as a table (.docx)', ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { value: 'xlsx', label: 'Excel (.xlsx)', ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
];
export const isDocFormat = (f: string): f is DocFormat => DOC_FORMATS.some((d) => d.value === f);

const plain = (t: string) => stripTags(t).replace(/\r/g, '');
const oneLine = (t: string) => plain(t).replace(/\n+/g, ' ').trim();

export function toTxt(caps: Caption[], withTimes = false): string {
  const lines = caps.map((c) => (withTimes ? `[${fmtTime(c.start)} - ${fmtTime(c.end)}] ${oneLine(c.text)}` : oneLine(c.text)));
  return lines.join('\r\n') + '\r\n';
}

export function toCsv(caps: Caption[]): string {
  const q = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = [['Number', 'Start', 'End', 'Duration (s)', 'Text']];
  caps.forEach((c, i) => rows.push([String(i + 1), fmtTime(c.start), fmtTime(c.end), ((c.end - c.start) / 1000).toFixed(3), plain(c.text)]));
  // BOM so Excel opens it as UTF-8.
  return '﻿' + rows.map((r) => r.map(q).join(',')).join('\r\n') + '\r\n';
}

const x = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');

async function zip(files: Record<string, string | Uint8Array>): Promise<Uint8Array> {
  const { zipSync, strToU8 } = await import('fflate');
  const input: Record<string, Uint8Array> = {};
  for (const [k, v] of Object.entries(files)) input[k] = typeof v === 'string' ? strToU8(v) : v;
  return zipSync(input, { level: 6 });
}

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

function runs(text: string): string {
  return plain(text)
    .split('\n')
    .map((l, i) => `${i ? '<w:br/>' : ''}<w:t xml:space="preserve">${x(l)}</w:t>`)
    .join('');
}

export async function toDocx(caps: Caption[], title: string, asTable = false): Promise<Uint8Array> {
  const p = (inner: string, style = '') => `<w:p>${style}<w:r>${inner}</w:r></w:p>`;
  let body = p(`<w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t xml:space="preserve">${x(title)}</w:t>`);
  if (asTable) {
    const cell = (inner: string, w: number, mono = false) =>
      `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/></w:tcPr><w:p><w:r>${mono ? '<w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr>' : ''}${inner}</w:r></w:p></w:tc>`;
    const head = (t: string, w: number) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${t}</w:t></w:r></w:p></w:tc>`;
    const b = '<w:top w:val="single" w:sz="4" w:color="BFBFBF"/><w:left w:val="single" w:sz="4" w:color="BFBFBF"/><w:bottom w:val="single" w:sz="4" w:color="BFBFBF"/><w:right w:val="single" w:sz="4" w:color="BFBFBF"/><w:insideH w:val="single" w:sz="4" w:color="BFBFBF"/><w:insideV w:val="single" w:sz="4" w:color="BFBFBF"/>';
    const widths = [600, 1500, 1500, 5400];
    body += `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders>${b}</w:tblBorders><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>`;
    body += `<w:tr><w:trPr><w:tblHeader/></w:trPr>${head('#', widths[0])}${head('Start', widths[1])}${head('End', widths[2])}${head('Text', widths[3])}</w:tr>`;
    caps.forEach((c, i) => {
      body += `<w:tr>${cell(`<w:t>${i + 1}</w:t>`, widths[0])}${cell(`<w:t>${fmtTime(c.start)}</w:t>`, widths[1], true)}${cell(`<w:t>${fmtTime(c.end)}</w:t>`, widths[2], true)}${cell(runs(c.text), widths[3])}</w:tr>`;
    });
    body += '</w:tbl><w:p/>';
  } else {
    for (const c of caps) body += p(runs(c.text));
  }
  const doc = `${XML}<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  return zip({
    '[Content_Types].xml': `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
    '_rels/.rels': `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    'word/document.xml': doc,
  });
}

export async function toXlsx(caps: Caption[]): Promise<Uint8Array> {
  const str = (ref: string, v: string, s = 0) => `<c r="${ref}" t="inlineStr"${s ? ` s="${s}"` : ''}><is><t xml:space="preserve">${x(v)}</t></is></c>`;
  const num = (ref: string, v: number) => `<c r="${ref}"><v>${v}</v></c>`;
  let rows = `<row r="1">${['Number', 'Start', 'End', 'Duration (s)', 'Text'].map((h, i) => str(`${'ABCDE'[i]}1`, h, 1)).join('')}</row>`;
  caps.forEach((c, i) => {
    const r = i + 2;
    rows += `<row r="${r}">${num(`A${r}`, i + 1)}${str(`B${r}`, fmtTime(c.start))}${str(`C${r}`, fmtTime(c.end))}${num(`D${r}`, (c.end - c.start) / 1000)}${str(`E${r}`, plain(c.text), 2)}</row>`;
  });
  const sheet = `${XML}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="9" customWidth="1"/><col min="2" max="3" width="14" customWidth="1"/><col min="4" max="4" width="12" customWidth="1"/><col min="5" max="5" width="80" customWidth="1"/></cols><sheetData>${rows}</sheetData></worksheet>`;
  return zip({
    '[Content_Types].xml': `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    '_rels/.rels': `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `${XML}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Subtitles" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': `${XML}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs></styleSheet>`,
    'xl/worksheets/sheet1.xml': sheet,
  });
}

/** Render one doc format. Returns bytes or a string. */
export async function exportDoc(caps: Caption[], fmt: DocFormat, title: string): Promise<string | Uint8Array> {
  if (fmt === 'txt') return toTxt(caps);
  if (fmt === 'txt-times') return toTxt(caps, true);
  if (fmt === 'csv') return toCsv(caps);
  if (fmt === 'docx') return toDocx(caps, title);
  if (fmt === 'docx-table') return toDocx(caps, title, true);
  return toXlsx(caps);
}

export async function zipFiles(files: { name: string; data: string | Uint8Array }[]): Promise<Uint8Array> {
  const used = new Set<string>();
  const map: Record<string, string | Uint8Array> = {};
  for (const f of files) {
    let name = f.name;
    for (let k = 2; used.has(name); k++) name = f.name.replace(/(\.[^.]+)?$/, ` (${k})$1`);
    used.add(name);
    map[name] = f.data;
  }
  return zip(map);
}
