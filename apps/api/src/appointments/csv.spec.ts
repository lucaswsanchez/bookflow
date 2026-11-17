import { csvCell, toCsv } from './csv';

describe('csv', () => {
  it('quotes values with commas, quotes and new lines', () => {
    expect(csvCell('Pérez, Juan')).toBe('"Pérez, Juan"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('a\nb')).toBe('"a\nb"');
  });

  it('neutralizes spreadsheet formulas but keeps negative numbers', () => {
    expect(csvCell('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(csvCell('-5')).toBe('-5');
  });

  it('renders empty cells for null and undefined', () => {
    expect(toCsv(['a', 'b'], [[null, undefined]])).toBe('a,b\r\n,\r\n');
  });
});
