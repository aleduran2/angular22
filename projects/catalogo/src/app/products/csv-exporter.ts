import { DOCUMENT } from '@angular/common';
import { Service, inject } from '@angular/core';

export type CsvRow = Record<string, string | number>;

// Se carga con injectAsync(): este archivo queda en un chunk aparte que se baja recién al exportar.
@Service()
export class CsvExporter {
  private readonly document = inject(DOCUMENT);

  toCsv(rows: CsvRow[]): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const lines = rows.map((row) => headers.map((h) => escape(row[h])).join(','));
    return [headers.join(','), ...lines].join('\n');
  }

  download(filename: string, rows: CsvRow[]): void {
    const blob = new Blob([this.toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
