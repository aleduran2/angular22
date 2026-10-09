import { TestBed } from '@angular/core/testing';
import { CsvExporter } from './csv-exporter';

describe('CsvExporter', () => {
  it('builds a header row and escapes quotes', () => {
    const exporter = TestBed.inject(CsvExporter);

    const csv = exporter.toCsv([
      { id: 1, name: 'Monitor 27" 4K' },
      { id: 2, name: 'Mouse, inalámbrico' },
    ]);

    expect(csv).toBe('id,name\n"1","Monitor 27"" 4K"\n"2","Mouse, inalámbrico"');
  });

  it('returns an empty string without rows', () => {
    expect(TestBed.inject(CsvExporter).toCsv([])).toBe('');
  });
});
