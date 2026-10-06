/**
 * Converts an array of plain objects into a CSV string.
 *
 * Security:
 *  - Every cell is escaped per RFC 4180 (quotes doubled, wrapped in quotes
 *    whenever it contains a comma, quote, or newline).
 *  - Formula injection is prevented: if a cell's first character is one of
 *    = + - @ (the characters spreadsheet apps interpret as a formula
 *    prefix), we prefix the cell with a single quote so it is imported as
 *    plain text, matching OWASP's CSV injection guidance.
 */
const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

function escapeCell(value) {
  let str = value === null || value === undefined ? '' : String(value);

  if (FORMULA_PREFIXES.includes(str[0])) {
    str = `'${str}`;
  }

  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCell(c.value(row))).join(','))
    .join('\r\n');
  return `${header}\r\n${body}`;
}
