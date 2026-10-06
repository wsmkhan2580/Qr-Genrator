import { describe, it, expect } from '@jest/globals';
import { toCsv } from '../../src/utils/csv.js';

const columns = [
  { label: 'Name', value: (r) => r.name },
  { label: 'Note', value: (r) => r.note },
];

describe('toCsv', () => {
  it('produces a header row and one row per record', () => {
    const csv = toCsv([{ name: 'Alice', note: 'ok' }], columns);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Name,Note');
    expect(lines[1]).toBe('Alice,ok');
  });

  it('quotes and escapes values containing commas or quotes', () => {
    const csv = toCsv([{ name: 'Smith, John', note: 'He said "hi"' }], columns);
    expect(csv).toContain('"Smith, John"');
    expect(csv).toContain('"He said ""hi"""');
  });

  it('neutralizes formula-injection prefixes', () => {
    const csv = toCsv([{ name: '=SUM(A1:A9)', note: '+cmd' }], columns);
    const dataLine = csv.split('\r\n')[1];
    expect(dataLine.startsWith("'=SUM")).toBe(true);
    expect(dataLine).toContain("'+cmd");
  });

  it('handles null/undefined as empty cells', () => {
    const csv = toCsv([{ name: null, note: undefined }], columns);
    expect(csv.split('\r\n')[1]).toBe(',');
  });
});
